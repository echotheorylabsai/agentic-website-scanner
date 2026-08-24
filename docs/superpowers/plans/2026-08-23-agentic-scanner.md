# Agentic Website Scanner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a locally-running clone of is-agentic.com that scans websites for AI-agent readiness, produces comparable reports, and validates its logic against the real tool via a comparison harness.

**Architecture:** Next.js monolith (`apps/web`) hosting UI + API + SSE; `packages/scanner-core` is a pure-TS engine emitting an async iterable of events; Postgres (local Docker) via Drizzle; validation through a `tools/compare.ts` harness plus the official CLI pointed at localhost.

**Tech Stack:** TypeScript, Next.js App Router, Drizzle ORM + Postgres, zod, vitest, undici, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-23-agentic-scanner-ux-design.md` (rev 2)

## Global Constraints

- Grouping uses Ora's `essentialsTier` field from the pinned catalog — NEVER native `tier`
- Pinned `contractVersion = "1.20.1"`; startup must assert it when fetching `ora.ai/api/checks`
- Scoring: `fraction=score/max_score`; `error ⇒ fraction 0, stays eligible`; `Essential=80×mean`, `Recommended=20×mean` (equal weight); `Bonus=min(5, 0.25×Σ)`; score=`round(trunc0.1(E)+trunc0.1(R)+trunc0.1(B))`; store raw, serialize `earned=round(raw,1)`
- `/api/v1/report` JSON must satisfy the real `PublicScanReport` schema (parse real is-agentic payloads as fixtures)
- SSE event names must match the real protocol exactly (`kind_detecting…scan_archived,error`) + our `relevance_assessed`
- No rate limiting, no auth, no background rescans; Rescan is a manual button
- Every probe returns evidence strings naming what was observed; never bare failures
- Node ≥20; all tests `vitest`; commits after every passing step

---

### Task 1: Monorepo scaffold + database schema

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `docker-compose.yml`
- Create: `apps/web/src/db/schema.ts`, `apps/web/src/db/index.ts`, `apps/web/drizzle.config.ts`
- Test: `apps/web/src/db/schema.test.ts`

**Interfaces:**
- Produces: Drizzle tables `scans`, `checks`, `reports` (exact column names per spec §3); exported `db` client; `SCHEMA_VERSION = "1.20.1"`

- [ ] **Step 1: Scaffold workspace**

```bash
mkdir -p apps/web packages/scanner-core tools
pnpm init && printf 'packages:\n  - apps/*\n  - packages/*\n' > pnpm-workspace.yaml
```

- [ ] **Step 2: docker-compose.yml for Postgres**

```yaml
services:
  db:
    image: postgres:16
    environment: { POSTGRES_PASSWORD: local, POSTGRES_DB: agentic }
    ports: ["5432:5432"]
    volumes: [pgdata:/var/lib/postgresql/data]
volumes: { pgdata: }
```

Run `docker compose up -d`.

- [ ] **Step 3: Write failing schema test**

```ts
// apps/web/src/db/schema.test.ts
import { describe, it, expect } from "vitest";
import { scans, checks, reports } from "./schema";

describe("schema", () => {
  it("has lifecycle statuses on scans", () => {
    const s = scans.status;
    expect(s.enumValues).toContain("gating");
    expect(s.enumValues).toContain("complete");
  });
  it("checks carries essentials mapping columns", () => {
    expect(checks.essentialsTier.name).toBe("essentials_tier");
    expect(checks.fraction.name).toBe("fraction");
    expect(checks.occurrences.name).toBe("occurrences");
  });
  it("reports.score is nullable", () => {
    expect(reports.score.notNull).toBeFalsy();
  });
});
```

- [ ] **Step 4: Run test → FAIL (no schema module)**

- [ ] **Step 5: Implement `schema.ts`** with drizzle-pg tables exactly matching spec §3 (statuses enum arrays; numerics as `numeric`; `checks.fraction numeric NOT NULL DEFAULT '0'`; `occurrences integer NOT NULL DEFAULT 1`; unique index `(scan_id, check_id, occurrences)`).

- [ ] **Step 6: Run test → PASS** · `pnpm drizzle-kit push`

- [ ] **Step 7: Commit** `feat: workspace scaffold + postgres schema`

---

### Task 2: Contracts — zod schemas + pinned catalog

**Files:**
- Create: `packages/scanner-core/src/schema.ts`, `packages/scanner-core/src/catalog.json`
- Test: `packages/scanner-core/src/schema.test.ts`
- Fixture: `packages/scanner-core/test/fixtures/real-report-vercel.json` (captured from `GET https://is-agentic.com/api/v1/report?url=https%3A%2F%2Fvercel.com`)

**Interfaces:**
- Produces: zod schemas + inferred types: `PublicScanReport`, `Issue`, `ProblemDetails`, `ScanEvent` (discriminated union on `type`: `kind_detecting|kind_detected|scan_init|layer_start|check_start|check_complete|layer_complete|relevance_assessed|summary_ready|scan_complete|scan_archived|error`), `CheckCatalogEntry`, `assertCatalogVersion(cat)`
- Consumes: nothing (leaf)

- [ ] **Step 1: Capture fixtures**

```bash
mkdir -p packages/scanner-core/test/fixtures
curl -s "https://is-agentic.com/api/v1/report?url=https%3A%2F%2Fvercel.com" > packages/scanner-core/test/fixtures/real-report-vercel.json
curl -s "https://is-agentic.com/api/v1/report?url=https%3A%2F%2Feve.dev"   > packages/scanner-core/test/fixtures/real-report-eve.json
curl -s "https://ora.ai/api/checks?include=essentials" > packages/scanner-core/test/fixtures/ora-checks.json
```

- [ ] **Step 2: Failing test — real payload parses**

```ts
import PublicScanReportFixture from "./fixtures/real-report-vercel.json";
it("parses the real tool's report verbatim", () => {
  const r = PublicScanReport.parse(PublicScanReportFixture);
  expect(r.score_breakdown.essential.available).toBe(80);
});
it("rejects unknown top-level fields", () => {
  expect(PublicScanReport.safeParse({ ...PublicScanReportFixture, extra: 1 }).success).toBe(false);
});
```

- [ ] **Step 3: Run → FAIL**

- [ ] **Step 4: Implement schemas** — mirror the real shape exactly: `strictObject` at top level; fields `target, display_target, report_url, score (nullable number), score_label, scanned_at, eligible_checks, score_breakdown{essential{earned,available,passing,total}, recommended{…}, bonus{points,positive_signals}}, issues[{id,name,tier('essential'|'recommended'|'bonus'),result('failed'|'partial'),details,recommendation}]`. `ScanEvent` union per Global Constraints. Export `catalogSchema` with `essentialsTier/essentialsBonusOnly/essentialsExcluded/nativeTier/maxScore/bonus/description` and `assertCatalogVersion(v){ if(v!=="1.20.1") throw … }`.

- [ ] **Step 5: Vendor catalog** — copy fixture JSON minus volatile fields into `src/catalog.json`; add startup unit test calling `assertCatalogVersion`.

- [ ] **Step 6: Run → PASS** · **Commit** `feat: zod contracts + pinned 124-check catalog`

---

### Task 3: Fetcher

**Files:**
- Create: `packages/scanner-core/src/fetcher.ts`
- Test: `packages/scanner-core/src/fetcher.test.ts`

**Interfaces:**
- Produces: `fetchAs(url: string, o: { ua?: "browser"|"GPTBot"|"ClaudeBot"|"ChatGPT-User"|"PerplexityBot"|"Google-Extended"|"DeepSeekBot"; accept?: string; timeoutMs?: number }): Promise<FetchedResponse>` where `FetchedResponse = { status:number; headers:Record<string,string>; body:string; finalUrl:string }`
- Consumes: `undici`

- [ ] **Step 1: Failing tests** using a local `http.createServer` fixture server started in `beforeAll`: (a) default UA sends a browser-like header; (b) `ua:"GPTBot"` sends `user-agent: GPTBot`; (c) `accept:"text/markdown"` forwards header; (d) non-2xx returned as data, not thrown; (e) 5s timeout aborts.

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement** with `undici.request`; never throw on status; capture `content-type` lowercased into headers map.

- [ ] **Step 4: PASS** · **Commit** `feat: multi-UA fetcher`

---

### Task 4: Probe framework + HTTP-semantics probes

**Files:**
- Create: `packages/scanner-core/src/probes/types.ts`, `src/probes/http-semantics.ts`
- Test: `src/probes/http-semantics.test.ts`

**Interfaces:**
- Produces: `interface Probe { id: CheckId; layer: Layer; run(ctx: ProbeContext): Promise<ProbeResult | ProbeResult[]> }`, `ProbeContext = { url: URL; fetch: typeof fetchAs; catalog: CheckCatalogEntry[] }`, `ProbeResult = { status:"pass"|"fail"|"warning"|"error"; score:number; max_score:number; details:string; recommendation?:string }`. Concrete exports: `agentFriendly404Probe`, `redirectHygieneProbe`.
- Consumes: fetcher, catalog ids

- [ ] **Step 1: Failing tests** against fixture server:

```ts
// soft-404: server returns 200 + HTML shell for unknown path
it("fails soft-404 shells", async () => {
  const r = await agentFriendly404Probe.run(ctx("http://localhost:PORT"));
  expect(r.status).toBe("fail");
  expect(r.details).toMatch(/HTTP 200/);
});
// real 404 with recovery links ⇒ warning(partial); plain 404 ⇒ pass
// 401/403 on fake path ⇒ warning with observed status in details
// redirect chain >2 hops for http→https ⇒ redirect-hygiene warning
```

- [ ] **Step 2: FAIL → implement → PASS** (probe requests `${url}/nonexistent-probe-${Date.now()}`).

- [ ] **Step 3: Commit** `feat: probe framework + http-semantics`

---

### Tasks 5–8: Remaining probe families (same pattern as Task 4)

Each family = one task, identical step rhythm: failing fixture-server tests → implement → pass → commit. Fixtures: static files served by the test server (harvest real bad pages during research into `test/fixtures/sites/`).

**Task 5 — Content & metadata probes** (`src/probes/content.ts`)
`content-no-js` (raw HTML char count ≥500 ∧ h1 ∧ heading depth≥2 else warning/fail), `metadata-completeness` (canonical/lang/og:image/og:type — 4 signals, warning if 3), `json-ld` (+`json-ld-entity-linking` sameAs), `org-schema-completeness`, `trust-anchors` (/about,/contact,/privacy each ≥500 chars text).

**Task 6 — Discovery-file probes** (`src/probes/discovery.ts`)
`llms-txt-exists`, `llms-txt-formatting`, `sitemap`, `robots-agent-user-policy`, `robots-ai-policy-quality` (per-crawler directives), `agent-instruction` (llms.txt/agent.txt/agents.md with when-to-use section), `markdown-negotiation-vary` (send Accept: text/markdown; require markdown CT + `Vary` containing `accept`), `agent-crawler-reachability`+`bot-detection` (UA matrix from fetcher).

**Task 7 — Developer/API probes** (`src/probes/api.ts`)
`openapi-spec` (/openapi.json,/api/openapi.yaml parse), `scoped-permissions` (securitySchemes scopes or RFC9728), `response-schema-coverage` (%ops typed responses; threshold 0.6), `rate-limit-headers`, `json-error-responses` (probe a wrong-method request → JSON body), `public-api`/`public-api-docs`/`developer-portal` (link/path heuristics), `oauth-support` (/.well-known/oauth-authorization-server), `api-schema-analysis`+`function-calling-compat` (operationId/description coverage), `sandbox-environment` (docs signal search), `auth-md-exists`.

**Task 8 — MCP + payments-presence probes** (`src/probes/mcp.ts`)
`mcp-well-known-discovery` (/.well-known/mcp JSON validity), `mcp-server` (initialize handshake over Streamable HTTP; auth challenge ⇒ warning), `mcp-server-card`, payments presence (`x402-support`,`acp-support`,`ucp-support`,`ap2-support`,`mpp-support` — link/header/text detection only), `a2a-agent-card`.

Every probe MUST have ≥2 fixture tests (one failing site, one passing site) and evidence strings naming observations.

Shared harness (built once in Task 4, reused verbatim by 5–8): `test/utils/fixtureServer.ts` — http server from a route map `{path: {status, headers, body}}`; `test/utils/recorder.ts` — `record(url)` saves real fetched responses into `fixtures/sites/<host>/` so new probe fixtures are one command.

---

### Task 9: Relevance gating

**Files:**
- Create: `packages/scanner-core/src/relevance.ts`
- Test: `src/relevance.test.ts`

**Interfaces:**
- Produces: `applyRelevance(checks: ResultedCheck[], ctx: ScanContext): { gated: GatedCheck[], naReasons: Record<CheckId,string> }` — emits `relevance_assessed` payload shape `{naCheckIds, reasons}`
- Types (defined here, consumed by Task 10+): `ResultedCheck = { check_id: CheckId; layer: Layer; status:'pass'|'fail'|'warning'|'error'; score:number; max_score:number }`; `GatedCheck = ResultedCheck & { eligible:boolean; na_reason?:string }`
- Rules table (from naReason corpus): no homepage fetchable ⇒ cascade N/A for page-dependent checks; no OpenAPI found ⇒ N/A api-family; no MCP detected ⇒ N/A mcp-runtime family; marketing site (no dev-surface evidence) ⇒ N/A api/oauth/dev-portal family. Table lives in `relevance.ts` as data, reviewed against `ora.ai` naReason strings in fixtures.

- [ ] Tests: marketing-site context excludes ≥10 api checks with reasons; api-enabled site excludes none of them; unreachable-homepage cascades page-dependent set. **Commit** `feat: relevance gating`

---

### Task 10: Scorer (golden-tested against the real tool)

**Files:**
- Create: `packages/scanner-core/src/scorer.ts`
- Test: `src/scorer.test.ts`, fixture `test/fixtures/golden/*.json` (per-check results transcribed from Ora `?include=essentials` payloads for vercel/eve/meta)

**Interfaces:**
- Produces: `scoreReport(gated: GatedCheck[], catalog): RawScore` and `serializeReport(raw): PublicScanReport`

```ts
// exact rules (Global Constraints)
const mean = a => a.length ? a.reduce((s,x)=>s+x,0)/a.length : 0;
E = 80*mean(fractions(essential, nonBonusOnly)); R = 20*mean(fractions(recommended, nonBonusOnly));
B = Math.min(5, .25*sum(fractions(bonusOnly))); positive_signals = bonusOnly.filter(f=>f>0).length;
score = Math.round(trunc1(E)+trunc1(R)+trunc1(B));   // trunc1 = Math.trunc(x*10)/10
serialize: earned = round(raw,1); issues sorted Essential→Recommended then fraction asc;
grade bands: 95/86/70/48/28; label bands per spec §4.
```

- [ ] Golden tests: vercel fixture → `{earned 63.5/80, 16.8/20, bonus 5}` score 85; eve → 55; meta → 32. Property test: setting any N/A check's values must not change output. Disambiguation test asserting trunc-sum rule vs floor-sum on eve.dev numbers. **Commit** `feat: validated scorer`

---

### Task 11: Engine orchestrator

**Files:**
- Create: `packages/scanner-core/src/engine.ts`
- Test: `src/engine.test.ts`

**Interfaces:**
- Produces: `runScan(url: string, opts?): AsyncGenerator<ScanEvent>` — event order: `kind_detecting → kind_detected → scan_init(roster subset + layerMaxScores + totalChecks) → layer_start/discovery_phase… → per check: check_start → check_complete → layer_complete → relevance_assessed → summary_ready → scan_complete(result provisional) → scan_archived`. Terminal `report` accessor via `opts.onComplete` callback (post-gating score).
- Consumes: probes registry, relevance, scorer

- [ ] Integration test: fixture server with known-good site; assert exact event sequence, 4 `layer_complete`, terminal score equals direct scorer call. Error-path test: dead host → `error` event. **Commit** `feat: scan engine`

---

### Task 12: Job runner + REST API

**Files:**
- Create: `apps/web/lib/jobs.ts`, `apps/web/app/api/scan/route.ts`, `app/api/v1/report/route.ts`, `app/api/report/full/route.ts`, `app/api/v1/checks/route.ts`
- Test: `apps/web/lib/jobs.test.ts`, `app/api/__tests__/routes.test.ts`

**Interfaces:**
- Produces: `startScan(target, source)` (dedupe-collapse on running host), `getLatestComplete(host)`, bus `subscribe(scanId, fn)`; engine-level failures retry ≤2 on transient network errors then mark scan `failed`; routes return problem+json errors (`invalid_url`, `report_not_found`) with `type,title,status,detail,instance,code,resolution`.

- [ ] Tests: POST /api/scan 202 shape; second POST while running returns same URL; GET report 404 before completion, PublicScanReport-valid JSON after; normalization: `"eve.dev"` ≡ `"https://eve.dev"`. **Commit** `feat: job runner + rest api`

---

### Task 13: SSE route + Markdown negotiation

**Files:**
- Create: `apps/web/app/api/scan/stream/route.ts`, `apps/web/app/scan/[host]/route.ts` (markdown branch), middleware for `Vary`
- Test: `stream.test.ts`

**Interfaces:**
- Produces: GET stream modes — live attach (bus), replay (buffered events from DB), cache-hit (`kind_detected → scan_complete{servedFromCache:true,resultAgeSeconds} → scan_archived`). Markdown branch renders compact report, sets `Content-Type: text/markdown; charset=utf-8` + `Vary: Accept`.

- [ ] Tests: live sequence matches engine events; replay fast-forwards; cache-hit triple; curl-level Vary assertion. **Commit** `feat: sse + markdown negotiation`

---

### Task 14: Web UI — Home + Report

**Files:**
- Create: `apps/web/app/page.tsx`, `app/scan/[host]/page.tsx` (+ `ProgressView.tsx`, `FindingsList.tsx`, `RosterTable.tsx`, `useScanStream.ts` hook), `app/docs/page.tsx`, `app/methodology/page.tsx`
- Test: Playwright `e2e/scan.spec.ts`

**Interfaces:**
- Consumes: contracts types; `useScanStream(host)` → `{events, phase, done, report}`; hydrate-from-DB-first then attach stream; reconnect w/ backoff.

- [ ] E2E: submit flow → progress bar counts up → auto-transition; completed host loads instantly; stale chip appears when snapshot_at forced old (fixture row); Copy-fix-prompt writes clipboard containing failed findings. Component tests for FindingsList ordering (estGain desc within groups). **Commit** `feat: web ui`

---

### Task 15: Comparison harness

**Files:**
- Create: `tools/compare.ts`, `apps/web/src/db/reference.ts` (`reference_reports` table)
- Test: `tools/compare.test.ts`

**Interfaces:**
- Produces: CLI `tsx tools/compare.ts fetch <host>` (stores Ora `?include=essentials` snapshot; cache-first, ≤20 reads), `tools/compare.ts diff <host>` → per-check table (theirs vs ours: fraction/status/tier/na + eligible symmetric difference + advisory flags for `brand-search-accuracy`,`agentic-search-specific`,`wikipedia-presence`), `reproject` mode (Ora fractions restricted to our roster → our scorer must equal our score), `cli-diff <host>` (runs `IS_AGENTIC_API_ORIGIN=http://localhost:3000 npx is-agentic <host>`, structural diff vs real run saved under `reference/cli/`).

- [ ] Tests: golden diff on vercel fixture pair (known deltas only from unimplemented roster); reproject equality property. **Commit** `feat: comparison harness`

---

### Task 16: Live validation milestone

- [ ] Pick 5 domains used in research; run ours + official tool; record outputs in `docs/validation/2026-MM-DD-run.md` (per-check diff summary, reproject equality, CLI structural diff)
- [ ] Exit criteria met: overlapping-eligible fractions match; reproject scores match exactly; official CLI renders ours indistinguishably modulo values
- [ ] Commit `docs: first live validation run`
