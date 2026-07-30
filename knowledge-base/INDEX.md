---
id: kb-index
type: index
discipline: [SEO, AEO, GEO, LLMO]
tags: [lookup-table, standards, tools, weights]
related: [kb-overview]
last_updated: 2026-07-29
---

# Knowledge Base Index

**A markdown-only index of every standard and tool in this knowledge base.** This replaces the earlier `manifest.json` — everything in this knowledge base is now plain `.md`, by design. If this ever needs to be machine-parsed (e.g. for the evaluator/critic MCP code), the tables below are the source to parse; no separate JSON file is maintained alongside them.

---

## All 33 standards

| ID | Title | Category | Level | Gate | File |
|---|---|---|---|---|---|
| STD-01 | Crawler access via robots.txt | Access | 0 | HARD (×0.5) | `standards/01-access-indexability.md` |
| STD-02 | Edge/CDN not blocking AI crawlers | Access | 0 | HARD | `standards/01-access-indexability.md` |
| STD-03 | Training-vs-retrieval crawler trade-off | Access | 0 | SOFT | `standards/01-access-indexability.md` |
| STD-04 | No accidental noindex / indexing hygiene | Access | 0 | HARD (×0.0) | `standards/01-access-indexability.md` |
| STD-05 | XML sitemap and URL hygiene | Access | 0 | SOFT | `standards/01-access-indexability.md` |
| STD-06 | Content present in raw (unrendered) HTML | Rendering | 0 | HARD (×0.25) | `standards/02-rendering.md` |
| STD-07 | No content gated behind interaction | Rendering | 0 | SOFT | `standards/02-rendering.md` |
| STD-08 | JS/CSS not blocked for renderer bots | Rendering | 0 | SOFT | `standards/02-rendering.md` |
| STD-09 | JSON-LD format and validity | Schema | 1 | HARD (×0.9) | `standards/03-structured-data.md` |
| STD-10 | Organization schema | Schema | 1 | SOFT | `standards/03-structured-data.md` |
| STD-11 | Content-type schema coverage | Schema | 1 | SOFT | `standards/03-structured-data.md` |
| STD-12 | Content parity | Schema | 1 | HARD-adjacent | `standards/03-structured-data.md` |
| STD-13 | LCP (Largest Contentful Paint) | Performance | 2 | SOFT | `standards/04-performance.md` |
| STD-14 | INP (Interaction to Next Paint) | Performance | 2 | SOFT | `standards/04-performance.md` |
| STD-15 | CLS (Cumulative Layout Shift) | Performance | 2 | SOFT | `standards/04-performance.md` |
| STD-16 | Holistic, site-wide CWV scoring | Performance | 2 | SOFT | `standards/04-performance.md` |
| STD-17 | Heading structure | Semantics | 1 | SOFT | `standards/05-semantic-html.md` |
| STD-18 | Lists, tables, landmarks | Semantics | 1 | SOFT | `standards/05-semantic-html.md` |
| STD-19 | Alt text, dates, author bylines | Semantics | 1 | SOFT | `standards/05-semantic-html.md` |
| STD-20 | Answer-first structure (BLUFF) | Content | 2 | SOFT | `standards/06-aeo-geo-content.md` |
| STD-21 | Question-shaped headings | Content | 2 | SOFT | `standards/06-aeo-geo-content.md` |
| STD-22 | Chunking discipline | Content | 2 | SOFT | `standards/06-aeo-geo-content.md` |
| STD-23 | Evidence density (Princeton trio) | Content | 2 | SOFT | `standards/06-aeo-geo-content.md` |
| STD-24 | Freshness as an eligibility gate | Content | 2 | SOFT | `standards/06-aeo-geo-content.md` |
| STD-25 | Format bonus: listicles and tables | Content | 2 | SOFT | `standards/06-aeo-geo-content.md` |
| STD-26 | Brand mentions beat backlinks | Off-site | 3 | N/A | `standards/07-off-site-authority.md` |
| STD-27 | Third-party editorial presence | Off-site | 3 | N/A | `standards/07-off-site-authority.md` |
| STD-28 | Entity consistency (sameAs/NAP/Wikidata) | Off-site | 3 | N/A | `standards/07-off-site-authority.md` |
| STD-29 | YouTube / video presence | Off-site | 4 | N/A | `standards/07-off-site-authority.md` |
| STD-30 | AI visibility panel | Off-site | 3 | N/A | `standards/07-off-site-authority.md` |
| STD-31 | No separate LLMO rule module | LLMO | — | N/A | `standards/08-llmo.md` |
| STD-32 | Third-party LLM integration surfaces | LLMO | — | N/A | `standards/08-llmo.md` |
| STD-33 | Optional provision of llms.txt | LLMO | — | SOFT | `standards/08-llmo.md` |

## All 8 tools

| ID | Name | Cost | Verifies |
|---|---|---|---|
| TOOL-01 | Google Search Console | Free | STD-01, 04, 05, 06, 09, 10, 11, 13–16 |
| TOOL-02 | Google Analytics 4 | Free | STD-26, 30 |
| TOOL-03 | PageSpeed Insights / CrUX Dashboard / CrUX API | Free | STD-13–16 |
| TOOL-04 | Rich Results Test + Schema.org Validator | Free | STD-09, 12 |
| TOOL-05 | Server logs / Screaming Frog Log File Analyser | Free / £99/yr | STD-01, 02, 03, 05, 17–19 |
| TOOL-06 | Ahrefs / Semrush | ~$129–249/mo | STD-26, 27 |
| TOOL-07 | AI-visibility tools (Profound, Peec, Otterly) | $25–330/mo | STD-27, 30 |
| TOOL-08 | Google Business Profile | Free | STD-28 |

All tool detail: `tools/tools-reference.md`.

## Reward dimension weights (for the MCP critic — see `../architecture/15-mcp-evaluator-critic-architecture.md` §5.3)

| Dimension | Weight | Standards |
|---|---|---|
| `indexability` | 0.20 | STD-01, 04, 05 |
| `ai_access` | 0.20 | STD-01, 02, 03, 06, 07, 08 |
| `performance` | 0.20 | STD-13, 14, 15, 16 |
| `structured_data` | 0.15 | STD-09, 10, 11, 12 |
| `content_quality` | 0.15 | STD-20–25 |
| `semantics` | 0.10 | STD-17, 18, 19 |

## By discipline

| Discipline | Folder | Functional groups | Standards emphasized |
|---|---|---|---|
| SEO | `SEO/README.md` | keyword-analyzer, google-search-console, traffic-identification, crawler, page-performance, competitive-analysis | STD-01, 02, 04, 05, 06, 08–19, 26, 28 |
| AEO | `AEO/README.md` | answer-structuring, question-research, schema-faq-howto, content-chunking-extractability, snippet-aio-tracking, freshness-operations | STD-01, 02, 06, 07, 09, 11, 12, 17–22, 24, 25, 27, 30 |
| GEO | `GEO/README.md` | query-fan-out-mapping, evidence-density-authoring, off-site-mention-monitoring, ai-visibility-panel, platform-specific-optimization, video-youtube-presence | STD-01–03, 06, 09, 10, 17–30 |
| LLMO | `LLMO/README.md` | training-corpus-access, third-party-integration-surfaces, cross-surface-readiness, retrieval-rag-readiness | STD-01, 03, 06, 17–23, 31, 32, 33 |

## By prerequisite level

| Level | Name | Standards |
|---|---|---|
| 0 | Existence | STD-01–08 |
| 1 | Comprehensibility | STD-09–12, 17–19 |
| 2 | Quality | STD-13–16, 20–25 |
| 3 | Authority | STD-26–28, 30 |
| 4 | Compounding | STD-29 |
