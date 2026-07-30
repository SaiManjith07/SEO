---
id: aeo-group-content-chunking-extractability
discipline: AEO
group: content-chunking-extractability
type: functional-group
tags: [chunking, pronoun-density, extractability, semantic-html]
related: [std-content-aeo-geo, std-semantic-html]
last_updated: 2026-07-29
---

# Content Chunking & Extractability

## Overview

The functional group responsible for making each paragraph survive being pulled out of context — because that is exactly what happens at retrieval time. A 4,000-word guide competes as roughly 40 independent chunks, not one document; each chunk needs to stand alone.

## How it works

```
2–4 line paragraphs, one idea per block
        │
        ▼
Every section standalone-readable — assumes no surrounding context
        │
        ▼
Proper nouns over pronouns ("Perplexity" not "the platform") —
chunking strips anaphoric reference, so a pronoun-heavy passage
becomes meaningless once extracted
        │
        ▼
Real semantic HTML — <h2>, <ul>, <table> — models parse HTML
structure to find chunk boundaries
        │
        ▼
Definition sentences: "X is Y that does Z" — matches the shape of
a definitional answer
```

**Rule of thumb:** if the page reads correctly as plain text with all CSS removed, it will chunk correctly. Test it by disabling CSS.

## Standards it touches

- STD-22 (Chunking discipline) — `../../standards/06-aeo-geo-content.md`
- STD-17, STD-18 (Heading structure, lists/tables) — `../../standards/05-semantic-html.md`

## Tools & what to check

No dedicated commercial tool scores this well — it's manual editorial review plus the future `seo_extractability` evaluator tool. Hemingway App (free / $20 once) is genuinely useful here: simple declarative sentences extract better, and Hemingway scores sentence complexity directly.

## Key metrics / thresholds

- Paragraph length: **2–4 lines**
- Pronoun density: low relative to named-entity density (heuristic — count "it/this/that/the platform" vs. actual proper nouns per paragraph)
- Reported **2–4x improvement in AI citation rates** from restructuring alone, no new content required (`../../../research/02-AEO-answer-engine-optimization.md` §4.3)
