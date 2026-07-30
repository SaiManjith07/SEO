---
id: std-llmo
type: standard-doc
discipline: [LLMO]
level: null
tags: [llmo, third-party-integrations, training-data]
related: [std-access-indexability, std-content-aeo-geo]
last_updated: 2026-07-29
---

# LLMO — Large Language Model Optimization

**LLMO is the umbrella term for making content retrievable and reproducible by any LLM-mediated surface** — not just the named answer engines (ChatGPT, Gemini, Perplexity) covered by AEO/GEO in `06-aeo-geo-content.md`, but also enterprise copilots (Microsoft 365 Copilot indexing your docs), custom GPTs/plugins, third-party RAG systems built on your content, code assistants citing your documentation, and future model training corpora. AEO is about *answer format*; GEO is about *source selection inside a generative pipeline*; **LLMO is the superset — optimizing for the fact that a language model, of any kind, in any product, may read, retrieve, or be trained on this content.**

---

### STD-31 — Do not build a separate rule module for LLMO
**Decision:** LLMO does not get its own rule category. Every mechanism that makes a page LLM-retrievable is already a standard elsewhere in this folder: server-rendered content (`02-rendering.md` STD-06) so any LLM's fetcher can read it, semantic HTML (`05-semantic-html.md` STD-17–19) so chunk boundaries are clean for any tokenizer/parser, evidence density and atomic paragraphs (`06-aeo-geo-content.md` STD-20–23) so any model can safely reproduce the content, and training-crawler access decisions (`01-access-indexability.md` STD-01, STD-03: `GPTBot`, `CCBot`, `Google-Extended`, `Applebot-Extended`) so the content can enter a training corpus at all.
**Rationale:** organizing checks by marketing acronym (one module for AEO, one for GEO, one for LLMO) produces four modules testing the same underlying thing — extractability, verifiability, access — under different names. Organize by *check type*, not by acronym.
**Source:** `../../architecture/13-system-architecture.md` §6 ("On the acronyms").

---

### STD-32 — Third-party LLM integration surfaces
**Requirement:** beyond the named consumer answer engines, actively track and, where relevant, pursue: (a) inclusion in vendor-published "GPT Store" / custom-GPT ecosystems for your category, (b) enterprise copilot visibility (if you sell B2B, whether Microsoft 365 Copilot or similar surfaces your product docs to a customer's internal Copilot), (c) any public API or licensing deal a model vendor offers publishers (as OpenAI has done with select media) — these directly control whether your content enters training data on favorable terms rather than being scraped.
**Source:** `../../research/03-GEO-generative-engine-optimization.md` §2 (training data vs. retrieval); `../../research/04-technical-requirements.md` §1 (training-bot policy).
**Gate:** N/A — a strategic/business-development standard, not a build-time check. Track as an ongoing initiative, not a page-level score.

---

### STD-33 — Optional provision of llms.txt
**Requirement:** Optional generation and provision of a `/llms.txt` file at the site root containing markdown-formatted descriptions of the website structure and content.
**Threshold:** Presence of `/llms.txt` with formatted links and summaries; low priority, optional (near-zero measured crawler adoption/fetch rates as of early 2026).
**Source:** `../../research/04-technical-requirements.md` §8; SE Ranking study.
**Verify:** Fetch `/llms.txt` and verify it contains structured markdown listing core sections and links.
**Gate:** SOFT (optional, negligible impact on search visibility).
