---
id: aeo-group-freshness-operations
discipline: AEO
group: freshness-operations
type: functional-group
tags: [freshness, refresh-cadence, content-ops]
related: [std-content-aeo-geo, geo-group-evidence-density-authoring]
last_updated: 2026-07-29
---

# Freshness Operations

## Overview

The functional group responsible for running a standing content-refresh cycle — because freshness is an **eligibility gate** for AI citation, not a nice-to-have. Stale pages are structurally excluded from commercial AI answers regardless of how good the content otherwise is.

## How it works

```
Cadence table, by content type (below)
        │
        ▼
A refresh means SUBSTANTIVE change: new data, changed recommendations,
added sections — never just a date-stamp edit on unchanged content
(detectable, and gains nothing)
        │
        ▼
Prioritise: high-impression, position 4-15, commercial/comparison
intent, not refreshed in 12+ months (pulled from GSC)
        │
        ▼
Re-stamp the visible date only after the substantive edit lands
```

### Cadence table

| Content type | Refresh cadence |
|---|---|
| Commercial/comparison/pricing pages | Quarterly |
| Statistics and data roundups | Quarterly, or whenever underlying data updates |
| How-to guides for versioned software | On each major version |
| Evergreen conceptual explainers | Annually |

## Standards it touches

STD-24 (Freshness as an eligibility gate) — `../../standards/06-aeo-geo-content.md`

## Tools & what to check

Google Search Console (`../../tools/tools-reference.md` TOOL-01) — pull the candidate list: high impressions, positions 4–15, not refreshed in 12+ months. No dedicated freshness-tracking tool exists; this is a calendar/process function, not a scored check.

## Key metrics / thresholds

- **83%** of AI citations on commercial queries come from pages updated within **12 months** (AirOps)
- **76%** of ChatGPT's top-cited pages updated within **30 days**
- Both figures point the same direction: build a real refresh cadence, quarterly minimum for commercial pages
