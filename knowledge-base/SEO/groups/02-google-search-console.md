---
id: seo-group-google-search-console
discipline: SEO
group: google-search-console
type: functional-group
tags: [gsc, indexing, core-web-vitals, structured-data, diagnostics]
related: [seo-group-crawler, seo-group-page-performance, std-access-indexability]
last_updated: 2026-07-29
---

# Google Search Console

## Overview

**The single most important tool in this knowledge base.** GSC is the only source with Google's own data about your site — everything else (Ahrefs, Semrush, third-party rank trackers) is estimation. Free, and non-negotiable: set it up on day one of any project.

## How it works

GSC surfaces seven distinct reports, each answering a different question in the ranking pipeline (`Discovery → Crawl → Render → Index → Retrieval → Ranking → Presentation`):

```
Manual Actions / Security Issues   → "has Google penalised me?"        (check first, 10 seconds)
Pages (Coverage)                    → "is this page even indexed?"      (Index stage)
URL Inspection                      → "what does Googlebot actually see?" (Render/Index stage)
Sitemaps                            → "does Google know all my URLs?"   (Discovery stage)
Performance                         → "how am I doing in search?"       (Ranking/Presentation stage)
Core Web Vitals                     → "is my site fast enough?"         (Quality/Ranking stage)
Enhancements                        → "is my structured data valid?"    (Comprehensibility stage)
```

Diagnose in this order on any traffic drop — most "ranking problems" are actually earlier-stage crawl/render/index problems. Full diagnostic table: `../../diagnostics.md`.

## Standards it touches

| Report | Verifies |
|---|---|
| Pages (Coverage), Sitemaps | STD-04, STD-05 — `../../standards/01-access-indexability.md` |
| URL Inspection (View Crawled Page) | STD-04, STD-06 — `../../standards/01-access-indexability.md`, `../../standards/02-rendering.md` |
| Core Web Vitals | STD-13–16 — `../../standards/04-performance.md` |
| Enhancements | STD-09, STD-10, STD-11 — `../../standards/03-structured-data.md` |
| Manual Actions / Security Issues | Diagnostic gate, precondition for everything |

## Tools & what to check — full detail

The complete report-by-report, metric-by-metric reference lives in `../../tools/tools-reference.md` TOOL-01 — this file exists to route you there by *function* rather than by tool name. Read that entry for exact pass/fail values.

## Key metrics / thresholds

- **Manual Actions:** must be empty
- **Core Web Vitals:** ≥75% of URLs "Good", mobile and desktop separately
- **Enhancements:** zero invalid structured-data items
- **Coverage:** indexed count should match your believed-indexable URL count; watch for spikes in "Crawled – currently not indexed" or "Duplicate without user-selected canonical"

**Cadence:** Performance weekly; Coverage, CWV, and Enhancements monthly; Manual Actions/Security checked first on any drop.
