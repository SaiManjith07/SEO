---
id: seo-group-page-performance
discipline: SEO
group: page-performance
type: functional-group
tags: [core-web-vitals, lcp, inp, cls, crux, performance]
related: [seo-group-crawler, std-performance]
last_updated: 2026-07-29
---

# Page Performance

## Overview

The functional group covering Core Web Vitals — the one category of standard in this knowledge base that **cannot be gamed from markup**, because it's measured on real users' devices (CrUX field data), not authored HTML. Treat it as the most trustworthy signal available precisely for that reason.

## How it works

```
Real Chrome users load your page
        │
        ▼
Chrome reports LCP, INP, CLS back to Google (CrUX)
        │
        ▼
Google aggregates at the 75th percentile, 28-day rolling window
        │
        ▼
As of the March 2026 core update: scored as a SITE-WIDE HOLISTIC
COMPOSITE, not per-page — fixing only top landing pages no longer works
        │
        ▼
Surfaces in: GSC Core Web Vitals report + PageSpeed Insights field data
(same underlying dataset, should agree)
```

**Why this group matters disproportionately:** it's a confirmed Google ranking signal, it's the one dimension an automated critic can trust without a human double-checking, and 43% of sites still fail the INP threshold — meaning this is unusually often the actual bottleneck, not content or authority.

## Standards it touches

| Standard | Threshold | File |
|---|---|---|
| STD-13 — LCP | < 2.5s at p75 | `../../standards/04-performance.md` |
| STD-14 — INP | < 200ms at p75 | `../../standards/04-performance.md` |
| STD-15 — CLS | < 0.1 at p75 | `../../standards/04-performance.md` |
| STD-16 — Holistic site-wide scoring | ≥75% of URL groups "Good" | `../../standards/04-performance.md` |

## Tools & what to check — full detail

Report-by-report reference: `../../tools/tools-reference.md` TOOL-03 (PageSpeed Insights / CrUX Dashboard / CrUX API) and TOOL-01 (GSC Core Web Vitals report).

**Diagnostic-only, not a ranking input:** Chrome DevTools Lighthouse / lab data. Use it to find *why* field data is failing, never as the score itself.

## Key metrics / thresholds

| Metric | Good | Needs improvement | Poor |
|---|---|---|---|
| LCP | < 2.5s | 2.5–4.0s | > 4.0s |
| INP | < 200ms | 200–500ms | > 500ms |
| CLS | < 0.1 | 0.1–0.25 | > 0.25 |

**Wait the full 28-day rolling window** after shipping a fix before checking whether p75 crossed into "Good" — checking sooner shows stale data. INP is the most commonly failed vital and is almost always a JavaScript problem (ship less JS, break long tasks, defer third-party scripts).
