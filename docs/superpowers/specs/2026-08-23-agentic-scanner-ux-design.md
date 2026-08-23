# Agentic Website Scanner — UX & Interaction Design Spec

**Date:** 2026-08-23
**Status:** Approved design (sections 1–6 approved by user in chat)
**Companion doc:** `is-agentic-reverse-engineering-primer.md` (validated backend/engine specification)

---

## 1. Product Definition

A **local, free, open scanner** that scores how ready any public website is for
AI agents — a faithful clone of is-agentic.com's UX patterns and Ora's validated
check/scoring engine, running entirely on this machine.

**Primary user:** the owner (single local user; no auth, no multi-tenancy).
**Secondary consumers:** coding agents and scripts reading reports as JSON/Markdown.

### Locked decisions

| # | Decision | Choice |
|---|---|---|
| 1 | Deployment & audience | Public-tool pattern, used locally; anonymous; stable open report URLs |
| 2 | Surfaces (v1) | Web · Markdown negotiation · JSON API · CLI. (MCP deferred to v2) |
| 3 | Scan-time UX | Hybrid: SSE progress lives on the canonical `/scan/<host>` URL |
| 4 | Report presentation | Progressive disclosure: hero → findings → excluded → full roster |
| 5 | Stack | Next.js full-stack (App Router, TS) + portable `scanner-core` package |
| 6 | Database | Postgres via local Docker, accessed through Drizzle ORM |

### Explicit non-goals (v1)

Auth/accounts, cloud deployment, rate limiting/abuse controls, MCP server,
OpenAPI spec page, scan-history diff UI (schema supports it; UI comes later),
security/accessibility certification of scanned sites.

---

## 2. Architecture

```text
agentic-website-scanner/
├─ apps/web/                 Next.js App Router (UI + API routes + SSE)
├─ packages/scanner-core/    Pure TS engine library — no framework/DB imports
│  ├─ src/fetcher.ts         multi-UA HTTP client (AI UAs, markdown-Accept)
│  ├─ src/probes/            v1 probe modules → Finding[]  (see §5 scope)
│  ├─ src/relevance.ts       applicability gating → naCheckIds + reasons
│  ├─ src/scorer.ts          validated formula (§4)
│  ├─ src/engine.ts          orchestrator: async generator of ScanEvent
│  └─ src/types.ts           ScanEvent union, Finding, CheckResult, Report
├─ packages/cli/             thin client over the public HTTP contract
└─ packages/contracts/       zod schemas: report JSON, SSE events, errors
```

### Component responsibilities

| Unit | Does | Depends on |
|---|---|---|
| `scanner-core` | `run(url) → AsyncIterable<ScanEvent>` + final report | fetcher only (`undici`) |
| Job runner (`apps/web/lib/jobs.ts`) | execute scans in-process; persist results | scanner-core, DB, bus |
| Event bus (in-proc EventEmitter behind interface) | pub/sub scan events | nothing |
| API routes | REST + SSE + markdown negotiation | contracts, DB, bus |
| UI | home, progress-on-report-URL, report rendering | contracts (typed events) |
| CLI | wraps public HTTP contract for terminal use | contracts only |

**Purity rule:** `scanner-core` never imports DB/framework code.
`(url, options) → AsyncIterable<ScanEvent>` is its entire interface.

---

## 3. Data Model (Postgres + Drizzle)

```text
scans
  id            uuid PK
  target_url    text
  host          text (normalized, indexed)
  source        text  ('web' | 'cli' | 'api' | 'freshness_refresh')
  status        text  ('queued'|'running'|'gating'|'scoring'|'complete'
                       |'failed'|'cancelled')
  error         text nullable
  queued_at, started_at, completed_at  timestamptz

checks
  id            uuid PK
  scan_id       uuid → scans (index)
  check_id      text   -- stable vocabulary (124 ids), diff-join key
  layer         text   ('discovery'|'accessibility'|'usability'|'payments')
  tier          text   ('required'|'recommended'|'emerging')
  bonus         boolean
  status        text   ('pass'|'fail'|'warning'|'na'|'error'|'pending')
  score         numeric
  max_score     numeric
  details       text nullable      -- observed evidence
  recommendation text nullable
  na_reason     text nullable
  spec_url      text nullable

reports
  scan_id       uuid PK → scans
  prev_scan_id  uuid nullable → reports   -- revision chain for future diffs
  score         int, grade text, label text
  essential_earned/available/passing/total   numeric/int
  recommended_earned/available/passing/total numeric/int
  bonus_points  numeric, bonus_signals int
  eligible_checks int
  summary       text
  top_fixes     jsonb
  snapshot_at   timestamptz
```

**Rules**

- **Latest-wins reads:** report pages render newest `complete` report per host.
  All snapshots retained; `prev_scan_id` enables later "+N since last scan" and
  historical diffing (`checks` join on `check_id` across two `scan_id`s).
- **Duplicate collapse:** a request to scan a host already `queued|running`
  returns the existing job's URL (simple early-return; no queue machinery).
- **Freshness:** on report visit, snapshot older than **6 h** ⇒ subtle stale chip
  + background rescan (`source='freshness_refresh'`); old report stays visible.

---

## 4. Scoring (validated)

Roster: the **124-check vocabulary** extracted during research (primer §15.3),
pruned to v1 probe scope per §5 — unscored roster entries are omitted, not
zeroed, so `eligible_checks` reflects what actually ran.

Formula (reproduced to ±0.1 on 7 domains against ground truth):

```text
Essential   = 80 × mean(fraction)   over eligible required-tier checks   // equal weight
Recommended = 20 × mean(fraction)   over eligible recommended-tier checks
Bonus       = min(5, 0.25 × Σ fraction)  over bonus-only checks with credit
score       = round( trunc0.1(Essential) + trunc0.1(Recommended) + trunc0.1(Bonus) )
grade       = A+ ≥95 · A ≥86 · B ≥70 · C ≥48 · D ≥28 · F else
positive_signals = count of bonus-only checks earning any credit
```

Gating runs before scoring: `relevance.ts` marks checks `na` with human-readable
`na_reason`; N/A checks are excluded from every denominator.

---

## 5. v1 Probe Scope

Full 124-check roster is the target end-state. v1 implements the highest-value,
fully-deterministic subset (~40 checks across all four layers), including at
minimum every check family observed failing in our five captured reports:

- Discovery: brand/dev-resource discovery hooks, robots AI policy, agent rules
- Accessibility(layer): sitemap, content-no-js, bot-detection/crawler reachability,
  llms.txt family, JSON-LD family, metadata completeness, trust anchors,
  markdown negotiation (+Vary), redirect hygiene, token budget, agent-friendly-404
- Usability: OpenAPI spec, scoped permissions, rate-limit headers, JSON errors,
  MCP well-known + handshake, onboarding friction signals, response-schema coverage
- Payments: protocol presence probes (header/link-based detection only in v1)

LLM-judged checks (onboarding prose quality, summaries beyond templated text)
are v2. The engine emits roster metadata so adding probes later requires no
scorer/consumer changes.

---

## 6. UX Flows & Screens

Four screens: Home `/`, Report `/scan/[host]`, Docs `/docs`, Methodology `/methodology`.

### Hero flow — first-time scan

1. Home: URL input + "Scan" → client-side validation → optimistic navigate
   (no spinner on home).
2. `POST /api/scan` returns 202 `{report_url}` immediately.
3. `/scan/<host>` shows live progress via SSE: determinate bar
   (`completedChecks / totalChecks`), current phase line, last-N check ticker.
4. On `scan_final`: same URL transitions to full report (SSR-quality render).

SSE is an enhancement, never the source of truth: on reconnect or mid-scan
navigation, page hydrates from DB state first, then attaches to the stream.

### Report page — progressive disclosure

- **Hero:** score /100, grade, label, failed·partial·N/A counts,
  **"Copy fix prompt"** button (copies all failed findings as a coding-agent
  implementation brief), Rescan button.
- **Findings** (open by default): grouped Discovery→Access→Usability→Payments;
  ordered by `estGain` within group, where `estGain` for a failed/partial check
  = points it would add to the displayed score if fully passed, computed by
  re-running the scorer with that check set to pass (cheap, exact, no separate
  weighting model). Each card = evidence → fix → verify command.
  Never a bare "failed".
- **Excluded** (collapsed): N/A checks with reasons.
- **Full roster** (collapsed): all ran checks, filterable by status/tier/layer.

### Machine consumption (same rows, negotiated)

```text
GET /scan/<host>                 Accept: text/html      → SSR report
GET /scan/<host>                 Accept: text/markdown  → compact Markdown (Vary: Accept)
GET /api/v1/report?url=<host>                           → latest completed JSON
GET /api/scan/stream?target=<url>                       → SSE progress/replay/cache-hit
```

CLI (`packages/cli`): report API → stream fallback → short poll, mirroring the
is-agentic CLI contract; prints score bar + findings; `--json` flag.

---

## 7. API Contract (local-first, de-overengineered)

| Method | Path | Behavior |
|---|---|---|
| POST | `/api/scan` `{url}` | validate → dedupe-collapse → create row → 202 `{target, report_url}` |
| GET | `/api/v1/report?url=` | latest completed JSON; never starts scans |
| GET | `/api/scan/stream?target=` | SSE: live attach · replay · cache-hit(`scan_archived`) |
| GET | `/api/v1/checks` | static roster metadata |

No rate limiting, quotas, or abuse controls (local single-user).
Errors are RFC 9457 `application/problem+json` with stable codes
(`invalid_url`, `report_not_found`, `scan_failed`) — small cost, clean CLI errors.

### SSE event types

`scan_init` (roster+totals) · `discovery_phase` · `check_start` ·
`check_complete` (persisted) · `relevance_assessed` (persisted na_reasons) ·
`summary_ready` · `scan_final` (**authoritative post-gating score**) ·
`scan_archived` · `scan_failed`.

All shapes defined once in `packages/contracts` (zod); server, UI, CLI consume
the same types.

---

## 8. Error Handling

- Probe throws → `status='error'`, evidence records the error, scan completes
  and scores around it.
- Engine-level failure (DNS/TLS dead) → scan `failed`; honest error page +
  rescan; ≤2 automatic retries on transient network errors.
- Stale snapshots (>6h) → visible chip + background refresh; old data stays up.
- Invalid input → inline client validation mirrored server-side.

---

## 9. Testing Strategy

| Layer | Approach |
|---|---|
| Probes (unit) | Recorded fixtures from real harvested responses (soft-404 shells, blocked-UA pages, broken Vary headers) replayed against probes |
| Scorer (unit) | Golden tests vs captured payload↔published-score pairs; property test: N/A exclusion never changes eligible scores |
| Gating (unit) | Table-driven: marketing site vs API site activation |
| Engine (integration) | Local fixture HTTP server serving good/bad pages; assert event sequence + final report |
| Contracts | zod round-trip: engine events → serialize → UI/CLI parse |
| E2E (Playwright) | hero flow, instant completed-report load, markdown negotiation |

Definition of done per probe: fixture test + evidence string naming observation.
