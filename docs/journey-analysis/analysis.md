# Ora Agentic Journey — Reverse-Engineered Business Logic

## What the "agentic workflow" actually is

A **Claude Agent SDK run** (model: `claude-haiku-4-5`) is given ONE fixed intent per domain:

> intent_id: `understand-offering` — *"What does {domain} do and who is it for? Explain it back to me."*

The agent has exactly **two tools**:
1. `mcp__orank__api_call` — fetches URLs through Ora's MCP server ("orank" = Ora Rank), returning page content
2. `WebSearch` — standard web search

Every trajectory step is recorded with full **attribution metadata**:
- `attribution.kind`: `prior_knowledge` (method: heuristic) | `previous_artifact` (method: llm, confidence: strong/weak, referrer step) | `web_search`
- `page_role` classification (homepage / docs / pricing / other)
- HTTP status per fetch (status_profile: count_2xx/3xx/4xx/5xx)

## The three captured journeys

| | J1 vercel.com | J2 ora.ai | J3 eve.dev |
|---|---|---|---|
| steps / turns | 17 / 5 | 23 / 9 | 21 / 9 |
| duration · cost | 60.6s · $0.18 | 62.6s · $0.13 | 74.4s · $0.72 |
| tokens (in/out) | 1,906 / 3,714 | 1,936 / 2,837 | 1,936 / 2,823 |
| searches | 5 | 3 | 4 |
| ON-SITE DISCOVERY | 86% | 100% | 73% |
| RELIABILITY | 100% | 100% | 82% |
| LINK FOLLOWING | 29% | 91% | 64% |
| PATH ORIGIN (prior/artifact/search) | 57/29/14% | 91/9/0% | 9/64/27% |
| friction_outcome | succeeded_with_heavy_bridge | succeeded_natively | succeeded_with_light_bridge |
| bridge_classification | prior_knowledge_fallback | none | none |
| verdict | satisfied | satisfied | satisfied |
| journey_layers touched | discovery, identity | discovery, identity, access | discovery, identity, payments |

## The derived metrics (formulas reverse-engineered)

- **ON-SITE DISCOVERY = 1 − web_search_ratio** (J1: 1−0.14=86% ✓, J3: 1−0.27=73% ✓)
- **RELIABILITY = 2xx fetches ÷ total fetches** (J1: 7/7 = 100% ✓)
- **LINK FOLLOWING = link_following_rate** (fraction of fetches attributed `previous_artifact` — i.e., followed from discovered links vs guessed)
- **PATH ORIGIN** = attribution kind distribution (prior_knowledge / previous_artifact / web_search)

## The signal pipeline (run_signals v3)

Post-run, a deterministic analyzer computes from the trajectory:
- `intent_category`: discovery-evaluation (fixed for this intent)
- `page_reach`: which page-roles were reached (homepage/docs/pricing/other), at which turn
- `friction_outcome`: succeeded_natively → with_light_bridge → with_heavy_bridge
  (bridge = the agent had to "bridge" gaps using prior knowledge or web search instead of on-site content)
- `bridge_classification`: none | prior_knowledge_fallback | …
- `success_step_ids` + `success_route` (which steps carried the answer; homepage = "load_bearing" vs "helper")
- `journey_layers`: which report layers the journey touched (discovery/identity/access/payments)

Then a **separate LLM call** (timestamped ~9s after run end) generates the `insight`:
summary + 5–6 key_observations citing specific step ids.

## How it integrates with the deterministic report

1. **journey_layers touched** map onto the 124-check report layers — the journey shows which layers a *real agent* actually used
2. **friction_outcome / bridge_classification** quantify agent-experience quality beyond pass/fail: vercel passes 37/42 deterministic checks yet the journey proves agents must "bridge heavily" (57% guessed URLs, minified HTML unreadable) — the deterministic report cannot see this
3. **page_reach** validates the deterministic access checks from live agent behavior (agents DID reach homepage/docs/pricing)
4. **The report page composes both**: deterministic score + breakdown + fixes (our clone's scope) alongside the journey narrative, discovery/reliability metrics, and evaluator insight (Ora's LLM layer)

## The business logic, stated plainly

1. Pose a fixed comprehension task to a Claude agent with fetch+search tools
2. Record every action with attribution (guessed vs followed vs searched)
3. Derive agent-experience metrics: could the agent discover content on-site, or did it bridge via prior knowledge/search?
4. LLM-generate the narrative insight from the attributed trajectory
5. Publish journey + deterministic report together: **the deterministic checks measure whether agent-readable content EXISTS; the journey measures whether a real agent can actually USE it to understand the offering**

## Replicability assessment — HIGH confidence

The entire pipeline is replicable with available tools:
1. Claude Agent SDK + Haiku with two tools (fetch-via-MCP + WebSearch) — we already run Claude Code on this machine
2. Fixed intent prompt (verbatim known)
3. Trajectory recording with attribution — the attribution classification (prior_knowledge vs previous_artifact vs web_search) is itself LLM/heuristic-labeled per step, reproducible
4. Deterministic signal computation from the trajectory (all formulas reverse-engineered above)
5. Insight generation = one LLM call over the trajectory
Estimated effort: a focused implementation could replay this end-to-end; cost per run ≈ $0.13–0.72.
