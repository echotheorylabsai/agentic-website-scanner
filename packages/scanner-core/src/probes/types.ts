import type { FetchedResponse, UaName } from "../fetcher.js";

export type CheckId = string;
export type CheckStatus = "pass" | "fail" | "warning" | "na" | "error";

/** One check result as produced by a probe (pre-gating). */
export interface ProbeResult {
  id: CheckId;
  status: CheckStatus;
  score: number;
  max_score: number;
  details: string;
  recommendation?: string;
}

/**
 * Mutable context threaded through probes.
 * Detector probes write surface facts; dependent probes read them.
 */
export interface ScanContext {
  homepage?: FetchedResponse | null;   // set by content probes (raw HTML)
  openapi?: FetchedResponse | null;    // set by openapi-spec detector
  mcpManifest?: FetchedResponse | null;// set by MCP discovery detector
  restSurface: boolean;                // OpenAPI parsed OR REST evidence found
  graphqlSurface: boolean;             // /graphql endpoint or schema evidence
  restOrDocsEvidence: boolean;         // REST API OR developer docs present
  commerceSignals: boolean;            // pricing/cart/checkout signals
  mcpHandshake: "ok" | "auth-gated" | "none";
}

export interface Probe {
  /** Check ids this probe produces results for. */
  ids: readonly CheckId[];
  layer: "discovery" | "accessibility" | "usability" | "payments";
  run(ctx: ProbeContext): Promise<ProbeResult[]>;
}

export interface ProbeContext {
  url: URL;
  fetchAs: (url: string | URL, opts?: { ua?: UaName; accept?: string; timeoutMs?: number }) => Promise<FetchedResponse>;
  ctx: ScanContext;
}

export function newScanContext(): ScanContext {
  return {
    restSurface: false,
    graphqlSurface: false,
    restOrDocsEvidence: false,
    commerceSignals: false,
    mcpHandshake: "none",
  };
}

export function result(id: CheckId, status: CheckStatus, score: number, max_score: number, details: string, recommendation?: string): ProbeResult {
  return { id, status, score, max_score, details, recommendation };
}

/** fraction per validated formula; error ⇒ 0 but still eligible. */
export function fraction(r: ProbeResult): number {
  if (r.max_score === 0) return 0;
  if (r.status === "error") return 0;
  return r.score / r.max_score;
}
