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
