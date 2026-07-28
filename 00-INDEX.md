# Search Visibility Research Pack — SEO / AEO / GEO

**Compiled:** 27 July 2026
**Purpose:** Consolidate existing public reports and studies on search visibility, then translate them into what to actually build.

---

## The three disciplines in one table

| | **SEO** | **AEO** | **GEO** |
|---|---|---|---|
| Full name | Search Engine Optimization | Answer Engine Optimization | Generative Engine Optimization |
| Target surface | Google/Bing blue links, SERP features | Direct answers: featured snippets, AI Overviews, voice, PAA | LLM-generated responses: ChatGPT, Gemini, Perplexity, Claude, Copilot |
| Unit of competition | The **page** (ranked position) | The **answer** (being *the* cited source) | The **passage** (being retrieved and synthesised into a response) |
| Success metric | Rank, organic sessions, CTR | Snippet/AIO citation share | Share of voice in AI answers, brand mention frequency |
| Primary lever | Backlinks + relevance + technical health | Structure + directness + schema | Entity authority + quotable, statistic-dense passages |
| Maturity | 25+ years, well documented | ~5 years, moderately documented | ~2 years, one peer-reviewed paper + vendor studies |

**Important:** these are not three separate jobs. They are three layers on one stack. GEO and AEO both depend on being crawlable, indexed, and credible — which is SEO. Nobody gets cited by ChatGPT on a site Google can't render.

---

## Read in this order

| File | What it covers |
|---|---|
| `01-SEO-fundamentals-2026.md` | How Google ranking works today, 2026 algorithm changes, ranking factor evidence, keyword strategy |
| `02-AEO-answer-engine-optimization.md` | Answer engines, citation mechanics, AI Overviews, conversion data, the AEO playbook |
| `03-GEO-generative-engine-optimization.md` | Princeton study, RAG vs training data, query fan-out, platform biases, off-site authority, BLUFF |
| `04-technical-requirements.md` | The engineering checklist — crawler access, SSR, schema, CWV, semantic HTML, 404 hallucinations, llms.txt |
| `05-implementation-playbook.md` | Phased plan, measurement instrumentation, tooling, realistic timelines, conflicting-figures table |
| `06-tools-and-platforms.md` | Every tool worth knowing — what it does, price, how to use it, recommended stacks by budget, where to learn |
| `07-algorithms-and-how-ranking-works.md` | The actual IR algorithms (BM25, PageRank, embeddings, RAG), Google's update history, prerequisites, how to optimise rank, 90-day learning path |

**If you read only one thing:** §7 of `05-implementation-playbook.md` — the five things that matter most.

**If you're an engineer:** start with `07`. It explains the mechanics the rest of the industry papers over.

---

## Build track — SEOKit

Files 08–13 cover designing and building the tool, not doing SEO.

| File | What it covers |
|---|---|
| `08-seo-tool-architecture.md` | Why MCP is the core, rule-engine design, three modes |
| `09-critic-architecture.md` | The second server: benchmarks, reward function, gates, reward-hacking limits |
| `10-prior-art.md` | Who built this already — **includes two corrections to my own claims** |
| `11-competitive-strategy.md` | Incumbent teardown, weakness→strength conversion, the zero-cost data stack |
| `12-cursor-prompt-pack.md` | Eight copy-pasteable Cursor prompts with verification commands |
| `13-system-architecture.md` | **The full design:** layers, knowledge base schema, agent loop protocol, skill packs |

**Working code:** `seokit/` — two MCP servers, 31 tests passing.
`seokit/AGENTS.md` is the project constitution; Cursor reads it automatically.

**Start here to build:** `13-system-architecture.md`, then prompt 1 in `12`.

---

## Source library

### Peer-reviewed / primary research
| Source | What it establishes | Link |
|---|---|---|
| **Aggarwal, Murahari, Rajpurohit, Kalyan, Narasimhan, Deshpande** — *GEO: Generative Engine Optimization*, ACM SIGKDD (KDD) 2024, Princeton. arXiv v3, 28 Jun 2024. ✅ *link verified 27 Jul 2026* | The founding GEO paper. GEO-bench, ~10,000 queries, 9 datasets. Up to **40% visibility lift**; quotes +27.8%, statistics +25.9%, cite sources +24.9%. Also notes efficacy **varies by domain** — no universal recipe. | [arxiv.org/abs/2311.09735](https://arxiv.org/abs/2311.09735) · [ACM DL](https://dl.acm.org/doi/10.1145/3637528.3671900) |
| **Cloudflare Radar** — *The crawl before the fall… of referrals* (Belson & Rhea, pub. 1 Jul 2025, updated Mar 2026). ✅ *link verified 27 Jul 2026* | Crawl-to-refer ratios per AI bot, measured across Cloudflare's network. **Read the caveat:** native-app referrals send no `Referer:` header, so ratios likely overstate the imbalance. | [blog.cloudflare.com](https://blog.cloudflare.com/ai-search-crawl-refer-ratio-on-radar/) · [live data on Radar](https://radar.cloudflare.com/ai-insights#crawl-to-refer-ratio) |

### Platform / first-party documentation
| Source | Why it matters |
|---|---|
| Google Search Central — Search Essentials, structured data docs, spam policies | The only authoritative statement of what Google requires |
| Google Quality Rater Guidelines | The written definition of E-E-A-T that raters apply |
| Chrome UX Report (CrUX) | The real-user dataset Core Web Vitals is scored from |
| Schema.org vocabulary | Canonical structured-data types |

### Industry studies referenced throughout
| Source | Key finding | Link |
|---|---|---|
| AirOps — *2026 State of AI Search Report* | 83% of AI citations on commercial queries come from pages updated within 12 months | [airops.com](https://www.airops.com/blog/aeo-answer-engine-optimization) |
| Semrush (June 2025) — AI traffic study, 500+ topics | AI search visitors convert at ~4.4x organic rate | [omnibound.ai summary](https://www.omnibound.ai/blog/answer-engine-optimization-aeo-statistics) |
| ALM Corp — 173,000 URL AIO study | Top-10 pages' AIO citation rate fell 76% → 38% in one year | [nogood.io](https://nogood.io/blog/query-fan-out-guide/) |
| SE Ranking — 300,000 domain llms.txt study | 10.13% adoption; near-zero crawler fetches | [ai.aeo.press](https://ai.aeo.press/the-state-of-llms-txt-in-2026) |
| SE Ranking — AI search engine traffic research | AI referral share by platform | [seranking.com](https://seranking.com/blog/ai-traffic-research-study/) |
| Omnibound — GEO / AEO / AI-SEO statistics compilations | Aggregated data points across the field | [GEO](https://www.omnibound.ai/blog/generative-engine-optimization-statistics) · [AEO](https://www.omnibound.ai/blog/answer-engine-optimization-aeo-statistics) · [AI SEO](https://www.omnibound.ai/blog/ai-seo-statistics) |
| Lumar — content chunking & AI extractability | Chunking mechanics for retrieval | [lumar.io](https://www.lumar.io/blog/best-practice/content-chunking-ai-extractability-geo-aeo-explainer/) |
| Backlinko — Google's 200 ranking factors | Comprehensive (if partly speculative) factor catalogue | [backlinko.com](https://backlinko.com/google-ranking-factors) |
| Cloudflare Radar / TechnologyChecker — referral share | Google still ~87.6% of all search referrals (May 2026) | [technologychecker.io](https://technologychecker.io/blog/search-engine-market-share) |

---

## How to read the statistics in this pack

Only the Princeton GEO paper is peer-reviewed. Everything else is vendor or agency research, which means:

- **Methodology is often undisclosed.** Sample sizes, query selection, and time windows vary wildly.
- **Vendors measure what they sell.** An AI-visibility tool publishing "AI visibility is exploding" is not neutral.
- **Numbers conflict across sources.** ChatGPT's share of AI referrals is reported anywhere from 62.6% to 74.78% depending on who is counting and what panel they use.

Statistics in these files are labelled with their source. Treat the direction of travel as reliable; treat any single decimal point as approximate.

A table of **directly conflicting figures** — where two credible sources report different values for the same thing — is in §8 of `05-implementation-playbook.md`. Check it before quoting any statistic externally.

**The one number that should anchor your priorities:** across Cloudflare Radar's May 2026 data, Google sent **87.63%** of all search referral traffic, while every AI chatbot combined sent **0.29%**. AI search is growing fast and matters strategically — but classic SEO is still where essentially all the traffic is. Budget accordingly.
