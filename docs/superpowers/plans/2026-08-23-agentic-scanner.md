# Agentic Website Scanner Implementation Plan (v2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a locally-running clone of is-agentic.com whose outputs are comparable to the real tool's, validated live via per-check diffs and the official CLI pointed at localhost.

**Architecture:** Next.js monolith (`apps/web`) + pure-TS `packages/scanner-core` engine; Postgres (local Docker) via Drizzle; comparison harness in `tools/`.

**Tech Stack:** TypeScript · Next.js App Router · Drizzle/Postgres · zod · vitest · undici · Playwright.

**Spec:** `docs/superpowers/specs/2026-08-23-agentic-scanner-ux-design.md` (rev 3)

## Global Constraints

- Pool vocabulary: Ora `essentialsTier ∈ {required, recommended, emerging}` — **the string "essential" does not exist**. Essential pool = `essentialsTier==='required'`; `emerging` ⇒ bonus-only.
- Bonus-only rule: `bonusOnly = essentialsBonusOnly OR nativeBonus`, exception: `markdown-negotiation-vary` stays Essential-pool. `essentialsExcluded=true` checks leave all pools.
- Per-domain ground truth beats static flags: use Ora `essentials.checks[].{tier,bonus,fraction}` when present (harness stores them).
- Scoring: `fraction = score/max_score`; `error ⇒ fraction 0, still eligible`; pools = equal-weight means ×80 / ×20; bonus `min(5, 0.25×Σ)`; score = `round(trunc0.1(E)+trunc0.1(R)+trunc0.1(B))`; store raw earned; **serialize `earned=round(raw,1)`**.
- Issue order (observed): tier → access-signal set first (`agent-crawler-reachability`, `bot-detection`, `content-no-js`, `docs-auth-gate`, `redirect-hygiene`, `agent-friendly-404`, `ax-*`) → gain desc → native `estScoreGain` desc.
- Gating is deterministic dependent-family N/A only (REST×8, GraphQL×6, MCP-subchecks×15, payments×6, ax-*). Detector checks never auto-N/A'd. Product-level relevance is advisory-only.
- `/api/v1/report` parses real is-agentic payloads (strict zod, nullable score, tier enum incl `bonus`, details/recommendation nullable-but-required).
- SSE uses REAL event names/order incl. two `scan_init` frames; wire = `data:` lines; no `layer_start` reliance. Stream endpoint starts scans when missing; `scan_archived` only after DB commit.
- Markdown negotiation via `middleware.ts` rewrite → route handler (never `route.ts` beside `page.tsx`); `Vary: Accept` on both branches.
- Catalog JSON vendored VERBATIM (real field names); drift check = `compare.ts check-catalog` command, not startup fetch.
- Fetcher UA roster includes `ora-agent`.
- Node ≥20; vitest everywhere; commit after every passing step.

---

### Task 1: Workspace scaffold + database schema

**Files:** Create `pnpm-workspace.yaml`, `docker-compose.yml`, `apps/web/src/db/schema.ts`, `apps/web/src/db/index.ts`, `drizzle.config.ts` · Test `apps/web/src/db/schema.test.ts`

**Interfaces:** Produces Drizzle tables exactly per spec §3 — statuses enum contains `'gating'`; `checks` has `native_tier`, `essentials_tier` (enum `'required'|'recommended'|'emerging'`), `essentials_bonus_only`, `essentials_excluded`, `bonus`, `fraction`, `occurrences`; unique index `(scan_id, check_id)`; `reports.score` nullable; plus `reference_reports` table (id, host, payload jsonb, source text, fetched_at, scanned_at).

- [ ] Step 1: Scaffold workspace files + `docker compose up -d`
- [ ] Step 2: Write failing schema test asserting the columns above
- [ ] Step 3: Run → FAIL
- [ ] Step 4: Implement schema; `pnpm drizzle-kit push`
- [ ] Step 5: PASS · Commit `feat: scaffold + postgres schema`

---

### Task 2: Contracts — real-shaped zod schemas + verbatim catalog

**Files:** Create `packages/scanner-core/src/schema.ts`, `src/catalog.json` (verbatim vendored Ora catalog) · Test `schema.test.ts` · Fixtures `test/fixtures/real-report-{vercel,eve}.json`, `ora-checks.json`, `sse-fresh.txt`

**Interfaces:** Produces `PublicScanReport` (strict; nullable score; issues[].tier enum `'essential'|'recommended'|'bonus'`; details/recommendation `.nullable()` but required keys), `ProblemDetails` (`additionalProperties:true`, `code` enum of 6 values), `ScanEvent` union with EXACT payload shapes:

```ts
check_start   {layerId,layerName,checkId,checkName,mcpKind:null,mcpUrl:null,timestamp}
check_complete{...same ids, status:'pass'|'fail'|'warning'|'na'|'error',
               score:number,maxScore:number,details:string}
scan_init     {layerMaxScores:{discovery,accessibility,usability,payments},
               checkRoster:[{id,name,layerId,maxScore,bonus?}],totalChecks?,staticOnly?}
relevance_assessed {naCheckIds:string[],reasons:Record<string,string>,score?:number,grade?:string}
summary_ready {agenticSummary:string}
scan_complete {result:{/* native object */}}
kind_detected {kind,hint?} · kind_detecting{} · layer_complete{layerId,layerName}
discovery_phase{step,label,stepIndex,totalSteps} · scan_archived{reportUrl?} · error{message}
```

Also: `assertCatalogVersion(cat)` reading real `contractVersion` field.

- [ ] Step 1: Capture fixtures (curl commands listed in appendix A)
- [ ] Step 2: Failing tests: real report parses; unknown top-level key rejected; every frame line of `sse-fresh.txt` parses into `ScanEvent`
- [ ] Step 3–5: Implement → PASS → Commit `feat: contracts`

---

### Task 3: Fetcher

**Files:** `packages/scanner-core/src/fetcher.ts` · Test `fetcher.test.ts`

**Interfaces:** `fetchAs(url,{ua?,accept?,timeoutMs?}) → {status,headers,body,finalUrl}`; UA roster: browser default + `GPTBot, ChatGPT-User, ClaudeBot, PerplexityBot, Google-Extended, DeepSeekBot, ora-agent`. Never throws on status codes.

- [ ] Failing fixture-server tests (UA sent, accept forwarded, status-as-data, timeout) → implement → pass → commit `feat: fetcher`

---

### Task 4: Probe framework + harness + HTTP-semantics probes

**Files:** `src/probes/types.ts`, `src/probes/http-semantics.ts`, `test/utils/fixtureServer.ts`, `test/utils/recorder.ts` · Tests `http-semantics.test.ts`

**Interfaces:**

```ts
type ProbeResult = { id: CheckId; status:'pass'|'fail'|'warning'|'error';
                     score:number; max_score:number;
                     details:string; recommendation?:string };
interface Probe  { ids: CheckId[]; layer: Layer;
                   run(ctx: ProbeContext): Promise<ProbeResult[]> };
type ProbeContext = { url: URL;
                      fetch: typeof fetchAs;
                      surface: ScanContext };
type ScanContext = { homepage?: FetchedResponse;      // set by content probes
                     openapi?: FetchedResponse|null;  // set by openapi probe
                     mcpManifest?: FetchedResponse|null;
                     restSurface:boolean; graphqlSurface:boolean;
                     commerceSignals:boolean };       // detectors write these
```

Concrete: `agentFriendly404Probe.ids=['agent-friendly-404']`, `redirectHygieneProbe.ids=['redirect-hygiene']`.

Rubric table:

| Check | Condition | score/max |
|---|---|---|
| agent-friendly-404 | fake path → 200 HTML shell | 0/2 fail, evidence quotes status+CT |
| | 404/410 with links in body | 2/2 pass |
| | 404/410 bare body | 1/2 warning |
| | other status (401/403…) | 1/2 warning, status quoted |
| redirect-hygiene | ≤2 hops to https | 1/1 pass |
| | >2 hops or http loop | 0/1 fail |

- [ ] Failing tests (fixture server routes from table) → implement → pass → commit `feat: probe framework`

---

### Tasks 5–8: Probe families (each at Task 4 detail level: rubric table + ≥2 fixture tests per check + evidence strings)

**Task 5 — Content & metadata** (`src/probes/content.ts`)
Checks & rubrics:

| check | requests | rubric highlights |
|---|---|---|
| content-no-js | homepage raw | ≥500 chars ∧ h1 ∧ depth≥2 ⇒ 3/3; ≥500∧h1 flat ⇒ 2/3 warn; <500 ∨ no h1 ⇒ 0/3 fail (evidence: char count) |
| metadata-completeness | homepage head | 4 signals ⇒ 2/2; 3 ⇒ 1/2 warn (name missing one); ≤2 ⇒ 0/2 |
| json-ld | homepage scripts[type=application/ld+json] parse | valid identity type w/ name,url ⇒ 4/4; parse-ok wrong-type ⇒ 2/4; none ⇒ 0/4 |
| json-ld-entity-linking | sameAs present | 2/0/… binary ± partial |
| org-schema-completeness | Organization node fields | contactPoint∧address 2/2; one 1/2 |
| trust-anchors | /about,/contact,/privacy text≥500 each | 2/2 all; 2-of-3 1/2 warn |

Writes `surface.homepage`. Sets estGain ordering input.

**Task 6 — Discovery files** (`src/probes/discovery.ts`)
llms-txt-exists (1pt), llms-txt-formatting (2pt: H1+link list), sitemap (2/1/0 by valid XML), sitemap-lastmod(bonus), robots-agent-user-policy (2pt explicit AI directives), robots-ai-policy-quality (2pt per-crawler allow/disallow), agent-instruction (3pt: file found 1 + when-to-use section 2), markdown-negotiation-vary (markdown CT 1/2 + Vary Accept 2/2; sets Vary finding verbatim), agent-crawler-reachability + bot-detection (per-UA matrix; any hard-block 0/2, soft degrade 1/2).

**Task 7 — Developer/API** (`src/probes/api.ts`)
openapi-spec (7pt: found+parses; records `ctx.openapi`), scoped-permissions (5pt rubric: named scopes in securitySchemes 5; schemes-no-scopes 2/5 warn; none 0), response-schema-coverage (2pt: pct>60 full, >30 half), rate-limit-headers (2pt live header observed), json-error-responses (4pt: wrong-method probe returns application/json problem body), public-api (7)/public-api-docs(3)/developer-portal(6) path+link heuristics with partial credit per signal found, oauth-support (5: well-known OAuth server responds), api-schema-analysis (2) + function-calling-compat (2: operationId/description coverage ratios), sandbox-environment (2: docs signals), auth-md-exists (2).

**Task 8 — MCP + payments presence** (`src/probes/mcp.ts`)
mcp-well-known-discovery (bonus 2: manifest JSON validity), mcp-server (6pt: handshake initialize OK Streamable 6/6; auth challenge 3/6 warn; invalid manifest 1/6; absent handled by gating), mcp-server-card (2 bonus), payments presence family (mpp/x402/ucp/acp/acp-delegate/ap2 — link/header/text detection; 2–3pt each, bonus-flagged per catalog), a2a-agent-card (2 bonus).

---

### Task 9: Relevance gating — deterministic families ONLY

**Files:** `packages/scanner-core/src/relevance.ts` · Test `relevance.test.ts`

**Interfaces:** `applyRelevance(results: ProbeResult[], ctx: ScanContext): { gated: GatedCheck[], assessed: {naCheckIds,reasons} }`; `GatedCheck = ProbeResult & { eligible:boolean; na_reason?:string }`.

Dependent-family table (data-driven):

| Family | N/A iff | na_reason template |
|---|---|---|
| REST-dependent ×8 (`json-error-responses`,`rate-limit-headers`,`response-schema-coverage`,`api-schema-analysis`,`function-calling-compat`,`rest-sdk-packages`,`pagination-shape`,`api-versioning-policy`) | `!ctx.restSurface` (openapi absent ∧ no REST evidence) | "No REST API surface detected on this domain" |
| GraphQL ×6 | `!ctx.graphqlSurface` | "No GraphQL surface detected" |
| MCP sub-checks ×15 (tool-descriptions, param-schemas, …) | `!ctx.mcpManifest` | "No MCP server detected" |
| Payments ×6 | `!ctx.commerceSignals` | "No commerce signals detected" |
| ax-* | homepage unfetchable | "No server HTML available" |

Hard rule encoded in test: detector checks (`openapi-spec`,`mcp-server`,`public-api`,`oauth-support`,`scoped-permissions`,`json-error-responses` where REST exists…) are never N/A'd here — they fail normally.

- [ ] Table-driven tests: marketing context excludes exactly the REST/GraphQL/MCP/payments sets; API site excludes none; unreachable-homepage cascades page-dependent checks. Commit `feat: relevance gating`

---

### Task 10: Scorer

**Files:** `packages/scanner-core/src/scorer.ts` · Test `scorer.test.ts` · Fixtures `test/fixtures/golden/{vercel,eve,meta}-essentials.json` (transcribed from Ora `essentials.checks[]`: `{id,tier,bonus,fraction,nativeEstGain}`)

**Interfaces:**

```ts
type RawScore = { essentialRaw:number; recommendedRaw:number; bonusRaw:number;
                  passing:{essential:number;recommended:number};
                  totals:{essential:number;recommended:number};
                  bonusSignals:number; eligibleChecks:number; score:number;
                  grade:string; label:string };
scoreReport(checks: GatedCheck[], catalog): RawScore
serializeReport(raw: RawScore, meta:{target,displayTarget,reportUrl,scannedAt},
                issues: Issue[]): PublicScanReport
estGains(raw, checks): Map<CheckId,number>  // re-score per failed check flipped to pass
```

Pool selection helper (encodes Blocker-1/2 rules):

```ts
const bonusOnly = c => (c.essentials_bonus_only || c.nativeBonus)
                        && c.check_id !== 'markdown-negotiation-vary';
const pool = t => gated.filter(c => !c.na_reason && c.essentials_excluded!==true
                                     && !bonusOnly(c) && c.essentials_tier===t);
E = 80*mean(pool('required').map(fraction));
R = 20*mean(pool('recommended').map(fraction));
B = Math.min(5, .25*sum(fractions(bonusOnly checks with fraction>0)));
score = Math.round(trunc1(E)+trunc1(R)+trunc1(B));
label = lookupLabel(score);            // data table src/labels.json, filled from snapshots
grade = bands 95/86/70/48/28 else F;
```

- [ ] Golden: vercel → E63.5/R16.8/B5/score85 · eve → 55 · meta → 32 (using essentials.checks ground truth fixtures)
- [ ] Property: flipping any N/A check values never changes output
- [ ] Serialization: eve recommended earned prints 10.2 (round, not trunc)
- [ ] Commit `feat: validated scorer`

---

### Task 11: Engine orchestrator

**Files:** `packages/scanner-core/src/engine.ts` · Test `engine.test.ts`

**Interfaces:** `runScan(url, opts:{onComplete:(report)=>Promise<void>}) : AsyncGenerator<ScanEvent>` — emits EXACT fresh-scan order (Global Constraints), including both `scan_init` frames; `opts.onComplete` persists BEFORE the engine yields final `scan_archived` (official CLI then finds the report within its 5-poll window). Dead-host ⇒ `error` terminal.

- [ ] Sequence test vs recorded fixture order; persistence-ordering test (fake clock). Commit `feat: engine`

---

### Task 12: Job runner + REST API

**Files:** `apps/web/lib/jobs.ts`, `app/api/scan/route.ts`, `app/api/v1/report/route.ts`, `app/api/report/full/route.ts`, `app/api/v1/checks/route.ts` · Tests alongside

**Interfaces:** `startScan(target,source)` dedupe-collapse; runner wires bus↔ring-buffer↔DB; retries ≤2 transient; `prev_scan_id` linked at insert; problem+json errors with 6-value code enum.

- [ ] Route contract tests incl. normalization (`eve.dev ≡ https://eve.dev`), 404 shape, 202 shape. Commit `feat: jobs + rest`

---

### Task 13: SSE stream + middleware markdown

**Files:** `app/api/scan/stream/route.ts`, `middleware.ts`, `app/api/scan/markdown/route.ts` · Test `stream.test.ts`

**Behavior:** target missing ⇒ call `startScan(target,'cli')` then stream; running ⇒ attach bus + ring buffer replay; complete+fresh ⇒ cache-hit triple. Middleware: `Accept` includes `text/markdown` ∧ path=/scan/* ⇒ rewrite to `/api/scan/markdown?host=`; add `Vary: Accept` on both branches.

- [ ] Tests: three modes; official-CLI simulation script (report→stream→poll like the 591-line reference). Commit `feat: sse + markdown`

---

### Task 14: Web UI

**Files:** `app/page.tsx`, `app/scan/[host]/page.tsx` (+`ProgressView`,`FindingsList`,`RosterTable`,`useScanStream`), `app/docs/page.tsx` (integration guide), `app/methodology/page.tsx` (formula+roster+labels) · Playwright `e2e/scan.spec.ts`

- [ ] E2E: hero flow; instant completed load; stale chip (>6h fixture row) + manual Rescan button; Copy-fix-prompt clipboard content. Component test: FindingsList order (access-signal first, then estGain desc). Commit `feat: ui`

---

### Task 15: Comparison harness

**Files:** `tools/compare.ts` (commands: `fetch`, `diff`, `reproject`, `cli-diff`, `check-catalog`, `labels`) · Test `compare.test.ts`

- [ ] fetch: Ora `?include=essentials&format=audit` snapshot → `reference_reports`; cache-first ≤20 reads/session
- [ ] diff: per-check theirs/ours (fraction,status,tier,na) + eligible symmetric difference + advisory flags for `brand-search-accuracy`,`agentic-search-specific`,`wikipedia-presence` + product-level relevance differences marked advisory
- [ ] reproject: their fractions restricted to our roster through our scorer == our score
- [ ] cli-diff: structural diff of official CLI output against localhost vs real
- [ ] labels: fill `labels.json` F-band from accumulated snapshots
- [ ] Commit `feat: comparison harness`

---

### Task 16: Live validation milestone

- [ ] Run 5 research domains through ours + official tool → `docs/validation/run-01.md` (per-check diff, reproject equality, CLI structural diff, scanned_at gaps)
- [ ] Exit criteria: overlapping fractions match; reproject equality exact; CLI renders ours indistinguishably modulo values; all divergences explained (advisory-listed)
- [ ] Commit `docs: validation run 01`

## Appendix A — Fixture capture commands

```bash
mkdir -p packages/scanner-core/test/fixtures
curl -s "https://is-agentic.com/api/v1/report?url=https%3A%2F%2Fvercel.com" > packages/scanner-core/test/fixtures/real-report-vercel.json
curl -s "https://is-agentic.com/api/v1/report?url=https%3A%2F%2Feve.dev"    > packages/scanner-core/test/fixtures/real-report-eve.json
curl -s "https://is-agentic.com/api/v1/report?url=https%3A%2F%2Fmeta.ai"    > packages/scanner-core/test/fixtures/real-report-meta.json
curl -s "https://ora.ai/api/checks?include=essentials" > packages/scanner-core/test/fixtures/ora-checks.json
curl -s "https://ora.ai/api/score/vercel.com?include=essentials" > packages/scanner-core/test/fixtures/golden/vercel-essentials.json
curl -s "https://ora.ai/api/score/eve.dev?include=essentials"    > packages/scanner-core/test/fixtures/golden/eve-essentials.json
curl -s "https://ora.ai/api/score/meta.ai?include=essentials"    > packages/scanner-core/test/fixtures/golden/meta-essentials.json
# fresh SSE capture (starts a real scan):
curl -sN "https://is-agentic.com/api/scan/stream?target=https%3A%2F%2Fexample.net" > packages/scanner-core/test/fixtures/sse-fresh.txt
```
