---
title: Retrieval Architecture — AI Engineering Knowledge Base
status: finalized (design phase)
owner: Pavan Kumar Kunukuntla
last_updated: 2026-07-28
---

# Retrieval Architecture Design

## 1. Purpose

Retrieval engine for a hierarchical, Markdown-based AI engineering knowledge base
(`Providers / Services / Comparisons`), exposed to an IDE coding agent via MCP.
Goal: return the most relevant, correctly-scoped context with minimal latency —
not a generic RAG pipeline.

---

## 2. Knowledge Base Prep (do before indexing)

**Every `.md` file gets YAML frontmatter:**

```yaml
---
id: openai-gpt-image
provider: OpenAI
service: Image Generation
model: GPT Image
type: model-doc          # model-doc | comparison | decision-guide
tags: [pricing, api, image-generation]
related: [flux-1, dalle-3]
last_updated: 2026-07-01
---
```

**Consistent heading structure across files of the same type** (e.g. every
model doc uses `## Overview`, `## Pricing`, `## Prompting`, `## API`,
`## Limitations`) so section names are comparable across providers.

---

## 3. Indexing Pipeline (offline, runs on file change)

```
Repo scan (hash + mtime diff → incremental only)
        │
        ▼
Parse frontmatter + Markdown heading structure
        │
        ▼
Heading-based chunking (parent-child, heading_path preserved)
        cap ~500 tokens/chunk, split oversized sections at paragraph
        boundaries while inheriting the same heading_path
        │
        ▼
Contextual retrieval step: prepend a short LLM-generated
context blurb to each chunk before embedding
        │
        ▼
Metadata attach (from frontmatter + folder path)
        │
        ▼
Embed (dense) ──────────────┐
        │                    │
        ▼                    ▼
  Qdrant collection     Sparse/BM25 vectors
  (dense + sparse in one collection, same chunk ID)
        │
        ▼
Manifest (SQLite): chunk_id → file → parent → siblings → related docs
```

- **Vector index type:** HNSW (Qdrant default). Correct choice at this scale
  (thousands–tens of thousands of chunks); IVF-PQ only matters past ~10M vectors.
- **Two storage tiers:** child chunks (searchable units) and parent
  docs/sections (for expansion).

---

## 4. Retrieval Pipeline (query-time)

```
Query
  │
  ▼
Intent detection
  keyword/regex match against known provider + service names first (free, instant)
  → fallback to a cheap LLM call only when ambiguous
  → also flags comparison-intent ("vs", "compare", "alternative to")
  │
  ▼
Metadata filter + document filter
  (Qdrant payload filter — provider / service / type / explicit path scope)
  │
  ▼
Hybrid search
  dense (HNSW) + sparse (BM25) → merged via Reciprocal Rank Fusion → top 20-30
  │
  ▼
Reranker (cross-encoder, e.g. bge-reranker-v2-m3) → top 5-8
  │
  ▼
Parent document resolution
  each surviving chunk → resolve parent section/file + sibling sections
  │
  ▼
Recursive expansion (conditional)
  only if comparison-intent flag is true
  follow `related:` links from frontmatter, capped at 1-2 hops
  (deterministic — no graph inference needed, links are already declared)
  │
  ▼
Dedup + context assembly
  ordered by heading_path (not raw relevance score), breadcrumb-labeled
  │
  ▼
Return to caller (MCP tool)
```

---

## 5. Design Decisions Locked

| Decision | Choice | Reason |
|---|---|---|
| Chunking | Heading-based, parent-child, ~500 token cap | Matches existing Markdown structure |
| Index algorithm | HNSW | Best latency/recall tradeoff at this corpus size |
| Search mode | Hybrid (dense + BM25), RRF merge | Handles both exact terms and semantic queries |
| Filtering | Metadata filter (inferred) + document filter (explicit) | Two distinct constraint sources, same mechanism |
| Recursion | Frontmatter `related:` links, 1-2 hops, comparison-intent only | Deterministic, avoids noise on simple factual queries |
| Reranker | Cross-encoder (self-hosted, e.g. bge-reranker-v2-m3) | Highest ROI step after chunking; free to run |
| Contextual retrieval | LLM-generated context blurb prepended per chunk before embedding | Cheap one-time cost, removes chunk ambiguity |
| Intent detection | Keyword match first, LLM fallback only if ambiguous | Avoids an LLM call on every query |
| Exposure | Single MCP tool: `search_knowledge_base(query, filters=None)` | Server keeps index + reranker loaded in memory — the actual latency lever |

---

## 6. Explicitly Deferred (not in v1)

- ColBERT / late-interaction retrieval — only revisit if reranking alone misses precision on exact numeric/spec queries
- Full GraphRAG (community detection, multi-level summarization) — corpus already has deterministic relationships via `related:` frontmatter
- Agentic/iterative multi-hop retrieval — the IDE agent can already re-call the MCP tool if one pass is insufficient; no need to build iteration into the retrieval layer itself
- Query fusion (multi-query expansion) — add only if ambiguous broad queries prove to be a real failure mode in usage

---

## 7. Build Order

1. Frontmatter pass over existing `.md` files (scripted draft generation + manual review)
2. Indexer: scanner → chunker → contextual-retrieval step → embed → Qdrant + manifest
3. Retriever: intent detection → filter → hybrid search → rerank → expand → assemble
4. MCP server wrapping the retriever as `search_knowledge_base()`
