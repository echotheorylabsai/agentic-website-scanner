import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { joinCatalogFlags, scoreReport, gradeFor } from "../src/scorer.js";
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
