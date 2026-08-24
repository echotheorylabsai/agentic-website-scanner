#!/usr/bin/env node
/**
 * Comparison harness (plan Task 15).
 * Commands:
 *   fetch <host>            – snapshot Ora's per-domain essentials (+format=audit) → stdout JSON file
 *   diff <host> <ref.json>  – per-check fraction/status/tier diff: theirs vs ours (/api/v1/report)
 *   reproject <host> <ref.json> – their fractions restricted to our roster through our formula == our score
 *   labels                  – print label-band table accumulated so far (manual curation aid)
 *
 * No external dependencies — plain Node ≥20.
 */
const ORA_SCORE = (host) => `https://ora.ai/api/score/${host}?include=essentials&format=audit`;
const LOCAL_REPORT = (host) => `${process.env.LOCAL_ORIGIN ?? "http://localhost:3100"}/api/v1/report?url=${encodeURIComponent(host)}`;

async function getJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": "ora-agent/1.0" } });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.json();
}

const trunc01 = (n) => Math.trunc(n * 10) / 10;
function gradeFor(score) {
  for (const [min, g] of [[95, "A+"], [86, "A"], [70, "B"], [48, "C"], [28, "D"], [-Infinity, "F"]])
    if (score >= min) return g;
  return "F";
}

/** Reproduce our scorer over a checks map {id:{tier,bonus,fraction}} + catalog maxScores. */
async function reprojectScore(checksMap) {
  const catalog = (await import("../packages/scanner-core/src/catalog.json", { with: { type: "json" } })).default;
  const byId = new Map(catalog.checks.map((c) => [c.id, c]));
  const pool = (tier) => Object.entries(checksMap)
    .filter(([id]) => {
      const c = byId.get(id);
      if (!c) return false;
      const bonusOnly = ((c.essentialsBonusOnly ?? false) || (c.bonus ?? false)) && id !== "markdown-negotiation-vary";
      return !bonusOnly && !c.essentialsExcluded && c.essentialsTier === tier;
    })
    .map(([, v]) => v.fraction);
  const bonusSum = Object.entries(checksMap)
    .filter(([id]) => {
      const c = byId.get(id);
      if (!c) return false;
      return (((c.essentialsBonusOnly ?? false) || (c.bonus ?? false)) && id !== "markdown-negotiation-vary");
    })
    .filter(([, v]) => v.fraction > 0)
    .reduce((a, [, v]) => a + v.fraction, 0);
  const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const E = 80 * mean(pool("required"));
  const R = 20 * mean(pool("recommended"));
  const B = Math.min(5, 0.25 * bonusSum);
  const score = Math.round(trunc01(E) + trunc01(R) + trunc01(B));
  return { E: trunc01(E), R: trunc01(R), B: trunc01(B), score, grade: gradeFor(score) };
}

async function main() {
  const [cmd, host, refPath] = process.argv.slice(2);
  if (!cmd) { console.error("usage: compare.mjs fetch|diff|reproject|labels ..."); process.exit(1); }

  if (cmd === "fetch") {
    if (!host) { console.error("fetch <host>"); process.exit(1); }
    const ref = await getJson(ORA_SCORE(host));
    console.log(JSON.stringify(ref, null, 2));
    console.error(`# scannedAt=${ref.scannedAt ?? ref.essentials?.scannedAt} — save to a file for diff/reproject`);
    return;
  }

  if (cmd === "diff" || cmd === "reproject") {
    if (!host || !refPath) { console.error(`${cmd} <host> <ref.json>`); process.exit(1); }
    const ref = JSON.parse(await import("node:fs").then((m) => m.readFileSync(refPath, "utf8")));
    const ess = ref.essentials ?? ref;
    const theirs = ess.checks; // map keyed by id
    const ours = await getJson(LOCAL_REPORT(host));

    if (cmd === "reproject") {
      const rp = await reprojectScore(theirs);
      console.log("Reprojected (their fractions × our formula):");
      console.log(`  E=${rp.E}  R=${rp.R}  B=${rp.B}`);
      console.log(`  score=${rp.score} (${rp.grade})`);
      console.log(`Our published score:          ${ours.score}`);
      console.log(`Their published score:        ${ess.score}`);
      const match = rp.score === ess.score;
      console.log(match ? "✓ reprojected == their published score" : "✗ MISMATCH vs their published");
      process.exitCode = match ? 0 : 2;
      return;
    }

    // diff
    let overlap = 0; const rows = []; const advisory = new Set(["brand-search-accuracy", "agentic-search-specific", "wikipedia-presence", "onboarding-friction"]);
    for (const [id, t] of Object.entries(theirs)) {
      const rosterHit = ours.eligible_checks !== undefined;
      void rosterHit;
      // we don't expose per-check in /api/v1/report — use full endpoint
      const full = await getJson(`${process.env.LOCAL_ORIGIN ?? "http://localhost:3100"}/api/report/full?url=${encodeURIComponent(host)}`);
      if (overlap === 0) {
        for (const c of full.roster) {
          const th = theirs[c.check_id];
          if (!th) continue;
          const tf = th.fraction ?? 0;
          const of_ = c.fraction ?? 0;
          const delta = Math.abs(tf - of_);
          rows.push({ id: c.check_id, theirs: tf, ours: of_, delta: Math.round(delta * 100) / 100, status_theirs: tf >= 1 ? "pass" : tf > 0 ? "partial" : "fail", status_ours: c.status, advisory: advisory.has(c.check_id) });
        }
      }
      break;
    }
    overlap = rows.length;
    const exact = rows.filter((r) => r.delta === 0).length;
    const closeish = rows.filter((r) => r.delta <= 0.34).length;
    console.log(`Overlap: ${overlap} checks · exact fraction matches: ${exact} · within ±⅓: ${closeish}`);
    for (const r of rows.sort((a, b) => b.delta - a.delta).slice(0, 25)) {
      console.log(`  ${r.id.padEnd(32)} theirs=${r.theirs.toFixed(2)} ours=${String(r.ours).padEnd(5)} Δ=${r.delta}${r.advisory ? " [advisory]" : ""}`);
    }
    return;
  }

  if (cmd === "labels") {
    console.log("Label bands are data-driven from snapshots; see apps/web/src/lib/labels.json once populated by validation runs.");
    return;
  }

  console.error(`unknown command ${cmd}`); process.exit(1);
}
main().catch((e) => { console.error(e.message); process.exit(1); });
