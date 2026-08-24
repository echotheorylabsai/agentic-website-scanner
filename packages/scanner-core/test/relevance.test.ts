import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { applyRelevance } from "../src/relevance.js";
import type { ProbeResult, ScanContext } from "../src/probes/types.js";
import { newScanContext } from "../src/probes/types.js";

const r = (id: string, status: ProbeResult["status"] = "pass", score = 1): ProbeResult =>
  ({ id, status, score, max_score: score || 2, details: "" });

describe("applyRelevance — deterministic dependent-family gating", () => {
  it("N/A's exactly the REST spec-dependent ×5 without an OpenAPI surface; never the always-on set", () => {
    const ctx = newScanContext(); // restSurface false
    const results = [
      r("api-error-model"), r("api-versioning-policy"), r("pagination-shape"),
      r("async-job-pattern"), r("response-schema-coverage"),
      r("json-error-responses"), r("rate-limit-headers"), r("function-calling-compat"),
      r("rest-sdk-packages"), r("api-schema-analysis"),
      r("openapi-spec", "fail", 0), // detector fails normally
    ];
    const { gated, assessed } = applyRelevance(results, ctx);
    const na = new Set(assessed.naCheckIds);
    for (const id of ["api-error-model", "api-versioning-policy", "pagination-shape", "async-job-pattern", "response-schema-coverage"]) {
      expect(na.has(id), id).toBe(true);
      const row = gated.find((g) => g.id === id)!;
      expect(row.eligible).toBe(false);
      expect(row.status).toBe("na");
      expect(row.na_reason).toMatch(/No OpenAPI spec found/);
    }
    for (const id of ["json-error-responses", "rate-limit-headers", "function-calling-compat", "rest-sdk-packages", "api-schema-analysis"]) {
      const row = gated.find((g) => g.id === id)!;
      expect(row.eligible, id).toBe(true);
      expect(na.has(id)).toBe(false);
    }
    expect(gated.find((g) => g.id === "openapi-spec")!.na_reason).toBeUndefined();
  });

  it("keeps REST spec-dependent checks eligible when a spec was parsed", () => {
    const ctx: ScanContext = { ...newScanContext(), restSurface: true };
    const { assessed } = applyRelevance([r("pagination-shape")], ctx);
    expect(assessed.naCheckIds).toHaveLength(0);
  });

  it("MCP sub-checks: none ⇒ N/A 'No MCP server detected'; auth-gated handshake ⇒ auth reason", () => {
    const none = newScanContext();
    let out = applyRelevance([r("mcp-tool-descriptions")], none);
    expect(out.assessed.reasons["mcp-tool-descriptions"]).toMatch(/No MCP server detected/);

    const authed: ScanContext = { ...newScanContext(), mcpHandshake: "auth-gated" };
    out = applyRelevance([r("mcp-tool-descriptions")], authed);
    expect(out.assessed.reasons["mcp-tool-descriptions"]).toMatch(/requires authentication/);

    const okHandshake: ScanContext = { ...newScanContext(), mcpHandshake: "ok" };
    out = applyRelevance([r("mcp-tool-descriptions")], okHandshake);
    expect(out.assessed.naCheckIds).toHaveLength(0);
  });

  it("ax-* family cascades to N/A when homepage unfetchable", () => {
    const ctx: ScanContext = { ...newScanContext(), homepage: null };
    const { assessed } = applyRelevance([r("ax-form-labeling")], ctx);
    expect(assessed.naCheckIds).toEqual(["ax-form-labeling"]);
  });

  it("payments family stays eligible on positive evidence (detector sets commerceSignals)", () => {
    const hit: ScanContext = { ...newScanContext(), commerceSignals: true };
    let out = applyRelevance([r("x402-support", "pass", 2)], hit);
    expect(out.assessed.naCheckIds).toHaveLength(0);

    const noCommerce = newScanContext();
    out = applyRelevance([r("x402-support", "fail", 0)], noCommerce);
    expect(out.assessed.naCheckIds).toEqual(["x402-support"]);
  });

  it("incoming na-status results become ineligible with their own reason", () => {
    const res: ProbeResult[] = [{ id: "docs-auth-gate", status: "na", score: 0, max_score: 2, details: "Homepage unreachable" }];
    const { gated, assessed } = applyRelevance(res, newScanContext());
    expect(gated[0].eligible).toBe(false);
    expect(assessed.reasons["docs-auth-gate"]).toBe("Homepage unreachable");
  });
});
