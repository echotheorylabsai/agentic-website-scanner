import type { ProbeResult, ScanContext } from "./probes/types.js";

/** A check after deterministic gating. */
export interface GatedCheck extends ProbeResult {
  eligible: boolean;      // false ⇒ N/A'd by gating (excluded from all denominators)
  na_reason?: string;
}

/**
 * Deterministic dependent-family gating ONLY.
 * Detector checks are never auto-N/A'd here. Product-level relevance
 * (LLM-judged upstream) is advisory and never replicated.
 * naReason strings follow observed native details text.
 */
const REST_SPEC_DEPENDENT = new Set([
  "api-error-model", "api-versioning-policy", "pagination-shape",
  "async-job-pattern", "response-schema-coverage",
]);
const GRAPHQL_FAMILY = new Set(["graphql-error-type-definition", "graphql-versioning-policy", "graphql-pagination-pattern", "graphql-async-job-pattern", "graphql-schema-completeness", "graphql-batch-mutations"]);
const PAYMENTS_FAMILY = new Set(["mpp-support", "x402-support", "ucp-support", "acp-support", "acp-delegate-payment", "ap2-support"]);
const AX_FAMILY = new Set(["ax-document-structure", "ax-native-controls", "ax-accessible-names", "ax-form-labeling", "ax-tree-injection-safe"]);
const MCP_SUBCHECKS = new Set(["mcp-registry-listed", "mcp-tool-descriptions", "mcp-param-schemas", "mcp-server-identity", "mcp-tool-listing", "mcp-tool-naming", "mcp-auth-mechanism", "mcp-oauth-metadata", "mcp-pkce-s256", "mcp-error-handling", "mcp-transport-modern", "mcp-tool-annotations", "mcp-multi-surface-coverage", "mcp-resource-listing", "mcp-app-registry", "mcp-apps-ui-quality", "mcp-view-domain", "mcp-view-csp", "mcp-resource-quality"]);

export function applyRelevance(results: ProbeResult[], ctx: ScanContext): { gated: GatedCheck[]; assessed: { naCheckIds: string[]; reasons: Record<string, string> } } {
  const gated: GatedCheck[] = [];
  const naCheckIds: string[] = [];
  const reasons: Record<string, string> = {};

  for (const r of results) {
    let naReason: string | null = null;

    // probes that already emitted na (homepage-unreachable cascade etc.)
    if (r.status === "na" && !naReason) naReason = r.details || "Not applicable for this domain";
    else if (REST_SPEC_DEPENDENT.has(r.id) && !ctx.restSurface) {
      naReason = "No OpenAPI spec found - check not applicable.";
    } else if (GRAPHQL_FAMILY.has(r.id) && !ctx.graphqlSurface) {
      naReason = "No GraphQL surface detected on this domain";
    } else if (MCP_SUBCHECKS.has(r.id)) {
      if (!ctx.mcpManifest && ctx.mcpHandshake === "none") naReason = "No MCP server detected on this domain";
      else if (ctx.mcpHandshake === "auth-gated") naReason = "MCP server requires authentication";
    } else if (AX_FAMILY.has(r.id) && (!ctx.homepage || ctx.homepage.status >= 400)) {
      naReason = "No server HTML available for accessibility-tree analysis";
    } else if (PAYMENTS_FAMILY.has(r.id) && !ctx.commerceSignals && r.score === 0) {
      naReason = "No commerce signals detected on this domain";
    } else if ((r.id === "docs-auth-gate" || r.id === "redirect-hygiene") && r.status === "na") {
      naReason = r.details; // homepage-unreachable cascade from the probe itself
    }

    const g: GatedCheck = naReason
      ? { ...r, status: "na", score: 0, eligible: false, na_reason: naReason }
      : { ...r, eligible: true };
    if (naReason) { naCheckIds.push(g.id); reasons[g.id] = naReason; }
    gated.push(g);
  }

  return { gated, assessed: { naCheckIds, reasons } };
}
