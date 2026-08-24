import { z } from "zod";

// ---------------------------------------------------------------------------
// PublicScanReport — strict shape of is-agentic.com/api/v1/report payloads
// ---------------------------------------------------------------------------

export const issueTier = z.enum(["essential", "recommended", "bonus"]);

export const reportIssue = z.strictObject({
  id: z.string(),
  name: z.string(),
  tier: issueTier,
  result: z.enum(["failed", "partial"]),
  details: z.string().nullable(),
  recommendation: z.string().nullable(),
});

export const scoreBreakdown = z.strictObject({
  essential: z.strictObject({
    earned: z.number(),
    available: z.number(),
    passing: z.number(),
    total: z.number(),
  }),
  recommended: z.strictObject({
    earned: z.number(),
    available: z.number(),
    passing: z.number(),
    total: z.number(),
  }),
  bonus: z.strictObject({
    points: z.number(),
    positive_signals: z.number(),
  }),
});

export const publicScanReport = z.strictObject({
  target: z.string(),
  display_target: z.string(),
  report_url: z.string(),
  score: z.number().nullable(),        // nullable until scan completes
  score_label: z.string().nullable(),
  scanned_at: z.string(),              // ISO timestamp
  eligible_checks: z.number(),
  score_breakdown: scoreBreakdown,
  issues: z.array(reportIssue),
});

export type PublicScanReport = z.infer<typeof publicScanReport>;
export type ReportIssue = z.infer<typeof reportIssue>;

// ---------------------------------------------------------------------------
// ProblemDetails — RFC 7807 style error envelope (additionalProperties true)
// ---------------------------------------------------------------------------

export const PROBLEM_CODES = [
  "invalid_url", "report_not_found", "scan_failed",
  "scan_start_failed", "scan_interrupted", "rate_limit_exceeded",
] as const;
export const problemCode = z.enum(PROBLEM_CODES);

export const problemDetails = z
  .object({
    type: z.string(),
    title: z.string(),
    status: z.number().int(),
    detail: z.string().optional(),
    instance: z.string().optional(),
    code: problemCode,
  })
  .passthrough(); // additionalProperties: true

export type ProblemDetails = z.infer<typeof problemDetails>;

// ---------------------------------------------------------------------------
// ScanEvent — real SSE protocol union. Wire format: each frame is a flat
// JSON object { type: <event-name>, ...payload }. Canonical order is
// documented in the plan Global Constraints; layer_start exists upstream but
// was never observed — kept in union, never emitted.
// ---------------------------------------------------------------------------

const frame = <T extends z.ZodRawShape>(shape: T) =>
  z.object({ type: z.string(), ...shape }).passthrough();

export const scanEvent = z.union([
  z.object({ type: z.literal("kind_detecting"), timestamp: z.number().optional() }).passthrough(),
  z.object({ type: z.literal("kind_detected"), kind: z.string(), hint: z.string().optional(), timestamp: z.number().optional() }).passthrough(),
  z.object({
    type: z.literal("scan_init"),
    // first frame carries roster+layer max scores; second carries totals
    layerMaxScores: z.record(z.string(), z.number()).optional(),
    checkRoster: z.array(z.object({ id: z.string(), name: z.string(), layerId: z.string(), maxScore: z.number(), bonus: z.boolean().optional() })).optional(),
    totalChecks: z.number().optional(),
    staticOnly: z.boolean().optional(),
  }).passthrough(),
  z.object({ type: z.literal("discovery_phase"), step: z.string().optional(), label: z.string().optional(), stepIndex: z.number().optional(), totalSteps: z.number().optional(), timestamp: z.number().optional() }).passthrough(), // late post-scan frames carry only {type,step}
  z.object({ type: z.literal("check_start"), layerId: z.string(), layerName: z.string(), checkId: z.string(), checkName: z.string(), mcpKind: z.null().optional(), mcpUrl: z.null().optional(), timestamp: z.number().optional() }).passthrough(),
  z.object({ type: z.literal("check_complete"), layerId: z.string(), layerName: z.string(), checkId: z.string(), checkName: z.string(), status: z.enum(["pass", "fail", "warning", "na", "error"]), score: z.number(), maxScore: z.number(), details: z.string(), bonus: z.boolean().optional(), mcpKind: z.null().optional(), mcpUrl: z.null().optional(), timestamp: z.number().optional() }).passthrough(),
  z.object({ type: z.literal("layer_start") }).passthrough(),
  z.object({ type: z.literal("layer_complete"), layerId: z.string(), layerName: z.string() }).passthrough(),
  z.object({ type: z.literal("relevance_assessed"), naCheckIds: z.array(z.string()), reasons: z.record(z.string(), z.string()), score: z.number().optional(), grade: z.string().optional() }).passthrough(),
  z.object({ type: z.literal("summary_ready"), agenticSummary: z.string() }).passthrough(),
  z.object({ type: z.literal("scan_complete"), result: z.unknown() }).passthrough(),
  z.object({ type: z.literal("scan_archived") }).passthrough(),
  z.object({ type: z.literal("error"), message: z.string() }).passthrough(),
  frame({}), // pass-through guard for unknown upstream event types — MUST stay last
]);

export type ScanEvent = z.infer<typeof scanEvent>;
export type ScanEventName = ScanEvent["event"];

/** Parse an SSE wire frame ("data: {...}") into a typed ScanEvent. */
export function parseSseData(line: string): ScanEvent {
  const payload = line.startsWith("data:") ? line.slice(5).trim() : line;
  return scanEvent.parse(JSON.parse(payload)) as ScanEvent;
}

export function eventName(e: ScanEvent): string { return e.type; }

// ---------------------------------------------------------------------------
// Catalog — vendored verbatim from ora.ai/api/checks?include=essentials
// ---------------------------------------------------------------------------

export const catalogCheck = z.object({
  id: z.string(),
  name: z.string(),
  layer: z.string(),
  maxScore: z.number(),
  tier: z.enum(["required", "recommended", "emerging"]),   // native tier
  essentialsTier: z.enum(["required", "recommended", "emerging"]),
  essentialsBonusOnly: z.boolean().optional(),
  essentialsExcluded: z.boolean().optional(),
  bonus: z.boolean().optional(),
  applicability: z.string().optional(),
  maturity: z.string().optional(),
  draft: z.boolean().optional(),
  beta: z.boolean().optional(),
  specUrl: z.string().nullish(),
  description: z.string().optional(),
  recommendation: z.string().nullish(),
  appliesTo: z.unknown().optional(),
}).passthrough();

export const catalog = z.object({
  contractVersion: z.string(),
  layers: z.array(z.object({ id: z.string(), name: z.string(), weight: z.number() }).passthrough()),
  checks: z.array(catalogCheck),
}).passthrough();

export type CatalogCheck = z.infer<typeof catalogCheck>;
export type Catalog = z.infer<typeof catalog>;

import rawCatalog from "./catalog.json";
export const vendoredCatalog: Catalog = catalog.parse(rawCatalog);

export function assertCatalogVersion(cat: Catalog, expected = "1.20.1"): void {
  if (cat.contractVersion !== expected) {
    throw new Error(
      `Catalog drift: vendored contractVersion ${cat.contractVersion} ≠ expected ${expected}. ` +
      `Run \`compare.ts check-catalog\` to re-vendor.`,
    );
  }
}

// Pool-selection helpers — encode the validated bonus-only rule.
export function isBonusOnly(c: CatalogCheck): boolean {
  return Boolean((c.essentialsBonusOnly || c.bonus) && c.id !== "markdown-negotiation-vary");
}
