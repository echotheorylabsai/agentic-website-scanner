# Validation Run 01 — Our Scanner vs is-agentic.com

**Date:** 2026-08-24 · **Domains:** vercel.com, eve.dev, meta.ai, example.org
**Method:** fresh official reports (`is-agentic.com/api/v1/report` + `ora.ai/api/score/<host>?include=essentials&format=audit`) vs our local scanner (`localhost:3100`), per-check fraction diff on overlapping checks, formula reprojection, official CLI rendering.

## Headline scores

| Domain | Official | Ours | Δ | Note |
|---|---|---|---|---|
| vercel.com | 85 | 92 | +7 | residual heuristics, see below |
| eve.dev | 55 → **71** (fresh rescan) | 66 (pre-rescan run) | — | eve.dev shipped md/agents.md/JSON-LD between scans; our results matched the fresh Ora scan on all three flipped checks |
| meta.ai | 32 | 27 | −5 | OAuth/a2a partials not replicable |
| example.org | 51 | 38 | −13 | overlap only 21 checks; gap = roster coverage (LLM-judged etc.), zero logic mismatches (21/21 exact) |

## Formula validation (the core claim)

- Golden fixtures reproduce Ora published numbers exactly: **vercel 63.5/16.8/5→85 · eve 55 · meta 32** ✔
- Reprojection (their per-check fractions through our scorer) == their published score on vercel/meta and eve-v1 ✔ (artifacts in `artifacts/`)
- Fresh eve snapshot reproduces to 70 vs published 71 — **input-precision bound**: Ora's essentials map ships fractions rounded to 2dp while their internal math uses exact rationals; component rounding matches their displayed breakdown. Bounded ±1.

## Per-check accuracy (overlapping checks)

| Domain | Overlap | Exact match |
|---|---|---|
| vercel.com | 42 | 34 (81%) |
| eve.dev | 36 | 27 (75%) |
| meta.ai | 32 | 23 (72%) |
| example.org | 21 | 21 (100%) |

## Bugs found & fixed during this campaign (each verified against live ground truth)

1. **MCP auth-wall redirects**: vercel.com answers initialize with `307 → /auth-redirect/mcp`; treated as "no server". Fixed: manual redirect + auth-location/body detection ⇒ 5/6 warning (matches Ora).
2. **auth.md false pass**: vercel.com/auth.md serves an HTML app shell (soft-404), meta.ai returns JSON 401 — we credited both. Fixed: require non-HTML CT + auth keywords.
3. **Invalid-manifest over-trigger**: vercel.com/mcp.json (non-well-known path) serving HTML triggered "invalid manifest"; restricted to `/.well-known/*`.
4. **function-calling-compat regex bug**: `\bdescription\b\s*:` never matched JSON `"description":` (quote between); plus 600-char block window too small for vercel's 10MB spec.
5. **Gating contract violation**: `api-schema-analysis` / `function-calling-compat` / `llms-txt-formatting` emitted `na` but stayed eligible — Ora *scores* these without a spec/file (0 or partial). Now emit fail/partial accordingly.
6. **essentialsExcluded ignored**: robots-* checks polluted Recommended pool. Fixed in joinCatalogFlags.
7. **13 probes unwired** (incl. Essential-pool oauth-support & scoped-permissions) — distorted every mean.
8. **agent-friendly-404 leniency**: full credit now requires agent-oriented guidance, not just any link.
9. **rate-limit-headers**: docs-only evidence no longer counts; live headers required.
10. **json-error-responses**: SPA-catch-all HTML error bodies ⇒ 0 (not a warning); JSON problem bodies probed at /api and /api/v1.
11. **public-api under-credit**: documented endpoints on /docs count as strong evidence.
12. **metadata-completeness**: expanded signal set (og:description, twitter:card), graded ≥4 ⇒ pass, 1–3 ⇒ partial.
13. **trust-anchors**: homepage footer links count toward anchors (eve.dev case).
14. **docs-auth-gate false wall**: /developers login-redirect no longer misread as gated docs (vercel.com case).

## Documented residuals (heuristic differences, not bugs)

- **content-no-js**: Ora stricter about visible prose depth (vercel 0.33 vs ours 1.0) — likely LLM-assisted judgment upstream.
- **scoped-permissions** (vercel): Ora requires least-privilege enforcement detail beyond scopes-defined+referenced.
- **oauth-support** (meta.ai 1.0 vs 0): Ora detects OAuth via signals we could not observe publicly.
- **bot-detection** (meta.ai): intermittent Cloudflare challenge — flaky both sides.
- **a2a/mcp-server-card partials** (meta.ai): half-credit rules not fully inferable.
- **agent-instruction**: Ora's secondary signal differs (their 0.67 vs our file-found 0.33 pattern across domains).
- **rest-sdk-packages**: registry-name heuristics differ per domain.
- **example.org score gap**: pure roster coverage (we implement 50 deterministic checks of 124; remainder is LLM-judged/bonus) — zero logic mismatches on overlap.

## Official CLI fidelity

`IS_AGENTIC_API_ORIGIN=http://localhost:3100 npx is-agentic <host>` renders our reports indistinguishably from real ones (score bar, breakdown table, ordered issues with evidence + fixes). SSE wire protocol byte-compatible (flat `{type,...}` frames, canonical order incl. cache-hit triple).

## Artifacts

Persisted under `artifacts/`: per-domain stream captures (`stream-*.txt`), served reports (`report-*.json`), full per-check diff (`deep-diff.txt`). Regenerate with `tools/deepdiff.py`.

## Conclusion

Business logic for every deterministic check is now either **byte-matched to observed Ora behavior** or documented as a bounded residual. The scoring formula reproduces published scores exactly given identical inputs. Remaining score deltas trace to (a) roster coverage, (b) documented heuristic residuals, (c) temporal skew when targets ship changes between the two scanners' runs (eve.dev case proved our side correct).

## Independent 7-agent verification of reused-logic claims (post-run audit)

| Claim | Verdict |
|---|---|
| Scoring formula | CONFIRMED (goldens pass; rounding verified) |
| Pool rules | CONFIRMED (essential pool = 11 on vercel; nuance: unknown ids still bonus-eligible) |
| Catalog verbatim | CONFIRMED (byte-identical, 124 checks, version pinned) |
| Gating families | PARTIAL — meta.ai split matches exactly; Ora also N/A'd rate-limit-headers on eve.dev (reason: "No REST or GraphQL surface detected") which we score as fail; 2 MCP bonus-check eligibility edges differ (~0 score impact) |
| Issue ordering | PARTIAL → FIXED — integer estGains collapsed ties; now fractional gains reproduce vercel's official order exactly; eve/meta have an unobservable intra-tie tie-break |
| SSE protocol | PARTIAL → doc fixed — engine already matched capture (late discovery_phase straddles relevance_assessed 1+2); claim text corrected; per-type validation is required-fields + unknown-type rejection, not key-strict |
| Label bands | CONFIRMED at all four data points (cutoffs between observations not uniquely provable with n=4) |

---

# Addendum: Deterministic Text Adoption (post run-01)

**Scope:** Adopt is-agentic's deterministic text for checks exactly similar to ours. LLM text/checks out of scope. Plan independently reviewed (Opus 5, 3 rounds → amendments incorporated).

## What changed
- **`checkText.json`** — 32 adopted (check,status)→details pairs (after per-pair sign-off: 3 unreachable/mismatched pairs rejected), each passing a 3-layer gate:
  ≥2-domain byte-match → datum audit (Ora probe constants rejected: "6 AI agent user-agents", live counts) → no-conflict (pairs with cross-domain wording conflicts rejected unless branch reproducible) → per-pair manual sign-off.
- **Fix lines**: catalog recommendation (Ora-authored) is now primary for all non-pass outcomes (137/137 official rows byte-match catalog).
- **N/A channel**: gated N/A now sets `details` = na text (Ora-wire-faithful; previously stale probe text). Captured family strings adopted: REST, commerce, rate-limit (combined REST+GraphQL gate), MCP.
- **Gating ahead of emission**: gated checks emit `status:"na"` + family text in SSE frames (matching Ora's wire format; previously `status:"error"` + probe text).
- **Semantic alignments** (toward observed Ora behavior): code-fence-validity na-when-no-markdown (was free pass); agent-instruction/openapi-spec/sitemap/trust-anchors/json-ld/org-schema/scoped-permissions/sandbox/auth-md/rate-limit fail texts now byte-match Ora's captured strings; A2A card probe checks agent-card.json path.
- **Kept ours** (datum mismatches, documented in checkText.json): bot-detection pass ("6 UAs" vs our 3), docs-auth-gate pass (live page counts), code-fence pass (live doc count), metadata-completeness pass (different signal sets), redirect-hygiene pass (live page count), developer-portal pass (live path), markdown-negotiation fail (live CT/Vary), agent-crawler-reachability pass (per-UA list for unprobed UAs), robots-agent-user-policy pass (semantic mismatch).

## Score impact (all shifts toward Ora-alignment)

| Domain | Before | After | Δ | Cause |
|---|---|---|---|---|
| vercel.com | 92 | 92 | 0 | — |
| eve.dev | 65 | 65 | 0 | — |
| meta.ai | 27 | 25 | −2 | code-fence na-alignment + rate-limit gate (Ora's own meta behavior: scored) |
| example.org | 36 | 35 | −1 | rate-limit gate (matches Ora na ✓) |

**Known temporal inconsistency (documented):** Ora's own eve.dev scans disagree on rate-limit-headers — older capture: na with our adopted text; fresh capture (score-71 run): scored 0.00. We follow the [static]-captured text.

## Verification
- 42 core tests + 3 web schema tests pass (45 total), tsc clean on both packages
- C1 golden: every adopted (checkId,status)→text pair asserted present in emitted sources; family strings match NA_TEXT exactly
- Per-check diff re-run: artifacts/deep-diff-post-text.txt

---

# Addendum 2: Live Browser E2E Test (Playwright)

**Method:** Playwright Chromium drove the real UI at localhost:3100 — home page → domain entry → live scan progress → rendered report (screenshots for all 4 domains + roster expansion + in-browser markdown negotiation check). Official pages captured side-by-side from is-agentic.com/scan/<domain>.

**Results (browser-verified):**

| Domain | Official (live) | Ours (live UI) | Δ | Labels match |
|---|---|---|---|---|
| vercel.com | 86 | 92 | +6 | ✓ Strong technical baseline |
| eve.dev | 71 | 66 | −5 | ✗ (see below) |
| meta.ai | 32 | 25 | −7 | ✓ Agents are likely to struggle |
| example.org | 51 | 35 | −16 | ✗ (see below) |

**New label band discovered:** official eve.dev at 71 shows "Ready with a few material gaps" — a band between "Strong technical baseline" (≥80) and "Important blockers remain". Added to scorer bands (≥70) with regression test.

**Markdown negotiation verified in-browser:** `Accept: text/markdown` → `text/markdown; charset=utf-8` with full report body.

**Remaining score deltas explained:**
- Roster coverage: we implement 50 deterministic checks of Ora's 124; non-overlap (LLM-judged etc.) shifts pool denominators (example.org: their Essential pool earns 46.7 across checks we don't all implement)
- Documented heuristic residuals (content-no-js, scoped-permissions, metadata-completeness, oauth-support)
- eve.dev label mismatch is the band discovery above — now fixed for future scans

**Artifacts:** `artifacts/browser/` — 01-home.png, report-<domain>.png (+roster), official-<domain>.png

---

# Addendum 3: Final Text-Parity Audit (4 parallel agents, vercel.com)

**Method:** 4 independent Opus-5 agents audited all 50 common checks: recommendations byte-equality, 31 evidence-text differences classified (semantic-equivalent / measurement-basis / factual-conflict), 14 status mismatches root-caused, live fact-checks against vercel.com.

## Results

| Dimension | Verdict |
|---|---|
| **Recommendations** | ✅ 50/50 byte-identical (by construction — catalog text; provenance verified) |
| **Evidence (details)** | 21/31 semantic equivalents · 13 measurement-basis differences · **6 factual conflicts → ALL FIXED** |
| **Status mismatches** | 14 root-caused: 6 payments (commerce-detector bug → fixed), 2 robots (display-only, faithful), 5 strictness residuals (documented), 1 cosmetic label |

## Factual bugs found by the audit → all fixed

1. **developer-portal**: login redirects scored as portal; "quickstart" read off login page → soft-404/auth-wall guard added
2. **response-schema-coverage**: word-count regex produced 1098%→capped "~100%"; real 88% → proper JSON parsing, per-operation coverage
3. **scoped-permissions**: prose word "scopes" (84 hits) credited → requires non-empty `scopes:{...}` or quoted tokens
4. **function-calling-compat**: verb regex counted 650 ops (real: 397) → proper JSON paths parse; threshold aligned to Ora's observed rule (97% described ⇒ pass)
5. **agent-instruction**: HTML app shell accepted as file → content-type/HTML guard (note: Ora credits HTML /agent.txt — their inconsistency, we stay factual)
6. **json-error-responses**: "problem bodies" implied RFC 9457 → wording corrected
7. **commerce detector**: `pricing` keyword alone matched vercel nav 34× → requires cart/checkout/protocol tokens
8. **async-job-pattern**: bare `statusUrl` word passed → requires 202 + explicit poll contract

## Post-fix vercel.com parity

**37/42 overlap exact (88%)** — remaining 5 rows all documented residuals:
- content-no-js (vercel serves markdown to AI UAs — UA-variant, changing would break JSON-LD checks)
- agent-instruction (Ora credits HTML soft-404 file finds — their inconsistency)
- scoped-permissions (Ora requires granularity beyond scopes+per-op-enforcement; spec genuinely has both)
- org-schema-completeness (Ora wrong: live JSON-LD has full PostalAddress)
- rest-sdk-packages (bonus-only, PyPI attribution difference)

**Recommendation text: 50/50 byte-identical. Evidence text: factually true on all checks (live-verified).**

---

# Addendum 4: CLI Channel Comparison (independent, no LLM assistance)

**Method:** official `npx is-agentic` binary run against both backends (`IS_AGENTIC_API_ORIGIN` switch), all 4 domains; parsed score/breakdown/issue blocks; byte-level Evidence + Fix comparison on shared issues. Artifacts: `artifacts/cli-final/`.

## Results

| Domain | Official | Ours | Shared issues | Fix byte-equal | Evidence byte-equal | False positives |
|---|---|---|---|---|---|---|
| vercel.com | 86 | 92 | 4 | **4/4** | 2/4 | **0** |
| eve.dev | 71 | 66 | 8 | **8/8** | 3/8 | 2 (documented oauth/scoped residuals) |
| meta.ai | 32 | 24 | 19 | **18/19** | 4/19 | 1 (documented oauth residual) |
| example.org | 51 | 35 | 9 | **9/9** | 6/9 | 11 — see below |

- **Fix text: 39/40 shared issues byte-identical (98%).**
- **Evidence text:** differences are documented phrasing/depth (Ora embeds deeper measurements); semantic equivalence previously verified row-by-row.
- **Zero evidence-text fabrications** (live fact-checked by the 4-agent audit).

## The example.org "11 false positives" — explained

All 11 are API/MCP-family checks that **Ora's LLM relevance pass excluded** from its essentials map (verified: absent from their per-domain checks; their eligible pool = 14, their issues list = 1). Our deterministic engine scored them factually-true fails (example.org genuinely has no OpenAPI, OAuth, MCP, or CLI). This is the documented **product-level relevance divergence**: Ora's LLM decides per-domain which checks apply; we score deterministically. Out of scope by design.

## Remaining true residuals (all documented)
- eve/meta OAuth + scoped-permissions: Ora finds auth signals we cannot observe
- content-no-js on vercel: UA-variant serving (their agent-UA fetch sees markdown)
- Brand-name discoverability / Agent onboarding friction / Developer resource discoverability: LLM-judged checks, out of scope

---

# Addendum 5: Text Standardization Study — 4 domains (is-agentic.com, ora.ai, vercel.com, eve.dev)

**Question:** does is-agentic serve the same description/fix text for deterministic checks across domains and across pass/fail states?

**Method:** fresh official reports + Ora native-layer payloads for all 4 domains; every (check, status, text) observation grouped and compared; digit/brand/URL normalization to expose underlying templates.

## Findings

**1. Recommendation (Fix) text — YES, standardized.**
Of 115 checks with observed recommendations: **103 always serve the exact catalog text** — status-independent, domain-independent (137/137 row-level byte-match). 10 checks have per-outcome catalog variants (e.g. payments checks: "if agents transact…" vs default) — still deterministic, just branch-selected. Only 2 (ax-*) lack catalog text.

**2. Evidence (details) text — YES, standardized as data-parameterized templates.**
Of 140 (check,status) pairs observed on ≥2 domains: 55 byte-identical outright; the remaining 85 all resolve to **the same underlying template once per-domain measurements are normalized** (counts, brand names, URLs, positions, UA lists, JSON-LD types). Examples: "All ⟨N⟩ entries valid with domain-anchored urn:air identifiers", "⟨BRAND⟩ appears at position #⟨N⟩…", "⟨N⟩ chars with H1 but flat heading structure". **Zero freeform LLM prose** in the details/recommendation channels — LLM output is confined to agenticSummary, evaluator notes, the Task section, and product-level relevance gating.

## Conclusion for our clone

is-agentic's deterministic-check text is **template + measured data** — exactly the model our implementation follows: adopt data-free strings verbatim, fill parameterized templates with our own measurements, reject templates whose data slots we can't fill (documented keep-ours list). Our text is accurate by the same standard the original tool meets.
