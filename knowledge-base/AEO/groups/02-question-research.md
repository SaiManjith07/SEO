---
id: aeo-group-question-research
discipline: AEO
group: question-research
type: functional-group
tags: [people-also-ask, answerthepublic, alsoasked, question-headings]
related: [seo-group-keyword-analyzer, aeo-group-answer-structuring]
last_updated: 2026-07-29
---

# Question Research

## Overview

The functional group responsible for sourcing the *real* questions to turn into headings — the AEO-specific layer on top of `../../SEO/groups/01-keyword-analyzer.md`. The rule that matters: use real question phrasing from actual users, never invented wording. Answer engines match query phrasing to heading phrasing; a heading that doesn't sound like a question a person actually typed is a weaker retrieval target.

## How it works

```
Sources, in priority order:
  Google Search Console Performance report (real queries you already
    get impressions for)
  → People Also Ask boxes for your target topics
  → AnswerThePublic / AlsoAsked (visualise and map question trees)
  → Reddit / Quora / niche forums (real language, real phrasing)
  → your own support tickets and sales-call transcripts (highest
    quality, almost nobody uses this)
        │
        ▼
Convert each into a question-shaped H2/H3
        │
        ▼
Feed into Answer Structuring (../01-answer-structuring.md) for the
actual authoring
```

## Standards it touches

STD-21 (Question-shaped headings) — `../../standards/06-aeo-geo-content.md`

## Tools & what to check

| Tool | Role |
|---|---|
| Google Search Console Performance report | Your best free source — real queries, no cost |
| AnswerThePublic | Free tier / ~$99/mo — visualises question-shaped queries |
| AlsoAsked | Free tier / ~$15+/mo — maps full People Also Ask trees |
| Reddit / Quora / niche forums | Free — also a GEO citation source in its own right |

Full tool detail: `../../../research/06-tools-and-platforms.md` §4.

## Key metrics / thresholds

No pass/fail — this is a sourcing function. The check that matters: every question-shaped heading should trace back to a real, observed query, not an invented one. `## How much does INP optimization cost?` (real query phrasing) beats `## Cost Considerations` (invented, generic) every time.
