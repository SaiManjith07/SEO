---
id: geo-group-query-fan-out-mapping
discipline: GEO
group: query-fan-out-mapping
type: functional-group
tags: [query-fan-out, sub-questions, topic-clusters]
related: [seo-group-keyword-analyzer, geo-group-evidence-density-authoring]
last_updated: 2026-07-29
---

# Query Fan-Out Mapping

## Overview

The functional group responsible for the foundational GEO mechanic: a single user prompt is decomposed by the generative engine into many synthetic sub-queries, each retrieved independently, then synthesised. You are not targeting a query — you are targeting the *set of sub-questions the system will invent*.

## How it works

```
"Plan a 5-day trip to Japan"
   ↓ decompose (9-11 average, 400+ in deep research modes)
   ├── "November weather in Kyoto"
   ├── "best neighbourhoods to stay in Tokyo"
   ├── "JR Pass cost 2026"
   ├── ... 6-9 more
   ↓ retrieve passages per sub-query, in parallel
   ↓ synthesise into one answer, cite sources
```

**Process for your content:**

1. Take the head topic
2. List every sub-question a curious buyer would need answered — 15–30 of them (sources: PAA, Reddit, sales-call transcripts, support tickets, competitor comparison pages)
3. Group into a pillar page plus supporting cluster pages
4. Ensure each sub-question gets its own question-shaped H2 with a self-contained answer
5. Interlink the cluster tightly

**Why this compounds:** a page answering 8 sub-questions well has 8 entry points into the answer. Depth of coverage, not keyword targeting, is the actual lever.

## Standards it touches

- STD-21 (Question-shaped headings) — `../../standards/06-aeo-geo-content.md`
- STD-22 (Chunking discipline — each sub-answer must stand alone) — `../../standards/06-aeo-geo-content.md`

## Tools & what to check

Same sourcing stack as `../../SEO/groups/01-keyword-analyzer.md` and `../../AEO/groups/02-question-research.md` — this group is the GEO lens on the same research: PAA, AnswerThePublic, AlsoAsked, Reddit/forums, support tickets.

## Key metrics / thresholds

- Average consumer prompt: **9–11 sub-queries**; Google AI Mode: 8–16; deep research modes: **400+**
- No numeric pass/fail — the check is coverage completeness: does the page/cluster answer the full question space, not just the head term?
