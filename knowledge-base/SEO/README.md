---
id: discipline-seo
type: discipline-index
discipline: SEO
tags: [seo, ranking, index]
related: [std-access-indexability, std-rendering, std-structured-data, std-performance, std-semantic-html]
last_updated: 2026-07-29
---

# SEO — Search Engine Optimization

**Target surface:** Google/Bing blue links and SERP features. **Unit of competition:** the page (ranked position). This is the foundation layer — AEO, GEO and LLMO all depend on being crawlable, indexed, and technically sound first. Full background: `../../research/01-SEO-fundamentals-2026.md`.

This folder does not duplicate standard content — each standard lives once in `../standards/`. This is an index: which standards matter to classic SEO, and why.

---

## Standards that apply

| Standard | Title | Why it matters to SEO | Where |
|---|---|---|---|
| STD-01 | Crawler access via robots.txt | Googlebot must be unblocked or nothing else matters | `../standards/01-access-indexability.md` |
| STD-02 | Edge/CDN not blocking crawlers | A permissive robots.txt is meaningless if the CDN 403s Googlebot | `../standards/01-access-indexability.md` |
| STD-04 | No accidental noindex / indexing hygiene | The classic hard gate — a page not indexed cannot rank at any price | `../standards/01-access-indexability.md` |
| STD-05 | XML sitemap and URL hygiene | How Google discovers and prioritizes your pages | `../standards/01-access-indexability.md` |
| STD-06 | Content present in raw HTML | Google renders JS (with budget limits) but still needs real content to index reliably | `../standards/02-rendering.md` |
| STD-08 | JS/CSS not blocked for renderer bots | Blocking assets makes Googlebot see a broken page | `../standards/02-rendering.md` |
| STD-09 | JSON-LD format and validity | Required for any rich result | `../standards/03-structured-data.md` |
| STD-10 | Organization schema | Establishes your brand as a coherent entity to Google | `../standards/03-structured-data.md` |
| STD-11 | Content-type schema coverage | Article/Product/FAQ schema unlock specific SERP features | `../standards/03-structured-data.md` |
| STD-12 | Content parity | Spammy structured data is a real policy violation with ranking consequences | `../standards/03-structured-data.md` |
| STD-13–16 | Core Web Vitals (LCP, INP, CLS, site-wide scoring) | A confirmed ranking signal since 2021, now a holistic site-wide composite | `../standards/04-performance.md` |
| STD-17–19 | Semantic HTML (headings, lists/tables, alt text) | Comprehensibility — Level 1 of the prerequisite ladder | `../standards/05-semantic-html.md` |
| STD-26 | Brand mentions vs. backlinks | Backlinks remain one of the strongest SEO correlation signals, even though mentions now matter more for AI visibility | `../standards/07-off-site-authority.md` |
| STD-28 | Entity consistency (`sameAs`, NAP, Wikidata) | Feeds Google's entity understanding of your brand | `../standards/07-off-site-authority.md` |

## Primary tools

Google Search Console (`../tools/tools-reference.md` TOOL-01) is the single most important tool for this discipline — it's the only source with Google's actual data about your site. Pair with PageSpeed Insights/CrUX (TOOL-03) for performance, Rich Results Test (TOOL-04) for schema, and Ahrefs/Semrush (TOOL-06) for backlink and keyword research.

## Functional groups

For day-to-day operational work, SEO splits into six functional groups — each is its own file in `groups/`, cross-referencing the standards above by function rather than by failure mode:

| Group | Covers |
|---|---|
| `groups/01-keyword-analyzer.md` | What to write about, intent segmentation, question mining |
| `groups/02-google-search-console.md` | The single most important tool — full report-by-report workflow |
| `groups/03-traffic-identification.md` | GA4, AI-referral attribution, branded search as a proxy |
| `groups/04-crawler.md` | robots.txt, CDN/edge blocking, raw-vs-rendered, server logs |
| `groups/05-page-performance.md` | Core Web Vitals — the one dimension that can't be gamed from markup |
| `groups/06-competitive-analysis.md` | Backlinks, brand mentions, and the narrative gap |

## Key mental model

```
Discovery → Crawl → Render → Index → Retrieval → Ranking → Presentation
```

Most "SEO problems" are actually crawl, render, or index problems — not ranking problems. Diagnose in pipeline order; see `../diagnostics.md`.
