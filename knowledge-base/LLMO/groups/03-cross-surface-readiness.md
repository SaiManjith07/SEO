---
id: llmo-group-cross-surface-readiness
discipline: LLMO
group: cross-surface-readiness
type: functional-group
tags: [rendering, semantics, evidence-density, shared-mechanism]
related: [std-rendering, std-semantic-html, std-content-aeo-geo]
last_updated: 2026-07-29
---

# Cross-Surface Readiness

## Overview

The functional group that makes STD-31's decision ("no separate LLMO rule module") concrete and checkable. Cross-surface readiness means: does this content work for *any* LLM-mediated surface, not just the named consumer answer engines? This group is a checklist assembled entirely from standards that live elsewhere — nothing here is new content.

## How it works

```
Same content, evaluated against every surface at once:
        │
        ▼
Can a non-JS fetcher read it at all?          → STD-06 (rendering)
        │
        ▼
Does it have clean chunk boundaries for any tokenizer?  → STD-17-19
        │
        ▼
Is it specific and verifiable enough to be safely
reproduced by any model?                       → STD-20-23
        │
        ▼
Can training crawlers reach it, if that's the intended
policy?                                         → STD-01, STD-03
```

If content passes all four, it is ready for ChatGPT search, an enterprise Copilot indexer, a third-party RAG pipeline, and a future training run — simultaneously, because the underlying mechanism is identical across all of them.

## Standards it touches

STD-06, STD-17, STD-18, STD-19, STD-20–23, STD-01, STD-03 — this group does not add standards, it composes existing ones from `../../standards/02-rendering.md`, `../../standards/05-semantic-html.md`, `../../standards/06-aeo-geo-content.md`, and `../../standards/01-access-indexability.md` into a single cross-surface checklist.

## Tools & what to check

No new tool — run the checks already documented in `../../tools/tools-reference.md` TOOL-01 (GSC URL Inspection for the raw/rendered diff) and TOOL-05 (server logs for access). The distinguishing move is running them with the question "would this work for a surface I haven't even named yet?" rather than "would this work for ChatGPT specifically?"

## Key metrics / thresholds

Pass/fail is inherited from the composed standards — there's no separate threshold. A page passing STD-06, 17–19, and 20–23 is cross-surface ready by construction.
