# UI Redesign Plan — Match is-agentic Look & Feel

## Goal
Replicate the official is-agentic.com visual design (light, minimal, Vercel-style) in our app.
**Scope: UI/UX only. Zero backend/business-logic changes.**

## Design tokens (extracted from live is-agentic.com)
- Theme: LIGHT. bg #ffffff, text near-black (#0a0a0a), muted gray (#6b7280-ish lab 48.5)
- Font: Geist, Geist Fallback, Arial, Helvetica, sans-serif (use Geist via next/font or system fallback)
- Radii: 6px (buttons/inputs), 12px (cards), 4px (small), pill for nav command chip
- Accents: green tint rgba(46,160,67,.07) pass backgrounds; purple tint for secondary; black primary buttons
- Borders: 1px solid #e5e7eb-ish (lab 90.95 ≈ #e0e0e0)
- Nav: "▲ / Is Agentic" logo left; pill chip right: `$ npx is-agentic [domain]` + copy icon

## Page-by-page

### Home (/)
1. Centered hero: "Score how agentic your site is" (54px/600, "agentic" in dotted-matrix style), gray subtitle
2. URL input + black "Score" button (side-by-side, rounded 6px)
3. "Featured scores" list: rows with favicon dot, domain, score "86 /100" (bold number, gray /100) → link to /scan
4. "Recent scores" list from DB (latest scans), "Rotates hourly" style caption
5. Footer: minimal links

### Report (/scan/[host]) — restructure to official layout
1. Header block: small domain text + Share (copy link) button; H1 label (24px, e.g. "Strong technical baseline");
   big score number + "/100" with donut/pie chart (SVG, black fill on light); black "Prompt to improve" button
   (copies fix prompt — reuse existing clipboard logic); "Rescan" text link
2. Right column (border-separated rows): Essential "63.5 / 80" + "8 of 11 checks passed"; Recommended; Bonus signals "+5" + "38 positive, never required"
3. "Fix these gaps first" section: numbered issues (01, 02, …) with category tag right-aligned; fix text paragraphs
4. "Audit the checks behind the score": collapsible tiers — "Essential · 8 of 11 passed · 63.5/80 points" etc.,
   each check row: name, status icon (✓/!/—), details, RECOMMENDATION block (keep our existing data)
5. Surface progress bars (per-layer % from our checks: Discovery/Access/Usability/Payments) with
   strength labels (Strong ≥80, Ready with gaps ≥60, Needs work <60)
6. Footer: "Source: local scanner" + snapshot timestamp

### Data sourcing (read-only)
- All data from existing endpoints (/api/report/full roster + payload). NO new backend logic except:
  - /api/recent (tiny read-only list endpoint for home "Recent scores") — optional; can inline via server component
- Per-layer % computed client-side from roster rows (group by layer_id)

## Non-goals / out of scope
- No Task/agent-journey section (Ora LLM feature)
- No changes to scanning, gating, scoring, API contracts, DB schema
- No new npm UI dependencies beyond Geist font package (optional; fallback stack acceptable)

## Implementation order
1. globals.css: light theme tokens (colors, fonts, radii) — replace dark theme
2. layout.tsx: new nav (logo + npx pill) + footer
3. page.tsx (home): hero + input + featured/recent lists
4. scan page: header/donut/breakdown column → fix-gaps-first → tier audit (reuse roster data)
5. Verify: Playwright screenshots vs official; API responses byte-identical (no backend diff); all tests pass

## Breaking-change guards
- No edits to packages/scanner-core, app/api/**, lib/jobs.ts, middleware.ts
- Guard test: GET /api/v1/report?url=vercel.com byte-identical before/after


## v2 — Review round 1 amendments (all decisions explicit)

1. **Page coverage**: /docs + /methodology restyled too (they use .hero/.card/.fix-prompt tuned for dark — light theme would break them). Footer carries Docs + Methodology links (nav regression fixed).
2. **Guard list completed**: packages/scanner-core, app/api/**, src/db/**, src/lib/jobs.ts, middleware.ts, next.config.mjs (only touched if Geist needs config — it doesn't via next/font). E2E scripts (live-browser.mjs, verify-roster.mjs) WILL be updated to new selectors — they are UI drivers, not backend.
3. **Home = server component shell** (reads DB for recent scores directly, no /api/recent endpoint — plan's /api/recent proposal DROPPED) + client child for the form. POST /api/scan contract unchanged. Empty-state designed for fresh DB.
4. **Surface bars → "Layers" (option a)**: relabel as layer progress; join check_id→layer via /api/v1/checks catalog client-side; % = honest pass ratio per layer, labeled "N of M checks passed". No invented surfaces/percentages.
5. **"Critical access needs attention" groups: DROPPED** (groupings don't exist in our catalog — inventing them is off-brand). "Fix these gaps first" keeps tier as right-aligned label (Essential/Recommended).
6. **Tokens completed**: Geist + Geist Mono (both via next/font — mono for npx pill, /100, numbering, timestamps); dotted-matrix "agentic" approximated with Geist Mono + dotted underline (exact face not publicly available); container max-width 1200px; hover/focus states; spacing scale (4/8/12/16/24/48).
7. **Scanning-in-progress UI**: existing progress card restyled light (design reference doesn't cover it — simple restyle, no redesign).
8. **Dark mode: dropped** (light-only, matching official default). Full contrast pass on all classes + inline var() usages.
9. **Favicons**: colored initial dot (CSS), NO external favicon service.
10. **Port**: dev script aligned to 3100 (start already is).
11. **Guard widened**: byte-compare /api/v1/report + /api/report/full + /api/v1/checks + /api/scan/markdown before/after; SSE frame sequence re-verified via stream capture.

## Implementation order (v2)
1. globals.css light tokens + all class restyles (incl. docs/methodology cards)
2. layout.tsx: Geist/Geist Mono via next/font, new nav + footer w/ Docs+Methodology links
3. page.tsx: server shell (recent scores from DB) + client form child; featured scores static list
4. scan page: header (domain, copy-share, donut SVG, label, Prompt-to-improve, Rescan) + right breakdown column + numbered fix-gaps + layer bars + collapsible tier audit; progress card restyled
5. docs/methodology pages: light card styles
6. e2e selector updates + widened byte-guard verification + Playwright screenshots vs official


## v3 — Round-2 blocker/wording resolutions

B1. Port: BOTH dev and start scripts moved to 3100 (verified claim — reviewer is right, both were 3000).
B2. Home server component gets `export const dynamic = "force-dynamic"` (DB read must not bake at build).
B3. Recent scores: one row per domain (latest report per target — SQL DISTINCT ON / group-by), duplicates impossible.
W4. Layer bars "honest" defined: denominator = applicable (non-na) checks only; N/A count shown separately. Stale "group by layer_id" line struck (join via catalog instead).
W5. Six broken e2e selectors named: `.score-big`, `details.card summary`, `.card p`, `input[aria-label]`, `button[type=submit]`, `text=RECOMMENDATION`. Migration: add stable `data-testid` hooks (testid: score-value, tier-section, check-card, scan-input, scan-submit, recommendation-block) and update e2e scripts to testids.
W6. Contrast scope widened: grade-color map (GRADE_COLORS in scan page) + inline blue tint rgba(79,140,255,.05) retuned for white background.
W7. Byte-guard procedure: capture before/after against the SAME completed scan (no rescan between captures); stale-page auto-rescan avoided by capturing API responses directly, screenshots second.
O1. Homepage DB-unreachable fallback: try/catch → render featured-only with empty recent list (page still loads).
O2. Docs/Methodology: style-only restyle, TEXT FROZEN (recent accuracy audit).
O3. Featured-score links start scans tagged source "web" (unchanged behavior).
