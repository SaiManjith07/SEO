---
id: std-rendering
type: standard-doc
discipline: [SEO, AEO, GEO, LLMO]
level: 0
tags: [rendering, javascript, ssr, spa, ai-crawlers]
related: [std-access-indexability, seo-group-crawler]
last_updated: 2026-07-29
---

# Level 0/1 — Rendering (the AI-visibility differentiator)

Prerequisite level 0 in `../README.md` §2. This is the single highest-leverage technical category — see STD-06.

---

### STD-06 — Content present in raw (unrendered) HTML
**Requirement:** all primary content a human sees must be present in the HTML as served over the wire — before any JavaScript executes.
**Why it is the single highest-leverage technical standard:** GPTBot, OAI-SearchBot, and ClaudeBot **do not execute JavaScript**; PerplexityBot's JS support is limited/no. A client-side-rendered SPA shell (`<div id="root"></div>`) is a blank page to these crawlers regardless of how good the hydrated content is.
> **Verification note (2026-07-29):** Re-verified crawler documentation from OpenAI, Anthropic, and Perplexity. GPTBot, OAI-SearchBot, ClaudeBot, and PerplexityBot still only ingest raw, server-returned HTML and do not execute client-side JavaScript.
**Threshold:** `curl -s https://site/page | grep "key sentence"` finds the sentence. Equivalently: raw HTML word count is not near-zero.
**Source:** `../../research/04-technical-requirements.md` §2 (crawler JS-rendering table); this is the seokit "differentiator" check (`seo_check_ai_access`).
**Verify:** fetch page twice — once as a plain HTTP client (raw), once with headless-browser rendering (Playwright) — and diff. A large content delta between raw and rendered = failure. See `../tools/tools-reference.md` TOOL-01 (GSC URL Inspection).
**Gate:** HARD — × 0.25 multiplier ("SPA shell" gate). Google may eventually render it; no one else will.

---

### STD-07 — No content gated behind interaction
**Requirement:** accordions, tabs, and "read more" toggles must have their content present in the DOM at load (hidden via CSS), never fetched only on click.
**Source:** `../../research/04-technical-requirements.md` §2.
**Verify:** static HTML parse for the target content, independent of any client-side event.
**Gate:** SOFT, feeds into STD-06's raw/rendered diff.

---

### STD-08 — JS/CSS not blocked for renderer bots
**Requirement:** robots.txt must not block `/js/` or `/css/` paths — Googlebot needs them to render correctly; blocking causes Google to see a broken page even though it does execute JS.
**Source:** `../../research/04-technical-requirements.md` §2.
**Verify:** robots.txt parse for disallowed asset paths.
**Gate:** SOFT.
