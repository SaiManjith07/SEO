---
id: discipline-aeo
type: discipline-index
discipline: AEO
tags: [aeo, answer-engines, featured-snippets, ai-overviews]
related: [std-content-aeo-geo, std-rendering]
last_updated: 2026-07-29
---

# AEO — Answer Engine Optimization

**Target surface:** direct answers — featured snippets, AI Overviews, voice, People Also Ask. **Unit of competition:** the answer (being *the* cited source), not a ranked position. AEO is about *answer format*: being extractable, direct, and structured. Full background: `../../research/02-AEO-answer-engine-optimization.md`.

This folder does not duplicate standard content — each standard lives once in `../standards/`. This is an index: which standards matter to AEO, and why.

---

## How AEO works

```
Query → answer engine decomposes it → retrieves candidate PASSAGES across the index
      → scores passages: relevance · authority · clarity · freshness · verifiability
      → synthesises the answer from the highest-scoring passages
      → attributes citations to source URLs
```

Three consequences that change how you write:

1. **The unit is the passage, not the page.** A 4,000-word guide competes as ~40 independent chunks. Each must stand alone.
2. **Retrieval happens per sub-question.** One page can be cited for one sub-question and ignored for the rest.
3. **Extractability is a ranking factor in itself.** If the answer is spread across three paragraphs and depends on earlier context, the model picks a competitor whose answer is one clean self-contained block.

Full mechanism detail: `../../research/02-AEO-answer-engine-optimization.md` §3.

---

## Functional groups

For day-to-day operational work, AEO splits into six functional groups — each is its own file in `groups/`:

| Group | Covers |
|---|---|
| `groups/01-answer-structuring.md` | The BLUFF authoring pattern — answer-first sections |
| `groups/02-question-research.md` | Sourcing real question phrasing for headings |
| `groups/03-schema-faq-howto.md` | FAQPage/HowTo schema implementation |
| `groups/04-content-chunking-extractability.md` | Atomic paragraphs, pronoun density, chunk-level structure |
| `groups/05-snippet-aio-tracking.md` | Measuring featured-snippet and AI Overview citation |
| `groups/06-freshness-operations.md` | The refresh cadence that keeps content citation-eligible |

## Standards that apply

| Standard | Title | Why it matters to AEO | Where |
|---|---|---|---|
| STD-01, STD-02 | Crawler/CDN access for retrieval bots | `OAI-SearchBot`, `PerplexityBot` etc. must reach the page for live answer retrieval | `../standards/01-access-indexability.md` |
| STD-06 | Content present in raw HTML | **The differentiator.** GPTBot/ClaudeBot/PerplexityBot largely don't execute JavaScript — an SPA shell is invisible | `../standards/02-rendering.md` |
| STD-07 | No content gated behind interaction | Accordion/tab content must be in the DOM at load | `../standards/02-rendering.md` |
| STD-09 | JSON-LD format and validity | Schema tells retrieval systems what content *is* without inference | `../standards/03-structured-data.md` |
| STD-11 | Content-type schema coverage | `FAQPage` and `HowTo` directly match the question-answer shape AI queries look for | `../standards/03-structured-data.md` |
| STD-12 | Content parity | An FAQ in schema that isn't visible is flagged as spammy structured data | `../standards/03-structured-data.md` |
| STD-17–19 | Semantic HTML | Real headings/lists/tables are how a model finds chunk boundaries | `../standards/05-semantic-html.md` |
| STD-20 | Answer-first structure (BLUFF) | The first 100 words of a section are the primary citation candidate | `../standards/06-aeo-geo-content.md` |
| STD-21 | Question-shaped headings | Matches the phrasing of the query the answer engine is trying to fill | `../standards/06-aeo-geo-content.md` |
| STD-22 | Chunking discipline | 2–4 line atomic paragraphs — reported 2–4x citation-rate gains from restructuring alone | `../standards/06-aeo-geo-content.md` |
| STD-24 | Freshness as an eligibility gate | 83% of AI citations on commercial queries come from pages updated within 12 months | `../standards/06-aeo-geo-content.md` |
| STD-25 | Format bonus: listicles and tables | 43.8% of ChatGPT-cited pages are listicles — pre-chunked by nature | `../standards/06-aeo-geo-content.md` |
| STD-27 | Third-party editorial presence | Being inside a "Best X" listicle is worth more than what you publish yourself | `../standards/07-off-site-authority.md` |
| STD-30 | AI visibility panel | The core measurement instrument — citations are probabilistic, sample 3–5x per query | `../standards/07-off-site-authority.md` |

## Primary tools

Google Search Console (TOOL-01) for featured-snippet and PAA tracking; an AI-visibility tool (TOOL-07: Profound, Peec, Otterly) plus the manual query panel for citation tracking; AnswerThePublic/AlsoAsked (see `../../research/06-tools-and-platforms.md` §4) for sourcing question-shaped headings.

## Key fact worth remembering

Rank and citation have decoupled: AIO citation rate for top-10 pages fell from 76% to 38% in one year (ALM Corp, 173,000 URLs). Ranking #1 no longer guarantees the citation — extractability does.
