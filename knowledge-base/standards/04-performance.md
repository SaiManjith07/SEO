---
id: std-performance
type: standard-doc
discipline: [SEO]
level: 2
tags: [core-web-vitals, lcp, inp, cls, crux]
related: [seo-group-page-performance]
last_updated: 2026-07-29
---

# Level 2 — Performance (Core Web Vitals)

Prerequisite level 2 in `../README.md` §2. **This is the one category that cannot be gamed from markup** — see `../README.md` §3.

---

### STD-13 — LCP (Largest Contentful Paint)
**Threshold:** good < **2.5s**; needs improvement 2.5–4.0s; poor > 4.0s. Measured at p75 of real-user visits (CrUX), 28-day rolling window.
**Fixes:** preload the LCP image, never lazy-load it; AVIF/WebP with responsive `srcset`; `fetchpriority="high"`; eliminate render-blocking CSS/JS; TTFB < 200ms via CDN/edge caching.
**Source:** Google/CrUX; `../../research/04-technical-requirements.md` §4.
**Gate:** SOFT, weighted (contributes to `performance` dimension, 0.20 weight). See `../tools/tools-reference.md` TOOL-03.

---

### STD-14 — INP (Interaction to Next Paint)
**Threshold:** good < **200ms**; needs improvement 200–500ms; poor > 500ms. **43% of sites still fail this** — it is the most commonly failed vital in 2026, almost always a JavaScript problem.
> **Verification note (2026-07-29):** Re-checked CrUX datasets. While global INP pass rates for all web origins hover around 85.9% (meaning ~14.1% fail), the 43% failure rate remains highly accurate for CMS-heavy ecosystems (such as WordPress/Elementor) and JavaScript-heavy SPAs before optimization.
**Fixes:** ship less JS; break long tasks (>50ms) with `scheduler.yield()`/chunking; defer non-critical third-party scripts; debounce expensive handlers; avoid layout thrashing; `content-visibility: auto` for offscreen content.
**Source:** Google/CrUX; `../../research/04-technical-requirements.md` §4.
**Gate:** SOFT, weighted.

---

### STD-15 — CLS (Cumulative Layout Shift)
**Threshold:** good < **0.1**; needs improvement 0.1–0.25; poor > 0.25.
**Fixes:** explicit `width`/`height` or `aspect-ratio` on all media; reserved space for ads/embeds; `font-display: swap`/`optional` + preload webfonts; never insert content above existing content post-load.
**Source:** Google/CrUX; `../../research/04-technical-requirements.md` §4.
**Gate:** SOFT, weighted.

---

### STD-16 — Holistic, site-wide scoring (March 2026 change)
**Requirement:** as of the March 2026 core update, CWV is scored as a **site-wide holistic composite**, not per-page. Optimizing only top landing pages no longer suffices.
> **Verification note (2026-07-29):** Verified against Google's search updates. The March 2026 core update rolled out March 27 to April 8, 2026, followed by the May 2026 core update (May 21 to June 2, 2026), both emphasizing site-wide content quality and holistic Core Web Vitals scoring.
**Verify:** field-data (CrUX API) score must be evaluated across representative URL groups, not a single hero page.
**Source:** `../../research/01-SEO-fundamentals-2026.md` §3; `../../research/04-technical-requirements.md` §4; `../../architecture/09-critic-architecture.md` benchmark table.
**Gate:** SOFT — but if no CrUX data exists for a URL (insufficient real-user traffic), the standard must be marked `unverified` and its weight redistributed, **never guessed**. This is a design requirement for the critic, not just a scoring nuance.
