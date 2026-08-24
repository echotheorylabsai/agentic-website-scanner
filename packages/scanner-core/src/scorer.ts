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
    // Unknown ids default to excluded-from-pools (never silently Recommended)
    const tier = cat?.essentialsTier ?? "recommended";
    const bonusOnly = cat
      ? Boolean(((cat.essentialsBonusOnly ?? false) || (cat.bonus ?? false)) && c.id !== "markdown-negotiation-vary")
      : true;
    const excluded = cat?.essentialsExcluded === true;
    return excluded
      ? { ...c, eligible: false, status: "na" as const, na_reason: c.na_reason ?? "Excluded from essentials scoring", essentials_tier: tier, essentials_bonus_only: bonusOnly }
      : { ...c, essentials_tier: tier, essentials_bonus_only: bonusOnly };
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

// ---------------------------------------------------------------------------
// Serialization (plan Task 10)
// ---------------------------------------------------------------------------

export interface SerializeMeta {
  target: string;
  displayTarget: string;
  reportUrl: string;
  scannedAt: string; // ISO
}

/** issues[].tier serialization map: 'required'→'essential'; bonus-only never appear. */
const ISSUE_TIER: Record<string, "essential" | "recommended"> = {
  required: "essential",
  recommended: "recommended",
};

const ACCESS_SIGNAL_FIRST = new Set([
  "agent-crawler-reachability", "bot-detection", "content-no-js", "docs-auth-gate",
  "redirect-hygiene", "agent-friendly-404",
]);

function issueOrderKey(c: ScoredCheck, gains: Map<string, number>): [number, number, number] {
  const tierRank = c.essentials_tier === "required" ? 0 : 1;
  const accessRank = ACCESS_SIGNAL_FIRST.has(c.id) || c.id.startsWith("ax-") ? 0 : 1;
  const gain = -(gains.get(c.id) ?? 0);
  return [tierRank, accessRank, gain];
}

/** Build the PublicScanReport from a scored scan (round(raw,1) serialization). */
export function serializeReport(
  raw: RawScore,
  checks: ScoredCheck[],
  meta: SerializeMeta,
): {
  target: string; display_target: string; report_url: string;
  score: number; score_label: string | null; scanned_at: string;
  eligible_checks: number;
  score_breakdown: {
    essential: { earned: number; available: number; passing: number; total: number };
    recommended: { earned: number; available: number; passing: number; total: number };
    bonus: { points: number; positive_signals: number };
  };
  issues: Array<{ id: string; name: string; tier: string; result: "failed" | "partial"; details: string | null; recommendation: string | null }>;
} {
  void checks;
  return {
    target: meta.target,
    display_target: meta.displayTarget,
    report_url: meta.reportUrl,
    score: raw.score,
    score_label: raw.label,
    scanned_at: meta.scannedAt,
    eligible_checks: raw.eligibleChecks,
    score_breakdown: {
      essential: { earned: round1(raw.essentialRaw), available: 80, passing: raw.passing.essential, total: raw.totals.essential },
      recommended: { earned: round1(raw.recommendedRaw), available: 20, passing: raw.passing.recommended, total: raw.totals.recommended },
      bonus: { points: Math.round(round1(raw.bonusRaw)), positive_signals: raw.bonusSignals },
    },
    issues: [],
  };
}

const round1 = (n: number): number => Math.round(n * 10) / 10;

/**
 * estGains — for each failed eligible non-bonus check, the score if that check
 * were flipped to a full pass. Used for FindingsList ordering (gain desc).
 */
export function estGains(checks: ScoredCheck[]): { gains: Map<string, number>; issues: Array<{ id: string; name: string; tier: string; result: "failed" | "partial"; details: string | null; recommendation: string | null }> } {
  const base = scoreReport(checks).score;
  const gains = new Map<string, number>();
  for (const c of checks) {
    if (!c.eligible || c.essentials_bonus_only) continue;
    if (c.status === "pass" || c.status === "na") continue;
    if (c.max_score === 0 || c.score >= c.max_score) continue;
    const flipped = checks.map((x) => x === c ? { ...x, status: "pass" as const, score: x.max_score } : x);
    gains.set(c.id, scoreReport(flipped).score - base);
  }
  const issues = checks
    .filter((c) => c.eligible && !c.essentials_bonus_only && c.status !== "pass" && c.status !== "na")
    .sort((a, b) => {
      const ka = issueOrderKey(a, gains); const kb = issueOrderKey(b, gains);
      for (let i = 0; i < 3; i++) if (ka[i] !== kb[i]) return ka[i] - kb[i];
      return 0;
    })
    .map((c) => ({
      id: c.id, name: c.id, // engine joins catalog names upstream
      tier: ISSUE_TIER[c.essentials_tier] ?? "recommended",
      result: (c.status === "fail" || c.status === "error" ? "failed" : "partial") as "failed" | "partial",
      details: c.details ?? null,
      recommendation: c.recommendation ?? null,
    }));
  return { gains, issues };
}
