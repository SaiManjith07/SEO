---
id: aeo-group-answer-structuring
discipline: AEO
group: answer-structuring
type: functional-group
tags: [bluff, answer-first, authoring-pattern]
related: [std-content-aeo-geo, aeo-group-question-research]
last_updated: 2026-07-29
---

# Answer Structuring

## Overview

The functional group responsible for the single highest-leverage authoring pattern in AEO: making every section answer its own question in the first sentence, before any backstory. This is the "BLUFF" pattern (Bottom Line Up Front), and it is a writing discipline, not a technical fix — it applies whether the page is brand new or being restructured.

## How it works

```
Question-shaped H2 heading
        │
        ▼
40–60 word direct answer — complete sentence, no preamble,
self-contained, assumes no prior context
        │
        ▼
Then: elaboration, evidence, examples, caveats
```

**Bad:** "There are many factors to consider when evaluating this, and it depends heavily on your circumstances. Let's start by looking at the background..."

**Good:** "Interaction to Next Paint (INP) measures responsiveness. A 'good' INP is under 200 milliseconds, measured at the 75th percentile of real user visits over a 28-day window."

The second version is a complete, quotable, self-sufficient unit — that is the whole game. The first 100 words of a section carry disproportionate weight as the primary citation candidate.

## Standards it touches

- STD-20 (Answer-first structure / BLUFF) — `../../standards/06-aeo-geo-content.md`
- STD-22 (Chunking discipline — the paragraph-level execution of this pattern) — `../../standards/06-aeo-geo-content.md`

## Tools & what to check

No dedicated tool authors this for you — it's an editorial standard. Verify with `seo_extractability` (the evaluator MCP tool, once built) or manually: read only the first sentence of each section — if it doesn't fully answer the heading's question, restructure.

## Key metrics / thresholds

- First 100 words of a section = a complete, self-contained answer
- Reported **2–4x improvement in AI citation rates** from restructuring existing content this way alone, with no new content written — the highest-leverage change available to most sites (`../../../research/02-AEO-answer-engine-optimization.md` §4.3)
