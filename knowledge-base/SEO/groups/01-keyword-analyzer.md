---
id: seo-group-keyword-analyzer
discipline: SEO
group: keyword-analyzer
type: functional-group
tags: [keyword-research, intent, search-console, content-planning]
related: [seo-group-google-search-console, seo-group-competitive-analysis, std-content-aeo-geo]
last_updated: 2026-07-29
---

# Keyword Analyzer

## Overview

The functional group responsible for finding what to write about and what intent it serves. In 2026 this is not "pick a keyword, write a page, chase a rank" — that model is broken by passage-level retrieval and query fan-out (see `../../GEO/README.md`). Keyword analysis now means mapping the full question space around a topic, segmented by intent.

## How it works

```
Seed topic
   │
   ▼
Mine real queries: GSC Performance (positions 5-20 = quick wins) · People Also Ask
   · AnswerThePublic / AlsoAsked · Reddit/Quora/forums · support tickets · sales calls
   │
   ▼
Segment by intent (table below)
   │
   ▼
Group into topic clusters: one pillar page + supporting sub-intent pages, interlinked
   │
   ▼
Prioritise commercial-investigation queries — strongest AI-citation-to-conversion math
```

### Intent segmentation

| Intent | Query shape | Content type | Business value |
|---|---|---|---|
| Informational | "what is X", "how does X work" | Guide, explainer | Low direct, high AI-citation value |
| Navigational | "brand + feature" | Product/docs page | Defensive — must own |
| Commercial | "best X", "X vs Y", "X pricing" | Comparison, review | **Highest** — where AI citations convert |
| Transactional | "buy X", "X free trial" | Landing page | Direct revenue |

Full detail: `../../../research/01-SEO-fundamentals-2026.md` §5.

## Standards it touches

This group is upstream of the checkable standards — it decides *what* to build, not how to pass a check. Its output (a topic cluster + intent map) feeds directly into `../../standards/06-aeo-geo-content.md` (STD-20–25, especially STD-21 question-shaped headings) once content is being written.

## Tools & what to check

| Tool | What to check |
|---|---|
| Google Search Console (`../../tools/tools-reference.md` TOOL-01) | Performance report, filtered to positions 5–20 — your best free keyword tool, shows queries you already get impressions for |
| Google Keyword Planner | Raw volume data from Google itself (needs a Google Ads account) |
| AnswerThePublic / AlsoAsked | Question-shaped queries — directly useful for AEO headings |
| Ahrefs Keywords Explorer / Semrush Keyword Magic | Click data (not just volume) and clustering, if you have a paid suite |
| Reddit / Quora / niche forums | Real language, and a citation source in its own right (see `../../GEO/README.md` STD-27) |

Full tool comparison and pricing: `../../../research/06-tools-and-platforms.md` §4.

## Key metrics / thresholds

No pass/fail threshold here — this group produces inputs, not scores. The signal to watch: **impressions with no corresponding page** in GSC Performance is a content gap; **positions 5–20 with high impressions** is your highest-ROI existing-content list (`../../SEO/README.md`).
