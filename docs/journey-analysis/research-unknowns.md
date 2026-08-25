# Journey System — Research Report: Unknowns Resolved

Date: 2026-08-25. All findings verified live against ora.ai production.

## Q1: Can we use the `mcp__orank__api_call` tool?

**Not directly — and we don't need to.**

- Ora's **public MCP server** (`https://ora.ai/api/mcp`, verified via initialize + tools/list) exposes 13 tools:
  `scan_domain, get_score, get_leaderboard, discover_products, search_capabilities,
   get_verification_challenge, submit_feedback, submit_check_feedback, get_feedback,
   list_skills, get_skill, list_checks, run_checks`
- **`mcp__orank__api_call` is NOT among them** — it is Ora's *internal* journey-agent fetch tool, injected into the agent harness at journey runtime. It is not publicly exposed.
- **However**: `POST https://ora.ai/api/journey/runs` is **publicly runnable anonymously** (verified live — HTTP 201, curated intents, no API key; custom free-text intents require a partner key). Ora runs the agent + internal tools on their infra and exposes the full trajectory via public `GET /api/journey/runs/{id}` + `/stream`.

## Q2: What does `mcp__orank__api_call` actually do, and why is it needed?

**What it does (from trajectory + agent commentary):**
1. Fetches a URL and returns the page content to the agent — **raw, unprocessed** (the J1 agent repeatedly hit "minified HTML… unreadable" on vercel.com; no markdown conversion, no readability processing)
2. Captures the full observability record per call: `url_host`, `url_path`, `anchor_relation` (exact/…), `page_role` (homepage/docs/pricing/other), HTTP `status`, `duration_ms`, `label`
3. Routes through Ora's infrastructure so every fetch is centrally measured

**Why it's needed (vs the model alone):**
- The model cannot fetch URLs natively — a tool is mandatory
- A plain fetch tool would produce **no telemetry**; the wrapper makes every fetch the measurement itself. The journey's purpose is to observe agent friction — the tool is the instrument
- The friction IS the signal: vercel's minified HTML passing through unmodified is exactly what "succeeded_with_heavy_bridge" measures

**Why it's not redundant with is-agentic's deterministic checks:** the 124 checks test whether agent-readable content *exists* (static analysis); the journey tests whether a *live agent* can actually *use* the site to complete a comprehension task. vercel.com passes 37/42 deterministic checks yet its journey proves heavy bridging (57% guessed URLs, unreadable pages).

## Q3: The complete journey API (public, verified live)

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/api/journey/runs` | POST | anonymous (curated) / partner key (custom text) | Launch a run; returns `{id, stream_url}` |
| `/api/journey/runs/{id}` | GET | none | Full finished run: trajectory, run_signals, insight, agent_response |
| `/api/journey/runs/{id}/stream` | GET (SSE) | none | Live trajectory replay |
| `/api/journey/intents` | GET | none | 16 curated intents (pricing, signup, api-docs, integrate, support, evaluate, understand-offering, …) |
| `/api/journey/agents` | GET | none | 5 runnable agents: claude-code (Haiku 4.5 / Sonnet 4.6), eve (ash harness), ChatGPT (GPT-5.4) |
| `/api/journey/domains/{host}` | POST | **partner key** | get-or-create journey for a domain |

Request body (verified): `{intent:{intent_id, domain?} | {custom, domain}, harness, model}`

## Q4: Runtime behavior (verified by launching a real anonymous journey)

Live run `4a7c97bd` (example.org, understand-offering, claude-agent-sdk/haiku-4.5):
- 3 turns, 2 fetches, $0.016, 14.6s → verdict "satisfied", outcome "success"
- run_signals v3 computed: friction_outcome=succeeded_natively, bridge=none, link_following 0.5, prior_knowledge 0.5, page_reach map, journey_layers [discovery, identity]
- insight.summary generated ~9s after run end (separate LLM call)
- agent_response: full structured markdown answer

## Implementation notes captured for the build phase
- pydantic-ai + OpenRouter + gemini-flash-3.7: pydantic 2.12.5 present; uv available; pydantic skills plugin present (usage reference)
- Isolation: new sibling project; zero imports from the existing clone
