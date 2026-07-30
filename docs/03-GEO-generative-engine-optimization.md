# GEO — Generative Engine Optimization

---

## 1. The founding research

**Aggarwal, Murahari, Rajpurohit, Kalyan, Narasimhan, Deshpande — *GEO: Generative Engine Optimization*, ACM SIGKDD 2024 (Princeton)**
[arxiv.org/abs/2311.09735](https://arxiv.org/abs/2311.09735) · [ACM Digital Library](https://dl.acm.org/doi/10.1145/3637528.3671900)

This is the only peer-reviewed foundation the field has. Everything else is vendor research.

### Method
The team built **GEO-bench** — ~10,000 queries across 9 datasets spanning multiple domains, each with a set of candidate web sources. They applied nine content modification strategies to sources and measured visibility change in the generated response using position-adjusted word count and subjective impression metrics.

### Results — what worked

| Strategy | Visibility lift |
|---|---|
| **Quotation Addition** — add quotes from credible named sources | **+27.8%** |
| **Statistics Addition** — replace qualitative claims with numbers | **+25.9%** |
| **Cite Sources** — add inline citations to authoritative references | **+24.9%** |
| Fluency Optimization | Moderate |
| Easy-to-Understand | Moderate |
| Authoritative tone | Moderate |
| Technical Terms | Domain-dependent |

Top three methods: **30–40% relative improvement** on position-adjusted word count vs. unoptimized baseline. Headline figure: **up to 40% visibility lift**.

### Results — what didn't work

**Keyword stuffing produced no meaningful improvement.** In some conditions it hurt. The single most important finding in the paper: the classic SEO reflex is inert against generative engines.

### The pattern behind the results

All three winning strategies do the same thing — **they make claims verifiable.** A generative model synthesising an answer needs content it can safely reproduce and attribute. A statistic with a source is safe to quote. A vague assertion is not. Optimising for LLMs is largely optimising for *attributable specificity*.

### Honest limitations

- Tested against 2023-era generative engines. Retrieval architectures have changed substantially since.
- Measured *visibility within a response*, not business outcomes.
- If everyone adds statistics and quotes, the relative advantage compresses. These are becoming table stakes, not edges.

---

## 2. How generative engines actually retrieve

### Two distinct information sources

| | **Training data** | **Retrieval (RAG)** |
|---|---|---|
| What it is | Static snapshot of the web baked into model weights | Live web fetch at query time |
| Freshness | Typically 6+ months stale | Current |
| How you influence it | Long-term: be widely written about, be in the corpus | Short-term: be crawlable, fresh, quotable |
| Time to impact | Model generations — 12+ months | Days to weeks |
| Shows citations? | No — appears as unattributed "knowledge" | Yes — links returned |

**Strategic consequence:** you need both plays. Retrieval optimisation is where you get measurable returns this quarter. Training-corpus presence is where durable, unshakeable brand authority is built — and it is won by being consistently useful over years, not by any technical trick. This is the argument for prioritising **"search hits" (consistent utility) over "viral hits" (temporary spikes)**: sustained coverage is what gets absorbed into future model weights.

### Query fan-out

A single user prompt is decomposed into many synthetic sub-queries, each retrieved independently, then synthesised.

```
"Plan a 5-day trip to Japan"
   ↓ decompose
   ├── "November weather in Kyoto"
   ├── "best neighbourhoods to stay in Tokyo"
   ├── "JR Pass cost 2026"
   ├── "Tokyo to Kyoto travel time"
   ├── ... 5–12 more
   ↓ retrieve passages per sub-query, in parallel
   ↓ synthesise into one answer, cite sources
```

| Fan-out scale | Count |
|---|---|
| Average consumer prompt | **9–11** sub-queries |
| Google AI Mode (reported) | 8–16 parallel sub-queries |
| Deep research modes | **400+** searches for a single prompt |

**Four implications:**

1. **You cannot target the visible query.** You must cover the sub-questions the system will invent. Write to the *topic's full question space*, not the head term.
2. **Passages compete, not pages.** Retrieval pulls the strongest passage per sub-query from across many sites.
3. **Depth of coverage compounds.** A page answering 8 sub-questions well has 8 entry points into the answer.
4. **Ranking #1 stops guaranteeing anything.** ALM Corp's 173,000-URL study found AIO citation rate for top-10 pages **fell from 76% to 38% in a year** — pages at #7 get cited while #1 gets skipped, because the system is matching passages to sub-queries, not pages to queries.

### Citations are probabilistic, not fixed

Generative engines sample with non-zero temperature. **The same prompt asked twice can cite different sources.** There is no "rank 1" to hold.

**This changes measurement fundamentally.** AI visibility is a *probability distribution*, not a leaderboard position. The correct metric is: *across N runs of a query panel, what percentage of responses mention or cite us?* Sampling a query once tells you almost nothing. Sample each query 3–5 times, then average.

---

## 3. Platform dynamics — they are not interchangeable

Each engine has a distinct source bias. A single strategy will underperform on at least two of them.

| Platform | Source preference | Key insight |
|---|---|---|
| **Google AI Overviews** | Authoritative, established sites | ~76% of citations come from pages already in Google's top 10 — classic SEO is the entry ticket |
| **ChatGPT** | Publishers, media, Reddit | Leans heavily on high-authority media (median DR ~90) and licensing-deal partners |
| **Perplexity** | Traditional search results | Most Google-aligned; ~28.6% of citations rank in Google's top 10 |
| **Google AI Mode** | YouTube and social | Cites YouTube by a wide margin; cites Quora ~3.5x more than AI Overviews does |

### Reading this table
- **Winning on Google AI Overviews = winning at classic SEO.** No shortcut exists.
- **Winning on ChatGPT = earning third-party media coverage and Reddit presence.** Your own site is not the main lever.
- **Winning on AI Mode = having video and community presence.** A text-only content strategy is structurally capped here.

### AI referral market share (2026)

| Platform | Share of AI referrals | YoY growth |
|---|---|---|
| ChatGPT | 74.8% (B2B panels report ~62.6%) | +27% traffic, share declining |
| Gemini | 11.6% | **+231%** |
| Perplexity | 7.2% | — |
| Copilot | 3.5% | — |
| Claude | 2.6% (B2B panels report ~18.5%) | **+320%** |

*Sources disagree substantially between consumer and B2B panels. Direction is reliable: ChatGPT still dominant but losing share; Gemini and Claude growing fastest.*

**Scale check:** across Cloudflare Radar (May 2026), Google sent **87.63%** of all search referrals; every AI chatbot combined sent **0.29%**. AI search is strategically critical and commercially small. Do not defund SEO for it.

---

## 4. Off-site is the strongest lever

This is the most counterintuitive and most important GEO finding.

**Branded web mentions correlate 0.664 with AI Overview visibility. Backlinks correlate 0.218.**

That is roughly **3x stronger**. And critically — **the mention does not need to be linked.** An unlinked brand mention in a credible article feeds AI visibility. Under classic SEO it was worth almost nothing.

### Why this makes sense
A generative model builds a picture of "who are the credible players in X" from how often and in what context entities co-occur with the topic across its corpus. Links are a navigational structure. Mentions are semantic evidence. The model cares about the second.

### The three tiers of mentions

**Tier 1 — Third-party editorial**
Listicles, comparison posts and reviews on authoritative industry blogs and review sites. Being *inside* a "Best X tools for Y" article is worth more than any page you write about yourself, because AI trusts third-party consensus over self-description.
*How:* digital PR, expert contribution (HARO-style), review-site profiles, analyst relations, original data journalism others cite.

**Tier 2 — User-generated content**
Reddit, Quora, Stack Overflow, niche forums, Discord/Slack communities. Reddit is a foundational training source for LLMs and a heavy ChatGPT citation source.
*How:* genuine participation from real accounts with disclosed affiliation. Astroturfing is detectable, gets banned, and produces negative brand sentiment in the exact corpus you're trying to influence. This is a long game with no shortcut.

**Tier 3 — Owned properties**
YouTube, podcasts, social profiles, documentation, GitHub. Lower trust weight than Tier 1, but fully under your control.

### The YouTube factor

YouTube is **the most cited domain in Google's AI Overviews.** Correlation between YouTube mentions and ChatGPT visibility: **0.737** — higher even than general brand mentions.

**Practical optimisation:** Google and AI models process the **audio transcript**. So:

- **Say the target phrase out loud in the video.** Not just on-screen text, not just the title — spoken.
- Provide detailed, timestamped descriptions and accurate chapters.
- Upload a corrected transcript rather than relying on auto-captions.
- Structure the video answer-first, same as written content.

For most B2B and technical brands, a modest YouTube presence is the single highest-ROI unexplored GEO channel.

### Protect your original ideas from flattening

Generative models compress distinctive frameworks into generic advice, stripping attribution. Counter it by **naming your frameworks after your brand** — "The [Brand] Content Matrix", "The [Brand] Readiness Score". A named entity survives synthesis; an unnamed concept gets absorbed into general knowledge with no credit.

---

## 5. GEO content principles

### BLUFF — Bottom Line Up Front
Start every section with the answer, not the backstory. Models weight the beginning and end of passages most heavily. So do humans.

### Atomic content
Every H2 section must be self-contained and make complete sense when pulled out of context — because it will be.

### Entity-rich writing
Specific names over pronouns. "Perplexity" not "the platform." "INP" not "that metric." Chunking destroys anaphoric reference; a pronoun-heavy passage becomes meaningless once extracted.

### Simple, declarative sentences
Short. Subject-verb-object. Complex subordinate clauses parse poorly and extract worse.

### Format matters more than expected

| Finding | Figure |
|---|---|
| Share of ChatGPT-cited pages that are **listicles** | **43.8%** |
| AI-cited content freshness advantage over traditional results | **+25.7%** fresher on average |
| ChatGPT top-cited pages updated within last **30 days** | **76%** |
| AI citations on commercial queries from pages updated within 12 months | **83%** (AirOps) |

Listicles, comparisons and reviews are the most-cited formats. This is not a style preference — it is structural. A listicle is *pre-chunked*: every item is already an atomic, extractable unit with a heading. The format does the retrieval work for you.

**On freshness:** the 30-day figure is the aggressive read, the 12-month figure the conservative one. Both point the same way. Build a real refresh cadence — quarterly for commercial pages at minimum.

---

## 6. Visibility is a spectrum, not a binary

| State | What it looks like | Value |
|---|---|---|
| **Cited and linked** | Named in the answer with a clickable source link | Highest — traffic + authority |
| **Mentioned, not linked** | "Options include X, Y, Z" with no link to you | High — drives branded search, feeds future training |
| **Not visible** | Competitors named, you absent | Zero |

Most measurement tools only count the first state. **Unlinked mentions are now a primary driver of AI visibility** and a leading indicator of the branded-search lift that shows up in analytics as "Direct." Track mentions, not just citations.

### The narrative gap
The core competitive analysis for GEO: run your query panel, and log every query where **competitors are mentioned and you are not**. That list is your content and PR roadmap, ordered by commercial value. It is more actionable than any keyword gap report.

---

## Sources

- [GEO: Generative Engine Optimization — arXiv 2311.09735](https://arxiv.org/abs/2311.09735)
- [GEO: Generative Engine Optimization — ACM SIGKDD 2024](https://dl.acm.org/doi/10.1145/3637528.3671900)
- [The Princeton GEO Study: Methodology, Results and Critique — Blck Alpaca](https://blckalpaca.at/en/knowledge-base/seo-geo/geo-generative-engine-optimization/the-princeton-geo-study-methodology-results-and-critique)
- [Query Fan-Out: The Complete Guide — NoGood](https://nogood.io/blog/query-fan-out-guide/)
- [GEO Statistics (2026): 60+ Data Points — Omnibound](https://www.omnibound.ai/blog/generative-engine-optimization-statistics)
- [Analysis of Top AI Search Engines — SE Ranking](https://seranking.com/blog/ai-traffic-research-study/)
- [AI Referral Traffic 2026: Gemini Is Catching ChatGPT — Digital Applied](https://www.digitalapplied.com/blog/ai-referral-traffic-share-2026-gemini-chatgpt-geo-analysis)
- [Search Engine Market Share 2026 — TechnologyChecker](https://technologychecker.io/blog/search-engine-market-share)
