---
id: aeo-group-snippet-aio-tracking
discipline: AEO
group: snippet-aio-tracking
type: functional-group
tags: [featured-snippets, ai-overviews, paa, measurement]
related: [seo-group-google-search-console, geo-group-ai-visibility-panel]
last_updated: 2026-07-29
---

# Featured Snippet & AI Overview Tracking

## Overview

The functional group responsible for measuring whether the answer-structuring and schema work is actually landing citations — the AEO-specific measurement layer, distinct from classic rank tracking. Rank tracking does not measure this; a page can sit at position 7 and win the citation while position 1 gets skipped.

## How it works

```
Google Search Console — filter Performance by Search Appearance
  (where available) to see snippet-eligible queries
        │
        ▼
Manual SERP checks for target queries — is a featured snippet
present, and is it you or a competitor?
        │
        ▼
AI-visibility tool or manual panel — sample target queries against
Google AI Overviews specifically (separate from ChatGPT/Perplexity,
which are covered in ../../GEO/groups/04-ai-visibility-panel.md)
        │
        ▼
Log: cited-and-linked / mentioned-unlinked / absent, per query, per
run — never trust a single sample, citations are probabilistic
```

## Standards it touches

STD-30 (AI visibility panel) — `../../standards/07-off-site-authority.md`. This group is the AEO-specific slice (featured snippets, PAA, AI Overviews); the full GEO measurement instrument covering ChatGPT/Perplexity/Gemini/Copilot lives in `../../GEO/groups/04-ai-visibility-panel.md`.

## Tools & what to check

| Tool | Role |
|---|---|
| Google Search Console (`../../tools/tools-reference.md` TOOL-01) | Impressions/clicks by query, indirect snippet-presence signal |
| AI-visibility tools — Profound, Peec AI, Otterly.AI (TOOL-07) | Sampled AI Overview citation tracking |
| Manual panel | Ground truth — 3–5 samples per query |

## Key metrics / thresholds

- **AIO citation rate for top-10 pages fell from 76% to 38% in one year** (ALM Corp, 173,000 URLs) — the single most important number in this group: rank and citation have decoupled
- Track citation *frequency* across N sampled runs, not a single yes/no
- ~25% of Google searches triggered an AI Overview in early 2026 — treat that as the addressable surface size for this group
