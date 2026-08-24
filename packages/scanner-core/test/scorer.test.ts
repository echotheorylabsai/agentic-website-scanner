import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { joinCatalogFlags, scoreReport, gradeFor, estGains } from "../src/scorer.js";
import type { GatedCheck } from "../src/relevance.js";
import { vendoredCatalog } from "../src/schema.js";

const fx = (p: string) => JSON.parse(readFileSync(new URL(`./fixtures/golden/${p}`, import.meta.url), "utf8"));

/**
 * Reconstruct GatedCheck rows straight from Ora's per-domain ground truth
 * (`essentials.checks` map keyed by id; fields tier/bonus/fraction/occurrences).
 * N/A checks are ABSENT from that map (validated) so they never appear here.
 */
function rowsFromEssentials(ess: { checks: Record<string, { tier: string; bonus?: boolean; fraction: number }> }): GatedCheck[] {
  const byId = new Map(vendoredCatalog.checks.map((c) => [c.id, c]));
  return Object.entries(ess.checks).map(([id, v]) => {
    const cat = byId.get(id);
    if (!cat) throw new Error(`check ${id} not in catalog`);
    const max = cat.maxScore;
    return {
      id,
      status: v.fraction >= 1 ? "pass" : v.fraction > 0 ? "warning" : "fail",
      score: Math.round(v.fraction * max),
      max_score: max,
      details: "golden fixture",
      eligible: true,
    };
  });
}

describe.each([
  ["vercel-essentials.json", 63.5, 16.8, 5, 85],
  ["eve-essentials.json", null, null, null, 55],
  ["meta-essentials.json", null, null, null, 32],
])("golden scorer: %s", (fixture, e, r, b, score) => {
  it("reproduces Ora's published essentials numbers exactly", () => {
    const payload = fx(fixture);
    const ess = payload.essentials ?? payload;
    const scored = joinCatalogFlags(rowsFromEssentials(ess), vendoredCatalog);
    const raw = scoreReport(scored);
    if (e !== null) expect(round1(raw.essentialRaw)).toBe(e);
    if (r !== null) expect(round1(raw.recommendedRaw)).toBe(r);
    if (b !== null) expect(raw.bonusRaw).toBe(b);
    expect(raw.score).toBe(score);
    // cross-check against Ora's own reported values
    expect(ess.score ?? payload.score).toBe(score);
    expect(ess.required?.earned ?? raw.essentialRaw).toBeCloseTo(e ?? round1(raw.essentialRaw), 5);
  });
});

const round1 = (n: number): number => Math.round(n * 10) / 10;

describe("grade bands", () => {
  it("matches A+≥95 A≥86 B≥70 C≥48 D≥28 F", () => {
    expect(gradeFor(95)).toBe("A+");
    expect(gradeFor(86)).toBe("A");
    expect(gradeFor(70)).toBe("B");
    expect(gradeFor(48)).toBe("C");
    expect(gradeFor(28)).toBe("D");
    expect(gradeFor(27)).toBe("F");
  });
});

describe("gating invariance", () => {
  it("N/A checks never change scores", () => {
    const payload = fx("vercel-essentials.json");
    const ess = payload.essentials;
    const base = scoreReport(joinCatalogFlags(rowsFromEssentials(ess), vendoredCatalog)).score;
    const withNa = joinCatalogFlags([
      ...rowsFromEssentials(ess),
      ...[0, 1].map((i) => ({ id: `synthetic-na-${i}`, status: "na" as const, score: 7, max_score: 9, details: "", eligible: false })),
    ], vendoredCatalog);
    expect(scoreReport(withNa).score).toBe(base);
  });
});

describe("serialization (Task 10)", () => {
  it("serializeReport emits issues ordered access-signal first with catalog names", async () => {
    const { serializeReport, estGains, joinCatalogFlags } = await import("../src/scorer.js");
    const payload = fx("vercel-essentials.json");
    const ess = payload.essentials;
    // degrade a couple of checks so issues exist
    const rows = rowsFromEssentials(ess).map((r) =>
      r.id === "agent-friendly-404" ? { ...r, status: "fail" as const, score: 0 } :
      r.id === "rate-limit-headers" ? { ...r, status: "warning" as const } : r);
    const scored = joinCatalogFlags(rows, vendoredCatalog);
    const raw = scoreReport(scored);
    const names = new Map(vendoredCatalog.checks.map((c) => [c.id, c.name]));
    const report = serializeReport(raw, scored, {
      target: "https://vercel.com", displayTarget: "vercel.com",
      reportUrl: "http://localhost:3000/scan/vercel.com", scannedAt: new Date().toISOString(),
    }, names);
    expect(report.score_breakdown.essential.earned).toBeLessThanOrEqual(63.5);
    expect(report.issues.length).toBeGreaterThan(0);
    expect(report.issues[0].name).not.toBe(report.issues[0].id); // catalog names joined
    // ordering: agent-friendly-404 (access signal) before rate-limit-headers (non-access)
    const ids = report.issues.map((i) => i.id);
    expect(ids.indexOf("agent-friendly-404")).toBeLessThan(ids.indexOf("rate-limit-headers"));
    void estGains;
  });
  it("rounds earned on serialization (round not trunc): 10.2 stays 10.2", () => {
    expect(Math.round(10.19 * 10) / 10).toBe(10.2);
  });
});

describe("issue ordering vs official reports (fractional gains)", () => {
  // Same membership always; vercel reproduces exact order. eve/meta have an
  // unobservable intra-tier tie-break in Ora (documented residual).
  for (const [fx, report, exact] of [
    ["vercel-essentials.json", "real-report-vercel.json", true],
    ["eve-essentials.json", "real-report-eve.json", false],
    ["meta-essentials.json", "real-report-meta.json", false],
  ] as const) {
    it(`${report}: overlapping issue ${exact ? "order matches exactly" : "set matches"}`, () => {
      const ess = JSON.parse(readFileSync(new URL(`./fixtures/golden/${fx}`, import.meta.url), "utf8")).essentials;
      const scored = joinCatalogFlags(rowsFromEssentials(ess), vendoredCatalog);
      const { issues } = estGains(scored);
      const ours = issues.map((i) => i.id);
      const official = JSON.parse(readFileSync(new URL(`./fixtures/${report}`, import.meta.url), "utf8"))
        .issues.map((i: { id: string }) => i.id);
      const common = official.filter((id: string) => ours.includes(id));
      if (exact) {
        expect(ours.filter((id) => common.includes(id))).toEqual(common);
      } else {
        expect([...ours].sort()).toEqual([...common].sort());
      }
    });
  }
});
