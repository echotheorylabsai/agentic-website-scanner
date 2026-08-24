import type { Catalog } from "./schema.js";
import type { GatedCheck } from "./relevance.js";

/**
 * Scorer — reproduces the validated is-agentic/Ora essentials formula:
 *   fraction = score/max_score (error ⇒ 0, still eligible)
 *   E = 80 × mean(fractions of eligible non-bonus-only checks, essentialsTier 'required')
 *   R = 20 × mean(… 'recommended')
 *   B = min(5, 0.25 × Σ positive bonus fractions)
 *   score = round(trunc0.1(E) + trunc0.1(R) + trunc0.1(B))
 *
 * Catalog flags are JOINED onto result rows upstream (joinCatalogFlags);
 * bonus-only rule: essentialsBonusOnly OR native bonus, except
 * markdown-negotiation-vary which stays in the Essential pool.
 */
export interface RawScore {
  essentialRaw: number;
  recommendedRaw: number;
  bonusRaw: number;
  passing: { essential: number; recommended: number };
  totals: { essential: number; recommended: number };
  bonusSignals: number;
  eligibleChecks: number;
  score: number;
  grade: string;
  label: string | null;
}

const trunc0_1 = (n: number): number => Math.trunc(n * 10) / 10;

export const GRADE_BANDS: Array<[number, string]> = [
  [95, "A+"], [86, "A"], [70, "B"], [48, "C"], [28, "D"], [-Infinity, "F"],
];

export function gradeFor(score: number): string {
  for (const [min, g] of GRADE_BANDS) if (score >= min) return g;
  return "F";
}

/** Result row extended with the joined catalog classification. */
export interface ScoredCheck extends GatedCheck {
  essentials_tier: "required" | "recommended" | "emerging";
  essentials_bonus_only: boolean; // composite rule applied
}

/** Join vendored-catalog classification onto gated results (by check id). */
export function joinCatalogFlags(checks: GatedCheck[], catalog: Catalog): ScoredCheck[] {
  const byId = new Map(catalog.checks.map((c) => [c.id, c]));
  return checks.map((c) => {
    const cat = byId.get(c.id);
    const tier = cat?.essentialsTier ?? "recommended";
    const bonusOnly = Boolean(cat && ((cat.essentialsBonusOnly ?? false) || (cat.bonus ?? false)) && c.id !== "markdown-negotiation-vary");
    return { ...c, essentials_tier: tier, essentials_bonus_only: bonusOnly };
  });
}

function pool(cs: ScoredCheck[], tier: "required" | "recommended"): { fractions: number[]; passing: number } {
  const inPool = cs.filter((c) => c.eligible && !c.essentials_bonus_only && c.essentials_tier === tier);
  const fractions = inPool.map((c) => (c.max_score === 0 ? 0 : c.status === "error" ? 0 : c.score / c.max_score));
  return { fractions, passing: inPool.filter((c) => c.status === "pass").length };
}

const mean = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export function scoreReport(checks: ScoredCheck[], labels?: Record<string, string>): RawScore {
  const ess = pool(checks, "required");
  const rec = pool(checks, "recommended");

  const essentialRaw = 80 * mean(ess.fractions);
  const recommendedRaw = 20 * mean(rec.fractions);

  const bonusChecks = checks.filter((c) => c.eligible && c.essentials_bonus_only);
  const bonusSum = bonusChecks.reduce((acc, c) => acc + Math.max(0, c.max_score === 0 ? 0 : c.score / c.max_score), 0);
  const bonusRaw = Math.min(5, 0.25 * bonusSum);

  const score = Math.round(trunc0_1(essentialRaw) + trunc0_1(recommendedRaw) + trunc0_1(bonusRaw));

  return {
    essentialRaw, recommendedRaw, bonusRaw,
    passing: { essential: ess.passing, recommended: rec.passing },
    totals: { essential: ess.fractions.length, recommended: rec.fractions.length },
    bonusSignals: bonusChecks.filter((c) => c.score > 0).length,
    eligibleChecks: ess.fractions.length + rec.fractions.length,
    score,
    grade: gradeFor(score),
    label: labels?.[String(score)] ?? null,
  };
}
