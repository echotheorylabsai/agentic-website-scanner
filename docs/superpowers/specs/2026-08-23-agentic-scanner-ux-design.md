# Agentic Website Scanner — UX & Interaction Design Spec

**Date:** 2026-08-23 · **Rev:** 3 (post adversarial review — incorporates all BLOCKER/MAJOR findings)
**Status:** Approved design (sections approved in chat; rev-2 corrections from independent Fable 5 review)
**Companion:** `is-agentic-reverse-engineering-primer.md` (validated research)

---

## 1. Product Definition

A **local, free scanner** scoring how ready any public website is for AI agents —
a clone of is-agentic.com, running entirely on this machine.

**Primary user:** the owner (single local user; no auth, no multi-tenancy).
**Secondary consumers:** coding agents/scripts reading reports as JSON/Markdown.
**Hard requirement:** outputs comparable to `npx is-agentic <domain>` so our
logic can be validated live, side-by-side, on real websites (see §10).

### Locked decisions

| # | Decision | Choice |
|---|---|---|
| 1 | Deployment & audience | Local tool; anonymous; stable report URLs at `/scan/<host>` |
| 2 | Surfaces (v1) | Web · Markdown negotiation · JSON API. **CLI: use the official `npx is-agentic` pointed at localhost** (`IS_AGENTIC_API_ORIGIN`) instead of shipping our own. MCP deferred to v2 |
| 3 | Scan-time UX | Hybrid: SSE progress lives on the canonical `/scan/<host>` URL |
| 4 | Report presentation | Progressive disclosure: hero → findings → excluded → full roster |
| 5 | Stack | Next.js full-stack (App Router, TS) + pure `scanner-core` package |
| 6 | Database | Postgres via local Docker, Drizzle ORM |

### Explicit non-goals (v1)

Auth/accounts, cloud deploy, rate limiting/abuse controls, MCP server, own CLI
package, OpenAPI page, background `freshness_refresh` rescans (manual Rescan
button only), history-diff UI (schema supports it later).

---

## 2. Architecture

```text
agentic-website-scanner/
├─ apps/web/                 Next.js App Router (UI + API routes + SSE)
├─ packages/scanner-core/    Pure TS engine — no framework/DB imports
│  ├─ src/fetcher.ts         multi-UA HTTP client
│  ├─ src/probes/            v1 probe modules (§5)
│  ├─ src/relevance.ts       applicability gating (per-check table, §7)
│  ├─ src/scorer.ts          validated formula (§4)
│  ├─ src/engine.ts          orchestrator: async generator of ScanEvent
│  ├─ src/schema.ts          zod contracts: report JSON, SSE events, errors
│  └─ src/catalog.json       pinned check catalog snapshot (contractVersion 1.20.1)
└─ tools/compare.ts          comparison harness (§10)
```

Notes:
- Contracts live as zod schemas inside `scanner-core/src/schema.ts` (single
  package, no separate contracts/cli packages — proportionality).
- Event distribution: plain in-process `EventEmitter`; no abstraction layer.
- **Catalog drift guard:** on startup, assert pinned `contractVersion === 1.20.1`
  when fetching Ora's `/api/checks`; warn loudly on mismatch.

---

## 3. Data Model (Postgres + Drizzle)

```text
scans
  id uuid PK · target_url text · host text (normalized, indexed)
  source text ('web'|'cli') · status text
    ('queued'|'running'|'gating'|'scoring'|'complete'|'failed'|'cancelled')
  error text nullable · contract_version text
  queued_at/started_at/completed_at timestamptz

checks
  id uuid PK · scan_id uuid → scans (index) · check_id text
  layer text · native_tier text        -- Ora 'required|recommended|emerging'
  essentials_tier text                 -- 'required'|'recommended'|null  (Ora mapping)
  essentials_bonus_only boolean · essentials_excluded boolean
  bonus boolean · occurrences int default 1   -- MCP-kind duplicates averaged
  status text ('pass'|'fail'|'warning'|'na'|'error')
  score numeric · max_score numeric · fraction numeric  -- score/max_score
  details text null · recommendation text null · na_reason text null

reports
  scan_id uuid PK → scans · prev_scan_id uuid null → reports
  score numeric NULLABLE              -- real tool allows null (auth-gated targets)
  grade text · label text             -- ours; label bands §4
  essential_earned raw numeric (+ serialized round(.,1))
  recommended_earned raw numeric
  bonus_points numeric · bonus_signals int · eligible_checks int
  summary text (templated, v1) · top_fixes jsonb (top estGain, v1)
  snapshot_at timestamptz
```

**Rules**

- Latest-wins reads per host; all snapshots retained (`prev_scan_id` chain);
  future diffing = `checks` join on `check_id` across two scans.
- Duplicate collapse: scanning an already `queued|running` host returns the
  existing job URL.
- Freshness: reports >6 h old show a stale chip + manual Rescan button.
  **No automatic background rescan** (cut as disproportionate for local use).
- URL normalization: bare host ⇒ `https://<host>`; strip fragments;
  report path keyed by hostname.

---

## 4. Scoring — pinned to Ora's published model

**Source of truth:** `GET https://ora.ai/api/checks?include=essentials`
(pinned snapshot vendored to `catalog.json`; vendored VERBATIM (real field names: `tier`, `applicability`, `maturity`,
`specUrl`, …); drift check runs via `compare.ts check-catalog`, not every
startup (preserves Ora read budget).

Grouping uses **Ora's `essentialsTier` field — never the native `tier`**.
Vocabulary correction (rev 3): `essentialsTier ∈ {required, recommended, emerging}`
— the literal value `essential` does NOT exist in the catalog; Essential pool =
checks with `essentialsTier === 'required'`; `emerging` ⇒ bonus-only.

**Bonus-only rule (validated across vercel/eve/meta, 233/233 checks):**
`bonusOnly = essentialsBonusOnly OR nativeBonus`, single exception:
`markdown-negotiation-vary` stays in the Essential pool. Checks flagged
`essentialsExcluded=true` leave every pool. Where available, Ora's per-domain
`essentials.checks[].{tier,bonus,fraction}` overrides static flags as ground truth.

```text
fraction      = score / max_score            (per eligible non-excluded check)
error         ⇒ fraction 0, stays eligible
passing       = count(fraction == 1)
Essential     = 80 × mean(fraction | essentials_tier='required', not bonus_only)
Recommended   = 20 × mean(fraction | essentials_tier='recommended', not bonus_only)
Bonus         = min(5, 0.25 × Σ fraction | essentials_bonus_only=true, fraction>0)
positive_signals = count(bonus_only ∧ fraction>0)
score         = round( trunc0.1(Essential) + trunc0.1(Rec) + trunc0.1(Bonus) )
```

Serialization rules (for diff-comparability):
- store raw earned values; **serialize `earned = round(raw, 1)`**
- issues = eligible, non-bonus-only, fraction<1; order (observed rule):
  tier → access-signal checks first (`agent-crawler-reachability`, `bot-detection`,
  `content-no-js`, `docs-auth-gate`, `redirect-hygiene`, `agent-friendly-404`,
  `ax-*`) → computed gain desc → native `estScoreGain` desc

`grade`: A+ ≥95 · A ≥86 · B ≥70 · C ≥48 · D ≥28 · F else (applies to this
essentials score; Ora's native grade is different — do not mix).

Gating is split by nature:
- **Deterministic dependent-family N/A (our engine):** REST-dependent family
  (×8), GraphQL family (×6), MCP sub-checks (×15), payments protocols (×6),
  `ax-*` family — N/A iff its detector found no surface ("No REST API surface
  detected" etc.). Detector checks themselves are NEVER auto-N/A'd by us.
- **Product-level relevance (LLM-judged upstream):** advisory in comparisons,
  never replicated. Observed live order: `scan_complete{provisional}` →
  `relevance_assessed{naCheckIds,reasons,score,grade}` → final.
Our engine computes its authoritative score after deterministic gating.
Partial credit comes from per-probe rubric tables (condition → score/max_score)
defined in the plan; a pass may carry fraction <1 (e.g. mcp-server 5/6).

`label` bands (approximate, from 18 observed reports; diff labels advisory):
≥85 "Strong technical baseline" · 70–85 "Ready with a few material gaps" ·
48–70 "Important blockers remain" · 28–48 "Agents are likely to struggle" ·
<28 F-band label TBD-from-observations at build time.

---

## 5. v1 Probe Scope

**Comparability policy:** pools are means, so a partial roster cannot produce
comparable headline scores (spec rev-1 error). Therefore:

- v1 implements the **complete non-MCP Essential pool plus all Recommended-pool
  checks that are deterministic HTTP probes**, including (non-exhaustively):
  oauth-support, public-api, public-api-docs, developer-portal,
  agent-instruction, api-schema-analysis, function-calling-compat,
  openapi-spec family, scoped-permissions, json-error-responses,
  response-schema-coverage, sandbox-environment — closing the rev-1 gap.
- Excluded from v1: LLM-judged checks, `wikipedia-presence`, search-dependent
  checks (`brand-search-accuracy`, `agentic-search-specific` — external-search
  backend; marked **advisory** in comparisons), payments protocols beyond
  header/link detection, MCP-runtime handshake subchecks (manifest detection
  only in v1).
- Unscored roster entries are omitted from denominators; §10 defines how
  comparison remains honest despite this.

---

## 6. UX Flows & Screens

Four screens: Home `/`, Report `/scan/[host]`, Docs `/docs`, Methodology `/methodology`.

### Hero flow — first-time scan

1. Home: URL input → client validation → optimistic navigate (no spinner).
2. `POST /api/scan` returns 202 `{report_url}` immediately.
3. `/scan/<host>` streams SSE progress: determinate bar
   (`completedChecks/totalChecks`), phase line, last-N check ticker.
4. Terminal event transitions same URL to the full report.

SSE is enhancement, not source of truth: hydrate from DB first, attach to stream
after; reconnect with backoff.

### Report page — progressive disclosure

- **Hero:** score/100, grade, label, counts, **Copy fix prompt** button
  (failed findings as a coding-agent brief), Rescan button, stale chip if >6h.
- **Findings** (open): grouped Discovery→Access→Usability→Payments, ordered by
  `estGain` (= exact score delta if that check passed, computed by re-running
  scorer); each card evidence → fix → verify command.
- **Excluded** (collapsed): N/A with reasons. **Full roster** (collapsed):
  filterable by status/tier/layer.

### Machine consumption

```text
GET /scan/<host>  Accept html → page; Accept markdown → middleware rewrites to /api/scan/markdown route (Next.js forbids route.ts beside page.tsx); Vary: Accept on both
GET /api/v1/report?url=           PublicScanReport-compatible JSON (§10)
GET /api/report/full?url=         our extended report (grade, layers, N/A list)
GET /api/scan/stream?target=      SSE (real protocol names, §7)
```

---

## 7. API Contract

| Method | Path | Behavior |
|---|---|---|
| POST | `/api/scan` `{url}` | validate → dedupe-collapse → 202 `{target, display_target, report_url}` |
| GET | `/api/v1/report?url=` | latest completed; **schema copied verbatim from is-agentic's `PublicScanReport`** (`additionalProperties:false`, nullable score, tier enum incl. `bonus`) |
| GET | `/api/report/full?url=` | extended: grade, per-layer detail, N/A reasons, estGain |
| GET | `/api/scan/stream?target=` | If no report exists and none running: **starts a scan** (official CLI depends on this), then streams. Live attach · in-memory ring-buffer replay · cache-hit triple (`kind_detected→scan_complete{servedFromCache:true,resultAgeSeconds}→scan_archived`). `scan_archived` fires only after the reports row commits |
| GET | `/api/v1/checks` | pinned catalog |

Errors: RFC 9457 problem+json with `type,title,status,detail,instance,code,resolution`.
No rate limiting (local single user).

### SSE protocol — real is-agentic/Ora event names (compatibility requirement)

`kind_detecting` · `kind_detected` · `scan_init` (roster+totals) ·
`layer_start`* · `check_start` · `check_complete` · `layer_complete` ·
`relevance_assessed` (real Ora event carrying `{naCheckIds,reasons,score,grade}`) ·
`summary_ready` · `scan_complete` · `scan_archived` · `error`.

Cache-hit shape mirrors observed reality:
`kind_detected → scan_complete{servedFromCache:true,resultAgeSeconds} → scan_archived`.

*\* `layer_start` exists in Ora's documented protocol though rarely observed.*

**Compatibility payoff:** because names/shapes match the real protocol,
`IS_AGENTIC_API_ORIGIN=http://localhost:3000 npx is-agentic <host>` renders OUR
reports through the OFFICIAL CLI renderer — the primary side-by-side harness.

---



**Canonical frame order (authoritative, applies everywhere):**
`kind_detecting → kind_detected → scan_init{roster} → discovery_phase×8 → scan_init{totalChecks,staticOnly:true} → (check_start→check_complete)×N → layer_complete×4 → scan_complete{provisional} → relevance_assessed{final score,grade} → summary_ready → scan_archived`.
## 8. Error Handling

- Probe throws → `status='error'`, fraction 0, **stays eligible**, evidence
  records the error; scan completes.
- Engine-level failure (DNS/TLS dead) → scan `failed`, honest error page +
  Rescan; ≤2 retries on transient network errors.
- Invalid input → client validation mirrored server-side.

---

## 9. Testing Strategy

| Layer | Approach |
|---|---|
| Probes | Recorded fixtures harvested during research (soft-404 shells, blocked-UA pages, broken Vary) + a tiny fixture-recorder utility to capture new sites |
| Scorer | Golden tests vs captured payload↔published pairs (vercel.com 63.5/16.8/5→85, eve.dev 55, meta.ai 32) using Ora `essentialsTier` mapping; property test: N/A exclusion never changes eligible scores; disambiguation test: trunc-sum vs floor(sum) |
| Gating | Table-driven from the `naReason` corpus (auth-gated MCP, unreachable homepage cascades, below-bonus-threshold ax-*) |
| Engine | Local fixture HTTP server; assert full event sequence + final report |
| Contracts | zod round-trip vs real captured payloads (must parse real is-agentic JSON) |
| E2E | hero flow, instant completed-report load, markdown negotiation |

---

### Rev-3 additional rulings

- Fetcher UA roster includes `ora-agent` (observed in real evidence).
- Catalog JSON vendored verbatim; real field names preserved.
- Replay uses an in-memory ring buffer per running scan; DB report is the
  post-completion source of truth.
- Assigned previously-orphaned requirements: Rescan = manual button on report
  page; Docs & Methodology pages carry integration + scoring content (static);
  harness stores `?format=audit` snapshots and diffs against reference
  `scanned_at`, never wall-clock; F-band label resolved from harness snapshots
  into a data table (not hardcoded guesswork); `prev_scan_id` set by job runner
  at completion.

## 10. Comparison Harness (the validation goal)

New top-level component — the point of the project:

1. **Reference snapshots:** `tools/compare.ts fetch <host>` pulls
   `ora.ai/api/score/<host>?include=essentials` (+`?format=audit`) and stores
   versioned snapshots in Postgres (`reference_reports` table: raw payload +
   fetched_at + scanned_at). Rate-limit aware: cache-first, ≤20 reads/session
   (Ora 429s aggressively).
2. **Per-check diff** (primary comparison — valid despite roster differences):
   `id → {their fraction/status/tier/na, our fraction/status/tier/na}` +
   eligible-set symmetric difference. Advisory flags for known-divergent checks
   (search-dependent, wikipedia).
3. **Reprojected score:** restrict *Ora's* fractions to our implemented set →
   run our scorer → must equal our score on identical inputs (proves scorer).
4. **Headline diff** (advisory until roster complete): score delta + `scanned_at`
   gap (compare against their `scanned_at`, never wall-clock; snapshots lag).
5. **Official-CLI harness:** `IS_AGENTIC_API_ORIGIN=http://localhost:3000
   npx is-agentic <host>` must render our report identically-shaped to real
   output; byte-level structural diff of terminal output.

Exit criteria for "logic proven": per-check fractions match on overlapping
eligible set; reprojected scores match exactly; official CLI renders both
indistinguishably modulo values.
