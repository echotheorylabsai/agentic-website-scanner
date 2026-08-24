# is-agentic Check Text — Verbatim Extraction (Static Content Only)

_Compiled 2026-08-24 from: Ora catalog capture (`contractVersion 1.20.1`, 124 checks), per-domain score payloads (4 domains: vercel.com, eve.dev, meta.ai, example.org), official v1 reports (same 4 domains), and one fresh SSE scan capture (example.org)._

**Methodology.** Every string below is copied verbatim from captured API responses — zero paraphrasing, programmatic extraction only. Text classification:

- **Catalog `description` / `recommendation`** — static by construction (shipped in the versioned catalog, identical for every scan). 124/124 descriptions, 119/124 recommendations present.
- **[static]** outcome text — observed byte-identical on ≥2 independent domains ⇒ deterministic template, not freeform LLM output
- **[observed 1×]** outcome text — seen on a single domain; may be a deterministic outcome template or per-scan-tailored text. Included with provenance; treat with caution.

Freeform LLM-generated prose (never-repeating per-scan text) cannot be distinguished from single-observation templates with n=4 domains — such strings are marked `[observed 1×]` rather than silently included as static.

**Totals:** 124 checks — Discovery (15), Access (41), Usability (62), Payments (6)

---

# Layer: Discovery (15 checks)

## `agent-plugins-repo` — Agent Plugins manifest
*Layer: Discovery · essentialsTier: **emerging** · native tier: emerging · maxScore: **1** · bonus, essentials-bonus-only*
*Spec: https://agent-plugins.org/specification*

**Description (catalog, verbatim):** An Agent Plugins manifest (plugin.json) in your public GitHub repos, bundling skills and MCP servers into one installable package. An emerging format, so it never costs points.

**Recommendation (catalog, verbatim):** Bundle your agent skills and MCP servers as an Agent Plugin: a plugin.json manifest with the agent-plugins.org $schema and a name in your public repo. See https://agent-plugins.org/specification

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com, sse/example.org): "No Agent Plugins manifest (plugin.json) found in discovered repos"
- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Bundle your agent skills and MCP servers as an Agent Plugin: add a plugin.json manifest with the agent-plugins.org $schema and a name. See https://agent-plugins.org/specification"

---

## `agent-rules-repo` — Agent platform configs
*Layer: Discovery · essentialsTier: **emerging** · native tier: emerging · maxScore: **1** · essentials-bonus-only*

**Description (catalog, verbatim):** Published rules or config files for AI coding tools (Claude, Cursor, Windsurf). They teach coding agents to use your product correctly from the first prompt.

**Recommendation (catalog, verbatim):** Add an AGENTS.md or .cursorrules file to your public GitHub repo with instructions for how AI coding agents should interact with your codebase. Then make sure the repo is documented in the entry-point pages agents read - homepage, docs, and llms.txt - so it can be discovered without guessing.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Add an AGENTS.md or .cursorrules file to your public GitHub repo with instructions for how AI coding agents should interact with your codebase. Then make sure the repo is documented in the entry-point pages agents read - homepage, docs, and llms.txt - so it can be discovered without guessing."
- **[static]** *Details* (score-api/example.org, score-api/meta.ai, sse/example.org): "Could not locate a public repo containing agent configs or rules. If our probes missed it, AI coding agents likely will too - link the repo from your homepage or docs so it's discoverable."
- [observed 1×] *Details* (score-api/vercel.com): "Agent config found: github.com/vercel/vercel/blob/main/AGENTS.md"
- [observed 1×] *Details* (score-api/eve.dev): "Agent config found: github.com/vercel/eve/blob/main/AGENTS.md"

---

## `agentic-search-specific` — Developer resource discoverability
*Layer: Discovery · essentialsTier: **recommended** · native tier: recommended · maxScore: **6***

**Description (catalog, verbatim):** Can an agent that knows your name find your developer resources by searching: API docs, OpenAPI spec, MCP server, auth docs? If not, only people who already have the exact URLs can build on you.

**Recommendation (catalog, verbatim):** Make your developer resources (API docs, OpenAPI spec, auth docs, webhooks, MCP server) discoverable by name. Publish them at predictable URLs, list them in llms.txt, and include your product name in page titles and headings so search engines surface them for name-based queries.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com, v1-report/eve.dev, v1-report/meta.ai, v1-report/vercel.com): "Make your developer resources (API docs, OpenAPI spec, auth docs, webhooks, MCP server) discoverable by name. Publish them at predictable URLs, list them in llms.txt, and include your product name in page titles and headings so search engines surface them for name-based queries."
- [observed 1×] *Details* (score-api/vercel.com, v1-report/vercel.com): "Agent searched for "vercel" developer resources but found nothing relevant"
- [observed 1×] *Details* (score-api/eve.dev, v1-report/eve.dev): "Agent found 2 pages by name but no recognizable developer-resource type"
- [observed 1×] *Details* (score-api/meta.ai, v1-report/meta.ai): "Agent searched for "meta" developer resources but found nothing relevant"
- [observed 1×] *Details* (score-api/example.org, sse/example.org): "Agent searched for "example" developer resources but found nothing relevant"

---

## `agentic-search-usecase` — Category share of voice
*Layer: Discovery · essentialsTier: **emerging** · native tier: recommended · maxScore: **6** · essentials-bonus-only*

**Description (catalog, verbatim):** When someone asks an AI for a tool that does what you do, do you come up? This measures your share of voice for the problem you solve, not just your name.

**Recommendation (catalog, verbatim):** Build topical authority for your category. Publish comparison pages, 'best X for Y' content, tutorials, and integration guides that rank for generic use-case queries - not just your brand name - so agents surface you when users describe a need.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com, sse/example.org): "Category share of voice is in beta. It measures whether agents surface you for capability and use-case searches (not just your name). We are tuning it for accuracy before it counts toward your score - coming soon as a Pro check."
- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Build topical authority for your category. Publish comparison pages, 'best X for Y' content, tutorials, and integration guides that rank for generic use-case queries - not just your brand name - so agents surface you when users describe a need."

---

## `ard-catalog` — ARD / ai-catalog
*Layer: Discovery · essentialsTier: **emerging** · native tier: required · maxScore: **1** · essentials-bonus-only*
*Spec: https://agenticresourcediscovery.org/*

**Description (catalog, verbatim):** One catalog that tells agents everything you offer them: MCP servers, APIs, agents, and skills. Without it, every agent has to hunt for your capabilities page by page. We look for an Agentic Resource Discovery catalog at /.well-known/ai-catalog.json. Weighted at 1 point while ecosystem adoption is early (2026-08 audit; was 3).

**Recommendation (catalog, verbatim):** Publish an Agentic Resource Discovery catalog at /.well-known/ai-catalog.json listing your agentic resources (MCP servers, agents, skills, APIs), each entry with a urn:air identifier, a media type, and exactly one of url or data. See https://agenticresourcediscovery.org/

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Details* (score-api/eve.dev, score-api/example.org, sse/example.org): "No /.well-known/ai-catalog.json"
- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org): "Publish an Agentic Resource Discovery catalog at /.well-known/ai-catalog.json so AI clients can discover your agentic resources (MCP servers, agents, skills, APIs). See https://agenticresourcediscovery.org/"
- [observed 1×] *Details* (score-api/vercel.com): "ARD catalog valid (spec 1.0) - 4/4 entries"
- [observed 1×] *Recommendation* (score-api/vercel.com): "Add a trustManifest (identity, attestations, or signature) to entries for progressive trust"
- [observed 1×] *Details* (score-api/meta.ai): "/.well-known/ai-catalog.json exists but is not valid JSON"
- [observed 1×] *Recommendation* (score-api/meta.ai): "Serve a valid AI Catalog manifest per https://agenticresourcediscovery.org/"

---

## `ard-entries-valid` — ARD entry validity
*Layer: Discovery · essentialsTier: **emerging** · native tier: recommended · maxScore: **2** · bonus, essentials-bonus-only*
*Spec: https://ai-catalog.io/*

**Description (catalog, verbatim):** Each entry in your ai-catalog.json is complete enough for an agent to actually use it: an identifier, a display name, a media type, and a working target. Only applies when the catalog exists; partial adoption earns credit and never costs points.

**Recommendation (catalog, verbatim):** Make every ai-catalog.json entry fully valid: a domain-anchored urn:air identifier, a displayName, a media type, and exactly one of url or data.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Make every ai-catalog.json entry fully valid: a domain-anchored urn:air identifier, a displayName, a media type, and exactly one of url or data."
- **[static]** *Details* (score-api/eve.dev, score-api/example.org, sse/example.org): "No /.well-known/ai-catalog.json - entry validity applies only to published catalogs"
- [observed 1×] *Details* (score-api/vercel.com): "All 4 entries valid with domain-anchored urn:air identifiers"
- [observed 1×] *Details* (score-api/meta.ai): "Catalog is not valid JSON (flagged by the ARD / ai-catalog check)"

---

## `ard-trust-manifest` — ARD trust manifest
*Layer: Discovery · essentialsTier: **emerging** · native tier: recommended · maxScore: **2** · bonus, essentials-bonus-only*
*Spec: https://ai-catalog.io/*

**Description (catalog, verbatim):** Trust signals inside your catalog (verified identity, compliance attestations, signatures) that let cautious agents pick you over an unverified alternative. Only applies when the catalog exists; never costs points.

**Recommendation (catalog, verbatim):** Add a trustManifest (verifiable identity, compliance attestations, or signature) to your ai-catalog.json entries so clients can verify your resources with progressive trust.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Details* (score-api/eve.dev, score-api/example.org, sse/example.org): "No /.well-known/ai-catalog.json - trust metadata applies only to published catalogs"
- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai): "Add a trustManifest (verifiable identity, compliance attestations, or signature) to your ai-catalog.json entries so clients can verify your resources with progressive trust."
- [observed 1×] *Details* (score-api/vercel.com): "No entry carries a trustManifest"
- [observed 1×] *Recommendation* (score-api/vercel.com): "Add a trustManifest (identity, attestations, or signature) to catalog entries so clients can verify your resources with progressive trust"
- [observed 1×] *Details* (score-api/meta.ai): "Catalog is not valid JSON (flagged by the ARD / ai-catalog check)"

---

## `brand-search-accuracy` — Brand name discoverability
*Layer: Discovery · essentialsTier: **recommended** · native tier: required · maxScore: **3***

**Description (catalog, verbatim):** A plain search for your brand name should put your domain in the top results. If it does not, agents cannot reliably tell you apart from lookalikes and resellers.

**Recommendation (catalog, verbatim):** Make sure a clean search for your brand name returns your own domain in the top results. If it does not, your brand may be too generic, conflict with a more established term, or not yet indexed. Strengthen brand-name search by claiming consistent NAP across listings, earning press mentions that link to the canonical domain, and avoiding redirect chains that mask the apex domain in search results.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com, v1-report/eve.dev, v1-report/example.org, v1-report/meta.ai): "Make sure a clean search for your brand name returns your own domain in the top results. If it does not, your brand may be too generic, conflict with a more established term, or not yet indexed. Strengthen brand-name search by claiming consistent NAP across listings, earning press mentions that link to the canonical domain, and avoiding redirect chains that mask the apex domain in search results."
- [observed 1×] *Details* (score-api/example.org, sse/example.org, v1-report/example.org): ""Example Domain" search returned 8 results but domain did not appear - brand may be too generic or not indexed"
- [observed 1×] *Details* (score-api/eve.dev, v1-report/eve.dev): ""eve" search returned 7 results but domain did not appear - brand may be too generic or not indexed"
- [observed 1×] *Details* (score-api/meta.ai, v1-report/meta.ai): "meta.ai appears once in brand-name search results for "meta" (position #4 out of 5)"
- [observed 1×] *Details* (score-api/vercel.com): "vercel.com appears at position #1 in a clean brand-name search for "Vercel infrastructure devops" (6 total matches)"

---

## `chatgpt-app-listed` — ChatGPT app listed
*Layer: Discovery · essentialsTier: **recommended** · native tier: recommended · maxScore: **2** · bonus, essentials-bonus-only*

**Description (catalog, verbatim):** Listed in the ChatGPT app directory, where hundreds of millions of users can pull your product into a conversation by name. Upside-only: the directory is curated and gated, so absence never costs points.

**Recommendation (catalog, verbatim):** Submit your app to the ChatGPT apps / connectors directory (the apps-in-ChatGPT surface) so ChatGPT users can discover and use your product.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Submit your app to the ChatGPT apps / connectors directory (the apps-in-ChatGPT surface) so ChatGPT users can discover and use your product."
- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, sse/example.org): "Not found in ChatGPT app directory"
- [observed 1×] *Details* (score-api/vercel.com): "Found in ChatGPT app directory: "Vercel""

---

## `mcp-registry-listed` — Listed in MCP registries
*Layer: Discovery · essentialsTier: **recommended** · native tier: recommended · maxScore: **1** · essentials-bonus-only*

**Description (catalog, verbatim):** Agents find MCP servers through registries the way people find apps through app stores. We check the major ones (Smithery, mcp.so) for an entry verified against your domain.

**Recommendation (catalog, verbatim):** Register your MCP server on Smithery (smithery.ai) or mcp.so so agent platforms can discover your tools. Link the registry entry from your homepage or docs for bi-directional verification.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Register your MCP server on Smithery (smithery.ai) or mcp.so so agent platforms can discover your tools. Link the registry entry from your homepage or docs for bi-directional verification."
- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, sse/example.org): "No MCP server detected"
- [observed 1×] *Details* (score-api/vercel.com): "Verified in 2 registries: Smithery (vercel) [entry-to-product], npm (@vercel/mcp-adapter) [npm-scope] - 549 agent uses, verified"

---

## `npm-sdk-package` — NPM/PyPI SDK package
*Layer: Discovery · essentialsTier: **recommended** · native tier: recommended · maxScore: **1** · essentials-bonus-only*

**Description (catalog, verbatim):** An official SDK or CLI on NPM or PyPI gives agents and the developers steering them a ready-made way in, instead of hand-rolling every API call.

**Recommendation (catalog, verbatim):** Publish a JavaScript/TypeScript SDK package on npm so developers can integrate your API programmatically. In package.json set `repository` to your source repo and `homepage` to your product domain - these links are how agents confirm the package is your official SDK rather than a third-party tool with a similar name.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Publish a JavaScript/TypeScript SDK package on npm so developers can integrate your API programmatically. In package.json set `repository` to your source repo and `homepage` to your product domain - these links are how agents confirm the package is your official SDK rather than a third-party tool with a similar name."
- **[static]** *Details* (score-api/example.org, score-api/meta.ai, sse/example.org): "No NPM or PyPI SDK package found"
- [observed 1×] *Details* (score-api/vercel.com): "NPM package found: vercel - "The command-line interface for Vercel""
- [observed 1×] *Details* (score-api/eve.dev): "NPM package found: @github-tools/eve-extension - "GitHub tools for eve, distributed as a mountable eve extension (https://eve.dev/docs/extensions)""

---

## `registry-branding` — Registry branding
*Layer: Discovery · essentialsTier: **emerging** · native tier: emerging · maxScore: **2** · essentials-bonus-only*

**Description (catalog, verbatim):** Your MCP registry entry has a display name, icon, and description. Agents choosing between servers see this first; a bare entry looks abandoned.

**Recommendation (catalog, verbatim):** Give your MCP server-card (at /.well-known/mcp/server-card.json) a display name, an icon or logo, and a description - all three together are what reads as a complete, branded listing agents can present.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Give your MCP server-card (at /.well-known/mcp/server-card.json) a display name, an icon or logo, and a description - all three together are what reads as a complete, branded listing agents can present."
- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, sse/example.org): "No MCP server detected"
- [observed 1×] *Details* (score-api/vercel.com): "No registry branding (name, icon, description) found"

---

## `robots-ai-policy-quality` — robots.txt AI crawler policy
*Layer: Discovery · essentialsTier: **recommended** · native tier: required · maxScore: **2** · essentials-excluded*

**Description (catalog, verbatim):** An explicit robots.txt policy for AI crawlers: allow the answer and search crawlers that cite you, decide deliberately about training-only crawlers. We look for tiered rules or Content Signals declarations.

**Recommendation (catalog, verbatim):** Add explicit AI crawler directives in robots.txt. Allow the crawlers that feed answer engines ('User-agent: GPTBot' / 'Allow: /', same for ClaudeBot, PerplexityBot, OAI-SearchBot), and restrict training-only crawlers (CCBot, ByteSpider) with 'Disallow: /'. Content Signals ('Content-Signal: search=yes, ai-train=no') earns the same credit.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Add explicit AI crawler directives in robots.txt. Allow the crawlers that feed answer engines ('User-agent: GPTBot' / 'Allow: /', same for ClaudeBot, PerplexityBot, OAI-SearchBot), and restrict training-only crawlers (CCBot, ByteSpider) with 'Disallow: /'. Content Signals ('Content-Signal: search=yes, ai-train=no') earns the same credit."
- [observed 1×] *Details* (score-api/example.org, sse/example.org): "No robots.txt found"
- [observed 1×] *Details* (score-api/vercel.com): "Tier-aware Content Signals policy (search=yes, ai-input=yes, ai-train=no) - search allowed, ai-train blocked"
- [observed 1×] *Details* (score-api/eve.dev): "robots.txt allows all crawlers (e.g. `User-agent: *` + `Allow: /`) - open by default but declares no AI-crawler tier differentiation"
- [observed 1×] *Details* (score-api/meta.ai): "AI crawlers actively blocked: gptbot, claudebot, perplexitybot, google-extended, applebot-extended - this hurts AEO/GEO discoverability"

---

## `skills-sh-listed` — Listed on skills.sh
*Layer: Discovery · essentialsTier: **emerging** · native tier: emerging · maxScore: **1** · essentials-bonus-only*

**Description (catalog, verbatim):** Official skills published on skills.sh, the public directory where agents and developers browse for ready-made capabilities.

**Recommendation (catalog, verbatim):** Publish agent skills on skills.sh so AI agents can discover your product's capabilities. Create a SKILL.md in your GitHub repo and register it with 'npx skills add'. See skills.sh/docs.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Publish agent skills on skills.sh so AI agents can discover your product's capabilities. Create a SKILL.md in your GitHub repo and register it with 'npx skills add'. See skills.sh/docs."
- **[static]** *Details* (score-api/eve.dev, score-api/example.org, sse/example.org): "No official skills self-published on skills.sh (100 community skills with potential relation to this domain found, but only self-published official skills count)"
- [observed 1×] *Details* (score-api/vercel.com): "No official skills self-published on skills.sh"
- [observed 1×] *Details* (score-api/meta.ai): "4 official skills published on skills.sh - 376 total installs (skills.sh/meta-quest)"

---

## `wikipedia-presence` — Wikipedia / Wikidata entity presence
*Layer: Discovery · essentialsTier: **recommended** · native tier: recommended · maxScore: **4** · bonus, essentials-bonus-only*

**Description (catalog, verbatim):** A Wikipedia article and Wikidata entry that link to your domain. Wikipedia is the largest single source of citations in AI answers (~48% of ChatGPT citations), so presence there decides whether AIs can verify who you are.

**Recommendation (catalog, verbatim):** Establish a Wikipedia article and a Wikidata entity for your brand, with the domain set as the official website (Wikidata property P856) and a corresponding external link on Wikipedia. Wikipedia is the largest single source of citations in ChatGPT and a primary input to Knowledge Graphs across Google, Bing, and LLM training data. Earn third-party press coverage first to satisfy notability, then draft the article with cited references rather than self-promotion.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Establish a Wikipedia article and a Wikidata entity for your brand, with the domain set as the official website (Wikidata property P856) and a corresponding external link on Wikipedia. Wikipedia is the largest single source of citations in ChatGPT and a primary input to Knowledge Graphs across Google, Bing, and LLM training data. Earn third-party press coverage first to satisfy notability, then draft the article with cited references rather than self-promotion."
- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, sse/example.org): "Wikipedia and Wikidata presence could not be verified - try rescanning"
- [observed 1×] *Details* (score-api/vercel.com): "Wikipedia "Vercel" and Wikidata Q56069184 both verified - domain confirmed on both sources"

---

# Layer: Access (41 checks)

## `a2a-agent-card` — A2A / agent-card
*Layer: Access · essentialsTier: **recommended** · native tier: recommended · maxScore: **2** · bonus, essentials-bonus-only*

**Description (catalog, verbatim):** A business card for agent-to-agent contact: who you are, what you can do, and how to reach you, published at /.well-known/agent-card.json (the A2A protocol).

**Recommendation (catalog, verbatim):** Publish an Agent-to-Agent (A2A) agent card at /.well-known/agent-card.json describing your agent's capabilities, skills, and contact endpoint.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/vercel.com, sse/example.org): "No A2A agent card found at /.well-known/agent-card.json"
- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Publish an Agent-to-Agent (A2A) agent card at /.well-known/agent-card.json describing your agent's capabilities, skills, and contact endpoint."
- [observed 1×] *Details* (score-api/meta.ai): "agent-card.json exists but contains invalid JSON"

---

## `agent-crawler-reachability` — Agent crawler reachability
*Layer: Access · essentialsTier: **required** · native tier: recommended · maxScore: **2***

**Description (catalog, verbatim):** Whether the homepage is reachable to the major AI crawler/agent User-Agents (ChatGPT-User, ClaudeBot, Google-Extended, ora-agent, DeepSeekBot). A site that blocks these UAs is invisible to those agents from step one.

**Recommendation (catalog, verbatim):** Allowlist the major AI crawler/agent User-Agents (ChatGPT-User, ClaudeBot, Google-Extended, ora-agent, DeepSeekBot) in your WAF, bot-detection rules, and robots.txt so agents can reach your homepage.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/vercel.com, sse/example.org): "Reachable to all major AI crawlers - ChatGPT-User: reachable, ClaudeBot: reachable, Google-Extended: reachable, ora-agent: reachable, DeepSeekBot: reachable"
- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Allowlist the major AI crawler/agent User-Agents (ChatGPT-User, ClaudeBot, Google-Extended, ora-agent, DeepSeekBot) in your WAF, bot-detection rules, and robots.txt so agents can reach your homepage."
- [observed 1×] *Details* (score-api/meta.ai, v1-report/meta.ai): "No major AI crawler can reach the homepage - ChatGPT-User: blocked, ClaudeBot: blocked, Google-Extended: blocked, ora-agent: blocked, DeepSeekBot: blocked"
- [observed 1×] *Recommendation* (v1-report/meta.ai): "Verify that major agent User-Agents can reach the homepage. If your WAF or bot rules block them, remove or narrow the blocking rule. Add an allow rule only when your security setup denies them by default."

---

## `agent-discovery-file` — Agent discovery file
*Layer: Access · essentialsTier: **emerging** · native tier: required · maxScore: **2** · essentials-bonus-only*

**Description (catalog, verbatim):** A dedicated endpoint that tells arriving agents what you are and where to start, like a front desk for automated visitors.

**Recommendation (catalog, verbatim):** Publish an Agent Skills index at /.well-known/agent-skills/index.json that lists your capabilities, with each skill carrying a name and a description so agents can find and parse what you offer.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Publish an Agent Skills index at /.well-known/agent-skills/index.json that lists your capabilities, with each skill carrying a name and a description so agents can find and parse what you offer."
- **[static]** *Details* (score-api/eve.dev, score-api/vercel.com): "Agent discovery file found at /agents.md"
- [observed 1×] *Details* (score-api/example.org, sse/example.org): "No agent discovery file found"
- [observed 1×] *Details* (score-api/meta.ai): "Found legacy /.well-known/agent-skills; /.well-known/agent-skills/index.json exists but is not valid JSON - fix the file or remove it so agents fall back to /.well-known/agent-skills, /agents.md, or /skills.sh"

---

## `agent-instruction` — Agent instruction / when-to-use
*Layer: Access · essentialsTier: **recommended** · native tier: required · maxScore: **3***

**Description (catalog, verbatim):** Explicit guidance on when to use your product, written where agents will read it. An agent choosing between ten tools picks the one that says what it is for.

**Recommendation (catalog, verbatim):** Tell agents when to reach for you: add a 'when to use this' section to your llms.txt (or a dedicated agent-instructions file) that names your best-fit use cases and how an agent should call you. Be specific about the jobs you are right for - generic marketing copy does not read as guidance.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com, v1-report/eve.dev, v1-report/example.org, v1-report/meta.ai, v1-report/vercel.com): "Tell agents when to reach for you: add a 'when to use this' section to your llms.txt (or a dedicated agent-instructions file) that names your best-fit use cases and how an agent should call you. Be specific about the jobs you are right for - generic marketing copy does not read as guidance."
- **[static]** *Details* (score-api/eve.dev, score-api/example.org, sse/example.org, v1-report/eve.dev, v1-report/example.org): "No agent instruction file with when-to-use guidance found"
- [observed 1×] *Details* (score-api/vercel.com, v1-report/vercel.com): "Agent instruction file at /agent.txt but no explicit when-to-use guidance"
- [observed 1×] *Details* (score-api/meta.ai, v1-report/meta.ai): "Agent instruction file at /.well-known/agent-skills/ but no explicit when-to-use guidance"

---

## `agent-mode-view` — Agent mode view
*Layer: Access · essentialsTier: **emerging** · native tier: emerging · maxScore: **2** · bonus, essentials-bonus-only*

**Description (catalog, verbatim):** A stripped-down, structured view of your site at ?mode=agent, built for machine readers: plain content and direct endpoint links.

**Recommendation (catalog, verbatim):** Add a ?mode=agent query parameter to your homepage that returns a structured, machine-readable view with API endpoints, authentication info, and key capabilities instead of marketing HTML.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/vercel.com, sse/example.org): "?mode=agent returns same content as homepage (no dedicated agent view)"
- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Add a ?mode=agent query parameter to your homepage that returns a structured, machine-readable view with API endpoints, authentication info, and key capabilities instead of marketing HTML."
- [observed 1×] *Details* (score-api/meta.ai): "No agent mode view detected at ?mode=agent (optional)"

---

## `agent-skills-index-v2` — Agent Skills index conformance (v0.2.0)
*Layer: Access · essentialsTier: **emerging** · native tier: emerging · maxScore: **2** · bonus, essentials-bonus-only*

**Description (catalog, verbatim):** Your published agent skills follow the current discovery spec, so tools can verify and install them safely. We check /.well-known/agent-skills/index.json for the v0.2.0 schema, typed entries, and artifact digests.

**Recommendation (catalog, verbatim):** Upgrade /.well-known/agent-skills/index.json to the v0.2.0 schema: add "$schema": "https://schemas.agentskills.io/discovery/0.2.0/schema.json", and give every entry a type (skill-md or archive), url, and digest. Use "digest": "sha256:<64 lowercase hex chars>" (e.g. "digest": "sha256:a3f1...") - a bare "sha256": "<hex>" field is also accepted. Compute the value from the artifact's raw bytes.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/vercel.com, sse/example.org): "No /.well-known/agent-skills/index.json - skip v0.2.0 conformance"
- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Upgrade /.well-known/agent-skills/index.json to the v0.2.0 schema: add "$schema": "https://schemas.agentskills.io/discovery/0.2.0/schema.json", and give every entry a type (skill-md or archive), url, and digest. Use "digest": "sha256:<64 lowercase hex chars>" (e.g. "digest": "sha256:a3f1...") - a bare "sha256": "<hex>" field is also accepted. Compute the value from the artifact's raw bytes."
- [observed 1×] *Details* (score-api/meta.ai): "/.well-known/agent-skills/index.json is not valid JSON"

---

## `agent-ua-markdown` — Bot-UA markdown serving
*Layer: Access · essentialsTier: **emerging** · native tier: emerging · maxScore: **1** · bonus, essentials-bonus-only*

**Description (catalog, verbatim):** You recognize AI bots by their user-agent and serve them markdown even when they ask for HTML. Proactive courtesy for machine readers.

**Recommendation (catalog, verbatim):** Optionally detect AI-bot User-Agents (GPTBot, ClaudeBot, PerplexityBot) server-side and serve them a markdown representation of the page directly, even when they send Accept: text/html. Verify with `curl -A "ClaudeBot/1.0" https://yourdomain.com/` - a markdown body earns this bonus. Accept-header negotiation is scored separately.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Details* (score-api/example.org, score-api/meta.ai, score-api/vercel.com, sse/example.org): "No probed bot User-Agent (GPTBot, ClaudeBot, ChatGPT-User, PerplexityBot, Google-Extended, Applebot-Extended, ora-agent, DeepSeekBot) receives markdown when requesting HTML. Optional: detect AI-bot UAs server-side and serve them a markdown representation directly."
- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Optionally detect AI-bot User-Agents (GPTBot, ClaudeBot, PerplexityBot) server-side and serve them a markdown representation of the page directly, even when they send Accept: text/html. Verify with `curl -A "ClaudeBot/1.0" https://yourdomain.com/` - a markdown body earns this bonus. Accept-header negotiation is scored separately."
- [observed 1×] *Details* (score-api/eve.dev): "https://eve.dev serves markdown to the GPTBot User-Agent even with Accept: text/html - UA-sniffed agent responses in place"

---

## `api-catalog-rfc9727` — API catalog (RFC 9727)
*Layer: Access · essentialsTier: **recommended** · native tier: required · maxScore: **2** · bonus*

**Description (catalog, verbatim):** A machine-readable list of all your APIs at /.well-known/api-catalog (RFC 9727), so agents see your full surface in one request.

**Recommendation (catalog, verbatim):** Publish an API catalog at /.well-known/api-catalog per RFC 9727. Serve it with Content-Type: application/linkset+json;profile="https://www.rfc-editor.org/info/rfc9727" and include a 'linkset' array with item entries pointing to your OpenAPI specs and service descriptions.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Publish an API catalog at /.well-known/api-catalog per RFC 9727. Serve it with Content-Type: application/linkset+json;profile="https://www.rfc-editor.org/info/rfc9727" and include a 'linkset' array with item entries pointing to your OpenAPI specs and service descriptions."
- **[static]** *Details* (score-api/eve.dev, score-api/example.org, sse/example.org): "No /.well-known/api-catalog found (RFC 9727)"
- [observed 1×] *Details* (score-api/vercel.com): "api-catalog linkset[0] has no 'item' entries"
- [observed 1×] *Details* (score-api/meta.ai): "api-catalog responded but body is not valid JSON"

---

## `bot-detection` — Not blocked by bot detection
*Layer: Access · essentialsTier: **required** · native tier: required · maxScore: **2***

**Description (catalog, verbatim):** Your bot protection may be turning away the visitors you want. We check whether AI agents can reach your site without being blocked.

**Recommendation (catalog, verbatim):** Allowlist known AI agent User-Agents (ChatGPT-User, ClaudeBot, Google-Extended, DeepSeekBot) in your WAF or bot-detection rules.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com, v1-report/meta.ai): "Allowlist known AI agent User-Agents (ChatGPT-User, ClaudeBot, Google-Extended, DeepSeekBot) in your WAF or bot-detection rules."
- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/vercel.com, sse/example.org): "Site accessible to 6 AI agent user-agents"
- [observed 1×] *Details* (score-api/meta.ai, v1-report/meta.ai): "Some agents blocked: GPTBot, ClaudeBot, ChatGPT-User, PerplexityBot, Google-Extended"

---

## `code-fence-validity` — Code fence validity
*Layer: Access · essentialsTier: **recommended** · native tier: emerging · maxScore: **1***
*Spec: https://spec.commonmark.org/0.31.2/#fenced-code-blocks*

**Description (catalog, verbatim):** Fenced code blocks in served markdown are balanced - an unclosed fence swallows the rest of the document when an agent parses it

**Recommendation (catalog, verbatim):** Close every fenced code block (``` or ~~~) in your served markdown. CommonMark treats everything after an unclosed fence as code, so an agent parsing the document silently loses the rest of it. Count fence lines per file - the total must be even.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Close every fenced code block (``` or ~~~) in your served markdown. CommonMark treats everything after an unclosed fence as code, so an agent parsing the document silently loses the rest of it. Count fence lines per file - the total must be even."
- **[static]** *Details* (score-api/example.org, score-api/meta.ai, sse/example.org): "No served markdown to evaluate"
- **[static]** *Details* (score-api/eve.dev, score-api/vercel.com): "Code fences balanced across 1 markdown document"

---

## `content-no-js` — Content without JavaScript
*Layer: Access · essentialsTier: **required** · native tier: required · maxScore: **3***

**Description (catalog, verbatim):** Most AI crawlers never run JavaScript. If your pages need it to show content, agents see a blank site. We fetch your pages with JavaScript off and check the content is still there.

**Recommendation (catalog, verbatim):** Server-side render your homepage so AI crawlers see meaningful content without JavaScript. Ensure an H1 and 500+ chars of text in raw HTML.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com, v1-report/eve.dev, v1-report/example.org, v1-report/meta.ai, v1-report/vercel.com): "Server-side render your homepage so AI crawlers see meaningful content without JavaScript. Ensure an H1 and 500+ chars of text in raw HTML."
- [observed 1×] *Details* (score-api/example.org, sse/example.org, v1-report/example.org): "Very little text content (139 chars) - likely JS-rendered, invisible to AI crawlers"
- [observed 1×] *Details* (score-api/vercel.com, v1-report/vercel.com): "Only 976 chars of text content, no H1 tag - agents see limited content"
- [observed 1×] *Details* (score-api/eve.dev, v1-report/eve.dev): "6074 chars with H1 but flat heading structure"
- [observed 1×] *Details* (score-api/meta.ai, v1-report/meta.ai): "Could not fetch homepage"

---

## `developer-portal` — Developer portal
*Layer: Access · essentialsTier: **recommended** · native tier: recommended · maxScore: **6***

**Description (catalog, verbatim):** A place to sign up, get keys, and manage an integration without emailing anyone. Self-serve is the difference between integrating today and never.

**Recommendation (catalog, verbatim):** Create a developer portal at /developers with API keys, documentation, quickstart guides, and a sandbox environment.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com, v1-report/meta.ai): "Create a developer portal at /developers with API keys, documentation, quickstart guides, and a sandbox environment."
- **[static]** *Details* (score-api/example.org, score-api/meta.ai, sse/example.org, v1-report/meta.ai): "No developer portal found"
- **[static]** *Details* (score-api/eve.dev, score-api/vercel.com): "Developer portal found at /docs"

---

## `docs-auth-gate` — Content behind auth
*Layer: Access · essentialsTier: **required** · native tier: recommended · maxScore: **2***

**Description (catalog, verbatim):** Sampled content pages are publicly readable - pages behind a login wall are invisible to agents

**Recommendation (catalog, verbatim):** Serve your content pages without a login wall. Agents cannot complete auth flows while browsing - a 401/403 or a login-form page is invisible content. Keep public documentation public; if some content must stay gated, publish an ungated summary so agents can still represent it.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Serve your content pages without a login wall. Agents cannot complete auth flows while browsing - a 401/403 or a login-form page is invisible content. Keep public documentation public; if some content must stay gated, publish an ungated summary so agents can still represent it."
- **[static]** *Details* (score-api/example.org, score-api/meta.ai, sse/example.org): "No content pages sampled"
- **[static]** *Details* (score-api/eve.dev, score-api/vercel.com): "All 5 sampled pages are publicly readable (5 with substantive content)"

---

## `json-ld` — JSON-LD structured data
*Layer: Access · essentialsTier: **recommended** · native tier: required · maxScore: **4***

**Description (catalog, verbatim):** Structured data that states in machine terms what you are: a product, a company, a person. Without it, every AI describing you is guessing from prose. We grade the completeness of your homepage JSON-LD.

**Recommendation (catalog, verbatim):** Add JSON-LD structured data to your homepage using the identity type that matches your site - SoftwareApplication for products, Organization or LocalBusiness for companies, Person for personal sites, Article for blogs - with name, description, url, and type-appropriate fields (offers, sameAs, author) so AI can parse your identity programmatically.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com, v1-report/eve.dev, v1-report/example.org, v1-report/meta.ai): "Add JSON-LD structured data to your homepage using the identity type that matches your site - SoftwareApplication for products, Organization or LocalBusiness for companies, Person for personal sites, Article for blogs - with name, description, url, and type-appropriate fields (offers, sameAs, author) so AI can parse your identity programmatically."
- **[static]** *Details* (score-api/example.org, sse/example.org, v1-report/eve.dev, v1-report/example.org): "No JSON-LD structured data found on homepage"
- [observed 1×] *Details* (score-api/meta.ai, v1-report/meta.ai): "Could not fetch homepage"
- [observed 1×] *Details* (score-api/vercel.com): "Rich JSON-LD identity: Organization with name, description, url, and sameAs/logo/address (3 block(s))"
- [observed 1×] *Details* (score-api/eve.dev): "Rich JSON-LD identity: SoftwareApplication with name, description, url, and category/offers (1 block(s))"

---

## `json-ld-entity-linking` — JSON-LD entity linking (sameAs)
*Layer: Access · essentialsTier: **recommended** · native tier: recommended · maxScore: **2** · essentials-bonus-only*

**Description (catalog, verbatim):** sameAs links from your structured data to your official profiles (GitHub, LinkedIn, app stores). They let AIs confirm that every mention of you is actually you.

**Recommendation (catalog, verbatim):** Add sameAs links in your JSON-LD structured data pointing to your Wikipedia page, Wikidata entry, GitHub org, and social profiles. This helps AI disambiguate your brand from similarly named entities.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Add sameAs links in your JSON-LD structured data pointing to your Wikipedia page, Wikidata entry, GitHub org, and social profiles. This helps AI disambiguate your brand from similarly named entities."
- [observed 1×] *Details* (score-api/example.org, sse/example.org): "No JSON-LD found  - no entity linking possible"
- [observed 1×] *Details* (score-api/vercel.com): "Strong entity linking via sameAs: linkedin.com, github.com, wikipedia.org, wikidata.org"
- [observed 1×] *Details* (score-api/eve.dev): "No sameAs entity linking in JSON-LD  - agents cannot disambiguate your brand"
- [observed 1×] *Details* (score-api/meta.ai): "Could not fetch homepage"

---

## `link-headers-discovery` — HTTP Link headers (RFC 8288)
*Layer: Access · essentialsTier: **recommended** · native tier: required · maxScore: **1** · bonus, essentials-bonus-only*

**Description (catalog, verbatim):** HTTP Link headers that point agents at your sitemap and service docs before they parse a single page, making every automated visit faster.

**Recommendation (catalog, verbatim):** Add HTTP Link: response headers (RFC 8288) advertising your sitemap, markdown alternates, API service descriptions, and API catalog. Example: Link: </sitemap.xml>; rel="sitemap", </index.md>; rel="alternate"; type="text/markdown".

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Add HTTP Link: response headers (RFC 8288) advertising your sitemap, markdown alternates, API service descriptions, and API catalog. Example: Link: </sitemap.xml>; rel="sitemap", </index.md>; rel="alternate"; type="text/markdown"."
- **[static]** *Details* (score-api/example.org, score-api/meta.ai, sse/example.org): "No HTTP Link response headers (RFC 8288) found"
- [observed 1×] *Details* (score-api/vercel.com): "RFC 8288 Link header advertises: api-catalog"
- [observed 1×] *Details* (score-api/eve.dev): "Link header present but no agent-relevant rel values (sitemap, describedby, alternate, service-desc)"

---

## `llms-txt-exists` — llms.txt exists
*Layer: Access · essentialsTier: **emerging** · native tier: required · maxScore: **1** · essentials-bonus-only*

**Description (catalog, verbatim):** llms.txt is your site's guide for AI readers: what you do and where the important pages are. We check for /llms.txt or /.well-known/llms.txt.

**Recommendation (catalog, verbatim):** Create an llms.txt file at your domain root (/llms.txt) - the AI equivalent of robots.txt. Write at least 100 characters of real content: what your product is, what it does, and links to your key docs. Then verify it with `curl https://yourdomain.com/llms.txt` - you should see your text, not HTML. If your app returns its homepage for every URL (common with single-page apps), add a static file route so the raw text is served. A placeholder with just a heading earns no credit.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Create an llms.txt file at your domain root (/llms.txt) - the AI equivalent of robots.txt. Write at least 100 characters of real content: what your product is, what it does, and links to your key docs. Then verify it with `curl https://yourdomain.com/llms.txt` - you should see your text, not HTML. If your app returns its homepage for every URL (common with single-page apps), add a static file route so the raw text is served. A placeholder with just a heading earns no credit."
- [observed 1×] *Details* (score-api/example.org, sse/example.org): "No llms.txt found at /llms.txt or /.well-known/llms.txt."
- [observed 1×] *Details* (score-api/vercel.com): "Found the llms.txt at https://vercel.com/llms.txt."
- [observed 1×] *Details* (score-api/eve.dev): "Found the llms.txt at https://eve.dev/llms.txt."
- [observed 1×] *Details* (score-api/meta.ai): "A file is present at https://meta.ai/.well-known/llms.txt, but it returns an HTML page rather than a plain-text llms.txt."

---

## `llms-txt-formatting` — llms.txt formatting
*Layer: Access · essentialsTier: **emerging** · native tier: recommended · maxScore: **2** · essentials-bonus-only*

**Description (catalog, verbatim):** An llms.txt only helps if agents can parse it. We check the format: a heading up top, markdown links, and enough substance to navigate by.

**Recommendation (catalog, verbatim):** Format your llms.txt as a navigation index: start with a markdown heading, include markdown links to deeper resources, and keep it under 30,000 characters. If you have more to say, move long-form content into /llms-full.txt or per-section files (e.g. /docs/llms.txt, /api/llms.txt) and link to them from the main index.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Format your llms.txt as a navigation index: start with a markdown heading, include markdown links to deeper resources, and keep it under 30,000 characters. If you have more to say, move long-form content into /llms-full.txt or per-section files (e.g. /docs/llms.txt, /api/llms.txt) and link to them from the main index."
- **[static]** *Details* (score-api/example.org, score-api/meta.ai, sse/example.org): "No llms.txt found to evaluate quality"
- [observed 1×] *Details* (score-api/vercel.com): "The llms.txt is well-formatted: 19 lines with markdown links, 1,660 characters in total."
- [observed 1×] *Details* (score-api/eve.dev): "The llms.txt is well-formatted: 67 lines with markdown links, 7,740 characters in total."

---

## `llms-txt-links-resolve` — llms.txt links resolve
*Layer: Access · essentialsTier: **emerging** · native tier: recommended · maxScore: **2** · essentials-bonus-only*
*Spec: https://llmstxt.org*

**Description (catalog, verbatim):** The markdown links an llms.txt declares actually resolve - broken links strand agents that follow the index

**Recommendation (catalog, verbatim):** Make every link your llms.txt declares resolve to real content. Verify each one with `curl -L <url>` - you should see the linked document, not your homepage. If your app returns the homepage shell for unknown paths (common with single-page apps), a 200 status is not proof: check the body. Fix or remove any dead link; agents that follow the index treat a broken link as a dead end.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Make every link your llms.txt declares resolve to real content. Verify each one with `curl -L <url>` - you should see the linked document, not your homepage. If your app returns the homepage shell for unknown paths (common with single-page apps), a 200 status is not proof: check the body. Fix or remove any dead link; agents that follow the index treat a broken link as a dead end."
- **[static]** *Details* (score-api/example.org, score-api/meta.ai, sse/example.org): "No llms.txt found - nothing to verify (llms-txt-exists covers the gap)"
- [observed 1×] *Details* (score-api/vercel.com): "1 of 5 probed llms.txt links do not resolve: https://vercel.com/docs/llms-full.txt"
- [observed 1×] *Details* (score-api/eve.dev): "All 5 probed llms.txt links resolve to real content"

---

## `markdown-frontmatter` — Markdown frontmatter metadata
*Layer: Access · essentialsTier: **emerging** · native tier: emerging · maxScore: **1** · essentials-bonus-only*

**Description (catalog, verbatim):** Served markdown docs open with a frontmatter block (title plus description / canonical / last-updated) so agents get document metadata without scraping

**Recommendation (catalog, verbatim):** Open your served markdown docs with a --- frontmatter block carrying title plus at least one of description, canonical, or last-updated. Agents read frontmatter as document metadata without scraping. A Link: rel="canonical" response header also satisfies the canonical slot.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Open your served markdown docs with a --- frontmatter block carrying title plus at least one of description, canonical, or last-updated. Agents read frontmatter as document metadata without scraping. A Link: rel="canonical" response header also satisfies the canonical slot."
- **[static]** *Details* (score-api/example.org, score-api/meta.ai, sse/example.org): "No served markdown found (no root .md docs, no Accept: text/markdown negotiation) - nothing to carry frontmatter"
- **[static]** *Details* (score-api/eve.dev, score-api/vercel.com): "None of the 1 served markdown doc opens with a --- frontmatter block. Add title, description, canonical, and last-updated so agents get metadata without scraping."

---

## `markdown-link-alternate` — Markdown alternate link
*Layer: Access · essentialsTier: **emerging** · native tier: emerging · maxScore: **1** · bonus, essentials-bonus-only*
*Spec: https://www.rfc-editor.org/rfc/rfc8288*

**Description (catalog, verbatim):** Pages advertise their markdown twin via a rel=alternate link or HTTP Link header, and the advertised target really serves markdown.

**Recommendation (catalog, verbatim):** Advertise a markdown twin of each page with <link rel="alternate" type="text/markdown" href="..."> in the HTML head (or an equivalent Link response header), and make sure the advertised URL actually serves markdown - an advertisement pointing at HTML is worse than none. Verify the target with `curl -s <href>` and check the body starts with a heading, not <!doctype html>.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Advertise a markdown twin of each page with <link rel="alternate" type="text/markdown" href="..."> in the HTML head (or an equivalent Link response header), and make sure the advertised URL actually serves markdown - an advertisement pointing at HTML is worse than none. Verify the target with `curl -s <href>` and check the body starts with a heading, not <!doctype html>."
- **[static]** *Details* (score-api/example.org, score-api/vercel.com, sse/example.org): "No sampled page advertises a markdown alternate. Add <link rel="alternate" type="text/markdown" href="..."> (or the equivalent Link response header) pointing at a markdown twin of the page."
- [observed 1×] *Details* (score-api/eve.dev): "Markdown alternate advertised and verified: https://eve.dev/docs/agent-config.md serves markdown"
- [observed 1×] *Details* (score-api/meta.ai): "No pages fetched to inspect for alternate links"

---

## `markdown-negotiation` — Markdown agent docs
*Layer: Access · essentialsTier: **emerging** · native tier: emerging · maxScore: **1** · essentials-bonus-only*

**Description (catalog, verbatim):** Agents prefer markdown: the same content at a fraction of the noise. We check whether your docs are available as markdown, via content negotiation or .md routes.

**Recommendation (catalog, verbatim):** Pick one: (a) return Content-Type: text/markdown on GET <homepage> when the request sends Accept: text/markdown, or (b) publish a static /llms.md, /auth.md, or /agents.md file at your root with real markdown content. Option (b) is usually a single static file. This is the cold-discovery path for agents that land at your homepage from web search without reading llms.txt first.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Pick one: (a) return Content-Type: text/markdown on GET <homepage> when the request sends Accept: text/markdown, or (b) publish a static /llms.md, /auth.md, or /agents.md file at your root with real markdown content. Option (b) is usually a single static file. This is the cold-discovery path for agents that land at your homepage from web search without reading llms.txt first."
- **[static]** *Details* (score-api/example.org, score-api/meta.ai, sse/example.org): "Missing markdown content negotiation. Homepage returned text/html when probed with Accept: text/markdown (expected text/markdown), and none of the well-known root paths (/llms.md, /auth.md, /agents.md, /developers.md, /api.md, /index.md, /skill.md, /agent.md, /developer.md) returned markdown. Cold-arrival agents that land on the homepage from web search cannot get a markdown representation - serve text/markdown on the homepage via Accept negotiation, or publish a static /llms.md at the root."
- [observed 1×] *Details* (score-api/vercel.com): "Returns markdown when requested via Accept header"
- [observed 1×] *Details* (score-api/eve.dev): "Path-suffix markdown docs served with text/markdown content-type: /agents.md"

---

## `markdown-negotiation-vary` — Markdown content negotiation (acceptmarkdown.com)
*Layer: Access · essentialsTier: **required** · native tier: recommended · maxScore: **1** · bonus*

**Description (catalog, verbatim):** Markdown negotiation done to spec: the canonical URL serves markdown on request, with the Vary header set so CDNs cache both versions correctly.

**Recommendation (catalog, verbatim):** On the responses that serve text/markdown via Accept negotiation, add Accept to the Vary header (Vary: Accept, Accept-Encoding). Without it, CDNs can serve the cached HTML variant to an agent asking for markdown (or vice versa), depending on which variant landed in cache first.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com, v1-report/eve.dev, v1-report/example.org, v1-report/meta.ai): "On the responses that serve text/markdown via Accept negotiation, add Accept to the Vary header (Vary: Accept, Accept-Encoding). Without it, CDNs can serve the cached HTML variant to an agent asking for markdown (or vice versa), depending on which variant landed in cache first."
- **[static]** *Details* (score-api/meta.ai, v1-report/eve.dev, v1-report/meta.ai): "Not acceptmarkdown.com compliant: Accept: text/markdown returned text/html; charset=utf-8; Vary header missing Accept (got "rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch")"
- [observed 1×] *Details* (score-api/example.org, sse/example.org, v1-report/example.org): "Not acceptmarkdown.com compliant: Accept: text/markdown returned text/html; Vary header missing Accept (got "none")"
- **[static]** *Details* (score-api/eve.dev, score-api/vercel.com): "Canonical URL serves text/markdown and text/html via Accept negotiation with Vary: Accept"

---

## `markdown-url-fallback` — Markdown URL fallback
*Layer: Access · essentialsTier: **emerging** · native tier: emerging · maxScore: **2** · bonus, essentials-bonus-only*

**Description (catalog, verbatim):** Append .md to a page URL and get the markdown version: the cleanest possible read for an agent. Homepage /index.md is the baseline; .md twins on content pages earn full credit.

**Recommendation (catalog, verbatim):** Let agents fetch markdown by appending .md to page URLs. Required for any credit: serve a markdown homepage at /index.md. For full credit (2/2): also serve a .md twin for each content page (e.g. /docs/auth -> /docs/auth.md). Content-Type should be text/markdown and the body should start with a top-level heading (not HTML).

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Let agents fetch markdown by appending .md to page URLs. Required for any credit: serve a markdown homepage at /index.md. For full credit (2/2): also serve a .md twin for each content page (e.g. /docs/auth -> /docs/auth.md). Content-Type should be text/markdown and the body should start with a top-level heading (not HTML)."
- [observed 1×] *Details* (score-api/example.org, sse/example.org): "Homepage does not support the .md suffix. Probed https://example.org/index.md and it did not return markdown (expected text/markdown content-type or a heading-led non-HTML body). Serve /index.md so agents can fetch one canonical markdown URL for the site root."
- [observed 1×] *Details* (score-api/vercel.com): "Homepage does not support the .md suffix. Probed https://vercel.com/index.md and it did not return markdown (expected text/markdown content-type or a heading-led non-HTML body). Serve /index.md so agents can fetch one canonical markdown URL for the site root."
- [observed 1×] *Details* (score-api/eve.dev): "Homepage does not support the .md suffix. Probed https://eve.dev/index.md and it did not return markdown (expected text/markdown content-type or a heading-led non-HTML body). Serve /index.md so agents can fetch one canonical markdown URL for the site root."
- [observed 1×] *Details* (score-api/meta.ai): "Homepage does not support the .md suffix. Probed https://meta.ai/index.md and it did not return markdown (expected text/markdown content-type or a heading-led non-HTML body). Serve /index.md so agents can fetch one canonical markdown URL for the site root."

---

## `mcp-well-known-discovery` — MCP well-known discovery
*Layer: Access · essentialsTier: **emerging** · native tier: recommended · maxScore: **2** · bonus, essentials-bonus-only*

**Description (catalog, verbatim):** Publishing an MCP server is not enough; agents have to find it. We check the standard places: well-known paths, server-card.json, and your llms.txt.

**Recommendation (catalog, verbatim):** Serve your MCP server at /.well-known/mcp, publish a server-card.json at /.well-known/mcp/server-card.json, or reference it in llms.txt so agents can discover it automatically without manual URL input.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Serve your MCP server at /.well-known/mcp, publish a server-card.json at /.well-known/mcp/server-card.json, or reference it in llms.txt so agents can discover it automatically without manual URL input."
- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, sse/example.org): "No MCP server URL discovered"
- [observed 1×] *Details* (score-api/vercel.com): "MCP server at https://mcp.vercel.com - consider adding /.well-known/mcp for standard discovery"

---

## `metadata-completeness` — Metadata completeness
*Layer: Access · essentialsTier: **recommended** · native tier: required · maxScore: **2***

**Description (catalog, verbatim):** The basics AIs use to identify a page: canonical URL, language, and Open Graph image and type. Missing pieces mean mangled citations and wrong previews.

**Recommendation (catalog, verbatim):** Add all four signals to your homepage: <link rel="canonical">, <html lang="...">, <meta property="og:image">, and <meta property="og:type">. Agents use these for entity resolution and attribution.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com, v1-report/eve.dev, v1-report/example.org, v1-report/meta.ai): "Add all four signals to your homepage: <link rel="canonical">, <html lang="...">, <meta property="og:image">, and <meta property="og:type">. Agents use these for entity resolution and attribution."
- [observed 1×] *Details* (score-api/example.org, sse/example.org, v1-report/example.org): "Only 1/4 metadata signals present - missing: canonical URL, og:image, og:type"
- **[static]** *Details* (score-api/eve.dev, score-api/vercel.com): "All metadata signals present: canonical URL, lang="en", og:image, og:type"
- [observed 1×] *Details* (score-api/meta.ai, v1-report/meta.ai): "Could not fetch homepage"
- [observed 1×] *Details* (v1-report/eve.dev): "3/4 metadata signals present - missing: og:type"

---

## `modular-llms-txt` — Modular llms.txt per product area
*Layer: Access · essentialsTier: **emerging** · native tier: emerging · maxScore: **1** · bonus, essentials-bonus-only*

**Description (catalog, verbatim):** Per-section llms.txt files (like /docs/llms.txt) so an agent working in one area gets a focused index instead of your whole site.

**Recommendation (catalog, verbatim):** Add per-section llms.txt files (e.g. /docs/llms.txt, /api/llms.txt, /developers/llms.txt) so agents can fetch scoped context for specific product areas instead of the whole manual.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Add per-section llms.txt files (e.g. /docs/llms.txt, /api/llms.txt, /developers/llms.txt) so agents can fetch scoped context for specific product areas instead of the whole manual."
- **[static]** *Details* (score-api/example.org, score-api/meta.ai, sse/example.org): "No section-level llms.txt files found (optional)"
- [observed 1×] *Details* (score-api/vercel.com): "Only 1 section-level llms.txt found (docs) - add at least one more (/docs/llms.txt, /api/llms.txt) to earn bonus credit"
- [observed 1×] *Details* (score-api/eve.dev): "Modular llms.txt files found for sections: docs, api, developers, guides, reference, integrations, templates"

---

## `nlweb-schema-feeds` — NLWeb Schema Feeds
*Layer: Access · essentialsTier: **emerging** · native tier: emerging · maxScore: **1** · essentials-bonus-only*

**Description (catalog, verbatim):** A schemamap directive in robots.txt pointing at structured data feeds (NLWeb). It hands agents your catalog as data instead of making them scrape pages.

**Recommendation (catalog, verbatim):** Add a schemamap: directive to robots.txt pointing to a Schema Map XML file listing your structured data feeds (JSONL/RSS). See the NLWeb Schema Feeds spec.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Add a schemamap: directive to robots.txt pointing to a Schema Map XML file listing your structured data feeds (JSONL/RSS). See the NLWeb Schema Feeds spec."
- **[static]** *Details* (score-api/eve.dev, score-api/meta.ai, score-api/vercel.com): "No schemamap: directive in robots.txt"
- [observed 1×] *Details* (score-api/example.org, sse/example.org): "No robots.txt found - cannot check for Schema Feeds"

---

## `openapi-spec` — OpenAPI spec published
*Layer: Access · essentialsTier: **required** · native tier: required · maxScore: **7***

**Description (catalog, verbatim):** An OpenAPI spec is your API in a form machines can read. Agents use it to integrate without a human studying the docs, so it is one of the highest-leverage files you can publish.

**Recommendation (catalog, verbatim):** Publish an OpenAPI (Swagger) specification at /openapi.json or /api/openapi.yaml. This is how agents understand your API surface automatically.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com, v1-report/eve.dev, v1-report/meta.ai): "Publish an OpenAPI (Swagger) specification at /openapi.json or /api/openapi.yaml. This is how agents understand your API surface automatically."
- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, sse/example.org, v1-report/eve.dev, v1-report/meta.ai): "No OpenAPI/Swagger specification found"
- [observed 1×] *Details* (score-api/vercel.com): "OpenAPI spec found at https://vercel.com/openapi.json (version: 3.0.3)"

---

## `org-schema-completeness` — Organization schema completeness
*Layer: Access · essentialsTier: **recommended** · native tier: recommended · maxScore: **2***

**Description (catalog, verbatim):** Company details (contact, address) in your structured data. AIs use them to verify you are a real business before recommending you.

**Recommendation (catalog, verbatim):** Add Organization JSON-LD that includes both contactPoint (with email/phone and contactType) and address (PostalAddress). This lets AI verify your business legitimacy and answer contact queries.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com, v1-report/eve.dev, v1-report/example.org, v1-report/meta.ai, v1-report/vercel.com): "Add Organization JSON-LD that includes both contactPoint (with email/phone and contactType) and address (PostalAddress). This lets AI verify your business legitimacy and answer contact queries."
- **[static]** *Details* (score-api/example.org, sse/example.org, v1-report/eve.dev, v1-report/example.org): "No JSON-LD found - Organization schema missing"
- [observed 1×] *Details* (score-api/vercel.com, v1-report/vercel.com): "Organization schema found but missing: address"
- [observed 1×] *Details* (score-api/meta.ai, v1-report/meta.ai): "Could not fetch homepage"
- [observed 1×] *Details* (score-api/eve.dev): "No Organization type found in JSON-LD"

---

## `page-token-budget` — Page token budget
*Layer: Access · essentialsTier: **recommended** · native tier: recommended · maxScore: **1***

**Description (catalog, verbatim):** Individual pages keep extracted text within an agent-readable budget (~25K tokens) so they fit a context window without truncation

**Recommendation (catalog, verbatim):** Keep each page's extracted text under ~100K characters (~25K tokens) so it fits an agent's context window without truncation. Split oversized reference pages into focused per-topic documents and link them from an index. Check a page with `curl -s <url> | wc -c` and remember agents read the extracted text, not the raw HTML.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Keep each page's extracted text under ~100K characters (~25K tokens) so it fits an agent's context window without truncation. Split oversized reference pages into focused per-topic documents and link them from an index. Check a page with `curl -s <url> | wc -c` and remember agents read the extracted text, not the raw HTML."
- [observed 1×] *Details* (score-api/example.org, sse/example.org): "All 1 measured page fit an agent context budget (largest ~1K tokens)"
- [observed 1×] *Details* (score-api/vercel.com): "All 6 measured pages fit an agent context budget (largest ~3K tokens)"
- [observed 1×] *Details* (score-api/eve.dev): "All 7 measured pages fit an agent context budget (largest ~3K tokens)"
- [observed 1×] *Details* (score-api/meta.ai): "Nothing sampled to measure"

---

## `pricing-info` — Pricing info accessible
*Layer: Access · essentialsTier: **recommended** · native tier: required · maxScore: **3***

**Description (catalog, verbatim):** If an agent cannot find your prices, it cannot recommend you for a purchase. We check that pricing is discoverable and readable on your site.

**Recommendation (catalog, verbatim):** Make pricing discoverable - add a /pricing page or include pricing as schema.org/Offer structured data, so agents can find it without scraping a marketing page.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Make pricing discoverable - add a /pricing page or include pricing as schema.org/Offer structured data, so agents can find it without scraping a marketing page."
- [observed 1×] *Details* (score-api/example.org, sse/example.org): "No pricing page or pricing data found"
- [observed 1×] *Details* (score-api/vercel.com): "Pricing page found at /pricing"
- [observed 1×] *Details* (score-api/eve.dev): "Pricing link found but no dedicated pricing page at standard path"
- [observed 1×] *Details* (score-api/meta.ai): "Pricing page found at /pricing.html"

---

## `pricing-md` — pricing.md exists
*Layer: Access · essentialsTier: **emerging** · native tier: emerging · maxScore: **2** · essentials-bonus-only*

**Description (catalog, verbatim):** An agent comparing options needs your prices in a form it can read. We check for a machine-readable pricing file at /pricing.md.

**Recommendation (catalog, verbatim):** Create a /pricing.md file with your pricing tiers, features, and limits in plain markdown. This lets AI agents compare costs and recommend plans without scraping HTML pricing pages.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Create a /pricing.md file with your pricing tiers, features, and limits in plain markdown. This lets AI agents compare costs and recommend plans without scraping HTML pricing pages."
- **[static]** *Details* (score-api/eve.dev, score-api/example.org, sse/example.org): "No pricing.md found - agents need machine-readable pricing to compare products and make purchase recommendations"
- [observed 1×] *Details* (score-api/vercel.com): "pricing.md found at /pricing.md but thin (65 lines) - add plan tiers, prices, and feature breakdowns"
- [observed 1×] *Details* (score-api/meta.ai): "pricing.md found at /.well-known/pricing.md but thin (14 lines) - add plan tiers, prices, and feature breakdowns"

---

## `public-api-docs` — Public API/docs linked from homepage
*Layer: Access · essentialsTier: **recommended** · native tier: required · maxScore: **3***

**Description (catalog, verbatim):** Your API docs, linked straight from your homepage. If an agent has to search for your documentation, most will not. Only docs you own count.

**Recommendation (catalog, verbatim):** Publish API documentation at a discoverable URL (/docs, /api, /developers). Include authentication, endpoints, and example requests.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com, v1-report/meta.ai): "Publish API documentation at a discoverable URL (/docs, /api, /developers). Include authentication, endpoints, and example requests."
- **[static]** *Details* (score-api/example.org, score-api/meta.ai, sse/example.org, v1-report/meta.ai): "No public API or documentation page linked from homepage"
- [observed 1×] *Details* (score-api/vercel.com): "Documentation site found at https://vercel.com"
- [observed 1×] *Details* (score-api/eve.dev): "Documentation site found at https://eve.dev"

---

## `redirect-hygiene` — Redirect hygiene
*Layer: Access · essentialsTier: **required** · native tier: recommended · maxScore: **1***
*Spec: https://www.rfc-editor.org/rfc/rfc9110#name-redirection-3xx*

**Description (catalog, verbatim):** Pages reach real content without meta-refresh stubs, JavaScript-only redirects, or cross-domain hops that strand non-JS agents

**Recommendation (catalog, verbatim):** Replace meta-refresh and JavaScript-only redirects with real HTTP 301/302 redirects. Non-JS agents never execute `location.href` or wait for a meta refresh - they see only the stub page. Verify with `curl -sI <url>` - you should see a Location header, not a 200 with a near-empty body.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Replace meta-refresh and JavaScript-only redirects with real HTTP 301/302 redirects. Non-JS agents never execute `location.href` or wait for a meta refresh - they see only the stub page. Verify with `curl -sI <url>` - you should see a Location header, not a 200 with a near-empty body."
- **[static]** *Details* (score-api/eve.dev, score-api/vercel.com): "No meta-refresh stubs, JavaScript-redirect stubs, or cross-domain hops across 6 checked pages"
- [observed 1×] *Details* (score-api/example.org, sse/example.org): "No meta-refresh stubs, JavaScript-redirect stubs, or cross-domain hops across 1 checked page"
- [observed 1×] *Details* (score-api/meta.ai): "Nothing fetched to evaluate redirect hygiene"

---

## `robots-agent-user-policy` — robots.txt agent-user policy
*Layer: Access · essentialsTier: **recommended** · native tier: required · maxScore: **2** · essentials-excluded*

**Description (catalog, verbatim):** Whether robots.txt lets user-triggered agents (ChatGPT-User, Claude-User, Perplexity-User) read the site. These fetch live when a person asks a question, so a block turns a high-intent visit away. Silence passes - robots.txt allows by default.

**Recommendation (catalog, verbatim):** Stop blocking user-triggered agents in robots.txt. Remove any 'Disallow: /' that applies to ChatGPT-User, Claude-User or Perplexity-User - including a blanket 'User-agent: * / Disallow: /', which covers them by default. These agents fetch a page only because a person just asked about you, so a block turns away your highest-intent traffic.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Stop blocking user-triggered agents in robots.txt. Remove any 'Disallow: /' that applies to ChatGPT-User, Claude-User or Perplexity-User - including a blanket 'User-agent: * / Disallow: /', which covers them by default. These agents fetch a page only because a person just asked about you, so a block turns away your highest-intent traffic."
- **[static]** *Details* (score-api/eve.dev, score-api/vercel.com): "No robots.txt restriction on user-triggered agents - they can read the site"
- [observed 1×] *Details* (score-api/example.org, sse/example.org): "No robots.txt - nothing restricts user-triggered agents (RFC 9309 treats an absent file as allow-all)"
- [observed 1×] *Details* (score-api/meta.ai): "All user-triggered agents are blocked - a blanket `User-agent: * / Disallow: /` covers them. A person asking an assistant about you cannot have the answer sourced from your site."

---

## `schema-type-breadth` — Schema type breadth
*Layer: Access · essentialsTier: **recommended** · native tier: recommended · maxScore: **2** · essentials-bonus-only*

**Description (catalog, verbatim):** The more schema.org types you publish (FAQs, products, articles, events), the more kinds of questions an AI can answer about you with confidence.

**Recommendation (catalog, verbatim):** Expand your JSON-LD beyond Organization/WebSite. Add FAQPage for common questions, Service or Product for offerings, AggregateRating or Review for social proof, and BreadcrumbList for navigation context.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Expand your JSON-LD beyond Organization/WebSite. Add FAQPage for common questions, Service or Product for offerings, AggregateRating or Review for social proof, and BreadcrumbList for navigation context."
- **[static]** *Details* (score-api/eve.dev, score-api/example.org, sse/example.org): "No extended schema types found - AI can only answer basic questions about this entity"
- [observed 1×] *Details* (score-api/vercel.com): "Some extended schema types found: Service - add FAQPage, Service, or AggregateRating for full coverage"
- [observed 1×] *Details* (score-api/meta.ai): "Could not fetch homepage"

---

## `sitemap` — Sitemap exists
*Layer: Access · essentialsTier: **recommended** · native tier: required · maxScore: **2***

**Description (catalog, verbatim):** A map of every page you want found. Agents use your XML sitemap to discover content without crawling blind, so gaps here mean pages that never get read.

**Recommendation (catalog, verbatim):** Add a valid XML sitemap at /sitemap.xml listing all indexable URLs. Include lastmod dates and keep it under 50MB.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com, v1-report/example.org, v1-report/meta.ai): "Add a valid XML sitemap at /sitemap.xml listing all indexable URLs. Include lastmod dates and keep it under 50MB."
- **[static]** *Details* (score-api/example.org, score-api/meta.ai, sse/example.org, v1-report/example.org, v1-report/meta.ai): "No sitemap found"
- [observed 1×] *Details* (score-api/vercel.com): "Valid sitemap found at https://vercel.com/sitemap.xml with 6366 entries"
- [observed 1×] *Details* (score-api/eve.dev): "Valid sitemap found at https://eve.dev/sitemap.xml with 181 entries"

---

## `sitemap-lastmod` — Sitemap freshness (lastmod)
*Layer: Access · essentialsTier: **recommended** · native tier: recommended · maxScore: **1** · bonus, essentials-bonus-only*
*Spec: https://www.sitemaps.org/protocol.html*

**Description (catalog, verbatim):** Dates in your sitemap tell agents what changed and when, so they reread fresh pages instead of guessing. We check lastmod dates parse and the newest is recent.

**Recommendation (catalog, verbatim):** Add <lastmod> dates (W3C datetime, e.g. 2026-08-01) to your sitemap entries and update them when content actually changes. Aim for lastmod on at least half your entries with the newest within the last year. Verify with `curl https://yourdomain.com/sitemap.xml | grep lastmod`.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Add <lastmod> dates (W3C datetime, e.g. 2026-08-01) to your sitemap entries and update them when content actually changes. Aim for lastmod on at least half your entries with the newest within the last year. Verify with `curl https://yourdomain.com/sitemap.xml | grep lastmod`."
- **[static]** *Details* (score-api/example.org, score-api/meta.ai, sse/example.org): "No parsed sitemap entries to evaluate (the sitemap check covers existence)"
- [observed 1×] *Details* (score-api/vercel.com): "100% of 500 sampled sitemap entries carry lastmod; newest is 0 day(s) old"
- [observed 1×] *Details* (score-api/eve.dev): "None of the 181 sampled sitemap entries carries a lastmod date. Add <lastmod> (W3C datetime) so agents can prioritize fresh content."

---

## `skills-sh-quality` — Skills.sh skill quality
*Layer: Access · essentialsTier: **emerging** · native tier: emerging · maxScore: **2** · essentials-bonus-only*

**Description (catalog, verbatim):** Not just listed on skills.sh, but worth installing: multiple skills, descriptive names, and real adoption.

**Recommendation (catalog, verbatim):** Expand your skills.sh presence with multiple skill repos covering different use cases. Add descriptive skill names, clear SKILL.md files, and organize by capability area.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/vercel.com, sse/example.org): "No official skills on skills.sh to evaluate"
- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Expand your skills.sh presence with multiple skill repos covering different use cases. Add descriptive skill names, clear SKILL.md files, and organize by capability area."
- [observed 1×] *Details* (score-api/meta.ai): "Skills.sh presence exists but limited - 4 skills (goal: 5+)"

---

## `trust-anchors` — Trust anchor pages
*Layer: Access · essentialsTier: **recommended** · native tier: required · maxScore: **2***

**Description (catalog, verbatim):** About, contact, and privacy pages with real content. Agents check these to verify you are legitimate before recommending you, the way a careful person would.

**Recommendation (catalog, verbatim):** Publish real /about, /contact, and /privacy pages with at least 500 characters of content each. These are the pages AI agents check to verify your business is legitimate before recommending you.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com, v1-report/eve.dev, v1-report/example.org, v1-report/meta.ai): "Publish real /about, /contact, and /privacy pages with at least 500 characters of content each. These are the pages AI agents check to verify your business is legitimate before recommending you."
- **[static]** *Details* (score-api/example.org, score-api/meta.ai, sse/example.org, v1-report/example.org, v1-report/meta.ai): "No trust anchor pages found with sufficient content (About, Contact, Privacy)"
- [observed 1×] *Details* (score-api/eve.dev, v1-report/eve.dev): "About, Privacy pages verified - missing: Contact"
- [observed 1×] *Details* (score-api/vercel.com): "All trust anchor pages verified: About, Contact, Privacy"

---

# Layer: Usability (62 checks)

## `a2ui-support` — A2UI / generative UI support
*Layer: Usability · essentialsTier: **emerging** · native tier: emerging · maxScore: **2** · essentials-bonus-only*

**Description (catalog, verbatim):** Your product can render UI inside an agent conversation, via MCP Apps, the OpenAI Apps SDK, or generative UI patterns. Where users see you when they never visit your site.

**Recommendation (catalog, verbatim):** Support Agent-to-UI rendering via MCP Apps (ui:// resources), OpenAI Apps SDK, or generative UI patterns that let agents render interactive UIs in conversation.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Details* (score-api/example.org, score-api/meta.ai, score-api/vercel.com, sse/example.org): "No in-agent UI surface - generative / agent-to-UI rendering does not apply to a backend data / API service."
- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Support Agent-to-UI rendering via MCP Apps (ui:// resources), OpenAI Apps SDK, or generative UI patterns that let agents render interactive UIs in conversation."
- [observed 1×] *Details* (score-api/eve.dev): "No A2UI or generative UI support detected"

---

## `agent-auth-discovery-metadata` — Agent auth discovery metadata
*Layer: Usability · essentialsTier: **emerging** · native tier: recommended · maxScore: **3** · bonus, essentials-bonus-only*
*Spec: https://workos.com/auth-md/docs/apps*

**Description (catalog, verbatim):** The machine-readable half of agent auth: discovery documents (RFC 9728 and 8414) with an agent_auth block that round-trips to your auth.md, so agents can look up the exact request shape for each supported identity type.

**Recommendation (catalog, verbatim):** Publish RFC 9728 protected-resource metadata at /.well-known/oauth-protected-resource on your resource server (the host that actually serves the API, e.g. api.<apex>) with `resource` and `authorization_servers`. Publish RFC 8414 authorization-server metadata at /.well-known/oauth-authorization-server on the AS origin, and include the WorkOS auth.md `agent_auth` block with `register_uri`, `identity_types_supported` drawn from the spec enum (`anonymous`, `identity_assertion` - variants like `verified_email` or `urn:ietf:params:oauth:token-type:id-jag` belong inside `identity_assertion.assertion_types_supported`, not at the top level), and a sibling per-type block for each advertised type (`anonymous.credential_types_supported`; `identity_assertion.assertion_types_supported` + `credential_types_supported`) so agents can look up the request shape. Cross-link by listing the AS origin in PRM `authorization_servers`, and point `agent_auth.skill` back at your published /auth.md. Spec: https://workos.com/auth-md.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Publish RFC 9728 protected-resource metadata at /.well-known/oauth-protected-resource on your resource server (the host that actually serves the API, e.g. api.<apex>) with `resource` and `authorization_servers`. Publish RFC 8414 authorization-server metadata at /.well-known/oauth-authorization-server on the AS origin, and include the WorkOS auth.md `agent_auth` block with `register_uri`, `identity_types_supported` drawn from the spec enum (`anonymous`, `identity_assertion` - variants like `verified_email` or `urn:ietf:params:oauth:token-type:id-jag` belong inside `identity_assertion.assertion_types_supported`, not at the top level), and a sibling per-type block for each advertised type (`anonymous.credential_types_supported`; `identity_assertion.assertion_types_supported` + `credential_types_supported`) so agents can look up the request shape. Cross-link by listing the AS origin in PRM `authorization_servers`, and point `agent_auth.skill` back at your published /auth.md. Spec: https://workos.com/auth-md."
- [observed 1×] *Details* (score-api/example.org, sse/example.org): "Neither /.well-known/oauth-protected-resource nor /.well-known/oauth-authorization-server found. Probed: example.org, api.example.org."
- [observed 1×] *Details* (score-api/vercel.com): "Only AS metadata present; spec calls for both PRM and AS metadata"
- [observed 1×] *Details* (score-api/eve.dev): "Neither /.well-known/oauth-protected-resource nor /.well-known/oauth-authorization-server found. Probed: eve.dev, api.eve.dev."
- [observed 1×] *Details* (score-api/meta.ai): "Neither /.well-known/oauth-protected-resource nor /.well-known/oauth-authorization-server found. Probed: meta.ai, api.meta.ai."

---

## `agent-auth-endpoints-reachable` — agent_auth endpoints reachable
*Layer: Usability · essentialsTier: **emerging** · native tier: recommended · maxScore: **2** · bonus, essentials-bonus-only*
*Spec: https://workos.com/auth-md/docs/apps*

**Description (catalog, verbatim):** The registration, claim, and revocation endpoints your auth docs advertise actually respond. Stale discovery data is worse than none: it sends agents to doors that no longer exist.

**Recommendation (catalog, verbatim):** Make sure the URIs you advertise (in the AS metadata agent_auth block OR in your /auth.md prose) for register_uri, claim_uri, and revocation_uri actually resolve. An OPTIONS preflight should return any HTTP status (2xx/3xx/4xx that isn't 404). DNS-level failure or a 404 means the discovery block / prose is stale - either remove the URI or stand up the endpoint.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com, sse/example.org): "No agent_auth endpoint URIs found in AS metadata or /auth.md prose; nothing to probe"
- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Make sure the URIs you advertise (in the AS metadata agent_auth block OR in your /auth.md prose) for register_uri, claim_uri, and revocation_uri actually resolve. An OPTIONS preflight should return any HTTP status (2xx/3xx/4xx that isn't 404). DNS-level failure or a 404 means the discovery block / prose is stale - either remove the URI or stand up the endpoint."

---

## `agent-auth-www-authenticate` — Agent auth WWW-Authenticate hint
*Layer: Usability · essentialsTier: **recommended** · native tier: recommended · maxScore: **1** · bonus*
*Spec: https://workos.com/auth-md/docs/apps*

**Description (catalog, verbatim):** When an agent hits a 401 on your API, the response should point at the metadata explaining how to authenticate. One WWW-Authenticate header turns a dead end into a signpost.

**Recommendation (catalog, verbatim):** Return a 401 carrying a spec-shaped `WWW-Authenticate: Bearer resource_metadata="<your protected-resource metadata URL>"` header on your API's primary entry points, so an agent learns your auth requirements from one request instead of hunting for the well-known document. Point the metadata URL at /.well-known/oauth-protected-resource on the host that serves the API. Spec: https://workos.com/auth-md.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Return a 401 carrying a spec-shaped `WWW-Authenticate: Bearer resource_metadata="<your protected-resource metadata URL>"` header on your API's primary entry points, so an agent learns your auth requirements from one request instead of hunting for the well-known document. Point the metadata URL at /.well-known/oauth-protected-resource on the host that serves the API. Spec: https://workos.com/auth-md."
- [observed 1×] *Details* (score-api/example.org, sse/example.org): "No 401 with WWW-Authenticate: Bearer resource_metadata=... found. Probed [https://example.org/api, https://example.org/api/v1, https://example.org/v1, https://example.org/v2, https://example.org/agent/auth, https://api.example.org/api, https://api.example.org/api/v1, https://api.example.org/v1, https://api.example.org/v2, https://api.example.org/agent/auth]."
- [observed 1×] *Details* (score-api/vercel.com): "401 at https://mcp.vercel.com at / with spec-shaped WWW-Authenticate hint: Bearer error="invalid_token", error_description="No authorization provided", resource_metadata="https://mcp.vercel.com/."
- [observed 1×] *Details* (score-api/eve.dev): "No 401 with WWW-Authenticate: Bearer resource_metadata=... found. Probed [https://eve.dev/api, https://eve.dev/api/v1, https://eve.dev/v1, https://eve.dev/v2, https://eve.dev/agent/auth, https://api.eve.dev/api, https://api.eve.dev/api/v1, https://api.eve.dev/v1, https://api.eve.dev/v2, https://api.eve.dev/agent/auth]."
- [observed 1×] *Details* (score-api/meta.ai): "No 401 with WWW-Authenticate: Bearer resource_metadata=... found. Probed [https://meta.ai/api, https://meta.ai/api/v1, https://meta.ai/v1, https://meta.ai/v2, https://meta.ai/agent/auth, https://api.meta.ai/api, https://api.meta.ai/api/v1, https://api.meta.ai/v1, https://api.meta.ai/v2, https://api.meta.ai/agent/auth]."

---

## `agent-friendly-404` — Agent-friendly 404s
*Layer: Usability · essentialsTier: **required** · native tier: recommended · maxScore: **2***
*Spec: https://www.rfc-editor.org/rfc/rfc9110#name-404-not-found*

**Description (catalog, verbatim):** Missing pages should say 404. Answering every path with a 200 and an app shell tells agents pages exist when they do not, poisoning everything they learn about your site.

**Recommendation (catalog, verbatim):** Return a real HTTP 404 (or 410) status for nonexistent paths - never a 200 with your app shell, which makes agents believe every path exists. For full credit, give the 404 response a short markdown body pointing agents at your sitemap, llms.txt, or docs index. Verify with `curl -s -o /dev/null -w "%{http_code}" https://yourdomain.com/some-path-that-does-not-exist` - it must print 404.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com, v1-report/eve.dev, v1-report/example.org, v1-report/meta.ai, v1-report/vercel.com): "Return a real HTTP 404 (or 410) status for nonexistent paths - never a 200 with your app shell, which makes agents believe every path exists. For full credit, give the 404 response a short markdown body pointing agents at your sitemap, llms.txt, or docs index. Verify with `curl -s -o /dev/null -w "%{http_code}" https://yourdomain.com/some-path-that-does-not-exist` - it must print 404."
- **[static]** *Details* (score-api/eve.dev, score-api/example.org, sse/example.org, v1-report/eve.dev, v1-report/example.org): "Nonexistent paths return a real HTTP 404. For full credit, include a short markdown body (site map links, where to look next) so agents can recover."
- [observed 1×] *Details* (score-api/vercel.com, v1-report/vercel.com): "Nonexistent paths return HTTP 200 with the app shell (soft-404). Agents probing for resources conclude every path exists. Return a real HTTP 404 status for unknown paths."
- [observed 1×] *Details* (score-api/meta.ai, v1-report/meta.ai): "Nonexistent paths return HTTP 401 instead of 404/410 - agents get a non-200 signal but not the standard not-found semantics"

---

## `api-error-model` — REST typed error model
*Layer: Usability · essentialsTier: **recommended** · native tier: recommended · maxScore: **3***

**Description (catalog, verbatim):** A typed error schema in your OpenAPI spec, so agents know every failure shape in advance and can handle each one deliberately.

**Recommendation (catalog, verbatim):** Document your error responses in your OpenAPI spec: give 4xx and 5xx responses a typed error schema (or use RFC 9457 application/problem+json). A consistent error object with a machine-readable code and a human-readable message lets agents handle failures without guessing.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Details* (score-api/eve.dev, score-api/example.org, sse/example.org): "No REST API surface detected on this domain"
- **[static]** *Recommendation* (score-api/meta.ai, score-api/vercel.com): "Document your error responses in your OpenAPI spec: give 4xx and 5xx responses a typed error schema (or use RFC 9457 application/problem+json). A consistent error object with a machine-readable code and a human-readable message lets agents handle failures without guessing."
- [observed 1×] *Details* (score-api/vercel.com): "OpenAPI defines a typed error schema in components.schemas and 4xx/5xx responses reference it"
- [observed 1×] *Details* (score-api/meta.ai): "No API surface detected - typed error model check not applicable"

---

## `api-schema-analysis` — API schema complexity analysis
*Layer: Usability · essentialsTier: **recommended** · native tier: recommended · maxScore: **2***

**Description (catalog, verbatim):** Is your API simple enough for an agent to use without a human explaining it? Deeply nested, ambiguous schemas fail silently in agent hands.

**Recommendation (catalog, verbatim):** Make your API spec self-describing: a unique operationId and a description on every operation, typed parameters, and response schemas. For GraphQL, a fully typed schema with a documented cost or rate limit reads best.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com, v1-report/eve.dev, v1-report/meta.ai): "Make your API spec self-describing: a unique operationId and a description on every operation, typed parameters, and response schemas. For GraphQL, a fully typed schema with a documented cost or rate limit reads best."
- **[static]** *Details* (score-api/eve.dev, score-api/example.org, sse/example.org, v1-report/eve.dev): "No API schema detected"
- [observed 1×] *Details* (score-api/meta.ai, v1-report/meta.ai): "REST: OpenAPI spec found but failed to parse for complexity analysis"
- [observed 1×] *Details* (score-api/vercel.com): "REST: agent-friendly schema (396 operations, 100% with operationIds, 97% described)"

---

## `api-versioning-policy` — REST versioning / deprecation policy
*Layer: Usability · essentialsTier: **recommended** · native tier: recommended · maxScore: **3***

**Description (catalog, verbatim):** Agents integrate once and then run unattended. A versioning and deprecation policy is your promise about when things will break and how much warning they get.

**Recommendation (catalog, verbatim):** Declare a versioning policy agents can rely on: version your API (in the URL path or a version header) and publish how you signal deprecation (a Sunset/Deprecation header or a documented timeline). Agents avoid integrating against a surface that can change without warning.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Details* (score-api/eve.dev, score-api/example.org, sse/example.org): "No REST API surface detected on this domain"
- **[static]** *Recommendation* (score-api/meta.ai, score-api/vercel.com): "Declare a versioning policy agents can rely on: version your API (in the URL path or a version header) and publish how you signal deprecation (a Sunset/Deprecation header or a documented timeline). Agents avoid integrating against a surface that can change without warning."
- [observed 1×] *Details* (score-api/vercel.com): "API versioning strategy found (URL versioning) with sunset/deprecation markers documented"
- [observed 1×] *Details* (score-api/meta.ai): "No public API surface detected - versioning policy not applicable"

---

## `async-job-pattern` — REST async-job pattern
*Layer: Usability · essentialsTier: **recommended** · native tier: recommended · maxScore: **2** · essentials-bonus-only*

**Description (catalog, verbatim):** Long-running operations should return 202 Accepted with a way to poll for the result. Otherwise agents time out and retry work that was still running.

**Recommendation (catalog, verbatim):** For long-running operations, return 202 Accepted and point agents at where to poll for the result (a status/location reference plus a job identifier in the body), documented in your OpenAPI spec, so work that does not finish in one request is still followable.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Details* (score-api/eve.dev, score-api/example.org, sse/example.org): "No REST API surface detected on this domain"
- **[static]** *Recommendation* (score-api/meta.ai, score-api/vercel.com): "For long-running operations, return 202 Accepted and point agents at where to poll for the result (a status/location reference plus a job identifier in the body), documented in your OpenAPI spec, so work that does not finish in one request is still followable."
- [observed 1×] *Details* (score-api/vercel.com): "202 Accepted responses found but no clear polling pattern (Location header, /jobs path, or job_id schema)"
- [observed 1×] *Details* (score-api/meta.ai): "No API surface detected - async job pattern check not applicable"

---

## `auth-md-exists` — auth.md exists
*Layer: Usability · essentialsTier: **emerging** · native tier: required · maxScore: **2** · bonus, essentials-bonus-only*
*Spec: https://workos.com/auth-md/docs/auth-md*

**Description (catalog, verbatim):** auth.md is a walkthrough that teaches an agent how to get its own credentials, served at /auth.md. An emerging standard from WorkOS.

**Recommendation (catalog, verbatim):** Publish /auth.md as a markdown prose walkthrough of how agents should obtain credentials. Serve it with Content-Type: text/markdown, lead with a top-level heading, and write at least ~200 chars of real content (not just a placeholder). See the WorkOS auth.md draft at https://workos.com/auth-md.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Publish /auth.md as a markdown prose walkthrough of how agents should obtain credentials. Serve it with Content-Type: text/markdown, lead with a top-level heading, and write at least ~200 chars of real content (not just a placeholder). See the WorkOS auth.md draft at https://workos.com/auth-md."
- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, sse/example.org): "No /auth.md found at site root"
- [observed 1×] *Details* (score-api/vercel.com): "Path https://vercel.com/auth.md returned HTML (SPA / 404 fallback), not an auth.md document"

---

## `auth-md-structure` — auth.md structure
*Layer: Usability · essentialsTier: **emerging** · native tier: recommended · maxScore: **2** · bonus, essentials-bonus-only*
*Spec: https://workos.com/auth-md/docs/auth-md*

**Description (catalog, verbatim):** Your auth.md follows the standard walkthrough structure (discover, register, claim, use, errors, revocation), so any agent can follow it step by step. We grade the content of each section, not just the headings.

**Recommendation (catalog, verbatim):** Structure /auth.md as the WorkOS spec prescribes: sections for Discover, Pick a method, Register, Claim, Use the credential, Errors, and Revocation, with spec anchor keywords (agent_auth, register_uri, identity_assertion, id-jag, WWW-Authenticate). Reference https://workos.com/auth-md.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com, sse/example.org): "No /auth.md found at site root"
- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Structure /auth.md as the WorkOS spec prescribes: sections for Discover, Pick a method, Register, Claim, Use the credential, Errors, and Revocation, with spec anchor keywords (agent_auth, register_uri, identity_assertion, id-jag, WWW-Authenticate). Reference https://workos.com/auth-md."

---

## `auth-md-walkthrough-simulation` — auth.md walkthrough simulation
*Layer: Usability · essentialsTier: **emerging** · native tier: recommended · maxScore: **2** · bonus, essentials-bonus-only*
*Spec: https://workos.com/auth-md/docs/apps*

**Description (catalog, verbatim):** We do not take your auth.md's word for it: we simulate the walkthrough end to end (read-only) and verify an agent that only knows a user's email could actually get through it.

**Recommendation (catalog, verbatim):** Make your published auth-discovery chain traversable end to end: an agent starting at /auth.md (or your protected-resource metadata) should be able to follow the links to your authorization-server metadata and registration endpoint without hitting a dead link. Test the whole path, not just each file in isolation.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com, sse/example.org): "/auth.md not found at site root"
- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Make your published auth-discovery chain traversable end to end: an agent starting at /auth.md (or your protected-resource metadata) should be able to follow the links to your authorization-server metadata and registration endpoint without hitting a dead link. Test the whole path, not just each file in isolation."

---

## `ax-accessible-names` — Accessible names on controls
*Layer: Usability · essentialsTier: **required** · native tier: recommended · maxScore: **2** · bonus*

**Description (catalog, verbatim):** Every control needs a name a machine can compute (text, label, aria-label, alt). An unnamed icon button cannot be referenced, so it cannot be used.

**Recommendation (catalog):** _none provided_

**Observed outcome text (per-scan, verbatim):**

- [observed 1×] *Details* (score-api/example.org, sse/example.org): "1/1 interactive elements have a computable accessible name (100%)."
- [observed 1×] *Details* (score-api/vercel.com): "179/179 interactive elements have a computable accessible name (100%)."
- [observed 1×] *Details* (score-api/eve.dev): "142/159 interactive elements have a computable accessible name (89%)."
- [observed 1×] *Details* (score-api/meta.ai): "No server HTML available to assess the accessibility tree (homepage was unreachable or returned no usable HTML)."

---

## `ax-document-structure` — Accessible document structure
*Layer: Usability · essentialsTier: **required** · native tier: recommended · maxScore: **3** · bonus*

**Description (catalog, verbatim):** Agents navigate your page the way screen readers do: by landmarks and headings. We check your HTML is a real document, with a main region, nav, and a sane heading order.

**Recommendation (catalog):** _none provided_

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org): "Wrap primary content in <main>, add nav/header/footer landmarks, and use a single <h1> with no skipped heading levels so agents can navigate the document by landmark and heading."
- [observed 1×] *Details* (score-api/example.org, sse/example.org): "Document structure incomplete (main=false, landmarks=0/4, h1=1, maxHeadingSkip=0); below the bonus threshold."
- [observed 1×] *Details* (score-api/vercel.com): "Server HTML is a well-structured document (main=true, landmarks=4/4, h1=1, maxHeadingSkip=1)."
- [observed 1×] *Details* (score-api/eve.dev): "Document structure incomplete (main=false, landmarks=3/4, h1=1, maxHeadingSkip=1); below the bonus threshold."
- [observed 1×] *Details* (score-api/meta.ai): "No server HTML available to assess the accessibility tree (homepage was unreachable or returned no usable HTML)."

---

## `ax-form-labeling` — Form control labeling
*Layer: Usability · essentialsTier: **required** · native tier: recommended · maxScore: **2** · bonus*

**Description (catalog, verbatim):** Form fields with real labels, so agents know what each one expects. Placeholder text disappears on focus and never counts. N/A when a page has no forms.

**Recommendation (catalog):** _none provided_

**Observed outcome text (per-scan, verbatim):**

- [observed 1×] *Details* (score-api/example.org, sse/example.org): "No form controls present on the homepage; form labeling not applicable."
- [observed 1×] *Details* (score-api/vercel.com): "3/3 form controls have an associated label (100%)."
- [observed 1×] *Details* (score-api/eve.dev): "1 of 1 form controls lack an associated label (0% labeled); below the bonus threshold. Placeholders are not labels."
- [observed 1×] *Recommendation* (score-api/eve.dev): "Associate every input/select/textarea with a <label for> (or wrapping <label>, or aria-label), and expose required/invalid state via aria-required / aria-invalid."
- [observed 1×] *Details* (score-api/meta.ai): "No server HTML available to assess the accessibility tree (homepage was unreachable or returned no usable HTML)."

---

## `ax-native-controls` — Native interactive controls
*Layer: Usability · essentialsTier: **required** · native tier: recommended · maxScore: **3** · bonus*

**Description (catalog, verbatim):** Buttons should be buttons. Clickable divs are invisible to agents that target elements by role and name, so they cannot click what your users can.

**Recommendation (catalog):** _none provided_

**Observed outcome text (per-scan, verbatim):**

- [observed 1×] *Details* (score-api/example.org, sse/example.org): "1 native controls vs 0 div-soup affordances (100% native); below the bonus threshold."
- [observed 1×] *Details* (score-api/vercel.com): "179 native controls, 2 non-native div-soup affordances (99% native)."
- [observed 1×] *Details* (score-api/eve.dev): "159 native controls, 0 non-native div-soup affordances (100% native)."
- [observed 1×] *Details* (score-api/meta.ai): "No server HTML available to assess the accessibility tree (homepage was unreachable or returned no usable HTML)."
- [observed 1×] *Recommendation* (score-api/example.org): "Use <button>, <a href>, <input>, <select> instead of click-bound <div>/<span>. Div-soup has role 'generic' and is unreachable by an agent targeting role + accessible name."

---

## `ax-tree-injection-safe` — Accessibility-tree injection safety (bonus)
*Layer: Usability · essentialsTier: **recommended** · native tier: recommended · maxScore: **2** · bonus, essentials-bonus-only*

**Description (catalog, verbatim):** We scan for hidden instructions in aria-labels, alt text, and off-screen content that could hijack an agent reading your page (prompt injection). Upside only; never costs points.

**Recommendation (catalog):** _none provided_

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/vercel.com, sse/example.org): "No hidden instruction text detected in accessibility-tree attributes or off-screen content."
- [observed 1×] *Details* (score-api/meta.ai): "No server HTML available to assess the accessibility tree (homepage was unreachable or returned no usable HTML)."

---

## `batch-endpoints` — REST batch / bulk endpoint
*Layer: Usability · essentialsTier: **recommended** · native tier: recommended · maxScore: **2** · bonus, essentials-bonus-only*

**Description (catalog, verbatim):** Batch operations let an agent do a thousand things in one request instead of a thousand requests. We look for a /batch endpoint or array request bodies.

**Recommendation (catalog, verbatim):** Offer a batch endpoint that accepts an array of operations in one request, documented in your spec, so an agent acting on many items can do it in bulk instead of looping one call at a time.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Details* (score-api/eve.dev, score-api/example.org, sse/example.org): "No REST API surface detected on this domain"
- **[static]** *Recommendation* (score-api/meta.ai, score-api/vercel.com): "Offer a batch endpoint that accepts an array of operations in one request, documented in your spec, so an agent acting on many items can do it in bulk instead of looping one call at a time."
- [observed 1×] *Details* (score-api/vercel.com): "Batch operation found: POST/PUT endpoint accepts array request body in OpenAPI spec"
- [observed 1×] *Details* (score-api/meta.ai): "No batch or bulk endpoint pattern found"

---

## `cli-tool` — CLI tool available
*Layer: Usability · essentialsTier: **recommended** · native tier: recommended · maxScore: **3***

**Description (catalog, verbatim):** An official CLI. Coding agents live in the terminal, so a CLI makes your product directly operable by the fastest-growing class of agents.

**Recommendation (catalog, verbatim):** Publish an official CLI tool on npm, PyPI, or Homebrew. A CLI lets agents and developers script interactions with your product without building API integrations from scratch.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Publish an official CLI tool on npm, PyPI, or Homebrew. A CLI lets agents and developers script interactions with your product without building API integrations from scratch."
- [observed 1×] *Details* (score-api/example.org, sse/example.org): "No CLI tool found"
- [observed 1×] *Details* (score-api/vercel.com): "CLI tool found on PyPI: vercel-cli"
- [observed 1×] *Details* (score-api/eve.dev): "CLI tool found on PyPI: eve_cli"
- [observed 1×] *Details* (score-api/meta.ai): "CLI package found on npm: meta-cli"

---

## `function-calling-compat` — Function calling compatibility
*Layer: Usability · essentialsTier: **recommended** · native tier: recommended · maxScore: **2***

**Description (catalog, verbatim):** Whether your API spec translates cleanly into the function-calling format ChatGPT, Claude, and Gemini actually consume. Incompatible specs mean agents cannot call you even when they want to.

**Recommendation (catalog, verbatim):** Ensure API endpoints have unique operation IDs, typed schemas, and descriptions compatible with LLM function-calling formats.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com, v1-report/eve.dev, v1-report/meta.ai): "Ensure API endpoints have unique operation IDs, typed schemas, and descriptions compatible with LLM function-calling formats."
- **[static]** *Details* (score-api/eve.dev, score-api/example.org, sse/example.org, v1-report/eve.dev): "No API spec found - function calling requires discoverable endpoints"
- [observed 1×] *Details* (score-api/meta.ai, v1-report/meta.ai): "MCP manifest found but no OpenAPI spec for function calling"
- [observed 1×] *Details* (score-api/vercel.com): "Compatible: 396/396 ops with IDs, 396/396 with typed schemas"

---

## `graphql-async-job-pattern` — GraphQL async-job pattern
*Layer: Usability · essentialsTier: **recommended** · native tier: recommended · maxScore: **2***

**Description (catalog, verbatim):** Async job mutations with status types or progress subscriptions, so long-running work looks like progress instead of a hang.

**Recommendation (catalog, verbatim):** For long-running GraphQL work, model it as an async job: return a job/task type the agent can query for status, and consider a subscription for progress, so a mutation does not block on slow work.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com, sse/example.org): "No GraphQL API surface detected on this domain"

---

## `graphql-batch-mutations` — GraphQL batch mutations
*Layer: Usability · essentialsTier: **recommended** · native tier: recommended · maxScore: **2** · bonus*

**Description (catalog, verbatim):** Bulk mutation fields (createMany, updateMany) so agents can act at scale in one round trip instead of hundreds.

**Recommendation (catalog, verbatim):** Offer batch or bulk mutations (a mutation that accepts many inputs at once) so agents can apply changes to many records in a single round trip instead of one mutation per item.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com, sse/example.org): "No GraphQL API surface detected on this domain"

---

## `graphql-error-type-definition` — GraphQL typed error model
*Layer: Usability · essentialsTier: **recommended** · native tier: recommended · maxScore: **3***

**Description (catalog, verbatim):** Typed errors in your GraphQL schema (userErrors, error unions), so agents can tell 'bad input' from 'try again later' and react correctly.

**Recommendation (catalog, verbatim):** Model your GraphQL errors in the schema: define an error type and surface it through your mutation payloads (or a result union) instead of relying only on the top-level errors array, so agents can handle failures by type.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com, sse/example.org): "No GraphQL API surface detected on this domain"

---

## `graphql-pagination-pattern` — GraphQL pagination pattern
*Layer: Usability · essentialsTier: **recommended** · native tier: recommended · maxScore: **2***

**Description (catalog, verbatim):** Relay-style cursor pagination (Connection and PageInfo types), the pattern every GraphQL client and agent already knows how to walk.

**Recommendation (catalog, verbatim):** Paginate GraphQL lists with the standard Relay connection pattern (Connection and PageInfo types with cursors), a shape agents recognize and can traverse without custom handling.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com, sse/example.org): "No GraphQL API surface detected on this domain"

---

## `graphql-schema-completeness` — GraphQL schema description coverage
*Layer: Usability · essentialsTier: **recommended** · native tier: recommended · maxScore: **3** · bonus*

**Description (catalog, verbatim):** Descriptions on at least 80% of your GraphQL types and fields. A well-described schema documents itself to any agent that introspects it.

**Recommendation (catalog, verbatim):** Document your GraphQL schema thoroughly - descriptions on your types, fields, and arguments - so agents can decide how to call your API from the schema alone.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com, sse/example.org): "No GraphQL API surface detected on this domain"

---

## `graphql-versioning-policy` — GraphQL versioning / deprecation policy
*Layer: Usability · essentialsTier: **recommended** · native tier: recommended · maxScore: **2***

**Description (catalog, verbatim):** Deprecations declared in the schema (@deprecated) or a documented evolution policy, so agents learn about breaking changes before the break.

**Recommendation (catalog, verbatim):** Adopt a GraphQL evolution policy: mark retiring fields with @deprecated (with a reason) and document how you sunset schema elements. @deprecated is the standard signal agents read.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com, sse/example.org): "No GraphQL API surface detected on this domain"

---

## `idempotency-key-support` — Idempotency-Key support
*Layer: Usability · essentialsTier: **recommended** · native tier: recommended · maxScore: **3** · essentials-bonus-only*

**Description (catalog, verbatim):** Networks fail mid-request. Idempotency keys let an agent retry a payment or an order safely, without doubling it. We check that write endpoints accept the header.

**Recommendation (catalog, verbatim):** Support an idempotency key on your write operations and declare it where agents can read it: an Idempotency-Key header parameter on your POST/PUT/PATCH operations in your OpenAPI spec for REST, or a client-supplied id argument on your GraphQL mutations. Agents retry on network failures, and without this a retry can double-charge or duplicate a record.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Support an idempotency key on your write operations and declare it where agents can read it: an Idempotency-Key header parameter on your POST/PUT/PATCH operations in your OpenAPI spec for REST, or a client-supplied id argument on your GraphQL mutations. Agents retry on network failures, and without this a retry can double-charge or duplicate a record."
- **[static]** *Details* (score-api/eve.dev, score-api/example.org, sse/example.org): "No REST or GraphQL surface detected - idempotency check not applicable"
- **[static]** *Details* (score-api/meta.ai, score-api/vercel.com): "No REST Idempotency-Key support detected"

---

## `json-error-responses` — JSON error responses
*Layer: Usability · essentialsTier: **required** · native tier: required · maxScore: **4***

**Description (catalog, verbatim):** When something breaks, agents need a structured JSON error, not an HTML error page. One is recoverable, the other is a dead end.

**Recommendation (catalog, verbatim):** Return structured JSON error responses with error codes, messages, and resolution hints. Agents can't parse HTML error pages.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com, v1-report/eve.dev): "Return structured JSON error responses with error codes, messages, and resolution hints. Agents can't parse HTML error pages."
- **[static]** *Details* (score-api/eve.dev, score-api/example.org, sse/example.org, v1-report/eve.dev): "API does not return JSON error responses (or no API detected)"
- [observed 1×] *Details* (score-api/vercel.com): "API returns JSON error responses (404 at https://api.vercel.com (from OpenAPI servers))"
- [observed 1×] *Details* (score-api/meta.ai): "API returns JSON error responses (403 at https://api.meta.ai)"

---

## `mcp-app-registry` — MCP Apps support
*Layer: Usability · essentialsTier: **emerging** · native tier: recommended · maxScore: **4** · essentials-bonus-only*

**Description (catalog, verbatim):** MCP Apps let you ship real interactive UI inside ChatGPT and Claude, not just text answers. We check whether your server exposes any. N/A for pure API and data services.

**Recommendation (catalog, verbatim):** Add MCP Apps support to your MCP server using @modelcontextprotocol/ext-apps. Expose ui:// resources and add _meta.ui.resourceUri to tools so agents can render interactive UIs directly in conversation.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Add MCP Apps support to your MCP server using @modelcontextprotocol/ext-apps. Expose ui:// resources and add _meta.ui.resourceUri to tools so agents can render interactive UIs directly in conversation."
- **[static]** *Details* (score-api/example.org, score-api/meta.ai, sse/example.org): "No in-agent UI surface - MCP Apps render interactive UI inside an agent host (ChatGPT, Claude). A data / API service does not need one, so this is not applicable."
- [observed 1×] *Details* (score-api/vercel.com): "MCP server requires authentication - cannot introspect ui:// resources or tool UI metadata, and no MCP Apps mentions in public docs"
- [observed 1×] *Details* (score-api/eve.dev): "No MCP Apps support detected - this product has an in-agent UI surface but exposes no ui:// resources or tool UI metadata for agents to render."

---

## `mcp-apps-ui-quality` — MCP Apps UI quality
*Layer: Usability · essentialsTier: **emerging** · native tier: recommended · maxScore: **4** · bonus, essentials-bonus-only*

**Description (catalog, verbatim):** Your in-agent UI holds up to scrutiny: correct MIME type, valid HTML, dark mode support, and no hardcoded secrets in the markup.

**Recommendation (catalog, verbatim):** Ensure your MCP Apps resources use MIME type text/html;profile=mcp-app, include <!DOCTYPE html>, and add <meta name="color-scheme" content="light dark"> for dark mode. Never hardcode secrets in resource HTML.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com, sse/example.org): "No MCP Apps detected"
- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Ensure your MCP Apps resources use MIME type text/html;profile=mcp-app, include <!DOCTYPE html>, and add <meta name="color-scheme" content="light dark"> for dark mode. Never hardcode secrets in resource HTML."

---

## `mcp-auth-mechanism` — MCP auth mechanism
*Layer: Usability · essentialsTier: **required** · native tier: recommended · maxScore: **2** · bonus*

**Description (catalog, verbatim):** The right lock on the right door: docs servers should be public, product servers should require OAuth. We check your MCP auth matches what the server does.

**Recommendation (catalog, verbatim):** Protect your MCP server with OAuth 2.0 authentication. Publish authorization server metadata at /.well-known/oauth-authorization-server for automatic agent auth flows.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Protect your MCP server with OAuth 2.0 authentication. Publish authorization server metadata at /.well-known/oauth-authorization-server for automatic agent auth flows."
- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, sse/example.org): "No MCP server detected"
- [observed 1×] *Details* (score-api/vercel.com): "product MCP requires authentication with OAuth metadata discovery"

---

## `mcp-error-handling` — MCP error handling
*Layer: Usability · essentialsTier: **required** · native tier: recommended · maxScore: **2** · bonus*

**Description (catalog, verbatim):** When an agent sends your MCP server a bad request, the answer should be a structured error it can correct from, not a silent failure.

**Recommendation (catalog, verbatim):** Return structured JSON-RPC errors (with code and message) when agents call invalid tools or pass bad arguments. Don't crash or return empty responses.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Return structured JSON-RPC errors (with code and message) when agents call invalid tools or pass bad arguments. Don't crash or return empty responses."
- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, sse/example.org): "No MCP server detected"
- [observed 1×] *Details* (score-api/vercel.com): "product MCP requires authentication - cannot probe error handling (N/A)"

---

## `mcp-multi-surface-coverage` — Product + docs MCP coverage
*Layer: Usability · essentialsTier: **emerging** · native tier: recommended · maxScore: **2** · bonus, essentials-bonus-only*

**Description (catalog, verbatim):** Two MCP servers, cleanly split: one for taking actions in your product, one for answering questions from your docs. The mature pattern for brands that have both.

**Recommendation (catalog, verbatim):** Beyond your product MCP server, expose a documentation MCP surface so agents can pull your docs and reference material over the same protocol they use to act. Covering both the 'do' and the 'learn' surfaces over MCP earns this.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Beyond your product MCP server, expose a documentation MCP surface so agents can pull your docs and reference material over the same protocol they use to act. Covering both the 'do' and the 'learn' surfaces over MCP earns this."
- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, sse/example.org): "This bonus needs two MCP servers: one for your product so agents can take actions, and a separate one for your documentation so agents can answer questions from your docs."
- [observed 1×] *Details* (score-api/vercel.com): "You run an MCP server for your product, but not one for your documentation. This bonus needs two MCP servers: one for your product so agents can take actions, and a separate one for your documentation so agents can answer questions from your docs."

---

## `mcp-oauth-metadata` — MCP OAuth metadata
*Layer: Usability · essentialsTier: **required** · native tier: recommended · maxScore: **2** · bonus*

**Description (catalog, verbatim):** Standard OAuth metadata (RFC 8414) that lets agents discover your sign-in flow automatically, instead of a developer wiring it by hand.

**Recommendation (catalog, verbatim):** Publish RFC 8414 authorization server metadata with issuer, authorization_endpoint, and token_endpoint so agents can authenticate without hardcoded URLs.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Publish RFC 8414 authorization server metadata with issuer, authorization_endpoint, and token_endpoint so agents can authenticate without hardcoded URLs."
- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, sse/example.org): "No MCP server detected"
- [observed 1×] *Details* (score-api/vercel.com): "RFC 8414 OAuth metadata for product MCP: issuer=https://vercel.com, auth and token endpoints present"

---

## `mcp-param-schemas` — MCP parameter schemas
*Layer: Usability · essentialsTier: **recommended** · native tier: recommended · maxScore: **2** · bonus*

**Description (catalog, verbatim):** Typed parameter schemas on your MCP tools, so agents know what to send without trial and error. Product servers need required-field lists; docs servers need at least a query.

**Recommendation (catalog, verbatim):** Define inputSchema with typed properties and required arrays for each tool. Agents need schema info to construct valid tool calls without guessing.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Define inputSchema with typed properties and required arrays for each tool. Agents need schema info to construct valid tool calls without guessing."
- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, sse/example.org): "No MCP server detected"
- [observed 1×] *Details* (score-api/vercel.com): "product MCP requires authentication - cannot enumerate tools to evaluate parameter schemas (N/A)"

---

## `mcp-pkce-s256` — MCP PKCE S256 support
*Layer: Usability · essentialsTier: **required** · native tier: recommended · maxScore: **2** · bonus*

**Description (catalog, verbatim):** PKCE with S256, the OAuth hardening that stops intercepted codes from being replayed. Table stakes for agent auth done right.

**Recommendation (catalog, verbatim):** Support PKCE with S256 code challenge method in your OAuth server. Add 'S256' to code_challenge_methods_supported in your authorization server metadata.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Support PKCE with S256 code challenge method in your OAuth server. Add 'S256' to code_challenge_methods_supported in your authorization server metadata."
- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, sse/example.org): "No MCP server detected"
- [observed 1×] *Details* (score-api/vercel.com): "OAuth metadata for product MCP supports PKCE S256 code challenge"

---

## `mcp-resource-listing` — MCP resources exposed
*Layer: Usability · essentialsTier: **required** · native tier: recommended · maxScore: **3***

**Description (catalog, verbatim):** If your MCP server claims to offer resources, resources/list should return some. Advertising a capability and delivering nothing erodes agent trust.

**Recommendation (catalog, verbatim):** If your MCP server advertises the resources capability in its initialize handshake, make sure resources/list returns at least one resource. If you don't intend to expose resources, omit the capability - the check returns na with no penalty for tool-only servers. Quality of the resources you do return is scored separately by mcp-resource-quality.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "If your MCP server advertises the resources capability in its initialize handshake, make sure resources/list returns at least one resource. If you don't intend to expose resources, omit the capability - the check returns na with no penalty for tool-only servers. Quality of the resources you do return is scored separately by mcp-resource-quality."
- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, sse/example.org): "No MCP server detected"
- [observed 1×] *Details* (score-api/vercel.com): "MCP server requires authentication - cannot list resources (N/A)"

---

## `mcp-resource-quality` — MCP resource quality
*Layer: Usability · essentialsTier: **recommended** · native tier: recommended · maxScore: **3***

**Description (catalog, verbatim):** The MCP resources you declare should actually read: valid type, non-empty content. We grade the share that works.

**Recommendation (catalog, verbatim):** Ensure every resource returned by resources/list reads cleanly via resources/read: declare a valid mimeType, return non-empty content, and make sure any URIs in the content resolve. Broken or empty resources break agent UX silently.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Ensure every resource returned by resources/list reads cleanly via resources/read: declare a valid mimeType, return non-empty content, and make sure any URIs in the content resolve. Broken or empty resources break agent UX silently."
- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, sse/example.org): "No MCP server detected"
- [observed 1×] *Details* (score-api/vercel.com): "MCP server requires authentication - cannot evaluate resource quality (N/A)"

---

## `mcp-server` — MCP server / manifest
*Layer: Usability · essentialsTier: **recommended** · native tier: required · maxScore: **6***

**Description (catalog, verbatim):** MCP is how agents plug directly into your product, the way apps plug into an app store. We check for a Model Context Protocol server or manifest.

**Recommendation (catalog, verbatim):** Build an MCP (Model Context Protocol) server exposing your API as tools. Use Streamable HTTP transport for full score. This lets Claude, ChatGPT, and other AI agents call your product natively.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com, v1-report/eve.dev, v1-report/meta.ai, v1-report/vercel.com): "Build an MCP (Model Context Protocol) server exposing your API as tools. Use Streamable HTTP transport for full score. This lets Claude, ChatGPT, and other AI agents call your product natively."
- [observed 1×] *Details* (score-api/vercel.com, v1-report/vercel.com): "Live MCP server at https://mcp.vercel.com requires authentication (OAuth challenge at initialize) - properly scoped. Upgrade to public tool listing for full 6/6."
- [observed 1×] *Details* (score-api/eve.dev, v1-report/eve.dev): "MCP mentioned at https://eve.dev/agents.md but no standard manifest endpoint found"
- [observed 1×] *Details* (score-api/meta.ai, v1-report/meta.ai): "MCP endpoint found at /.well-known/mcp/manifest.json but response is not valid JSON"
- [observed 1×] *Details* (score-api/example.org, sse/example.org): "No MCP server or manifest found"

---

## `mcp-server-card` — MCP server-card.json
*Layer: Usability · essentialsTier: **emerging** · native tier: recommended · maxScore: **2** · bonus, essentials-bonus-only*

**Description (catalog, verbatim):** A server card at /.well-known/mcp/server-card.json that describes your MCP server (name, transport, tools) before an agent even connects.

**Recommendation (catalog, verbatim):** Publish a server card at /.well-known/mcp/server-card.json describing your MCP server. Required fields: name, description, version, serverUrl, tools[]. This lets agents preview your server before opening a transport connection.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/vercel.com, sse/example.org): "No MCP server card found at /.well-known/mcp/server-card.json"
- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Publish a server card at /.well-known/mcp/server-card.json describing your MCP server. Required fields: name, description, version, serverUrl, tools[]. This lets agents preview your server before opening a transport connection."
- [observed 1×] *Details* (score-api/meta.ai): "https://meta.ai/.well-known/mcp/server-card.json exists but body is not valid JSON"

---

## `mcp-server-identity` — MCP server identity
*Layer: Usability · essentialsTier: **required** · native tier: recommended · maxScore: **1** · bonus*

**Description (catalog, verbatim):** Your MCP server introduces itself in the handshake: name, version, and usage instructions. An anonymous server makes every agent guess what it connected to.

**Recommendation (catalog, verbatim):** Set server name, version, and instructions in your MCP server's initialize response. Instructions help agents understand your server's purpose and constraints.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Set server name, version, and instructions in your MCP server's initialize response. Instructions help agents understand your server's purpose and constraints."
- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, sse/example.org): "No MCP server detected"
- [observed 1×] *Details* (score-api/vercel.com): "product MCP requires authentication - cannot read server identity from handshake (N/A)"

---

## `mcp-tool-annotations` — MCP tool annotations
*Layer: Usability · essentialsTier: **recommended** · native tier: recommended · maxScore: **2** · bonus, essentials-bonus-only*

**Description (catalog, verbatim):** Labels that tell agents which tools are safe to call freely and which change or destroy things (readOnlyHint, destructiveHint). Essential when your MCP server can mutate real data.

**Recommendation (catalog, verbatim):** Add behavioral annotations (readOnlyHint, destructiveHint) to your MCP tools. Agents use these to avoid destructive actions without user confirmation.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Add behavioral annotations (readOnlyHint, destructiveHint) to your MCP tools. Agents use these to avoid destructive actions without user confirmation."
- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, sse/example.org): "No MCP server detected"
- [observed 1×] *Details* (score-api/vercel.com): "product MCP requires authentication - cannot enumerate tools to evaluate annotations (N/A)"

---

## `mcp-tool-descriptions` — MCP tool descriptions
*Layer: Usability · essentialsTier: **recommended** · native tier: recommended · maxScore: **3** · bonus*

**Description (catalog, verbatim):** An agent picks tools by reading their descriptions: vague ones get skipped, clear ones get called. We grade every tool on your MCP server, with different bars for product and docs servers.

**Recommendation (catalog, verbatim):** Add detailed descriptions (>= 20 chars) to every MCP tool. Agents use these to decide which tool to call - vague descriptions lead to wrong tool selection.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Add detailed descriptions (>= 20 chars) to every MCP tool. Agents use these to decide which tool to call - vague descriptions lead to wrong tool selection."
- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, sse/example.org): "No MCP server detected"
- [observed 1×] *Details* (score-api/vercel.com): "product MCP requires authentication - cannot enumerate tools to evaluate descriptions (N/A)"

---

## `mcp-tool-listing` — MCP tool listing
*Layer: Usability · essentialsTier: **recommended** · native tier: recommended · maxScore: **3** · bonus*

**Description (catalog, verbatim):** Your MCP server actually returns tools when asked. We call tools/list and grade the surface: product servers earn on breadth, docs servers on focus.

**Recommendation (catalog, verbatim):** Expose 3+ tools via your MCP server's tools/list endpoint. Cover your core API surface - agents need tools for read, write, and search operations.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Expose 3+ tools via your MCP server's tools/list endpoint. Cover your core API surface - agents need tools for read, write, and search operations."
- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, sse/example.org): "No MCP server detected"
- [observed 1×] *Details* (score-api/vercel.com): "product MCP requires authentication - cannot list tools (N/A)"

---

## `mcp-tool-naming` — MCP tool naming
*Layer: Usability · essentialsTier: **recommended** · native tier: recommended · maxScore: **2** · bonus*

**Description (catalog, verbatim):** Predictable tool names (create_invoice, search_docs) that agents parse at a glance. Inconsistent naming makes every call a small research project.

**Recommendation (catalog, verbatim):** Use consistent naming conventions (snake_case or camelCase) for all MCP tools. Names should be descriptive (>= 4 chars) and not generic (avoid 'run', 'get', 'do').

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Use consistent naming conventions (snake_case or camelCase) for all MCP tools. Names should be descriptive (>= 4 chars) and not generic (avoid 'run', 'get', 'do')."
- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, sse/example.org): "No MCP server detected"
- [observed 1×] *Details* (score-api/vercel.com): "product MCP requires authentication - cannot enumerate tools to evaluate naming (N/A)"

---

## `mcp-transport-modern` — MCP modern transport
*Layer: Usability · essentialsTier: **required** · native tier: recommended · maxScore: **1** · bonus*

**Description (catalog, verbatim):** Your MCP server speaks the current transport (Streamable HTTP), not just the legacy one. New agent clients increasingly expect it.

**Recommendation (catalog, verbatim):** Upgrade your MCP server from legacy SSE to Streamable HTTP transport. Streamable HTTP is the current standard and supports bidirectional communication.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Upgrade your MCP server from legacy SSE to Streamable HTTP transport. Streamable HTTP is the current standard and supports bidirectional communication."
- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, sse/example.org): "No MCP server detected"
- [observed 1×] *Details* (score-api/vercel.com): "product MCP requires authentication - cannot determine transport (N/A)"

---

## `mcp-view-csp` — MCP App view CSP
*Layer: Usability · essentialsTier: **required** · native tier: recommended · maxScore: **4***

**Description (catalog, verbatim):** Your view's Content-Security-Policy has to satisfy the ChatGPT and Claude sandboxes, or your UI silently fails to render there. We check the directives they require.

**Recommendation (catalog, verbatim):** Add a Content-Security-Policy (via HTTP header or <meta http-equiv>) that scopes 4 directive categories: connect-src includes your MCP server origin; frame-ancestors includes both https://chatgpt.com and https://claude.ai; form-action (or connect-src) scopes redirect targets; img-src / script-src / style-src list specific origins (not *). Permissive default-src * receives partial credit but loses points compared to a properly-scoped policy.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com, sse/example.org): "No MCP App detected"
- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Add a Content-Security-Policy (via HTTP header or <meta http-equiv>) that scopes 4 directive categories: connect-src includes your MCP server origin; frame-ancestors includes both https://chatgpt.com and https://claude.ai; form-action (or connect-src) scopes redirect targets; img-src / script-src / style-src list specific origins (not *). Permissive default-src * receives partial credit but loses points compared to a properly-scoped policy."

---

## `mcp-view-domain` — MCP App view reachable
*Layer: Usability · essentialsTier: **required** · native tier: recommended · maxScore: **4***

**Description (catalog, verbatim):** The view your MCP App points at loads publicly and serves HTML with no auth wall. A broken or gated view is worse than none: it fails in front of the user.

**Recommendation (catalog, verbatim):** Make sure your MCP App view is reachable and public. For inline ui:// resources: return HTML with <!DOCTYPE html> and no login form. For external HTTP origins (referenced via <base href> or <meta refresh>): return 200 OK + text/html without requiring auth (no 401/403, no password input in the body).

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com, sse/example.org): "No MCP App detected"
- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Make sure your MCP App view is reachable and public. For inline ui:// resources: return HTML with <!DOCTYPE html> and no login form. For external HTTP origins (referenced via <base href> or <meta refresh>): return 200 OK + text/html without requiring auth (no 401/403, no password input in the body)."

---

## `nlweb-ask` — NLWeb /ask endpoint
*Layer: Usability · essentialsTier: **emerging** · native tier: emerging · maxScore: **1** · essentials-bonus-only*

**Description (catalog, verbatim):** An /ask endpoint (Microsoft's NLWeb protocol) that answers natural-language questions about your site directly, no crawling needed.

**Recommendation (catalog, verbatim):** Implement Microsoft's NLWeb protocol by adding a POST /ask endpoint that accepts natural-language queries and returns JSON with _meta (response_type, version). See github.com/microsoft/NLWeb.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/vercel.com, sse/example.org): "No NLWeb-conformant /ask endpoint found via GET or POST"
- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Implement Microsoft's NLWeb protocol by adding a POST /ask endpoint that accepts natural-language queries and returns JSON with _meta (response_type, version). See github.com/microsoft/NLWeb."
- [observed 1×] *Details* (score-api/meta.ai): "NLWeb /ask endpoint exists but requires authentication (HTTP 401, via GET)"

---

## `nlweb-streaming` — NLWeb streaming support
*Layer: Usability · essentialsTier: **emerging** · native tier: emerging · maxScore: **1** · essentials-bonus-only*

**Description (catalog, verbatim):** Your /ask endpoint streams results as they are found, so agents can show progress instead of a spinner.

**Recommendation (catalog, verbatim):** Add SSE streaming to your NLWeb /ask endpoint. Accept prefer.streaming: true and respond with Content-Type: text/event-stream using NLWeb event types (start, result, complete).

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/vercel.com, sse/example.org): "NLWeb /ask does not support SSE streaming via GET or POST"
- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Add SSE streaming to your NLWeb /ask endpoint. Accept prefer.streaming: true and respond with Content-Type: text/event-stream using NLWeb event types (start, result, complete)."
- [observed 1×] *Details* (score-api/meta.ai): "NLWeb /ask requires authentication - cannot verify streaming"

---

## `oauth-protected-resource` — OAuth Protected Resource metadata (RFC 9728)
*Layer: Usability · essentialsTier: **required** · native tier: required · maxScore: **2** · bonus*

**Description (catalog, verbatim):** Metadata at /.well-known/oauth-protected-resource (RFC 9728) that tells agents your auth requirements up front, instead of leaving them to trial and error.

**Recommendation (catalog, verbatim):** Publish RFC 9728 protected-resource metadata at /.well-known/oauth-protected-resource. Include the resource field plus enough supporting metadata - your authorization servers, supported scopes, accepted bearer methods - that an agent can work out how to authenticate without first triggering a 401.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Publish RFC 9728 protected-resource metadata at /.well-known/oauth-protected-resource. Include the resource field plus enough supporting metadata - your authorization servers, supported scopes, accepted bearer methods - that an agent can work out how to authenticate without first triggering a 401."
- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, sse/example.org): "No /.well-known/oauth-protected-resource found (RFC 9728)"
- [observed 1×] *Details* (score-api/vercel.com): "RFC 9728 protected resource metadata found on MCP origin (resource=https://mcp.vercel.com/)"

---

## `oauth-support` — OAuth 2.0 support
*Layer: Usability · essentialsTier: **required** · native tier: required · maxScore: **5***

**Description (catalog, verbatim):** Agents need a standard way to sign in. We check for OAuth 2.0, or an explicitly open API that needs no keys at all.

**Recommendation (catalog, verbatim):** Implement OAuth 2.0 for API authentication. Publish your authorization server metadata at /.well-known/oauth-authorization-server.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com, v1-report/eve.dev): "Implement OAuth 2.0 for API authentication. Publish your authorization server metadata at /.well-known/oauth-authorization-server."
- [observed 1×] *Details* (score-api/eve.dev, v1-report/eve.dev): "OAuth mentioned in documentation at https://eve.dev/agents.md but no OAuth or OpenID Connect endpoint responded"
- [observed 1×] *Details* (score-api/example.org, sse/example.org): "No OAuth 2.0 or OpenID Connect support detected"
- [observed 1×] *Details* (score-api/vercel.com): "OpenID Connect discovery endpoint found at https://vercel.com"
- [observed 1×] *Details* (score-api/meta.ai): "OpenID Connect discovery endpoint found at https://meta.ai"

---

## `onboarding-friction` — Agent onboarding friction
*Layer: Usability · essentialsTier: **recommended** · native tier: recommended · maxScore: **2***

**Description (catalog, verbatim):** Can an agent go from discovering you to a first successful API call with no human in the loop? Every manual step is a place automated integrations quietly die.

**Recommendation (catalog, verbatim):** Offer a free tier or trial, self-serve API key generation, and a sandbox environment. Agents can't fill out 'contact sales' forms.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com, v1-report/eve.dev, v1-report/meta.ai, v1-report/vercel.com): "Offer a free tier or trial, self-serve API key generation, and a sandbox environment. Agents can't fill out 'contact sales' forms."
- **[static]** *Details* (score-api/eve.dev, score-api/vercel.com, v1-report/eve.dev, v1-report/vercel.com): "Onboarding signals described but not verified live: free tier available, self-serve key generation, sandbox/test environment"
- [observed 1×] *Details* (score-api/meta.ai, v1-report/meta.ai): "Insufficient content to evaluate onboarding friction"
- [observed 1×] *Details* (score-api/example.org, sse/example.org): "High onboarding friction - no free tier, self-serve keys, or sandbox detected"

---

## `pagination-shape` — REST pagination pattern
*Layer: Usability · essentialsTier: **recommended** · native tier: recommended · maxScore: **2** · essentials-bonus-only*

**Description (catalog, verbatim):** A predictable way to page through lists, cursor-based preferred. Without one, agents read page one and quietly miss the rest of your data.

**Recommendation (catalog, verbatim):** Use a consistent, documented pagination shape on your list endpoints (cursor-based preferred) and define the pagination fields in your OpenAPI response schemas, so agents can page through results without guessing the shape.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Details* (score-api/eve.dev, score-api/example.org, sse/example.org): "No REST API surface detected on this domain"
- **[static]** *Recommendation* (score-api/meta.ai, score-api/vercel.com): "Use a consistent, documented pagination shape on your list endpoints (cursor-based preferred) and define the pagination fields in your OpenAPI response schemas, so agents can page through results without guessing the shape."
- [observed 1×] *Details* (score-api/vercel.com): "Cursor-based pagination found in OpenAPI spec response schemas or query parameters"
- [observed 1×] *Details* (score-api/meta.ai): "No OpenAPI spec found - pagination shape check not applicable"

---

## `public-api` — Public API with reachable endpoints
*Layer: Usability · essentialsTier: **recommended** · native tier: required · maxScore: **7***

**Description (catalog, verbatim):** The foundation of agent access: an API that agents can actually call. We check for documentation and at least one endpoint that responds.

**Recommendation (catalog, verbatim):** Expose a public REST or GraphQL API. AI agents need programmatic access  - not just a web UI  - to integrate with your product.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com, v1-report/meta.ai): "Expose a public REST or GraphQL API. AI agents need programmatic access  - not just a web UI  - to integrate with your product."
- **[static]** *Details* (score-api/example.org, score-api/meta.ai, sse/example.org, v1-report/meta.ai): "No publicly reachable API surface detected (REST and GraphQL both absent or auth-gated)"
- [observed 1×] *Details* (score-api/vercel.com): "REST API documentation found at https://vercel.com/docs/products.md. Best-of-protocols score: 7/7."
- [observed 1×] *Details* (score-api/eve.dev): "REST API documentation found at https://eve.dev/docs/getting-started.md. Best-of-protocols score: 7/7."

---

## `rate-limit-headers` — Rate limit response headers
*Layer: Usability · essentialsTier: **recommended** · native tier: recommended · maxScore: **2***

**Description (catalog, verbatim):** Standard RateLimit headers tell agents how much room they have left, so they slow down gracefully instead of hitting errors and giving up on you.

**Recommendation (catalog, verbatim):** Return standard rate-limit headers on your API responses (the RFC RateLimit headers, plus Retry-After on a 429) so agents can self-throttle in real time, and document the conventions alongside your API.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com, v1-report/meta.ai, v1-report/vercel.com): "Return standard rate-limit headers on your API responses (the RFC RateLimit headers, plus Retry-After on a 429) so agents can self-throttle in real time, and document the conventions alongside your API."
- **[static]** *Details* (score-api/meta.ai, score-api/vercel.com, v1-report/meta.ai, v1-report/vercel.com): "No REST rate-limit headers found on probed endpoints"
- **[static]** *Details* (score-api/eve.dev, score-api/example.org, sse/example.org): "No REST or GraphQL surface detected - rate-limit headers check not applicable"

---

## `response-schema-coverage` — REST response schema coverage
*Layer: Usability · essentialsTier: **recommended** · native tier: recommended · maxScore: **2***

**Description (catalog, verbatim):** Typed response schemas on most of your API operations, so agents know the shape of what comes back before they call.

**Recommendation (catalog, verbatim):** Define typed JSON response schemas for every endpoint in your OpenAPI spec. Agents rely on these to know what fields they will get back; missing or partial schemas force trial-and-error.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Details* (score-api/eve.dev, score-api/example.org, sse/example.org): "No REST API surface detected on this domain"
- **[static]** *Recommendation* (score-api/meta.ai, score-api/vercel.com): "Define typed JSON response schemas for every endpoint in your OpenAPI spec. Agents rely on these to know what fields they will get back; missing or partial schemas force trial-and-error."
- [observed 1×] *Details* (score-api/vercel.com): "86% of operations define typed response schemas, 85% use application/json"
- [observed 1×] *Details* (score-api/meta.ai): "No OpenAPI spec found - response schema coverage check not applicable"

---

## `rest-sdk-packages` — Multi-language SDK packages
*Layer: Usability · essentialsTier: **recommended** · native tier: recommended · maxScore: **3** · essentials-bonus-only*

**Description (catalog, verbatim):** Official SDKs across ecosystems (npm, PyPI, Go). Each one is an integration an agent does not have to hand-roll, in the language it is already working in.

**Recommendation (catalog, verbatim):** Publish official SDK packages across multiple language ecosystems (npm, PyPI, Go modules, RubyGems). Auto-generate them from your OpenAPI spec using tools like openapi-generator. For each package set the project URL or homepage to your product domain (package.json `repository`/`homepage`, PyPI `Home-Page` or `project_urls`, RubyGems `homepage_uri`) - this is how agents verify the package is your official SDK.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Publish official SDK packages across multiple language ecosystems (npm, PyPI, Go modules, RubyGems). Auto-generate them from your OpenAPI spec using tools like openapi-generator. For each package set the project URL or homepage to your product domain (package.json `repository`/`homepage`, PyPI `Home-Page` or `project_urls`, RubyGems `homepage_uri`) - this is how agents verify the package is your official SDK."
- [observed 1×] *Details* (score-api/example.org, sse/example.org): "No SDK packages found across language ecosystems"
- [observed 1×] *Details* (score-api/vercel.com): "SDK found in npm, additional SDKs mentioned at https://vercel.com"
- [observed 1×] *Details* (score-api/eve.dev): "SDK found in npm, additional SDKs mentioned at https://eve.dev/docs/agent-config.md"
- [observed 1×] *Details* (score-api/meta.ai): "SDK package found only in pypi"

---

## `sandbox-environment` — Sandbox / test environment
*Layer: Usability · essentialsTier: **recommended** · native tier: recommended · maxScore: **2** · bonus, essentials-bonus-only*

**Description (catalog, verbatim):** A sandbox or test mode where agents can build an integration without touching production data. It lowers the stakes of every first call.

**Recommendation (catalog, verbatim):** Provide a sandbox or test mode so agents can exercise your API without touching production data, and document how to reach it - this lowers the risk of a destructive call against live data.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Provide a sandbox or test mode so agents can exercise your API without touching production data, and document how to reach it - this lowers the risk of a destructive call against live data."
- **[static]** *Details* (score-api/example.org, score-api/meta.ai, sse/example.org): "No sandbox or test environment found"
- [observed 1×] *Details* (score-api/vercel.com): "Sandbox environment found at https://vercel.com/sandbox"
- [observed 1×] *Details* (score-api/eve.dev): "Sandbox environment found at https://eve.dev/docs/sandbox"

---

## `scoped-permissions` — Scoped permissions
*Layer: Usability · essentialsTier: **required** · native tier: recommended · maxScore: **5***

**Description (catalog, verbatim):** Granular permissions so an agent gets only the access it needs, nothing more. Businesses connect faster when the blast radius of a mistake is small. We look for declared OAuth scopes (OpenAPI security schemes, RFC 9728 metadata), not prose mentions.

**Recommendation (catalog, verbatim):** Declare scoped API permissions where machines can read them: named OAuth scopes in your OpenAPI security schemes, or scopes_supported in RFC 9728 protected-resource metadata. Prose descriptions of roles help humans, but agents need the machine-readable declaration to request least-privilege access.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com, v1-report/eve.dev, v1-report/meta.ai, v1-report/vercel.com): "Declare scoped API permissions where machines can read them: named OAuth scopes in your OpenAPI security schemes, or scopes_supported in RFC 9728 protected-resource metadata. Prose descriptions of roles help humans, but agents need the machine-readable declaration to request least-privilege access."
- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, sse/example.org, v1-report/eve.dev, v1-report/meta.ai): "No declared OAuth scopes, security schemes, or scoped-permission documentation found"
- [observed 1×] *Details* (score-api/vercel.com, v1-report/vercel.com): "OpenAPI declares security schemes but no named OAuth scopes - agents get all-or-nothing access. Declare per-scope grants (e.g. read:*, write:*) in the spec."

---

## `web-bot-auth-directory` — Web Bot Auth directory
*Layer: Usability · essentialsTier: **emerging** · native tier: emerging · maxScore: **2** · bonus, essentials-bonus-only*

**Description (catalog, verbatim):** A public key directory (RFC 9421) that lets agents cryptographically sign their requests, so you know exactly who is calling and can let the good ones through.

**Recommendation (catalog, verbatim):** Publish a Web Bot Auth directory at /.well-known/http-message-signatures-directory. Serve a JSON document with a 'keys' array of Ed25519 JWKs (kty=OKP, crv=Ed25519, kid, nbf, exp). This lets agents sign their requests per RFC 9421 so you can distinguish legitimate bots from spoofers.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/vercel.com, sse/example.org): "No /.well-known/http-message-signatures-directory found"
- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Publish a Web Bot Auth directory at /.well-known/http-message-signatures-directory. Serve a JSON document with a 'keys' array of Ed25519 JWKs (kty=OKP, crv=Ed25519, kid, nbf, exp). This lets agents sign their requests per RFC 9421 so you can distinguish legitimate bots from spoofers."
- [observed 1×] *Details* (score-api/meta.ai): "Web Bot Auth directory found but body is not valid JSON"

---

## `webmcp` — WebMCP support
*Layer: Usability · essentialsTier: **emerging** · native tier: required · maxScore: **2** · essentials-bonus-only*

**Description (catalog, verbatim):** WebMCP (a W3C draft) exposes tools to agents right on your web pages, no separate server needed. Agents browsing your site can act, not just read.

**Recommendation (catalog, verbatim):** Expose in-page tools via WebMCP, the W3C draft standard for browser-resident AI agents. Add toolname and tooldescription attributes to your action forms - they survive into server-rendered HTML, so scanners and agents can see them - and register richer tools from client-side JS with document.modelContext.registerTool() (navigator.modelContext is the deprecated pre-Chrome-150 alias). Chrome ships WebMCP in 157 after the 149-156 origin trial.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Expose in-page tools via WebMCP, the W3C draft standard for browser-resident AI agents. Add toolname and tooldescription attributes to your action forms - they survive into server-rendered HTML, so scanners and agents can see them - and register richer tools from client-side JS with document.modelContext.registerTool() (navigator.modelContext is the deprecated pre-Chrome-150 alias). Chrome ships WebMCP in 157 after the 149-156 origin trial."
- **[static]** *Details* (score-api/example.org, score-api/meta.ai, sse/example.org): "No WebMCP support detected - no tool-attribute forms and no document.modelContext / navigator.modelContext usage found"
- **[static]** *Details* (score-api/eve.dev, score-api/vercel.com): "No WebMCP support detected - no tool-attribute forms and no document.modelContext / navigator.modelContext usage found (scanned 8 of 8 same-origin script bundle(s) for modelContext registrations)"

---

# Layer: Payments (6 checks)

## `acp-delegate-payment` — ACP delegate payment
*Layer: Payments · essentialsTier: **emerging** · native tier: recommended · maxScore: **3** · bonus, essentials-bonus-only*

**Description (catalog, verbatim):** The ACP endpoint that lets a buyer's agent hand you a payment credential securely (/agentic_commerce/delegate_payment). Supporting any one payment protocol is enough, so this reads N/A when another is detected. Optional for non-commerce sites.

**Recommendation (catalog, verbatim):** Expose the ACP Delegate Payment endpoint at `POST /agentic_commerce/delegate_payment`. The request takes `payment_method`, `allowance` (max amount, currency, expiry, merchant scope), and `risk_signals`; the response returns a vault token. This lets agents pay on behalf of users with scoped, revocable credentials.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com, sse/example.org): "No commerce signals detected - agent-payment protocols are optional for non-commerce sites"
- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Expose the ACP Delegate Payment endpoint at `POST /agentic_commerce/delegate_payment`. The request takes `payment_method`, `allowance` (max amount, currency, expiry, merchant scope), and `risk_signals`; the response returns a vault token. This lets agents pay on behalf of users with scoped, revocable credentials."

---

## `acp-support` — ACP - Agentic Commerce Protocol
*Layer: Payments · essentialsTier: **emerging** · native tier: required · maxScore: **3** · bonus, essentials-bonus-only*

**Description (catalog, verbatim):** A live Agentic Commerce Protocol checkout endpoint (/checkout_sessions), the flow behind agent-driven purchases in ChatGPT. Supporting any one payment protocol is enough, so this reads N/A when another is detected. Optional for non-commerce sites.

**Recommendation (catalog, verbatim):** Implement the Agentic Commerce Protocol checkout REST API: `POST /checkout_sessions` (create), update/get/complete/cancel variants, with `API-Version: YYYY-MM-DD` and `Idempotency-Key` required headers. Preflight OPTIONS should allow POST or return an ACP-shaped error with `supported_versions` so agents can negotiate.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Details* (score-api/example.org, score-api/meta.ai, score-api/vercel.com, sse/example.org): "No commerce signals detected - agent-payment protocols are optional for non-commerce sites"
- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Implement the Agentic Commerce Protocol checkout REST API: `POST /checkout_sessions` (create), update/get/complete/cancel variants, with `API-Version: YYYY-MM-DD` and `Idempotency-Key` required headers. Preflight OPTIONS should allow POST or return an ACP-shaped error with `supported_versions` so agents can negotiate."
- [observed 1×] *Details* (score-api/eve.dev): "ACP documented (AI analysis: Agent Client Protocol (ACP)); no live protocol surface found"

---

## `ap2-support` — AP2 - Agent Payments Protocol
*Layer: Payments · essentialsTier: **emerging** · native tier: recommended · maxScore: **3** · bonus, essentials-bonus-only*
*Spec: https://ap2-protocol.org/*

**Description (catalog, verbatim):** Google's Agent Payments Protocol: signed mandates that prove a human authorized the purchase, backed by Mastercard, Visa, PayPal and Amex. Supporting any one payment protocol is enough, so this reads N/A when another is detected. Optional for non-commerce sites.

**Recommendation (catalog, verbatim):** Adopt Google's AP2 (Agent Payments Protocol) authorization layer: advertise an AP2 mandate capability (e.g. `dev.ucp.shopping.ap2_mandate`) in your UCP discovery profile, and verify the three signed mandates (Intent, Cart, Payment - SD-JWT verifiable digital credentials) server-side before routing to a settlement rail. Note: one agentic payment protocol is sufficient - AP2 is only needed if you are not already covered by x402 / MPP / ACP / UCP.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com, sse/example.org): "No commerce signals detected - agent-payment protocols are optional for non-commerce sites"
- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Adopt Google's AP2 (Agent Payments Protocol) authorization layer: advertise an AP2 mandate capability (e.g. `dev.ucp.shopping.ap2_mandate`) in your UCP discovery profile, and verify the three signed mandates (Intent, Cart, Payment - SD-JWT verifiable digital credentials) server-side before routing to a settlement rail. Note: one agentic payment protocol is sufficient - AP2 is only needed if you are not already covered by x402 / MPP / ACP / UCP."

---

## `mpp-support` — MPP payment protocol
*Layer: Payments · essentialsTier: **emerging** · native tier: required · maxScore: **2** · bonus, essentials-bonus-only*

**Description (catalog, verbatim):** Machine Payments Protocol lets an agent pay you over plain HTTP. Supporting any one payment protocol is enough, so this reads N/A when another is detected. Optional for non-commerce sites.

**Recommendation (catalog, verbatim):** Implement the Machine Payments Protocol so agents can pay for premium resources over HTTP 402. Return a complete WWW-Authenticate: Payment challenge - the full set of standard MPP parameters, not just the bare scheme - and advertise x-payment-info in your OpenAPI spec so agents can discover it.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com, sse/example.org): "No commerce signals detected - agent-payment protocols are optional for non-commerce sites"
- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Implement the Machine Payments Protocol so agents can pay for premium resources over HTTP 402. Return a complete WWW-Authenticate: Payment challenge - the full set of standard MPP parameters, not just the bare scheme - and advertise x-payment-info in your OpenAPI spec so agents can discover it."

---

## `ucp-support` — UCP - Universal Commerce Protocol
*Layer: Payments · essentialsTier: **emerging** · native tier: required · maxScore: **3** · bonus, essentials-bonus-only*

**Description (catalog, verbatim):** A Universal Commerce Protocol profile at /.well-known/ucp, telling shopping agents how to transact with you. Supporting any one payment protocol is enough, so this reads N/A when another is detected. Optional for non-commerce sites.

**Recommendation (catalog, verbatim):** Publish a UCP discovery profile at /.well-known/ucp with a required `version` (YYYY-MM-DD) and advertised `services`/`capabilities` per ucp.dev. Also expose the REST checkout surface (`POST /checkout-sessions` with `UCP-Agent` and `Idempotency-Key` headers) so agents can transact without per-vendor integrations.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Details* (score-api/example.org, score-api/meta.ai, score-api/vercel.com, sse/example.org): "No commerce signals detected - agent-payment protocols are optional for non-commerce sites"
- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Publish a UCP discovery profile at /.well-known/ucp with a required `version` (YYYY-MM-DD) and advertised `services`/`capabilities` per ucp.dev. Also expose the REST checkout surface (`POST /checkout-sessions` with `UCP-Agent` and `Idempotency-Key` headers) so agents can transact without per-vendor integrations."
- [observed 1×] *Details* (score-api/eve.dev): "UCP documented (AI analysis: Universal Commerce Protocol (UCP)); no live protocol surface found"

---

## `x402-support` — x402 payment protocol
*Layer: Payments · essentialsTier: **emerging** · native tier: required · maxScore: **2** · bonus, essentials-bonus-only*

**Description (catalog, verbatim):** x402 lets an agent pay per request over plain HTTP micropayments. Supporting any one payment protocol is enough, so this reads N/A when another is detected. Optional for non-commerce sites.

**Recommendation (catalog, verbatim):** Implement x402 payment protocol so AI agents can pay for API access via HTTP 402. x402 uses PAYMENT-REQUIRED/PAYMENT-SIGNATURE/PAYMENT-RESPONSE headers with Base64-encoded JSON. Add a /discovery/resources endpoint for agent discovery.

**Observed outcome text (per-scan, verbatim):**

- **[static]** *Details* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com, sse/example.org): "No commerce signals detected - agent-payment protocols are optional for non-commerce sites"
- **[static]** *Recommendation* (score-api/eve.dev, score-api/example.org, score-api/meta.ai, score-api/vercel.com): "Implement x402 payment protocol so AI agents can pay for API access via HTTP 402. x402 uses PAYMENT-REQUIRED/PAYMENT-SIGNATURE/PAYMENT-RESPONSE headers with Base64-encoded JSON. Add a /discovery/resources endpoint for agent discovery."

---
