---
id: seo-group-competitive-analysis
discipline: SEO
group: competitive-analysis
type: functional-group
tags: [backlinks, brand-mentions, narrative-gap, ahrefs, semrush]
related: [seo-group-keyword-analyzer, std-off-site-authority]
last_updated: 2026-07-29
---

# Competitive Analysis

## Overview

The functional group responsible for understanding where competitors are winning that you aren't — and in 2026 that question has two layers: classic backlink/keyword competition, and the newer **narrative gap** (which queries name a competitor in an AI answer while you're absent). The second layer is now the higher-leverage one.

## How it works

```
Classic layer:
  Competitor backlink profile (Ahrefs/Semrush Site Explorer)
    → referring domains, top pages, organic keyword overlap
  Competitor content gap
    → topics they rank for that you don't

Narrative-gap layer (GEO-driven, higher leverage):
  Run the AI visibility panel (50-100 queries, 3-5 samples each)
    → for every query, log which competitors are named/cited
    → every query where a competitor appears and you don't
      = a line item on your content/PR roadmap, ranked by commercial value
```

**Why the narrative gap matters more than it used to:** brand mentions correlate ~3x more strongly with AI visibility than backlinks (0.664 vs. 0.218), and the mention doesn't need to be linked — so a competitor being *named* in a listicle you're absent from is a bigger loss than losing a backlink race.

## Standards it touches

- STD-26 (brand mentions beat backlinks) — `../../standards/07-off-site-authority.md`
- STD-27 (third-party editorial presence) — `../../standards/07-off-site-authority.md`
- STD-30 (AI visibility panel — the instrument that produces the narrative gap) — `../../standards/07-off-site-authority.md`

Full discipline context: `../../GEO/README.md`.

## Tools & what to check — full detail

| Tool | Role |
|---|---|
| Ahrefs Site Explorer / Content Explorer, or Semrush Backlink Analytics (`../../tools/tools-reference.md` TOOL-06) | Backlink profile, referring domains, keyword overlap, **unlinked brand mentions of competitors and yourself** |
| AI-visibility tools — Profound, Peec AI, Otterly.AI (TOOL-07) | Citation frequency and competitor co-mention sampling at scale |
| Manual AI visibility panel | The trustworthy baseline — run by hand, 3–5 samples per query, quarterly minimum |

## Key metrics / thresholds

- **Referring domains / DR / DA:** track trend only — these are vendor metrics Google doesn't use, never set a numeric target against them
- **Narrative gap list length:** the actionable output isn't a score, it's the list itself — every query where a competitor is named and you aren't, ranked by commercial value of that query
- **Citation frequency %, you vs. named competitors:** sampled across the AI visibility panel, trended monthly

**Cadence:** backlink/content gap — quarterly. AI visibility panel and narrative gap — monthly minimum, using paid tools for sampling convenience and the manual panel as ground truth.
