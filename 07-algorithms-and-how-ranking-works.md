# The Algorithms — What's Actually Running, and How Ranking Is Won

Written for someone with an engineering background. This is the layer most SEO content skips.

---

## Part 1 — The information retrieval algorithms underneath

Google is an information retrieval system. Before the branded update names, there is real, published CS. Understanding it makes most SEO advice either obvious or obviously wrong.

### 1.1 The inverted index

The foundational data structure. Instead of `document → words`, you store `word → documents`:

```
"optimization" → [doc_1, doc_47, doc_9912, ...]
"generative"   → [doc_47, doc_882, ...]
```

A query intersects posting lists. This is why crawlability and indexation are prerequisites: **a document not in the index cannot be retrieved at any price.**

### 1.2 TF-IDF — term weighting

The classic relevance weight:

```
tf-idf(t, d) = tf(t, d) × log(N / df(t))
```

A term matters more if it appears often in *this* document (`tf`) and rarely across the *whole corpus* (`idf`). "The" appears everywhere → near-zero weight. "Interaction to Next Paint" is rare → high weight.

**What this actually teaches you:** keyword *density* was never the signal. Distinctive, specific terminology was. Naming precise entities beats repeating generic head terms — which is exactly what GEO research rediscovered 25 years later.

### 1.3 BM25 — what actually shipped

TF-IDF's practical successor and still a baseline in production IR:

```
score(D,Q) = Σ IDF(qᵢ) · [ f(qᵢ,D) · (k₁+1) ] / [ f(qᵢ,D) + k₁ · (1 - b + b · |D|/avgdl) ]
```

Two things it adds:

- **Term frequency saturation** (`k₁`) — the 10th occurrence of a word adds almost nothing over the 5th. **This is the mathematical reason keyword stuffing does not work.** It is not a penalty; the function just flattens.
- **Length normalisation** (`b`) — long documents don't win by accumulating matches.

**Takeaway:** there is no word count or density target. There never was. Mention the concept naturally; saturation handles the rest.

### 1.4 PageRank — the link graph

Larry Page and Sergey Brin's contribution, and the reason Google won:

```
PR(A) = (1-d)/N + d · Σ [ PR(Tᵢ) / C(Tᵢ) ]
```

where `d ≈ 0.85` (damping factor), `C(Tᵢ)` = outbound links from page `Tᵢ`.

A page is important if important pages link to it. Recursive, solved as the principal eigenvector of the link matrix — a random-surfer stationary distribution.

**Three consequences that are still true:**
1. A link from a high-PR page passes more value than one from a low-PR page.
2. Value is **divided** by outbound link count — a link from a page with 5 outbound links is worth far more than one from a page with 500.
3. **Internal linking redistributes PageRank inside your own site.** This is free, fully under your control, and consistently underused. Your homepage usually holds the most authority; how you link from it determines what gets crawled and ranked.

Google no longer uses raw PageRank — it's been layered with trust, topical relevance, and spam signals — but the graph intuition holds.

### 1.5 Embeddings and vector retrieval — the modern layer

Since roughly 2015, the decisive shift: text is mapped to dense vectors where **semantic similarity is geometric proximity**.

```
similarity(q, d) = cos(θ) = (q · d) / (‖q‖ ‖d‖)
```

Retrieval becomes approximate nearest-neighbour search in vector space (HNSW, ScaNN, FAISS).

**Why this changes everything for content:**
- A page can rank for a query containing **none of its exact words**, if the meaning matches
- Synonyms, paraphrases and related concepts are handled natively — no "LSI keyword" ritual required
- **Passages are embedded independently.** This is the technical basis of passage retrieval, chunking, and everything in files 02 and 03.
- Vague, hedged writing produces vague embeddings that sit near nothing in particular. **Specificity is literally geometric positioning.**

### 1.6 Learning to Rank

Final ordering is a supervised ML problem. Hundreds of features (relevance scores, link metrics, engagement proxies, freshness, page experience) feed a model trained on human-rated relevance judgments — the Quality Rater Guidelines are the *rubric for producing that training data*.

Approaches: pointwise, pairwise (RankNet), listwise (LambdaMART). Google's stack is a gradient-boosted / neural ensemble.

**Why "the 200 ranking factors" lists mislead:** it is not a weighted sum you can optimise term by term. Features interact non-linearly and weights are query-dependent. The model has learned that freshness matters enormously for "news" and not at all for "how does photosynthesis work."

### 1.7 RAG — how generative engines work

```
Query → embed → retrieve top-k passages → stuff into LLM context → generate answer with citations
```

**The critical insight:** the generation step can only cite what the retrieval step returned. GEO is therefore ~80% a *retrieval* problem, not a writing problem. Your passage must be embedded, indexed, semantically close to the sub-query, and self-contained enough to survive extraction.

---

## Part 2 — Google's named algorithms

The public history. Useful because each name marks a class of tactic that stopped working.

| Year | Name | What it targeted | Lasting lesson |
|---|---|---|---|
| 1998 | **PageRank** | Link-graph authority | Links = votes |
| 2003 | **Florida** | Keyword stuffing, hidden text | First major anti-spam shock |
| 2010 | **Caffeine** | Indexing infrastructure rebuild | Enabled near-real-time indexing |
| 2011 | **Panda** | Thin, duplicate, low-value content | Content quality became a ranking signal |
| 2012 | **Penguin** | Manipulative link building, anchor over-optimisation | Bad links became a *liability*, not just wasted spend |
| 2013 | **Hummingbird** | Full query rewrite for conversational search | Shift from keywords to **meaning** |
| 2014 | **Pigeon** | Local search | Local became its own ranking system |
| 2015 | **Mobile-friendly ("Mobilegeddon")** | Mobile usability | Led to mobile-first indexing (2019) |
| 2015 | **RankBrain** | ML for unseen queries (~15% are novel daily) | First ML system in core ranking |
| 2018 | **Medic** | YMYL content quality | E-A-T became a real constraint |
| 2019 | **BERT** | Bidirectional transformer language understanding | Context and word order finally understood; prepositions matter |
| 2021 | **MUM** | Multitask, multimodal, multilingual understanding | Cross-format, cross-language reasoning |
| 2021 | **Page Experience** | Core Web Vitals as ranking input | Performance became SEO's problem |
| 2022 | **Helpful Content** | Content written for engines, not people | Site-wide classifier, not page-level |
| 2022– | **SpamBrain** | AI-driven spam detection, link devaluation | Neutralises bad links rather than penalising |
| 2023– | **SGE → AI Overviews → AI Mode** | Generative answers in the SERP | Rank and citation decouple |
| 2024 | **HCU absorbed into core** | — | No more standalone recovery moments |
| Nov 2025 | **Site reputation abuse (algorithmic)** | Parasite SEO — rented authority | Borrowed authority now demoted automatically |
| Mar 2026 | **Core update** | **Holistic, site-wide Core Web Vitals scoring** | Biggest signal change since HCU — page-level CWV fixes no longer sufficient |
| Mar 2026 | **Spam update** | Scaled AI content abuse, expired domains, site reputation abuse | Mass-produced content enforcement tightened |
| May 2026 | **Core update** | Continued quality consolidation | — |

**The pattern across 25 years:** every update closes the gap between *appearing* authoritative and *being* authoritative. Every tactic that ever died was a way of faking a signal. This is the most reliable predictive heuristic in SEO — if a tactic manufactures the appearance of a quality Google wants, it has a shelf life.

---

## Part 3 — Prerequisites: what you must have

Ordered. Each level is worthless without the one before it.

### Level 0 — Existence
- A crawlable, indexable site on a domain you control
- HTTPS with a valid certificate
- **Content in the server-rendered HTML** (see file 04 — this is binary for AI engines)
- robots.txt that doesn't block what matters; CDN/WAF not blocking crawlers
- XML sitemap, submitted
- Google Search Console verified

### Level 1 — Comprehensibility
- Semantic HTML: real `<h1>`/`<h2>`, real lists, real tables
- Unique, descriptive title tags and meta descriptions
- Clean, stable, readable URLs
- Self-referencing canonicals
- Structured data: Organization + Article/Product minimum
- Mobile-responsive, no horizontal scroll, tappable targets
- Descriptive alt text

### Level 2 — Quality
- Content that fully answers the query, better than what currently ranks
- Demonstrated **experience** — first-hand use, original data, real examples
- Named authors with real, verifiable credentials
- Accurate, current, cited claims
- Core Web Vitals green at p75, **site-wide**
- No intrusive interstitials

### Level 3 — Authority
- Editorial backlinks from relevant, credible sites
- Brand mentions (linked and unlinked) across your industry
- Topical depth — a cluster, not a page
- Consistent entity identity: `sameAs`, matching NAP, Wikidata/Wikipedia if you legitimately qualify
- Third-party validation: reviews, listicle inclusions, analyst mentions

### Level 4 — Compounding
- Original research others cite
- Community presence (Reddit, forums, Stack Overflow)
- Video presence, especially YouTube
- Named, branded frameworks
- A real refresh cadence

**Most sites are stuck at Level 0 or 1 while buying Level 4 tactics.** Fix in order.

---

## Part 4 — How you actually optimise rank

### The loop

```
1. DIAGNOSE  →  where in the pipeline are you losing? (crawl/render/index/rank/CTR)
2. PRIORITISE →  impact ÷ effort, respecting level order
3. EXECUTE   →  ship one change class at a time
4. WAIT      →  weeks, not days. CrUX alone is a 28-day window.
5. MEASURE   →  against the Phase 0 baseline
6. REPEAT
```

**Ship one change class at a time.** If you redesign, rewrite and rebuild links simultaneously and traffic moves, you have learned nothing about why.

### Diagnose by symptom

| Symptom | Likely stage | Check |
|---|---|---|
| Not in Google at all | Crawl / index | `site:` search, GSC Coverage, robots.txt, `noindex` |
| Indexed, zero impressions | Retrieval | Content doesn't match any real query — validate demand exists |
| Impressions, poor position | Ranking | Authority or content depth vs. competitors |
| Good position, low CTR | Presentation | Title/description, or a SERP feature is absorbing the click |
| Good rank, no AI citation | Extractability | Structure, freshness, quotability (files 02–03) |
| Sudden site-wide drop | Algorithmic or technical | Update dates, manual actions, recent deploys |
| Slow multi-month decline | Competitive or quality | Competitors improved, or content decayed |

### The highest-leverage moves, ranked

**1. Fix indexation and rendering.** Binary. Fastest possible win. A page that isn't indexed has zero ceiling.

**2. Improve pages ranking 5–20.** They already have relevance and some authority. Getting position 8 → 3 typically multiplies clicks several-fold. This is the best effort-to-return ratio in SEO, and Search Console hands you the list for free.

**3. Fix title tags and meta descriptions on high-impression, low-CTR pages.** Hours of work, immediate effect, no waiting on authority.

**4. Consolidate cannibalising pages.** Three mediocre pages on one topic compete with each other and split link equity. Merge into one strong page, 301 the rest. Consistently underrated.

**5. Restructure content for extractability.** BLUFF openings, question headings, atomic paragraphs, statistics, tables. Reported 2–4x citation-rate gains with no new content.

**6. Refresh substantively.** Freshness is an eligibility gate for AI citation (83% within 12 months; 76% of ChatGPT's top-cited within 30 days).

**7. Build internal links** from your highest-authority pages to your priority pages. Free PageRank redistribution.

**8. Earn mentions and links.** Slowest, highest ceiling, most durable. Original data is the most reliable engine for this.

**9. Core Web Vitals to green, site-wide.** Now a composite site-wide signal post-March 2026.

### Timelines — set expectations honestly

| Change | Effect visible in |
|---|---|
| Indexation / rendering fix | Days–2 weeks |
| Title/meta changes | 1–4 weeks |
| Content restructure or refresh | 2–8 weeks |
| Schema | 2–6 weeks |
| Core Web Vitals | **Minimum 28 days** (CrUX window) |
| New content ranking | 3–6 months |
| Link/mention acquisition → visibility | 3–9 months |
| Recovery from a core update | 1–2 update cycles, often 6+ months |

**Anyone promising rankings in 30 days is selling the technical fixes as strategy.** Those are real and fast. Nothing else is.

---

## Part 5 — How to learn this properly

### A 90-day self-study path

**Weeks 1–2 — Foundations**
Read the [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide) and the [Moz Beginner's Guide](https://moz.com/beginners-guide-to-seo). Set up Search Console and Analytics on a real site. Follow [LearningSEO.io](https://learningseo.io/) as your map.

**Weeks 3–4 — Technical**
Google's crawling & indexing docs end to end. Crawl a real site with Screaming Frog. Read [web.dev](https://web.dev/) on Core Web Vitals. Implement schema and validate it.

**Weeks 5–6 — Content and intent**
Read the **[Quality Rater Guidelines](https://guidelines.raterhub.com/searchqualityevaluatorguidelines.pdf)** in full. Almost nobody does; it is the closest thing to a specification for "quality" that exists. Then learn keyword research and intent classification via Ahrefs or Semrush Academy.

**Weeks 7–8 — Links and authority**
Ahrefs' link-building material. Study real backlink profiles of sites that rank in your space. Understand PageRank distribution and internal linking.

**Weeks 9–10 — AEO/GEO**
Read the [Princeton GEO paper](https://arxiv.org/abs/2311.09735). Build a manual AI visibility panel. Restructure one page and measure it.

**Weeks 11–12 — Practise on something real**
The only step that matters. Run a site. Break things. Watch Search Console. **SEO is an empirical discipline — you cannot learn it by reading.**

### How to evaluate any SEO claim you encounter

Ask, in order:

1. **Is there a source?** Google documentation > large-scale study > case study > assertion.
2. **Correlation or causation?** Almost every "ranking factor study" is correlation. Sites with more backlinks also tend to have better content, bigger teams and stronger brands.
3. **Who benefits from you believing this?** A tool vendor publishing "X is critical" where X is what they sell.
4. **What year is it from?** Half of all SEO content on the web describes an algorithm that no longer exists.
5. **Does it manufacture a signal, or earn it?** If it fakes a quality Google wants, it has a shelf life.

### Persistent myths, briefly

| Myth | Reality |
|---|---|
| "Keyword density should be 2%" | BM25 saturation means no such target exists |
| "Domain Authority is a Google metric" | It's Moz's. Google doesn't use it. Same for Ahrefs' DR. |
| "Longer content ranks better" | Correlation from comprehensive topics needing more words. Length is not a signal. |
| "Google penalised my site" | Almost always algorithmic reassessment, not a penalty. Real penalties appear in GSC as manual actions. |
| "Submit to 500 directories" | Penguin killed this in 2012 |
| "Meta keywords tag matters" | Unused since 2009 |
| "Duplicate content penalty" | No penalty — just filtering/canonicalisation |
| "SEO is dead because of AI" | Google still sends ~87.6% of search referrals; all AI chatbots combined ~0.29% |

---

## Sources

- [GEO: Generative Engine Optimization — arXiv 2311.09735](https://arxiv.org/abs/2311.09735)
- [Google Search Central Documentation](https://developers.google.com/search/docs)
- [Google Search Quality Rater Guidelines (PDF)](https://guidelines.raterhub.com/searchqualityevaluatorguidelines.pdf)
- [Google Algorithm Update History: Complete 2026 Timeline — Digital Applied](https://www.digitalapplied.com/blog/google-algorithm-update-history-2026-complete-timeline)
- [Google Algorithm Updates 2026: May Core Update — Stan Ventures](https://www.stanventures.com/blog/google-algorithm-updates/)
- [A Complete Google Update History Timeline — Brafton](https://www.brafton.com/blog/seo/a-complete-and-actionable-google-update-history-timeline/)
- [Google's 200 Ranking Factors — Backlinko](https://backlinko.com/google-ranking-factors)
- [LearningSEO.io — Aleyda Solís](https://learningseo.io/)
- [web.dev — Core Web Vitals](https://web.dev/)
