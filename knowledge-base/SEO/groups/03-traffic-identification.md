---
id: seo-group-traffic-identification
discipline: SEO
group: traffic-identification
type: functional-group
tags: [ga4, analytics, attribution, ai-referrals, conversion]
related: [seo-group-google-search-console, std-off-site-authority]
last_updated: 2026-07-29
---

# Traffic Identification

## Overview

The functional group responsible for knowing *where* visitors come from and *what* they do — Google Analytics 4 territory. In 2026 this is harder than it sounds: AI-referred traffic is measurably under-attributed (missing `Referer` headers from native apps), so "traffic identification" now means triangulating across several signals, not reading one channel report.

## How it works

```
GA4 default channel groups (Organic Search, Direct, Referral, Paid, ...)
        │
        ▼
+ custom "AI Search" channel — source contains chatgpt.com, perplexity.ai,
  gemini.google.com, copilot.microsoft.com, claude.ai, you.com, phind.com
        │
        ▼
Cross-check against GSC branded-search-volume trend (best proxy for
AI-driven awareness that GA4 cannot attribute directly)
        │
        ▼
Cross-check against Direct-traffic trend (AI-influenced journeys that
lost their referrer entirely land here)
        │
        ▼
Add self-reported attribution: "How did you hear about us?" on
signup/demo forms — often the most accurate single data point you have
```

**Why this matters more than it used to:** a large share of AI-influenced sessions arrive with no referrer and land in Direct, or as branded organic search, which analytics credits elsewhere. Treat measured AI referrals as the visible tip, not the whole iceberg.

## Standards it touches

- STD-26 (brand mentions) — `../../standards/07-off-site-authority.md` — branded search volume is the measurement proxy for this standard
- STD-30 (AI visibility panel) — `../../standards/07-off-site-authority.md` — GA4's AI Search channel is a *complement* to the manual panel, not a replacement
- The "404 hallucination" check (`../../../research/04-technical-requirements.md` §7) — AI assistants send visitors to 404s ~2.87x more often than Google Search does; GA4 is where you catch it

## Tools & what to check — full detail

Report-by-report, metric-by-metric reference: `../../tools/tools-reference.md` TOOL-02.

## Key metrics / thresholds

- **AI Search channel session share:** track trend direction, not absolute value — it structurally undercounts
- **404-by-AI-referrer:** should trend toward zero; any recurring hallucinated path needs a redirect
- **Direct + branded search, combined trend:** the best available proxy for total AI-driven awareness
- **Conversion rate, AI Search vs. Organic Search:** directionally expect AI-referred sessions to convert higher (vendor studies report 4.4–9x) — treat the multiple as approximate, not a KPI to chase

**Cadence:** monthly channel-mix and conversion review; 404-by-AI-referrer check monthly.
