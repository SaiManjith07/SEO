---
id: llmo-group-training-corpus-access
discipline: LLMO
group: training-corpus-access
type: functional-group
tags: [gptbot, ccbot, google-extended, training-data, crawler-policy]
related: [std-access-indexability, std-llmo]
last_updated: 2026-07-29
---

# Training-Corpus Access

## Overview

The functional group covering LLMO's most durable lever: whether your content becomes part of a model's parametric knowledge, not just something it can retrieve live. This is a 12+ month play — the payoff is showing up unattributed in a future model generation's "knowledge," not a citation next week.

## How it works

```
Decide, per training bot, deliberately (not by default):
  GPTBot (OpenAI training)
  CCBot (Common Crawl — feeds many models downstream, high leverage)
  Google-Extended (Gemini training/grounding)
  Applebot-Extended (Apple Intelligence)
  Bytespider (ByteDance — heavy load, low return for most sites)
        │
        ▼
Trade-off: allowing training crawlers means your content may answer
questions without sending traffic. Crawl-to-referral ratios (Cloudflare
Radar): Google ~5:1, OpenAI GPTBot ~857-1,276:1, Anthropic ClaudeBot
~11,122-23,951:1
        │
        ▼
Sensible default: allow all RETRIEVAL bots unconditionally (they send
traffic); make a deliberate business-model decision on pure TRAINING
bots
```

**Important caveat:** native-app referrals send no `Referer:` header, so the ratios above likely overstate the imbalance — Cloudflare's own words: "these calculations may overstate the respective ratios, but it is unclear by how much."

## Standards it touches

STD-03 (Training-vs-retrieval crawler trade-off) — `../../standards/01-access-indexability.md`, cross-referenced from STD-31/32 — `../../standards/08-llmo.md`.

## Tools & what to check

Server logs / Log File Analyser (`../../tools/tools-reference.md` TOOL-05) — the only ground truth for which bots are actually reaching you and getting 200s.

## Key metrics / thresholds

No universal right answer — this is a business-model decision, not a pass/fail standard. A publisher monetizing pageviews faces a genuinely different calculation than a brand that wants to be recommended. Document the decision explicitly rather than leaving it to robots.txt defaults.
