---
id: geo-group-ai-visibility-panel
discipline: GEO
group: ai-visibility-panel
type: functional-group
tags: [measurement, citation-tracking, probabilistic-sampling]
related: [std-off-site-authority, aeo-group-snippet-aio-tracking]
last_updated: 2026-07-29
---

# AI Visibility Panel

## Overview

The core GEO measurement instrument — nothing replaces it. Citations from generative engines are **probabilistic, not fixed**: the same prompt asked twice can cite different sources. There is no "rank 1" to hold, so a single check tells you almost nothing.

## How it works

```
Pick 50-100 queries with real commercial value
  ("best X for Y", "X vs Y", "X pricing", "alternatives to [competitor]")
        │
        ▼
Run each across ChatGPT, Perplexity, Google AI Overviews, Gemini, Copilot
        │
        ▼
Run each query 3-5 TIMES (not once — citations are probabilistic)
        │
        ▼
Log per run: cited-and-linked / mentioned-unlinked / absent
  + which competitors appear + which sources are cited
        │
        ▼
Store in a spreadsheet with a date column, repeat monthly
```

**The correct metric:** across N runs of a query panel, what percentage of responses mention or cite you? That is a probability distribution, not a leaderboard position.

## Standards it touches

STD-30 (AI visibility panel) — `../../standards/07-off-site-authority.md`. This is the discipline-level implementation of that standard; `../../AEO/groups/05-snippet-aio-tracking.md` covers the Google-specific slice (featured snippets, AI Overviews).

## Tools & what to check

| Tool | Role |
|---|---|
| Manual panel (spreadsheet) | Ground truth — tedious, most trustworthy |
| Profound, Peec AI, Otterly.AI | Sampling convenience at scale — all disagree with each other because they sample a probabilistic system differently |
| Semrush AI Toolkit / Ahrefs Brand Radar | Convenient if already paying for the suite |

**How to use paid tools properly:** never trust a single sample; track the trend, not the absolute number (not comparable across tools); the competitor co-mention list — the narrative gap — is the real output. Full detail: `../../tools/tools-reference.md` TOOL-07.

## Key metrics / thresholds

- Sample size: **3–5 runs per query minimum**
- Panel size: **50–100 queries**
- Cadence: **monthly**
- Worth paying for only *after* technical foundation (Level 0–1 standards) and content restructuring are done — paying to watch a number you haven't given a reason to move is the most common wasted spend in this category
