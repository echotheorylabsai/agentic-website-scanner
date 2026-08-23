# Is Agentic — Reverse-Engineering Primer

**A source-of-truth technical guide to Vercel's Agent-Readiness Scanner: what it checks, how it works, and how to build a minimal equivalent.**

> **Method note:** Every factual claim below was verified against primary sources captured on the day of analysis: the tool's own pages (fetched live, including Markdown-negotiated variants), its OpenAPI description, the published JSON reports for five domains, and the shipped npm CLI package (inspected from its tarball). Items we could **not** verify are explicitly marked ⚠️ in §14 (Open Questions). Nothing else is speculative.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [What It Is & Who Provides the Value](#2-what-it-is--who-provides-the-value)
3. [System Architecture](#3-system-architecture)
4. [The Scoring Model](#4-the-scoring-model)
5. [Anatomy of a Report](#5-anatomy-of-a-report)
6. [Delivery Surfaces](#6-delivery-surfaces)
7. [The Check Catalog (Validated)](#7-the-check-catalog-validated)
8. [Comparative Analysis of Five Real Reports](#8-comparative-analysis-of-five-real-reports)
9. [Critique & Design Weaknesses](#9-critique--design-weaknesses)
10. [Implementation Blueprint for a Minimal Clone](#10-implementation-blueprint-for-a-minimal-clone)
11. [Lessons for Site Owners (SEO/GEO Playbook)](#11-lessons-for-site-owners-seogeo-playbook)
12. [Biggest Learnings for Tool Builders](#12-biggest-learnings-for-tool-builders)
13. [Sources & Citations](#13-sources--citations)
14. [Open Questions & Unverified Items](#14-open-questions--unverified-items)
15. [ADDENDUM — Full Source & Check-Roster Reverse-Engineering](#15-addendum--full-source--check-roster-reverse-engineering)
16. [External Adversarial Review Summary](#158-independent-external-adversarial-review-claude-fable-5)

---

## 1. Executive Summary

**Is Agentic** is a free web tool by **Vercel** that scores how ready a public website is for **AI agents** — software acting on a person's behalf.

An agent must be able to **discover, access, understand, and use** a site.
Is Agentic audits exactly those capabilities.

**Key facts at a glance:**

| Property | Value |
|---|---|
| Product | Public URL scanner producing shareable readiness reports |
| Operator | Vercel (interface, storage, report pages, grouping) |
| Scan engine | Ora (runs every check and scores it) |
| Price | Free — no plans, keys, or billing ([pricing.md](https://is-agentic.com/pricing.md)) |
| Claimed depth | 118 checks across 4 layers |
| Output | Score 0–100 + evidence-backed findings + fixes |
| Interfaces | Web UI, JSON API, CLI (`npx is-agentic`), MCP server, agent skill |

**Core insight:** this is *"Lighthouse for AI agents"* — the same audit philosophy
as PageSpeed/Lighthouse, retargeted from human/browser UX to machine-consumer UX.

---

## 2. What It Is & Who Provides the Value

### 2.1 The two-party split (validated)

Responsibility is explicitly divided between two companies:

```text
┌─────────────────────────────┐        ┌─────────────────────────────┐
│            ORA              │        │           VERCEL            │
│  (agent-experience co.,     │        │                             │
│   "era labs")               │        │                             │
├─────────────────────────────┤        ├─────────────────────────────┤
│ • Runs the technical scan   │  ───▶  │ • Operates the web UI       │
│ • Scores every check        │ result │ • Stores reports/history    │
│ • Produces evidence +       │ object │ • Regroups checks into the  │
│   recommendations           │        │   displayed score           │
│ • Runs the observed agent   │        │ • Publishes API/CLI/MCP/    │
│   journey                   │        │   skill surfaces            │
└─────────────────────────────┘        └─────────────────────────────┘
```

Source: `/about` — *"Ora runs the technical audit and scores each check;
Vercel operates the interface, public report pages, historical storage,
and the maturity- and applicability-aware grouping."*

### 2.2 Who it's for

- **Site owners & platform teams** — pre-launch/migration readiness audits.
- **Developer-tool companies** — validate that APIs, OpenAPI specs, and MCP servers are *actually discoverable*.
- **CI pipelines** — `npx is-agentic <domain> --json` as a regression gate.
- **Agents themselves** — read-only report retrieval via API/MCP.

Explicitly **not** for (per the About page):
security audits, accessibility certification, legal compliance,
authenticated/private-page evaluation.

### 2.3 Why it matters (the thesis)

Agents increasingly browse, shop, book, integrate, and cite on a user's behalf.
A site that serves app-shell-only HTML, soft-404s, or blocks AI crawler
User-Agents becomes invisible or hostile to that class of visitor.
Is Agentic makes those failure modes measurable and prioritized.

---

## 3. System Architecture

Reconstructed from the CLI package internals, the OpenAPI description,
docs, and observed behavior:

```text
                    USER
                     │  submits URL (web form / npx is-agentic <domain>)
                     ▼
      ┌──────────────────────────────┐
      │       VERCEL FRONTEND        │  Next.js (dpl_id in HTML,
      │  is-agentic.com              │  immutable chunks observed)
      │  • report pages /scan/<host> │
      │  • score rendered in initial │
      │    HTML (no JS needed)       │
      │  • Accept: text/markdown     │
      │    variant, Vary: Accept     │
      └──────────┬───────────────────┘
                 │ stored completed reports (latest-wins per URL)
                 ▼
      ┌──────────────────────────────┐         ┌─────────────────────┐
      │   REPORT STORE + PUBLIC API  │◀────────│  ORA SCAN ENGINE    │
      │   GET /api/v1/report?url=…   │ results │  • crawls target    │
      │   • read-only, no auth       │         │  • runs 118 checks  │
      │   • 120 req/IP/60s           │         │  • scores + writes  │
      │   • RFC 9457 problem+json    │         │    evidence & fixes │
      │   • never starts a scan      │         │  • agent journey    │
      └──────────┬───────────────────┘         └─────────────────────┘
                 ▼
      MCP server (/mcp, Streamable HTTP) · npm CLI · agent skill
```

**Validated behaviors:**

- The CLI is a **thin client** (~20 KB, 3 files). We inspected the tarball:
  it renders the stored report in a terminal (ANSI score bar, FAIL/PARTIAL blocks)
  and supports `IS_AGENTIC_API_ORIGIN` override + `--json`.
  **All scanning happens server-side.**
- The public API/MCP **never launches a scan** — they retrieve completed reports.
  New scans start only via the website.
- Reports are cached; stale ones *"may [be] refresh[ed] … in the background
  while keeping the previous completed score visible until replacement
  evidence is ready"* (methodology page).
- The site **dogfoods its own checks**: score in initial HTML, markdown
  negotiation with `Vary: Accept`, OpenAPI spec, RFC 9727 API catalog,
  well-known discovery files, MCP server, agent-skill index with SHA-256 digests.

---

## 4. The Scoring Model

Two scoring models exist. Understanding both is essential to replicating one.

### 4.1 Ora's native layers (from the MarkTechPost article)

| Layer | What an agent does there | Points | Checks |
|---|---|---:|---:|
| Discovery | Find the site & its capabilities | 20 | 15 |
| Access | Reach content & endpoints | 30 | 41 |
| Usability | Understand & operate the surface | 40 | 56 |
| Payments | Transact | 10 | 6 |
| **Total** | | **100** | **118** |

Stated provenance: *"reverse-engineered from real agent runs, not authored
by opinion."*

⚠️ These layer splits come from the article only; we found no page on
is-agentic.com publishing the full 118-check list.

### 4.2 Vercel's displayed regrouping (validated on /methodology)

```text
   Final score (0–100, capped)
   ═══════════════════════════
   Essential pool      80 pts   fundamentals everyone needs
   Recommended pool    20 pts   activates only if surface detected
   Bonus              ≤ +5 pts  emerging formats; absence never hurts
```

**Rules (all stated on /methodology):**

- **Applicability gating** — Recommended checks activate only when scan
  evidence identifies an API, OAuth flow, GraphQL endpoint, MCP server,
  developer portal, or commerce surface.
- **N/A exclusion** — non-applicable checks are excluded, never counted as failures.
- **Partial credit** — partial results receive proportional credit.
- **De-duplication** — duplicated check IDs across MCP surfaces are averaged.

**Letter grades** (from the article):

| Grade | Range |
|---|---|
| A+ | 95–100 |
| A | 86–94 |
| B | 70–85 |
| C | 48–69 |
| D | 28–47 |
| F | 0–27 |

⚠️ The exact per-check point weights and the precise partial-credit formula
are **not published** (see §14).

---

## 5. Anatomy of a Report

Live JSON fetched during analysis
(`GET /api/v1/report?url=https%3A%2F%2Fis-agentic.com`), trimmed:

```json
{
  "target": "https://is-agentic.com",
  "display_target": "is-agentic.com",
  "report_url": "https://is-agentic.com/scan/is-agentic.com",
  "score": 100,
  "score_label": "Strong technical baseline",
  "scanned_at": "2026-08-23T20:02:36.869Z",
  "eligible_checks": 32,
  "score_breakdown": {
    "essential":   { "earned": 77.3, "available": 80, "passing": 9,  "total": 10 },
    "recommended": { "earned": 17.7, "available": 20, "passing": 19, "total": 22 },
    "bonus":       { "points": 5, "positive_signals": 28 }
  },
  "issues": [
    {
      "id": "content-no-js",
      "name": "Content without JavaScript",
      "tier": "essential",
      "result": "partial",
      "details": "4193 chars with H1 but flat heading structure",
      "recommendation": "Server-side render your homepage so AI crawlers see meaningful content..."
    }
  ]
}
```

**Schema takeaways:**

- `eligible_checks` differs per domain → proves applicability gating is real.
- Each issue = `id`, `name`, `tier`, `result` (`failed` | `partial`),
  `details` (evidence), `recommendation` (fix).
- Only failing/partial checks appear as issues; passes are aggregated in counts.

**Report structure (Markdown variant of `/scan/eve.dev`):**
score header → score breakdown → numbered findings
(each: tier, result, evidence, recommended fix) → interpretation disclaimer
(*"the observed agent task is supporting evidence and does not change
the numeric score"*).

---

## 6. Delivery Surfaces

All read-only, unauthenticated, free (validated via /docs):

| Surface | Endpoint / Command | Notes |
|---|---|---|
| Web report | `https://is-agentic.com/scan/<host>` | Stable URL; score in initial HTML; rescan replaces snapshot |
| Markdown | same URL + `Accept: text/markdown` | `Content-Type: text/markdown`, `Vary: Accept`; 406 if no match |
| JSON API | `GET /api/v1/report?url=<url>` | 120 req/IP/60 s; `RateLimit`/`RateLimit-Policy` headers; `Retry-After` on 429 |
| Errors | RFC 9457 `application/problem+json` | 400 invalid input · 404 no report · 405 method · 429 quota · 503 storage |
| Versioning | `/api/v1/` path major versions | Deprecation via RFC 9745 headers; old `/api/report` kept as alias |
| CLI | `npx is-agentic <domain>` (`--json`) | Retrieves stored report or waits on a fresh scan |
| MCP | `https://is-agentic.com/mcp` (Streamable HTTP) | Tools: `is_agentic_get_report`, `is_agentic_get_methodology`, `is_agentic_get_developer_docs`; MCP Apps resource `ui://is-agentic/score-report.html` |
| Discovery | `/.well-known/api-catalog` (RFC 9727), `.well-known/ai-catalog.json`, `/server.json`, `/openapi.json` | Machine-readable self-description |
| Agent skill | `npx skills add vercel-labs/is-agentic` | Listed in `.well-known/agent-skills/index.json` with SHA-256 digest |

---

## 7. The Check Catalog (Validated)

> **Provenance legend:**
> ✅ = check observed in at least one of the five captured reports.
> 🏷️ = exact check `id` confirmed (in report JSON, or named in the article).
> Names without a visible ID come from Markdown report headings.
> No commerce/"Payments"-layer check ever triggered across our five sites
> (no commerce surface was detected) — so none were observed.
> **(Superseded:** the full 124-check roster — including all Payments checks —
> was later extracted; see §15.**)**

Checks grouped by the agent journey stage they protect:

---

### Category A — Crawlability & Access

*Can agents reach the site at all?*

#### A1. Agent crawler reachability ✅ (essential)

- **Purpose:** verify AI crawler User-Agents get HTTP responses, not WAF blocks.
- **Observed evidence (meta.ai):**
  `"No major AI crawler can reach the homepage – ChatGPT-User: blocked, ClaudeBot: blocked, Google-Extended: blocked, ora-agent: blocked, DeepSeekBot: blocked"`
- **How it works (inferred from evidence):** fetches `/` with known AI-agent
  UAs and records per-UA outcomes.
- **Why it matters:** a single WAF rule can make a site fully invisible to agents.
- **Fix given:** remove/narrow blocking rules; allowlist known agent UAs.

#### A2. Not blocked by bot detection ✅ (essential)

- **Purpose:** finer-grained sibling of A1.
- **Observed evidence (meta.ai, partial):**
  `"Some agents blocked: GPTBot, ClaudeBot, ChatGPT-User, PerplexityBot, Google-Extended"`
- **UA roster observed across reports:** GPTBot, ChatGPT-User, ClaudeBot,
  PerplexityBot, Google-Extended, DeepSeekBot, `ora-agent`.

#### A3. Sitemap exists ✅ (recommended)

- **Observed evidence (meta.ai):** `"No sitemap found"` → failed.
- **Fix given:** valid XML sitemap at `/sitemap.xml`, lastmod dates, < 50 MB.

---

### Category B — Content Without JavaScript

*What does an agent's raw HTML fetch actually see?*

#### B1. Content without JavaScript ✅ 🏷️ `content-no-js` (essential)

- **Purpose:** homepage raw HTML must carry meaningful text without JS execution.
- **Thresholds stated in fixes:** H1 present + **500+ chars** of text in raw HTML.
- **Heading-hierarchy dimension observed:**
  - is-agentic.com (partial): `"4193 chars with H1 but flat heading structure"`
  - vercel.com (partial): `"Only 976 chars of text content, no H1 tag"`
  - eve.dev (partial): `"6074 chars with H1 but flat heading structure"`

  → three scored dimensions are visible: char count, H1 presence, heading hierarchy.
- **Why it matters:** most agent fetchers execute no JS; SPA shells read as empty.

---

### Category C — HTTP Semantics & Error Recovery

*Can an agent probe safely and recover from mistakes?*

#### C1. Agent-friendly 404s ✅ 🏷️ `agent-friendly-404` (essential)

- **Purpose:** nonexistent paths must return real 404/410.
- **Failure mode — "soft 404":** observed on vercel.com:
  `"Nonexistent paths return HTTP 200 with the app shell (soft-404). Agents probing for resources conclude every path exists."`
- **Partial credit behavior observed (eve.dev):** real 404 but
  `"For full credit, include a short markdown body (site map links, where to look next)"`.
- **Nonstandard code observed (meta.ai):** 401 instead of 404/410 → partial.
- **Verification command printed in the fix itself:**

  ```sh
  curl -s -o /dev/null -w "%{http_code}" \
    https://yourdomain.com/some-path-that-does-not-exist   # must print 404
  ```

#### C2. JSON error responses ✅ (essential)

- **Observed evidence (eve.dev):**
  `"API does not return JSON error responses (or no API detected)"`
- **Fix:** structured JSON errors with codes, messages, resolution hints
  (RFC 9457-style) — *"Agents can't parse HTML error pages."*

---

### Category D — Content Negotiation

*Do agents get machine-readable representations — cacheable and correct?*

#### D1. Markdown content negotiation ✅ 🏷️ `markdown-negotiation-vary` (essential; labeled "acceptmarkdown.com")

- **Purpose:** `Accept: text/markdown` returns markdown AND caches correctly.
- **Observed evidence (eve.dev, meta.ai — identical wording):**
  `"Not acceptmarkdown.com compliant: Accept: text/markdown returned text/html; charset=utf-8; Vary header missing Accept"`
  (original evidence also lists the observed Vary value:
  `got "rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch"`)
- **Two distinct sub-checks visible:** representation correctness +
  `Vary: Accept` presence (without it CDNs cross-serve HTML/markdown variants).
- **Reference standard:** acceptmarkdown.com (a published compliance convention).

---

### Category E — Machine-Readable Identity ("SEO/GEO for agents")

*Can an agent verify who you are?*

#### E1. JSON-LD structured data ✅ 🏷️ `json-ld` (recommended)

- **Fix specifies identity-type menu:** SoftwareApplication (products),
  Organization/LocalBusiness (companies), Person (personal), Article (blogs);
  required fields: `name`, `description`, `url`, plus type-appropriate extras
  (`offers`, `sameAs`, `author`).

#### E2. Organization schema completeness ✅ (recommended)

- **Graded fields observed:** `contactPoint` (email/phone + contactType)
  and `address` (PostalAddress). Partial when one is missing (vercel.com:
  `"Organization schema found but missing: address"`).

#### E3. Metadata completeness ✅ 🏷️ `metadata-completeness` (recommended)

- **Exactly four signals (enumerated in the fix):**
  `<link rel="canonical">`, `<html lang="...">`, `og:image`, `og:type`.
- **Partial example (eve.dev):** `"3/4 metadata signals present – missing: og:type"`.

#### E4. Trust anchor pages ✅ 🏷️ `trust-anchors` (recommended)

- **Pages:** `/about`, `/contact`, `/privacy` — each **≥500 characters**.
- **Rationale (verbatim):** *"pages AI agents check to verify your business is legitimate before recommending you."*
- **Partial example (eve.dev):** About + Privacy verified, Contact missing.

---

### Category F — Developer-Surface Discovery

*Can an agent find your programmatic interfaces by name?*

#### F1. Developer resource discoverability ✅ 🏷️ `agentic-search-specific` (recommended)

- **Mechanism (from evidence strings):** an agent performs a name-based search,
  e.g. `"Agent searched for 'is-agentic' developer resources but found nothing relevant"`.
- **Fix:** predictable URLs + llms.txt listing + product name in titles/headings.

#### F2. Brand name discoverability ✅ 🏷️ `brand-search-accuracy` (recommended)

- **Evidence examples:**
  - is-agentic.com (failed): `"'Is Agentic' search returned 7 results but domain did not appear"`
  - meta.ai (partial): `"appears once ... position #7 out of 7"`
- **Note:** depends on a live external search engine → least reproducible check (see §9).

#### F3. OpenAPI spec published ✅ (essential)

- **Locations probed (named in fixes):** `/openapi.json`, `/api/openapi.yaml`.

#### F4. Developer portal ✅ (recommended) · F5. Public API/docs linked from homepage ✅ (recommended) · F6. Public API with reachable endpoints ✅ (recommended)

- All three observed only on meta.ai (all failed) — they appear to activate
  when some developer surface is suspected but not confirmed.
- Portal expectation: `/developers` with keys, docs, quickstart, sandbox.

---

### Category G — API Quality & Auth Semantics

*Once found, is the API agent-operable?*

#### G1. Scoped permissions ✅ (essential)

- **Pass conditions named in fixes:** named OAuth scopes inside OpenAPI
  security schemes, or `scopes_supported` in RFC 9728 Protected Resource Metadata.
- **vercel.com (partial):** `"OpenAPI declares security schemes but no named OAuth scopes – agents get all-or-nothing access."`

#### G2. OAuth 2.0 support ✅ (essential)

- **eve.dev (partial):** OAuth described in `/agents.md` but
  *"no OAuth or OpenID Connect endpoint responded"*
  → checks **live** `/.well-known/oauth-authorization-server` (per fix text).

#### G3. REST response schema coverage ✅ (recommended)

- **Quantified evidence (ora.ai):** `"68% of operations define response schemas (target: >60% with application/json content type)"`.
- Reveals an actual numeric threshold: **>60% coverage** for full credit.

#### G4. API schema complexity analysis ✅ (recommended)

- **Expectations from fix text:** unique operationId + description per operation,
  typed parameters/response schemas; GraphQL: typed schema + cost/rate-limit docs.

#### G5. Function calling compatibility ✅ (recommended)

- Endpoints must map onto LLM tool-calling formats (operationIds + typed schemas).

#### G6. Rate limit response headers ✅ (recommended)

- **Standard cited:** RFC `RateLimit` headers (+ `Retry-After` on 429).
- **nuanced partial (ora.ai):** documented in spec but not observed live → partial.

---

### Category H — Agent Protocols & Onboarding

#### H1. MCP server / manifest ✅ 🏷️ `mcp-server` (recommended)

- **Graduated evidence observed:**
  | Site | Evidence | Result |
  |---|---|---|
  | vercel.com | Live server at `https://mcp.vercel.com`, OAuth challenge at initialize, properly scoped | partial ("Upgrade to public tool listing for full 6/6") |
  | is-agentic.com | Manifest at `/.well-known/mcp` but handshake failed | partial |
  | eve.dev | Mentioned in `/agents.md`, no manifest endpoint | partial |
  | meta.ai | `/.well-known/mcp/manifest.json` not valid JSON | partial |

- **Implications:** the check probes `/.well-known/mcp`, validates JSON,
  then attempts a **real protocol handshake** (Streamable HTTP preferred);
  auth-gated servers earn partial credit.

#### H2. Agent instruction / when-to-use ✅ (recommended)

- **Files observed being checked:** `/agent.txt` (vercel.com) and
  `/.well-known/agent-skills/` (meta.ai); eve.dev's `/agents.md` is an
  instruction-style file referenced by other checks' evidence.
- **Requirement:** explicit *"when to use this"* guidance naming best-fit jobs —
  *"generic marketing copy does not read as guidance."*

#### H3. Agent onboarding friction ✅ (recommended)

- **Three signals sought:** free tier/trial, self-serve key generation,
  sandbox/test environment.
- **Honest limitation shown twice (vercel.com, eve.dev):**
  `"Onboarding signals described but not verified live"` — i.e., judged from
  documentation prose, not live verification. This is LLM-judged territory.
  (vercel.com's evidence even names which prose signals were seen.)

---

### Check count reconciliation

**≈26 distinct checks** were observed across the five reports —
9 essential families (crawler reachability, bot-detection, content-no-js,
agent-friendly-404, OpenAPI spec, scoped permissions, JSON errors,
markdown negotiation, OAuth support) and ~17 recommended families
(brand search, resource discovery, MCP, rate limits, org schema,
onboarding, when-to-use, JSON-LD, schema complexity, function-calling,
metadata completeness, trust anchors, sitemap, developer portal,
public API reachable, docs-linking, response-schema coverage).
Against the claimed 118 total: **most checks never surfaced because they
were passing or not applicable** — issue lists only contain failures/partials.
*(The complete roster has since been extracted — see §15.3.)*

---

## 8. Comparative Analysis of Five Real Reports

All scanned 2026-08-23 (captured live via Markdown-negotiated report URLs).

| Site | Score | Label | Essential | Recommended | Bonus |
|---|---:|---|---|---|---|
| is-agentic.com | **100** | Strong technical baseline | 77.3/80 (9/10) | 17.7/20 (19/22) | +5 (28 signals) |
| ora.ai | **99** | Strong technical baseline | 75.2/80 (12/14) | 18.6/20 (20/23) | +5 (48 signals) |
| vercel.com | **86*** | Strong technical baseline | 63.5/80 (8/11) | 17.6/20 (16/21) | +5 (36 signals) |
| eve.dev | **55** | Important blockers remain | 41.9/80 (4/11) | 10.2/20 (7/18) | +3.4 (14 signals) |
| meta.ai | **32** | Agents are likely to struggle | 26.7/80 (2/9) | 3.9/20 (1/17) | +1.5 (10 signals) |

*(is-agentic.com also returned `eligible_checks: 32` via the JSON API.)*

*\* Snapshot note: vercel.com has since been rescanned by the live tool — newer captures show 85 with 16.8/20 recommended earned (33 eligible checks). Values above reflect our original capture date.*

### Cross-report insights

1. **Essential tier drives the spread.**
   Recommended points stay high everywhere (even meta.ai earns 3.9/20 partly
   through N/A exclusions). The 80-point essential pool separates leaders from laggards.

2. **Everyone fails the same basics.**
   `content-no-js` partials on 4/5 sites (flat headings recurring);
   soft-404 on vercel.com at 86/100. Highest-frequency failures = highest-value fixes.

3. **Failure cascades are real (meta.ai case study).**
   One root cause (blocking all AI crawlers) produced *"Could not fetch homepage"*
   failures across ≥4 unrelated checks (content-no-js, JSON-LD, metadata
   completeness, Organization schema), plus further downstream fails.
   One defect consumed many points.

4. **Applicability gating demonstrably works.**
   Eligible totals vary per site (10–14 essential, 17–23 recommended);
   marketing-ish sites aren't punished for missing APIs.

5. **MCP credit is graduated, binary-pass is rare.**
   Auth-gated-but-live > broken-manifest > merely-mentioned. Partial credit is used liberally.

6. **Self-scanning integrity.**
   is-agentic.com scores 100 despite failing its own brand-search check —
   rounding/bonus math absorbs it. Scores near 100 ≠ zero findings.

---

## 9. Critique & Design Weaknesses

Observed limitations worth avoiding in a clone:

- **Cascade double-counting** — one root cause fails many leaf checks (§8.3).
  Fix: cluster issues by root cause before scoring.
- **Non-reproducible checks** — brand-search depends on a live search engine;
  "is-agentic" itself couldn't rank for its own name. Fix: cache, seed, or demote to bonus tier.
- **Unverified judgments** — onboarding friction scored from prose
  ("described but not verified live"). Fix: require live probes for claimed credit.
- **Opaque arithmetic** — per-check weights and partial-credit formulas unpublished;
  a 77.3+17.7+5 = 100.0 outcome suggests rounding smoothing at the top.
- **Snapshot semantics** — a report is a point-in-time public view; no auth'd
  flows, geo variation, or bot-defense nuance (disclosed by the tool itself).

---

## 10. Implementation Blueprint for a Minimal Clone

### 10.1 Architecture

```text
scanner/
 ├─ fetcher.ts      multi-UA HTTP client (no headless browser needed for v1)
 ├─ probes/         pure functions: (target) → Finding[]
 │    ├─ ssr-content.ts        (B1)
 │    ├─ http-semantics.ts    (C1, C2)
 │    ├─ crawler-access.ts    (A1–A3)
 │    ├─ negotiation.ts       (D1)
 │    ├─ identity.ts          (E1–E4)
 │    ├─ dev-surface.ts       (F1–F6)
 │    ├─ api-quality.ts       (G1–G6)
 │    └─ agent-protocols.ts   (H1–H2)
 ├─ scorer.ts       pools + gating + partial credit
 └─ store.ts        latest-wins keyed by normalized origin
report-api/         GET /api/v1/report?url=
site/               HTML page + text/markdown variant + Vary: Accept
```

### 10.2 Probe pipeline (order matters — later stages depend on earlier)

```text
1. Fetch "/" with N AI UAs          → A1/A2 matrix + raw HTML (B1 input)
2. Parse raw HTML                   → headings, JSON-LD, meta quartet
3. Probe fake paths                 → C1 status-code map
4. Well-known sweep                 → /openapi.json /sitemap.xml /llms.txt
                                      /.well-known/{mcp,oauth-authorization-server}
                                      /agent.txt /agents.md
5. Negotiation test                 → Accept: text/markdown ⇒ Content-Type + Vary
6. If OpenAPI parses                → G3/G4/G5 metrics + G1 scopes
7. If MCP manifest found            → JSON validity → initialize handshake
8. Trust pages                      → /about /contact /privacy char counts
9. (optional, v2) LLM agent run     → discovery journeys → evidence-only output
```

### 10.3 Core data model + scoring logic

```ts
type Result = "pass" | "partial" | "fail";
type Tier   = "essential" | "recommended";

interface Finding {
  id: string;            // e.g. "content-no-js"
  tier: Tier;
  result: Result;
  weight: number;        // pool-relative points
  evidence: string;      // observed fact, always
  recommendation?: string;
}

const POOLS = { essential: 80, recommended: 20 };
const BONUS_CAP = 5;

function score(findings: Finding[], applicableOnly: Finding[]) {
  // 1. applicability gate: drop N/A checks BEFORE counting failures
  //    (activate recommended checks only when API/OAuth/GraphQL/MCP/
  //     portal/commerce evidence was positively detected)
  const eligible = applicableOnly;

  const sum = (t: Tier) =>
    eligible.filter(f => f.tier === t).reduce((a, f) => {
      const credit = f.result === "pass" ? 1 : f.result === "partial" ? 0.5 : 0;
      return a + f.weight * credit;          // proportional partial credit
    }, 0);

  const essential   = Math.min(sum("essential"),   POOLS.essential);
  const recommended = Math.min(sum("recommended"), POOLS.recommended);
  const bonus       = Math.min(BONUS_CAP, computeBonusSignals());
  return Math.round(essential + recommended + bonus);
}
```

### 10.4 Reference implementations of the highest-value probes

```ts
// B1 — content without JS
const html = await fetchText(origin);                       // no JS execution
const $ = load(html);
const text = $("body").text().trim();
const h1 = $("h1").length;
const depth = headingDepth($("h1,h2,h3,h4,h5,h6"));         // structural variety
result = text.length >= 500 && h1 >= 1 ? (depth >= 2 ? PASS : PARTIAL) : FAIL;

// C1 — agent-friendly 404 (soft-404 detector)
const res = await fetch(`${origin}/${randomPath()}`);
if (res.status === 200) FAIL;             // app-shell soft-404 (Vercel's own flaw)
else if ([404, 410].includes(res.status))
  PARTIAL;                                // upgrade to PASS if body has recovery links
else PARTIAL;                             // 401/403 etc. — wrong semantics

// A1 — AI crawler reachability
const AGENT_UAS = ["GPTBot","ChatGPT-User","ClaudeBot","PerplexityBot",
                   "Google-Extended","DeepSeekBot"];
const blocked = [];
for (const ua of AGENT_UAS) {
  const r = await fetch(origin, { headers: { "user-agent": ua } });
  if (![200, 301, 302].includes(r.status)) blocked.push(ua);
}
result = blocked.length === 0 ? PASS : blocked.length <= 2 ? PARTIAL : FAIL;

// D1 — markdown negotiation + Vary
const r = await fetch(origin, { headers: { accept: "text/markdown" } });
const okType  = r.headers.get("content-type")?.startsWith("text/markdown");
const varyOK  = (r.headers.get("vary") ?? "").toLowerCase().includes("accept");
result = okType && varyOK ? PASS : okType ? PARTIAL : FAIL;
```

### 10.5 Minimal viable scope

| Priority | Deliverable | Effort |
|---|---|---|
| P0 | Probes B1, C1, A1, D1, E3/E4 + weighted scorer | days |
| P1 | Well-known sweep + OpenAPI/MCP parsing (F3, G1, H1) | days |
| P2 | Report store, stable `/scan/<host>` pages, JSON API | days |
| P3 | Markdown negotiation on your own reports; CLI wrapper | hours |
| P4 | LLM agent-journey run (evidence-only) | ongoing tuning |

Stack suggestion: TypeScript + undici + cheerio; Next.js mirrors the original's
dogfooding (SSR score, markdown variant) almost for free.

---

## 11. Lessons for Site Owners (SEO/GEO Playbook)

Ranked by observed failure frequency × point impact:

1. **Server-render meaningful HTML** — H1 + ≥500 chars + hierarchical headings in raw HTML. (#1 most-failed check.)
2. **Return honest 404/410s** — kill app-shell soft-404s; add recovery links in the body.
3. **Unblock AI crawler User-Agents** — audit WAF/bot rules against GPTBot/ClaudeBot/ChatGPT-User/PerplexityBot/Google-Extended/DeepSeekBot.
4. **Support markdown negotiation** — serve `text/markdown` on content pages and set `Vary: Accept`.
5. **Publish machine-readable identity** — JSON-LD (correct type), canonical + lang + og:image + og:type, real /about /contact /privacy (≥500 chars each).
6. **Expose a parseable OpenAPI spec** at predictable paths, with named scopes and typed response schemas (>60% coverage target observed).
7. **Ship a working MCP surface** — `/.well-known/mcp`, Streamable HTTP, valid handshake.
8. **Tell agents when to use you** — llms.txt/agent instructions with concrete use cases, not marketing copy.
9. **Return RFC RateLimit headers** and JSON (RFC 9457) errors.
10. **Make yourself findable by name** — product name in titles/headings; resources at predictable URLs listed in llms.txt.

---

## 12. Biggest Learnings for Tool Builders

1. **Weighted pools + applicability gating is the core IP.**
   Excluding N/A checks is what makes one rubric fair across a blog and an API company.
2. **Evidence is the product.**
   Every finding pairs an observed fact with a copy-pasteable fix — often including
   the exact `curl` command to verify. This triples the actionability.
3. **Separate measurement from judgment.**
   Deterministic probes produce the score; the LLM agent journey stays
   *outside* the number. Honest and robust.
4. **Dogfood your own standard.**
   The site serves markdown variants, publishes OpenAPI, runs an MCP server,
   and renders scores in raw HTML — instant credibility and a living reference implementation.
5. **Distribution multiplicity is cheap growth.**
   One report payload → HTML/Markdown/JSON/CLI/MCP/skill. Build once, expose everywhere.
6. **Design against gaming and noise deliberately** —
   avoid search-engine-dependent checks and cascade double-counting (§9) from day one.
7. **Scope humility into the product.**
   Explicit "not a security/a11y/compliance audit" boundaries reduce liability
   and set correct expectations.

---

## 13. Sources & Citations

Primary sources captured and inspected during this analysis:

| # | Source | What was taken from it |
|---|---|---|
| 1 | [MarkTechPost article](https://www.marktechpost.com/2026/08/23/vercel-introduces-is-agentic-a-free-agent-readiness-scoring-tool-that-audits-public-websites-using-oras-100-checks/) | Ora/Vercel split; 118-check layer table; letter grades; JSON field names; check IDs (`content-no-js`, `agent-friendly-404`, `markdown-negotiation-vary`, `json-ld`, `sitemap`, `trust-anchors`, `metadata-completeness`); rate-limit & RFC details |
| 2 | [is-agentic.com home](https://is-agentic.com/) | Product framing, scoring overview, resource links |
| 3 | [/methodology](https://is-agentic.com/methodology) | 80/20/+5 model; N/A exclusion; partial credit; MCP-ID averaging; caching/refresh policy |
| 4 | [/docs](https://is-agentic.com/docs) | API errors/versioning, rate limits, CLI usage, MCP tools, markdown negotiation, no-auth/read-only guarantees |
| 5 | [/about](https://is-agentic.com/about) | Party responsibilities, intended scope & disclaimers |
| 6 | [/pricing.md](https://is-agentic.com/pricing.md) | Free-to-use statement |
| 7 | [/llms.txt](https://is-agentic.com/llms.txt) | Page inventory, usage rules, report-path conventions |
| 8 | [/openapi.json](https://is-agentic.com/openapi.json) | API contract: operationId, parameters, RateLimit headers, RFC references |
| 9 | [Report: is-agentic.com](https://is-agentic.com/scan/is-agentic.com) + its JSON API record | Score 100; breakdown; issue IDs `content-no-js`, `agentic-search-specific`, `brand-search-accuracy`, `mcp-server`; eligible_checks=32 |
| 10 | [Report: vercel.com](https://is-agentic.com/scan/vercel.com) | Soft-404 evidence; scoped-permission partial; onboarding "not verified live"; MCP OAuth-challenge partial |
| 11 | [Report: ora.ai](https://is-agentic.com/scan/ora.ai) | 68% response-schema threshold; documented-vs-live rate-limit partial |
| 12 | [Report: eve.dev](https://is-agentic.com/scan/eve.dev) | acceptmarkdown.com wording; trust-anchor thresholds; OAuth live-endpoint check; missing-spec failures |
| 13 | [Report: meta.ai](https://is-agentic.com/scan/meta.ai) | Crawler-block matrix incl. `ora-agent`; failure cascade; 401-not-404 partial |
| 14 | npm package [`is-agentic@1.0.1`](https://www.npmjs.com/package/is-agentic) (tarball inspected) | Thin-client architecture; `IS_AGENTIC_API_ORIGIN`; terminal renderer; `--json` flag |

All report captures were made via the sites' own
`Accept: text/markdown` negotiation — which is itself one of the audited behaviors.

---

## 14. Open Questions & Unverified Items

Explicitly **not** established by this analysis:

- ⚠️ **Full 118-check list is not public.** Only ≈26 distinct checks were
  observable across five reports (issues list failures/partials; passes are invisible).
- ⚠️ **Per-check weights and the exact partial-credit formula** are unpublished;
  our `0.5 × weight` sketch is illustrative, not reverse-engineered fact.
- ⚠️ **Whether a headless browser is ever used** in scanning — evidence suggests
  raw HTTP fetching, but this is inference, not confirmation.
- ⚠️ **Which search backend** powers brand/dev-resource discovery checks.
- ⚠️ **Scan latency, queueing, and background-refresh cadence** — the docs say
  stale reports *"may"* be refreshed; no timing published.
- ⚠️ **Payments-layer checks** never triggered in our five public reports,
  but were later enumerated via the raw payload — see §15.3 (resolved).
- ⚠️ **GitHub repo** `vercel-labs/is-agentic` returned 404 at analysis time
  (private or unpublished); the skill file could not be read directly.
- ⚠️ **Which LLM/model Ora's agent journeys use**, and how journeys are selected.
- ⚠️ **Score rounding behavior** at the top of the range
  (is-agentic.com: 77.3 + 17.7 + 5 = 100.0 displayed as 100).
- ⚠️ **Vercel's exact regrouping arithmetic** — proven to be its own
  per-check classification independent of Ora tiers (§15.7 A9);
  precise formula unresolved.

---

### 15.7 Adversarial audit findings (independent verification pass)

A hostile re-verification was performed: registry-integrity-verified tarball
re-download (SHA-512 match, byte-identical), fresh live uncached scan
(hamel.dev), and numerical cross-validation of cached payloads against
published reports. Results:

**Confirmed ✅**

- **A1 — Tarball integrity:** fresh download matches npm registry SHA-512;
  byte-identical to the original extraction; still 591 lines.
- **A2 — Roster stability:** `scan_init.checkRoster` observed LIVE carrying
  all 124 check IDs; identical (zero symmetric difference) to the roster
  extracted from a different domain's result object. 124 `check_start` /
  `check_complete` pairs emitted in the live run.
- **A3 — Ungated totals:** `scan_init.layerMaxScores` =
  discovery **35**, access **84**, usability **158**, payments **16**
  = **293 pts** total — exactly matching the sum of all 124 checks' maxScores.
- **A5 — Gating mechanism exposed:** a `relevance_assessed` event lists the
  exact `naCheckIds` being excluded plus per-check `reasons`. Applicability
  gating is an explicit engine step, not implicit scoring math.
- **A6 — Crawl shape:** `discovery_phase` events reveal an ~8-step crawl
  ("Fetching <host>" → "Loaded homepage" → …), and `summary_ready` shows the
  plain-language summary is generated as a final step.
- **A7 — Dual-phase signal:** a second `scan_init` frame carries
  `totalChecks: 104, staticOnly: true` — evidence of a static/dynamic split
  in the engine (exact semantics unconfirmed).

**Corrections forced by the audit ❌→✅**

- **A8 — Event attribution fix:** `kind_detected` is emitted by the server
  but is NOT handled in the CLI source (the CLI handles only 6 event types).
  The live stream additionally carries `kind_detecting`, `discovery_phase`,
  `layer_complete`, `relevance_assessed`, and `summary_ready`.
- **A9 — SUPERSEDED by external review (see §15.8).** Our interim conclusion
  ("Vercel maintains its own per-check classification and rescaling") was itself
  refuted: the grouped-score arithmetic is a **published Ora feature**
  (`GET ora.ai/api/score/<host>?include=essentials` + `/api/checks?include=essentials`)
  and the formula has since been reproduced to ±0.1 on 7 domains.
**Impact on the build plan:** none of the findings block implementation.
They change two choices: (a) score against Ora's native 293-pt structure
(or our own published weights) rather than pretending to reproduce Vercel's
regrouping arithmetic; (b) implement applicability gating as an explicit
relevance-assessment step emitting machine-readable exclusion reasons,
mirroring `relevance_assessed`.

---

### 15.8 Independent external adversarial review (Claude Fable 5)

An independent Claude Code session (model `claude-fable-5`, xhigh effort) was
given only this document plus pointers to the CLI/docs, and re-derived everything
from primary sources: registry-verified tarball, full source read, reports for
**8 domains**, two fresh SSE captures, **Ora's own API surface**, and a real 429.

**Verdict: PASS WITH CORRECTIONS.**

#### Confirmed independently ✅

- Every CLI fact, all quoted evidence strings, all five report numbers
  (vercel.com has since rescanned: 86 → 85), the 124-check roster
  (**0 mismatches** vs Ora's catalog), rate limits (120×200 then 429 observed),
  letter grades, RFC citations, and embedded thresholds.
- Roster stability across domains; ungated totals 35/84/158/16 = 293.

#### Corrections adopted into this primer ❌→✅

1. **The grouped-score formula is public and reproducible** (±0.1 on 7 domains):
   - `Essential = 80 × mean(fraction)` over eligible essential checks —
     **equal weight; native maxScore ignored**
   - `Recommended = 20 × mean(fraction)`
   - `Bonus = min(5, 0.25 × Σ fraction)` over bonus-only checks with credit;
     `positive_signals` = count of those
   - Integer score: truncate each component to 0.1 → sum → round
2. **Ora publishes its own engine surface** — the real spec for cloners:
   `GET ora.ai/api/checks` (+`?include=essentials` for the static
   Essential/Recommended/Bonus mapping), `GET /api/score/<domain>`,
   `POST /api/scan`, `POST /api/scan/checks`, `/api/scan/stream`
   (documented in Ora's OpenAPI — not fully "undocumented"), MCP at
   `ora.ai/api/mcp`, CLI `npx @ora-ai/ax audit <url>` (also a thin client).
3. **`scan_complete` is provisional**: the stored score is the one computed
   *after* `relevance_assessed` N/A-gating. Treat the stream's terminal object
   as pre-gating. Status vocabulary also includes `pending`.
4. Snapshot drift is real: Vercel-stored reports can lag Ora's latest
   (example.com differed by ~14 h; JSON API lagged Markdown ~20 min post-rescan);
   refresh occurs when a visit finds a report older than **6 hours**.
5. Minor: `issues[].tier` enum includes `bonus`; details/recommendation nullable;
   `/.well-known/api-catalog` needs a JSON Accept header;
   npm package maintained by a personal account with a 404 repo (supply-chain note).

#### Resolved former open questions

Full check list ✅ public · per-check weights + grouping ✅ public ·
grouping arithmetic ✅ reproduced · payments roster ✅ · skill file ✅ readable ·
refresh cadence ✅ (6 h). Remaining unknown: headless-browser usage,
exact meaning of `staticOnly` phase, one edge (`api-catalog-rfc9727`
tier discrepancy between catalog and report evidence).

*End of primer. Confidence assessment follows in the delivery notes.*

---

## 15. ADDENDUM — Full Source & Check-Roster Reverse-Engineering

> Added after this primer's initial validation pass: we executed the official CLI
> `npx is-agentic meta.ai`, read its **entire 591-line source** from the npm tarball,
> and used it to discover an **undocumented SSE scan endpoint** whose payload contains
> Ora's complete raw result object. Everything below is machine-extracted from that
> capture — no inference.

### 15.1 What the CLI actually is (full source read)

**Confirmed: the CLI contains zero scanning logic.** It is a 591-line API client:

```text
npx is-agentic <target>
   |
   +- 1. GET /api/v1/report?url=<target>          (existing report?)
   |
   +- 2. if 404 report_not_found:
   |      GET /api/scan/stream?target=<target>     <- UNDOCUMENTED SSE endpoint
   |      Accept: text/event-stream
   |      Event protocol observed in source:
   |        scan_init       -> carries `checkRoster` array + ungated
   |                          `layerMaxScores`  [handled by CLI]
   |        check_start     -> per-check progress (`checkName`)
   |        check_complete  -> progress counter
   |        scan_complete   -> FULL RAW RESULT OBJECT (see 15.2)
   |        scan_archived   -> stored for /scan/<host>
   |        error           -> failure terminal event
   |
   |      (the CLI handles exactly these 6 event types; the SERVER emits
   |       several more that the CLI ignores - see 15.7)
   |
   +- 3. poll /api/v1/report up to 5x (backoff 250ms x attempt) -> render
```

Other confirmed CLI internals: `--json/-j`, `IS_AGENTIC_API_ORIGIN` override,
RFC 9457-style local errors (`scan_start_failed`, `scan_interrupted`,
`api_unreachable`, ...), control-character sanitizing of target strings.

### 15.2 The raw Ora result object (contractVersion `1.20.1`)

The `scan_complete` SSE frame carries the complete native scoring object -
**before** Vercel's Essential/Recommended regrouping. Captured facts:

- Engine attribution: `"source": "ora.ai"`; result URL hosted at `ora.ai/<domain>`
- **124 checks** in the roster (the article's "118" has since grown)
- Status vocabulary: `pass` / `fail` / `warning` (= partial) / `na` (excluded) / `error` (probe itself errored — seen on meta.ai's `content-no-js`)
- Tier vocabulary: `required` / `recommended` / `emerging`. **Caution:** these do NOT map 1:1 onto Vercel's Essential/Recommended/Bonus pools — see §15.7 A9 / §15.8
- Every check carries: `id`, `name`, `maxScore`, `status`, `score`, `bonus` flag,
  `tier`, optional `specUrl`, `details` (evidence), `recommendation`,
  `naReason` (why excluded), and `estScoreGain` (prioritization weight)
- Layer `maxScore` values are **post-gating** (N/A checks excluded from the denominator)
- A `topFixes[]` array ranks remediations by `estScoreGain` (e.g. WebMCP support: +11.1)

### 15.3 The complete validated check roster (124 checks)

#### Layer `discovery` — Discovery (15 checks, gated max 10 pts)

| ID | Name | Pts | Tier | Bonus |
|---|---|---:|---|:-:|
| `ard-catalog` | ARD / ai-catalog | 1 | required |  |
| `ard-entries-valid` | ARD entry validity | 2 | recommended | ⭐ |
| `ard-trust-manifest` | ARD trust manifest | 2 | recommended | ⭐ |
| `agentic-search-usecase` | Category share of voice | 6 | recommended |  |
| `agentic-search-specific` | Developer resource discoverability | 6 | recommended |  |
| `brand-search-accuracy` | Brand name discoverability | 3 | required |  |
| `wikipedia-presence` | Wikipedia / Wikidata entity presence | 4 | recommended | ⭐ |
| `robots-ai-policy-quality` | robots.txt AI crawler policy | 2 | required |  |
| `mcp-registry-listed` | Listed in MCP registries | 1 | recommended |  |
| `npm-sdk-package` | NPM/PyPI SDK package | 1 | recommended |  |
| `agent-rules-repo` | Agent platform configs | 1 | emerging |  |
| `agent-plugins-repo` | Agent Plugins manifest | 1 | emerging | ⭐ |
| `skills-sh-listed` | Listed on skills.sh | 1 | emerging |  |
| `registry-branding` | Registry branding | 2 | emerging |  |
| `chatgpt-app-listed` | ChatGPT app listed | 2 | recommended | ⭐ |

#### Layer `accessibility` — Access (41 checks, gated max 35 pts)

| ID | Name | Pts | Tier | Bonus |
|---|---|---:|---|:-:|
| `sitemap` | Sitemap exists | 2 | required |  |
| `content-no-js` | Content without JavaScript | 3 | required |  |
| `bot-detection` | Not blocked by bot detection | 2 | required |  |
| `agent-discovery-file` | Agent discovery file | 2 | required |  |
| `agent-skills-index-v2` | Agent Skills index conformance (v0.2.0) | 2 | emerging | ⭐ |
| `a2a-agent-card` | A2A / agent-card | 2 | recommended | ⭐ |
| `pricing-md` | pricing.md exists | 2 | emerging |  |
| `nlweb-schema-feeds` | NLWeb Schema Feeds | 1 | emerging |  |
| `mcp-well-known-discovery` | MCP well-known discovery | 2 | recommended | ⭐ |
| `agent-mode-view` | Agent mode view | 2 | emerging | ⭐ |
| `link-headers-discovery` | HTTP Link headers (RFC 8288) | 1 | required | ⭐ |
| `markdown-url-fallback` | Markdown URL fallback | 2 | emerging | ⭐ |
| `modular-llms-txt` | Modular llms.txt per product area | 1 | emerging | ⭐ |
| `sitemap-lastmod` | Sitemap freshness (lastmod) | 1 | recommended | ⭐ |
| `robots-agent-user-policy` | robots.txt agent-user policy | 2 | required |  |
| `llms-txt-exists` | llms.txt exists | 1 | required |  |
| `llms-txt-formatting` | llms.txt formatting | 2 | recommended |  |
| `json-ld` | JSON-LD structured data | 4 | required |  |
| `pricing-info` | Pricing info accessible | 3 | required |  |
| `public-api-docs` | Public API/docs linked from homepage | 3 | required |  |
| `agent-instruction` | Agent instruction / when-to-use | 3 | required |  |
| `skills-sh-quality` | Skills.sh skill quality | 2 | emerging |  |
| `json-ld-entity-linking` | JSON-LD entity linking (sameAs) | 2 | recommended |  |
| `metadata-completeness` | Metadata completeness | 2 | required |  |
| `org-schema-completeness` | Organization schema completeness | 2 | recommended |  |
| `schema-type-breadth` | Schema type breadth | 2 | recommended |  |
| `trust-anchors` | Trust anchor pages | 2 | required |  |
| `llms-txt-links-resolve` | llms.txt links resolve | 2 | recommended |  |
| `markdown-link-alternate` | Markdown alternate link | 1 | emerging | ⭐ |
| `markdown-frontmatter` | Markdown frontmatter metadata | 1 | emerging |  |
| `redirect-hygiene` | Redirect hygiene | 1 | recommended |  |
| `page-token-budget` | Page token budget | 1 | recommended |  |
| `code-fence-validity` | Code fence validity | 1 | emerging |  |
| `docs-auth-gate` | Content behind auth | 2 | recommended |  |
| `openapi-spec` | OpenAPI spec published | 7 | required |  |
| `developer-portal` | Developer portal | 6 | recommended |  |
| `api-catalog-rfc9727` | API catalog (RFC 9727) | 2 | required | ⭐ |
| `markdown-negotiation` | Markdown agent docs | 1 | emerging |  |
| `markdown-negotiation-vary` | Markdown content negotiation (acceptmarkdown.com) | 1 | recommended | ⭐ |
| `agent-ua-markdown` | Bot-UA markdown serving | 1 | emerging | ⭐ |
| `agent-crawler-reachability` | Agent crawler reachability | 2 | recommended |  |

#### Layer `usability` — Usability (62 checks, gated max 8 pts)

| ID | Name | Pts | Tier | Bonus |
|---|---|---:|---|:-:|
| `mcp-tool-descriptions` | MCP tool descriptions | 3 | recommended | ⭐ |
| `mcp-param-schemas` | MCP parameter schemas | 2 | recommended | ⭐ |
| `mcp-server-identity` | MCP server identity | 1 | recommended | ⭐ |
| `mcp-tool-listing` | MCP tool listing | 3 | recommended | ⭐ |
| `mcp-tool-naming` | MCP tool naming | 2 | recommended | ⭐ |
| `public-api` | Public API with reachable endpoints | 7 | required |  |
| `oauth-support` | OAuth 2.0 support | 5 | required |  |
| `scoped-permissions` | Scoped permissions | 5 | recommended |  |
| `mcp-auth-mechanism` | MCP auth mechanism | 2 | recommended | ⭐ |
| `mcp-oauth-metadata` | MCP OAuth metadata | 2 | recommended | ⭐ |
| `mcp-pkce-s256` | MCP PKCE S256 support | 2 | recommended | ⭐ |
| `onboarding-friction` | Agent onboarding friction | 2 | recommended |  |
| `web-bot-auth-directory` | Web Bot Auth directory | 2 | emerging | ⭐ |
| `oauth-protected-resource` | OAuth Protected Resource metadata (RFC 9728) | 2 | required | ⭐ |
| `auth-md-exists` | auth.md exists | 2 | required | ⭐ |
| `auth-md-structure` | auth.md structure | 2 | recommended | ⭐ |
| `auth-md-walkthrough-simulation` | auth.md walkthrough simulation | 2 | recommended | ⭐ |
| `agent-auth-discovery-metadata` | Agent auth discovery metadata | 3 | recommended | ⭐ |
| `agent-auth-www-authenticate` | Agent auth WWW-Authenticate hint | 1 | recommended | ⭐ |
| `agent-auth-endpoints-reachable` | agent_auth endpoints reachable | 2 | recommended | ⭐ |
| `mcp-server` | MCP server / manifest | 6 | required |  |
| `mcp-error-handling` | MCP error handling | 2 | recommended | ⭐ |
| `mcp-transport-modern` | MCP modern transport | 1 | recommended | ⭐ |
| `webmcp` | WebMCP support | 2 | required |  |
| `rate-limit-headers` | Rate limit response headers | 2 | recommended |  |
| `idempotency-key-support` | Idempotency-Key support | 3 | recommended |  |
| `json-error-responses` | JSON error responses | 4 | required |  |
| `api-error-model` | REST typed error model | 3 | recommended |  |
| `api-versioning-policy` | REST versioning / deprecation policy | 3 | recommended |  |
| `pagination-shape` | REST pagination pattern | 2 | recommended |  |
| `async-job-pattern` | REST async-job pattern | 2 | recommended |  |
| `cli-tool` | CLI tool available | 3 | recommended |  |
| `rest-sdk-packages` | Multi-language SDK packages | 3 | recommended |  |
| `nlweb-ask` | NLWeb /ask endpoint | 1 | emerging |  |
| `nlweb-streaming` | NLWeb streaming support | 1 | emerging |  |
| `response-schema-coverage` | REST response schema coverage | 2 | recommended |  |
| `mcp-tool-annotations` | MCP tool annotations | 2 | recommended | ⭐ |
| `mcp-server-card` | MCP server-card.json | 2 | recommended | ⭐ |
| `mcp-multi-surface-coverage` | Product + docs MCP coverage | 2 | recommended | ⭐ |
| `sandbox-environment` | Sandbox / test environment | 2 | recommended | ⭐ |
| `batch-endpoints` | REST batch / bulk endpoint | 2 | recommended | ⭐ |
| `mcp-resource-listing` | MCP resources exposed | 3 | recommended |  |
| `graphql-error-type-definition` | GraphQL typed error model | 3 | recommended |  |
| `graphql-versioning-policy` | GraphQL versioning / deprecation policy | 2 | recommended |  |
| `graphql-pagination-pattern` | GraphQL pagination pattern | 2 | recommended |  |
| `graphql-async-job-pattern` | GraphQL async-job pattern | 2 | recommended |  |
| `graphql-schema-completeness` | GraphQL schema description coverage | 3 | recommended | ⭐ |
| `graphql-batch-mutations` | GraphQL batch mutations | 2 | recommended | ⭐ |
| `agent-friendly-404` | Agent-friendly 404s | 2 | recommended |  |
| `ax-document-structure` | Accessible document structure | 3 | recommended | ⭐ |
| `ax-native-controls` | Native interactive controls | 3 | recommended | ⭐ |
| `ax-accessible-names` | Accessible names on controls | 2 | recommended | ⭐ |
| `ax-form-labeling` | Form control labeling | 2 | recommended | ⭐ |
| `ax-tree-injection-safe` | Accessibility-tree injection safety (bonus) | 2 | recommended | ⭐ |
| `mcp-app-registry` | MCP Apps support | 4 | recommended |  |
| `a2ui-support` | A2UI / generative UI support | 2 | emerging |  |
| `mcp-apps-ui-quality` | MCP Apps UI quality | 4 | recommended | ⭐ |
| `mcp-view-domain` | MCP App view reachable | 4 | recommended |  |
| `mcp-view-csp` | MCP App view CSP | 4 | recommended |  |
| `api-schema-analysis` | API schema complexity analysis | 2 | recommended |  |
| `function-calling-compat` | Function calling compatibility | 2 | recommended |  |
| `mcp-resource-quality` | MCP resource quality | 3 | recommended |  |

#### Layer `payments` — Payments (6 checks, gated max 0 pts)

| ID | Name | Pts | Tier | Bonus |
|---|---|---:|---|:-:|
| `mpp-support` | MPP payment protocol | 2 | required | ⭐ |
| `x402-support` | x402 payment protocol | 2 | required | ⭐ |
| `ucp-support` | UCP - Universal Commerce Protocol | 3 | required | ⭐ |
| `acp-support` | ACP - Agentic Commerce Protocol | 3 | required | ⭐ |
| `acp-delegate-payment` | ACP delegate payment | 3 | recommended | ⭐ |
| `ap2-support` | AP2 - Agent Payments Protocol | 3 | recommended | ⭐ |

### 15.4 Roster statistics (machine-computed)

- Total checks: **124** across 4 layers
- Tiers: required=29, recommended=75, emerging=20
- Bonus-flagged checks: **54**
- Sum of all maxScores: 293 pts (non-bonus subset: 181 pts)
- For example.com: 70 N/A-gated, 43 failed, 9 passed, 2 warnings — demonstrating heavy applicability gating on a non-developer site

### 15.5 Notable discoveries beyond the public reports

- **New checks never surfaced in any public report**, including:
  `wikipedia-presence` (Wikipedia/Wikidata entity, Wikidata P856),
  `robots-ai-policy-quality` (per-crawler Allow/Disallow guidance incl. Content Signals),
  `webmcp` (W3C WebMCP draft: `toolname`/`tooldescription` form attributes,
  `document.modelContext.registerTool()`, Chrome 157 shipping), `a2a-agent-card`,
  `mcp-registry-listed` (Smithery/mcp.so), `npm-sdk-package`, `agent-rules-repo`,
  the NLWeb family, x402/UCP/ACP/AP2/MPP payment protocols, the `auth.md` family,
  the accessibility-for-agents family (`ax-*`), and the MCP Apps UI family
  (`mcp-apps-ui-quality`, `mcp-view-domain`, `mcp-view-csp`)
- **Beta/Pro check revealed:** `agentic-search-usecase` ("Category share of voice")
  is explicitly labeled *beta ... coming soon as a Pro check* — evidence of a
  future paid tier inside Ora's engine
- `naReason` fields give exact exclusion logic (e.g., "No developer resources exist
  to be discovered via search")
- The `estScoreGain` field is the tool's built-in remediation-prioritization
  algorithm — directly replicable in a clone

### 15.6 Impact on this primer's confidence

| Previously unknowable (§14) | Now |
|---|---|
| Full check list not public | ✅ **RESOLVED** — all 124 checks extracted with IDs |
| Per-check weights unpublished | ✅ **RESOLVED** — every check's maxScore known (but see §15.7 A9 on Vercel's separate regrouping) |
| Partial-credit formula | Partially resolved — status vocabulary + per-check points known; warning→partial mapping still inferred |
| Payments-layer content | ✅ **RESOLVED** — 6 protocol checks enumerated (MPP, x402, UCP, ACP ×2, AP2) |
| Headless browser usage | Still unknown (server-side implementation not exposed) |
| Search backend for brand/discovery checks | Still unknown |