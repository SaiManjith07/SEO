---
id: aeo-group-schema-faq-howto
discipline: AEO
group: schema-faq-howto
type: functional-group
tags: [faqpage, howto, json-ld, rich-results]
related: [std-structured-data, aeo-group-answer-structuring]
last_updated: 2026-07-29
---

# Schema: FAQ & HowTo

## Overview

The functional group responsible for the two schema types that most directly match the question-answer shape of AI queries: `FAQPage` and `HowTo`. This is the AEO-specific slice of the broader structured-data standard — see `../../SEO/README.md` for the full schema picture including `Organization` and `Article`.

## How it works

```
Genuine, visible Q&A content on the page
        │
        ▼
Mark up with FAQPage schema — question + acceptedAnswer pairs must
match visible text exactly (content parity, non-negotiable)
        │
        ▼
Step-by-step guides get HowTo schema — numbered steps, each with
name + text, optional image/tool/supply
        │
        ▼
Validate — zero errors, always
```

**The hard rule, repeated because it's enforced, not theoretical:** if schema claims an FAQ that isn't visible on the rendered page, Google flags it as spammy structured data with real ranking consequences.

## Standards it touches

- STD-09 (JSON-LD validity) — `../../standards/03-structured-data.md`
- STD-11 (Content-type schema coverage — FAQPage, HowTo specifically) — `../../standards/03-structured-data.md`
- STD-12 (Content parity — the hard rule) — `../../standards/03-structured-data.md`

## Tools & what to check

| Tool | Role |
|---|---|
| Google Rich Results Test | Run after every schema change — zero errors required |
| Schema.org Validator | Catches vocabulary issues Google's tool ignores |
| Merkle Schema Markup Generator | Free — generate JSON-LD without writing it by hand |

Full detail: `../../tools/tools-reference.md` TOOL-04.

## Key metrics / thresholds

- **Zero invalid items** in GSC Enhancements report, per FAQ/HowTo type
- **100% content parity** — every question/answer or step in schema has a visible on-page match
- FAQPage only where genuine visible Q&A exists — never manufactured to gain the rich result
