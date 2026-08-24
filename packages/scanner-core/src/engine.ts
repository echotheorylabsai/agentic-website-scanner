import type { Catalog } from "./schema";
import { vendoredCatalog } from "./schema";
import { makeFetcher } from "./fetcher";
import { newScanContext } from "./probes/types";
import type { ProbeResult, Probe } from "./probes/types";
import { contentProbes } from "./probes/content";
import { discoveryProbes } from "./probes/discovery";
import { OpenApiSpecProbe, PublicApiProbe, JsonErrorResponsesProbe, ResponseSchemaCoverageProbe, ScopedPermissionsProbe, OAuthSupportProbe, RateLimitHeadersProbe, PublicApiDocsProbe, DeveloperPortalProbe } from "./probes/api";
import {
  ApiSchemaAnalysisProbe, FunctionCallingCompatProbe, SandboxEnvironmentProbe,
  AuthMdExistsProbe, CliToolProbe, ApiErrorModelProbe, ApiVersioningPolicyProbe,
  PaginationShapeProbe, AsyncJobPatternProbe, RestSdkPackagesProbe,
} from "./probes/apiDerived";
import { mcpProbes, McpWellKnownDiscoveryLateProbe, McpWellKnownDiscoveryProbe, McpServerProbe, CommerceSignalsDetector } from "./probes/mcp";
import { AgentFriendly404Probe, RedirectHygieneProbe } from "./probes/http-semantics";
import { applyRelevance, NA_TEXT, REST_SPEC_DEPENDENT, GRAPHQL_FAMILY, MCP_SUBCHECKS, PAYMENTS_FAMILY } from "./relevance";
import type { GatedCheck } from "./relevance";
import { joinCatalogFlags, scoreReport } from "./scorer";
import type { RawScore, ScoredCheck } from "./scorer";

export interface EngineEvent {
  type: string;
  [k: string]: unknown;
}

export interface ScanOutput {
  gated: ScoredCheck[];
  assessed: { naCheckIds: string[]; reasons: Record<string, string> };
  raw: RawScore;
}

const LAYER_NAMES: Record<string, string> = {
  discovery: "Discovery", accessibility: "Access", usability: "Usability", payments: "Payments",
};

function apiDerivedProbes(): Probe[] {
  return [
    new ApiSchemaAnalysisProbe(), new FunctionCallingCompatProbe(), new SandboxEnvironmentProbe(),
    new ResponseSchemaCoverageProbe(),
    new AuthMdExistsProbe(), new CliToolProbe(),
    new ApiErrorModelProbe(), new ApiVersioningPolicyProbe(),
    new PaginationShapeProbe(), new AsyncJobPatternProbe(), new RestSdkPackagesProbe(),
  ];
}

/**
 * Orchestrates one scan, yielding canonical-order engine events.
 * onComplete is awaited BEFORE scan_archived is emitted (the official CLI
 * polls /api/v1/report up to 5×2s after stream end — persistence must win that race).
 */
export async function* runScan(
  target: string,
  opts: {
    catalog?: Catalog;
    fetchAs?: ReturnType<typeof makeFetcher>;
    onComplete?: (out: ScanOutput) => Promise<void>;
    labels?: Record<string, string>;
  } = {},
): AsyncGenerator<EngineEvent, void, void> {
  const catalog = opts.catalog ?? vendoredCatalog;
  const fetchAs = opts.fetchAs ?? makeFetcher();
  const url = normalizeTarget(target);
  const ctx = newScanContext();

  const roster = catalog.checks.map((c) => ({
    id: c.id, name: c.name, layerId: c.layer, maxScore: c.maxScore,
    ...(c.bonus ? { bonus: true } : {}),
  }));
  const layerMaxScores: Record<string, number> = {};
  for (const r of roster) layerMaxScores[r.layerId] = (layerMaxScores[r.layerId] ?? 0) + r.maxScore;

  const results: ProbeResult[] = [];

  // Dead host ⇒ terminal error frame (no scored report)
  try {
    await fetchAs(url, { timeoutMs: 10_000 });
  } catch {
    yield { type: "kind_detecting", timestamp: Date.now() };
    yield { type: "kind_detected", kind: "domain", hint: "likely-domain", timestamp: Date.now() };
    yield { type: "error", message: `Target unreachable: ${url.hostname}` };
    return;
  }

  yield { type: "kind_detecting", timestamp: Date.now() };
  yield { type: "kind_detected", kind: "domain", hint: "likely-domain", timestamp: Date.now() };

  const phases = ["Fetching host", "Reading robots & sitemaps", "Crawling key pages", "Checking agent files",
    "Probing API surface", "MCP handshake", "Payments signals", "Finalizing"];

  yield { type: "scan_init", layerMaxScores, checkRoster: roster };
  phases.forEach((label, i) => {
    void label; void i;
  });
  // capture truth: discovery_phase×8 between the two scan_init frames
  for (let i = 0; i < phases.length; i++) {
    yield { type: "discovery_phase", step: phases[i], label: phases[i], stepIndex: i + 1, totalSteps: phases.length };
  }
  yield { type: "scan_init", totalChecks: roster.length, staticOnly: true };

  // Ordering contract:
  // 1. homepage-dependent content probe runs FIRST (sets ctx.homepage)
  // 2. surface detectors next (OpenAPI, MCP discovery/handshake, public API)
  // 3. remaining probes — surface flags are already final when they read them
  const content = contentProbes();
  const discovery = discoveryProbes();
  const homeProbe = content[0]; // ContentNoJsProbe fetches the homepage into ctx
  const restContent = content.slice(1);
  const detectors: Probe[] = [
    new OpenApiSpecProbe(), new ScopedPermissionsProbe(),
    new McpWellKnownDiscoveryProbe(), new McpServerProbe(),
  ];
  const dependent: Probe[] = [
    ...restContent,
    ...discovery,
    new JsonErrorResponsesProbe(),
    new OAuthSupportProbe(), new RateLimitHeadersProbe(),
    new PublicApiDocsProbe(), new DeveloperPortalProbe(),
    new PublicApiProbe(),
    ...apiDerivedProbes(),
    ...mcpProbes().filter((p) => !(p instanceof McpWellKnownDiscoveryProbe) && !(p instanceof McpServerProbe)),
    new AgentFriendly404Probe(), new RedirectHygieneProbe(),
    new McpWellKnownDiscoveryLateProbe(),
  ];
  const emitted = new Set<string>();

  // --- Phase 1: run home + detector probes to establish surface facts ---
  const commerceDetector = new CommerceSignalsDetector(); // phase-1: sets ctx.commerceSignals
  for (const probe of [homeProbe, ...detectors, commerceDetector]) {
    const layerOf = (id: string) => {
      const catRow = catalog.checks.find((c) => c.id === id);
      return { layerId: catRow?.layer ?? probe.layer, layerName: LAYER_NAMES[catRow?.layer ?? probe.layer] ?? probe.layer };
    };
    for (const id of probe.ids) {
      if (!emitted.has(id)) {
        const catRow = catalog.checks.find((c) => c.id === id);
        const { layerId, layerName } = layerOf(id);
        yield { type: "check_start", layerId, layerName, checkId: id, checkName: catRow?.name ?? id, mcpKind: null, mcpUrl: null, timestamp: Date.now() };
      }
    }
    try {
      for (const r of await probe.run({ url, fetchAs, ctx })) {
        if (emitted.has(r.id)) continue;
        emitted.add(r.id);
        results.push(r);
        const catRow = catalog.checks.find((c) => c.id === r.id);
        const { layerId, layerName } = layerOf(r.id);
        yield {
          type: "check_complete", layerId, layerName, checkId: r.id, checkName: catRow?.name ?? r.id,
          status: r.status, score: r.score, maxScore: r.max_score, details: r.details,
          ...(catRow?.bonus && r.score > 0 ? { bonus: true } : {}),
          mcpKind: null, mcpUrl: null, timestamp: Date.now(),
        };
      }
    } catch (err) {
      for (const id of probe.ids) {
        const maxScore = catalog.checks.find((c) => c.id === id)?.maxScore ?? 0;
        results.push({ id, status: "error", score: 0, max_score: maxScore, details: `Probe failed: ${String(err)}` });
        const { layerId, layerName } = layerOf(id);
        yield { type: "check_complete", layerId, layerName, checkId: id, checkName: id, status: "error", score: 0, maxScore, details: `Probe failed: ${String(err)}`, mcpKind: null, mcpUrl: null, timestamp: Date.now() };
      }
    }
  }

  // --- Phase 2: deterministic gating AHEAD of emission (Ora-wire-faithful:
  //     gated checks emit status:"na" + family text, like Ora's frames) ---
  const naTextFor = (id: string): string | null => {
    if (REST_SPEC_DEPENDENT.has(id) && !ctx.restSurface) return NA_TEXT.rest;
    if (GRAPHQL_FAMILY.has(id) && !ctx.graphqlSurface) return NA_TEXT.graphql;
    if (MCP_SUBCHECKS.has(id)) {
      if (!ctx.mcpManifest && ctx.mcpHandshake === "none") return NA_TEXT.mcp;
      if (ctx.mcpHandshake === "auth-gated") return NA_TEXT.mcpAuth;
    }
    if (id === "rate-limit-headers" && !ctx.restSurface && !ctx.graphqlSurface) return NA_TEXT.rateLimit;
    if (PAYMENTS_FAMILY.has(id) && !ctx.commerceSignals) return NA_TEXT.commerce;
    return null;
  };

  // --- Phase 3: remaining probes; gated ones emit na without running ---
  for (const probe of dependent) {
    const layerOf = (id: string) => {
      const catRow = catalog.checks.find((c) => c.id === id);
      return { layerId: catRow?.layer ?? probe.layer, layerName: LAYER_NAMES[catRow?.layer ?? probe.layer] ?? probe.layer };
    };
    // skip probes whose every id is deterministically gated — emit na frames instead
    const gatedIds = probe.ids.filter((id) => !emitted.has(id) && naTextFor(id) !== null);
    if (gatedIds.length === probe.ids.length) {
      for (const id of gatedIds) {
        emitted.add(id);
        const naText = naTextFor(id)!;
        const catRow = catalog.checks.find((c) => c.id === id);
        const { layerId, layerName } = layerOf(id);
        results.push({ id, status: "na", score: 0, max_score: catRow?.maxScore ?? 0, details: naText });
        yield { type: "check_start", layerId, layerName, checkId: id, checkName: catRow?.name ?? id, mcpKind: null, mcpUrl: null, timestamp: Date.now() };
        yield { type: "check_complete", layerId, layerName, checkId: id, checkName: catRow?.name ?? id, status: "na", score: 0, maxScore: catRow?.maxScore ?? 0, details: naText, mcpKind: null, mcpUrl: null, timestamp: Date.now() };
      }
      continue;
    }
    for (const id of probe.ids) {
      if (!emitted.has(id)) {
        const catRow = catalog.checks.find((c) => c.id === id);
        const { layerId, layerName } = layerOf(id);
        yield { type: "check_start", layerId, layerName, checkId: id, checkName: catRow?.name ?? id, mcpKind: null, mcpUrl: null, timestamp: Date.now() };
      }
    }
    try {
      for (const r of await probe.run({ url, fetchAs, ctx })) {
        const isLateOverride = emitted.has(r.id);
        // late refinement probes REPLACE the earlier result (never emit a second frame)
        if (isLateOverride) {
          const i = results.findIndex((x) => x.id === r.id);
          if (i >= 0 && r.status !== "na") results[i] = r;
          continue;
        }
        emitted.add(r.id);
        results.push(r);
        const catRow = catalog.checks.find((c) => c.id === r.id);
        const { layerId, layerName } = layerOf(r.id);
        yield {
          type: "check_complete", layerId, layerName, checkId: r.id, checkName: catRow?.name ?? r.id,
          status: r.status, score: r.score, maxScore: r.max_score, details: r.details,
          ...(catRow?.bonus && r.score > 0 ? { bonus: true } : {}),
          mcpKind: null, mcpUrl: null, timestamp: Date.now(),
        };
      }
    } catch (err) {
      for (const id of probe.ids) {
        const maxScore = catalog.checks.find((c) => c.id === id)?.maxScore ?? 0;
        results.push({ id, status: "error", score: 0, max_score: maxScore, details: `Probe failed: ${String(err)}` });
        const { layerId, layerName } = layerOf(id);
        yield { type: "check_complete", layerId, layerName, checkId: id, checkName: id, status: "error", score: 0, maxScore, details: `Probe failed: ${String(err)}`, mcpKind: null, mcpUrl: null, timestamp: Date.now() };
      }
    }
  }

  for (const layer of Object.keys(LAYER_NAMES)) {
    yield { type: "layer_complete", layerId: layer, layerName: LAYER_NAMES[layer] };
  }

  const { gated, assessed } = applyRelevance(results, ctx);
  const scored = joinCatalogFlags(gated as GatedCheck[], catalog);
  const raw = scoreReport(scored, opts.labels);

  const preGatingResult = {
    contractVersion: catalog.contractVersion,
    domain: url.hostname,
    url: target,
    score: raw.score,
    scoreMax: 100,
    grade: raw.grade,
    scannedAt: new Date().toISOString(),
    provisional: true,
  };

  yield { type: "scan_complete", result: preGatingResult };
  yield { type: "discovery_phase", step: "Assessing product relevance" };
  yield { type: "relevance_assessed", naCheckIds: assessed.naCheckIds, reasons: assessed.reasons, score: raw.score, grade: raw.grade };
  yield { type: "discovery_phase", step: "Generating summary" };
  yield { type: "discovery_phase", step: "Archiving report" };
  yield { type: "summary_ready", agenticSummary: buildSummary(scored, raw) };

  if (opts.onComplete) await opts.onComplete({ gated: scored, assessed, raw });

  yield { type: "scan_archived" };
}

function buildSummary(scored: ScoredCheck[], raw: RawScore): string {
  const fails = scored.filter((c) => c.eligible && !c.essentials_bonus_only && c.status !== "pass");
  if (!fails.length) return "Fully agent-ready across every deterministic check.";
  const worst = [...fails].sort((a, b) => b.max_score - a.max_score)[0];
  return `Scored ${raw.score}/100 (${raw.grade}); biggest gap: ${worst.id}.`;
}

export function normalizeTarget(input: string): URL {
  let s = input.trim();
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  const u = new URL(s);
  u.hash = "";
  if (!u.pathname || u.pathname === "/") u.pathname = "/";
  return u;
}
