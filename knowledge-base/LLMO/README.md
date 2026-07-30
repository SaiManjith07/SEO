---
id: discipline-llmo
type: discipline-index
discipline: LLMO
tags: [llmo, third-party-llm, training-corpora]
related: [std-llmo, std-content-aeo-geo]
last_updated: 2026-07-29
---

# LLMO — Large Language Model Optimization

**Target surface:** any LLM-mediated product, not just the named consumer answer engines — enterprise copilots, custom GPTs/plugins, third-party RAG systems, code assistants, future training corpora. LLMO is the superset of AEO and GEO: AEO is about answer format, GEO is about source selection inside a generative pipeline, **LLMO is optimizing for the fact that a language model, of any kind, in any product, may read, retrieve, or be trained on this content.**

This folder does not duplicate standard content — each standard lives once in `../standards/`. This is an index: which standards matter to LLMO, and why.

---

## How LLMO works

There is no single "LLMO pipeline" the way SEO has crawl→index→rank or GEO has query fan-out — that is the point of the discipline. LLMO works by treating every LLM-mediated surface as running the *same underlying mechanism*: a model (or a system built on one) fetches or was trained on content, and can only reproduce what it could parse and trust.

```
Any LLM-mediated surface (chat search, enterprise copilot, custom GPT, code assistant, training run)
        │
        ▼
Can the fetcher/trainer even reach the content?        → STD-01, STD-03 (access)
        │
        ▼
Is the content present without executing JavaScript?    → STD-06 (rendering)
        │
        ▼
Is the structure clean enough to chunk correctly?        → STD-17–19 (semantics)
        │
        ▼
Is the content specific and verifiable enough to safely reproduce?  → STD-20–23 (evidence)
```

Optimize the mechanism once, and every LLM-mediated surface benefits — that is why STD-31 rejects a separate rule module. The only genuinely distinct LLMO work is the business-development layer (STD-32): licensing, plugin ecosystems, copilot partnerships — relationships, not content properties.

---

## Functional groups

LLMO splits into four functional groups — each is its own file in `groups/`:

| Group | Covers |
|---|---|
| `groups/01-training-corpus-access.md` | The GPTBot/CCBot/Google-Extended access policy decision |
| `groups/02-third-party-integration-surfaces.md` | GPT-store presence, enterprise copilots, publisher licensing — business development, not page checks |
| `groups/03-cross-surface-readiness.md` | The composed checklist proving STD-31's "no separate module" decision |
| `groups/04-retrieval-rag-readiness.md` | Structuring content for any third-party RAG ingestion, grounded in `../architecture-notes/retrieval-architecture.md` |

## The one decision that defines this discipline

**LLMO does not get its own rule category.** See `../standards/08-llmo.md` STD-31 for the full rationale — organizing checks by marketing acronym (one module per term) produces multiple modules testing the same underlying thing. Every mechanism below already exists as a standard elsewhere; this folder is the LLMO *lens* on standards that live in SEO/AEO/GEO.

## Standards that apply

| Standard | Title | Why it matters to LLMO | Where |
|---|---|---|---|
| STD-01 | Crawler access via robots.txt | `GPTBot`, `CCBot`, `Google-Extended`, `Applebot-Extended` control whether content enters *any* model's training data, not just live search | `../standards/01-access-indexability.md` |
| STD-03 | Training-vs-retrieval crawler trade-off | The core LLMO access decision — training-corpus presence is a 12+ month play, retrieval is days-to-weeks | `../standards/01-access-indexability.md` |
| STD-06 | Content present in raw HTML | Any LLM fetcher without a JS renderer needs this — the mechanism is identical whether the caller is ChatGPT, a code assistant, or an enterprise RAG pipeline | `../standards/02-rendering.md` |
| STD-17–19 | Semantic HTML | Clean chunk boundaries matter to *any* tokenizer/parser, not just named answer engines | `../standards/05-semantic-html.md` |
| STD-20–23 | Answer-first, chunking, evidence density | The same content properties that make a passage safely reproducible by one LLM make it safely reproducible by all of them | `../standards/06-aeo-geo-content.md` |
| STD-31 | Do not build a separate rule module for LLMO | The organizing principle for this entire discipline | `../standards/08-llmo.md` |
| STD-32 | Third-party LLM integration surfaces | GPT-store presence, enterprise copilot visibility, publisher licensing deals — the business-development side of LLMO, not a page-level check | `../standards/08-llmo.md` |
| STD-33 | Optional provision of llms.txt | A proposed standard format to provide markdown-formatted context for LLM extraction, though current adoption/fetch rate is near-zero | `../standards/08-llmo.md` |

## Primary tools

No dedicated tool exists for this discipline (see `../tools/tools-reference.md` TOOL-01–08 verification map, STD-31/32 row). Tracked via the same access and content tools used for SEO/AEO/GEO, plus manual monitoring of vendor GPT/plugin ecosystems, enterprise copilot partnerships, and publisher licensing announcements — this is a watch list, not a dashboard.

## Why this folder exists despite STD-31

Because the user-facing question — "am I optimized for LLMs generally, beyond just ChatGPT/Gemini/Perplexity search?" — is a real and reasonable one to ask, even though the *engineering* answer is "yes, if you pass the standards above." This index exists to answer that question without duplicating the underlying checks.
