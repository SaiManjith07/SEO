---
id: discipline-geo
type: discipline-index
discipline: GEO
tags: [geo, generative-engines, query-fan-out, princeton]
related: [std-content-aeo-geo, std-off-site-authority]
last_updated: 2026-07-29
---

# GEO — Generative Engine Optimization

**Target surface:** LLM-generated responses — ChatGPT, Gemini, Perplexity, Claude, Copilot. **Unit of competition:** the passage (being retrieved and synthesised into a response). GEO is about *source selection inside a generative pipeline*: being authoritative, quotable, and an entity the model trusts. Full background: `../../research/03-GEO-generative-engine-optimization.md`.

This folder does not duplicate standard content — each standard lives once in `../standards/`. This is an index: which standards matter to GEO, and why.

---

## Functional groups

For day-to-day operational work, GEO splits into six functional groups — each is its own file in `groups/`:

| Group | Covers |
|---|---|
| `groups/01-query-fan-out-mapping.md` | Covering the sub-question space, not the head keyword |
| `groups/02-evidence-density-authoring.md` | The Princeton trio — statistics, quotations, citations |
| `groups/03-off-site-mention-monitoring.md` | Brand mentions vs. backlinks, the three mention tiers |
| `groups/04-ai-visibility-panel.md` | The core probabilistic-sampling measurement instrument |
| `groups/05-platform-specific-optimization.md` | Why ChatGPT, Perplexity, AI Mode and AI Overviews each need a different emphasis |
| `groups/06-video-youtube-presence.md` | The highest-ROI underused GEO channel |

## Standards that apply

| Standard | Title | Why it matters to GEO | Where |
|---|---|---|---|
| STD-01, STD-02 | Crawler/CDN access | Retrieval bots and training crawlers alike need to reach the page | `../standards/01-access-indexability.md` |
| STD-03 | Training-vs-retrieval crawler trade-off | Governs whether your content enters model training corpora (long-term brand authority) vs. only live retrieval | `../standards/01-access-indexability.md` |
| STD-06 | Content present in raw HTML | RAG can only cite what retrieval returns — an SPA shell returns nothing | `../standards/02-rendering.md` |
| STD-09, STD-10 | Schema validity + Organization schema | Entity disambiguation — how a generative model judges source reliability | `../standards/03-structured-data.md` |
| STD-17–19 | Semantic HTML | Passages are embedded independently; clean structure = clean chunk boundaries | `../standards/05-semantic-html.md` |
| STD-20–22 | BLUFF, question headings, chunking | Query fan-out means you're targeting a sub-question space, not one keyword — each chunk must stand alone | `../standards/06-aeo-geo-content.md` |
| STD-23 | Evidence density (the Princeton trio) | The only peer-reviewed finding in this field: quotes +27.8%, statistics +25.9%, citations +24.9% visibility lift. Keyword stuffing does *not* work | `../standards/06-aeo-geo-content.md` |
| STD-24 | Freshness as an eligibility gate | ChatGPT's top-cited pages: 76% updated within 30 days | `../standards/06-aeo-geo-content.md` |
| STD-26 | Brand mentions beat backlinks | The most counterintuitive GEO finding: mentions correlate 0.664 with AI visibility vs. 0.218 for backlinks — **~3x stronger**, and the mention doesn't need to be linked | `../standards/07-off-site-authority.md` |
| STD-27 | Third-party editorial presence | AI trusts third-party consensus over self-description | `../standards/07-off-site-authority.md` |
| STD-28 | Entity consistency | `sameAs`, NAP, Wikidata — how a model builds a picture of "who's credible in X" | `../standards/07-off-site-authority.md` |
| STD-29 | YouTube / video presence | Most-cited domain in Google's AI Overviews; 0.737 correlation with ChatGPT visibility. Models process the **audio transcript** | `../standards/07-off-site-authority.md` |
| STD-30 | AI visibility panel | Citations are probabilistic — same prompt, different sources on different runs. Sample, don't single-shot | `../standards/07-off-site-authority.md` |

## Primary tools

The manual AI visibility panel plus a paid tool (TOOL-07: Profound, Peec, Otterly) for citation-frequency sampling; Ahrefs Content Explorer or Brand24 (TOOL-06) for unlinked brand-mention discovery — this is now higher-leverage than backlink building.

## Key mental model

```
Query → decompose into 9–11+ sub-queries (fan-out) → retrieve passages per sub-query → synthesise → cite
```

GEO is ~80% a retrieval problem, not a writing problem. Your passage must be embedded, indexed, semantically close to the sub-query, and self-contained enough to survive extraction.
