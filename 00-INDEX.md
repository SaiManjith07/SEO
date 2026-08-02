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

## Folder structure

```
SEO/
├── 00-INDEX.md              you are here
├── research/                 narrative research pack — the "why", read once
│   ├── 01-SEO-fundamentals-2026.md
│   ├── 02-AEO-answer-engine-optimization.md
│   ├── 03-GEO-generative-engine-optimization.md
│   ├── 04-technical-requirements.md
│   ├── 05-implementation-playbook.md
│   ├── 06-tools-and-platforms.md
│   └── 07-algorithms-and-how-ranking-works.md
├── knowledge-base/           CANONICAL — the checklist / data form, read repeatedly
│   ├── README.md              pipeline model, prerequisite ladder, limitations, dimension weights
│   ├── manifest.json           machine-readable index of every STD-##/TOOL-## — the MCP resource source
│   ├── diagnostics.md          symptom → failing stage → which standards to check
│   ├── standards/               32 standards (STD-01–32), one file per category
│   └── tools/                    GSC/GA4/CrUX/etc. — what to check, what values mean
├── architecture/              MCP server design — how to build the tool
│   ├── 15-mcp-evaluator-critic-architecture.md   CANONICAL — supersedes 08, 09, 13
│   ├── 08-13...                                    historical rationale, kept for context
├── seokit/                    working code — two MCP servers, 31 tests passing
└── (this file)
```

**Two different jobs, two different folders.** `research/` explains *why* each standard exists — read once, front to back. `knowledge-base/` is *what to check and what value counts as a pass* — read in fragments, re-read constantly, and eventually load programmatically via `manifest.json`. Don't confuse the two: if you're doing SEO work day-to-day, live in `knowledge-base/`; if you're building the tool or need the underlying evidence, go to `research/`.

---

## Read in this order — research pack

| File | What it covers |
|---|---|
| `research/01-SEO-fundamentals-2026.md` | How Google ranking works today, 2026 algorithm changes, ranking factor evidence, keyword strategy |
| `research/02-AEO-answer-engine-optimization.md` | Answer engines, citation mechanics, AI Overviews, conversion data, the AEO playbook |
| `research/03-GEO-generative-engine-optimization.md` | Princeton study, RAG vs training data, query fan-out, platform biases, off-site authority, BLUFF |
| `research/04-technical-requirements.md` | The engineering checklist — crawler access, SSR, schema, CWV, semantic HTML, 404 hallucinations, llms.txt |
| `research/05-implementation-playbook.md` | Phased plan, measurement instrumentation, tooling, realistic timelines, conflicting-figures table |
| `research/06-tools-and-platforms.md` | Every tool worth knowing — what it does, price, how to use it, recommended stacks by budget, where to learn |
| `research/07-algorithms-and-how-ranking-works.md` | The actual IR algorithms (BM25, PageRank, embeddings, RAG), Google's update history, prerequisites, how to optimise rank, 90-day learning path |

**If you read only one thing:** §7 of `research/05-implementation-playbook.md` — the five things that matter most.

**If you're an engineer:** start with `research/07`. It explains the mechanics the rest of the industry papers over.

---

## The knowledge base — canonical, operational reference

**Built as `.md` files only** — no JSON. Every file carries YAML frontmatter (id, discipline, type, tags, related) so the folder is ready for the heading-based hybrid-retrieval pipeline described in `knowledge-base/architecture-notes/retrieval-architecture.md`, without requiring a database to be useful today.

| Path | What it covers |
|---|---|
| `knowledge-base/README.md` | **Start here.** Pipeline model, prerequisite ladder (Level 0–4), honest limitations, standard→reward-dimension weight table |
| `knowledge-base/INDEX.md` | Full markdown lookup table — every `STD-##` and `TOOL-##` in one place: category, gate, weight, file, verifying tool |
| `knowledge-base/diagnostics.md` | Symptom-to-stage triage table — start here when something breaks |
| `knowledge-base/SEO/`, `AEO/`, `GEO/`, `LLMO/` | **Browse by discipline.** Each `README.md` explains how that discipline works and indexes the standards that matter to it. `SEO/groups/` further splits SEO into 6 functional areas: keyword analysis, Google Search Console, traffic identification, crawling, page performance, competitive analysis |
| `knowledge-base/standards/01-access-indexability.md` … `08-llmo.md` | **Browse by failure mode.** The 32 standards (STD-01–32), organized by what breaks, not by acronym — the content every discipline folder indexes into |
| `knowledge-base/tools/tools-reference.md` | GSC, GA4, PageSpeed/CrUX, Rich Results Test, server logs, Ahrefs/Semrush, AI-visibility tools, Google Business Profile — exact report, exact metric, exact passing value, per standard |

---

## Build track — SEOKit

`architecture/` covers designing and building the tool, not doing SEO.

| File | What it covers |
|---|---|
| `architecture/15-mcp-evaluator-critic-architecture.md` | **Canonical.** The full MCP design — evaluator + critic, knowledge base tiers, reward function, agent loop protocol. Supersedes 08, 09, and 13. |
| `architecture/08-seo-tool-architecture.md` | Historical — why MCP is the core, rule-engine design, three modes |
| `architecture/09-critic-architecture.md` | Historical — benchmarks, reward function, gates, reward-hacking limits |
| `architecture/10-prior-art.md` | Who built this already — **includes two corrections to my own claims** |
| `architecture/11-competitive-strategy.md` | Incumbent teardown, weakness→strength conversion, the zero-cost data stack |
| `architecture/12-cursor-prompt-pack.md` | Eight copy-pasteable Cursor prompts with verification commands |
| `architecture/13-system-architecture.md` | Historical — layers, knowledge base schema, agent loop protocol, skill packs |
| `architecture/16-antigravity-research-task-prompt.md` | Ready-to-paste prompt for Antigravity (or any agentic IDE) to verify claims, run a worked example against a real URL, and report back |
| `architecture/17-antigravity-code-audit-prompt.md` | **v2 — rescoped.** Ready-to-paste prompt for Antigravity to audit the actual `seokit/` source code, now correctly scoped to the real 23-package repo (was wrongly written for a 4-package snapshot) |
| `architecture/18-seokit-codebase-analysis-report.md` | **Ground truth.** A real build+test run of all 23 packages plus targeted verification: what passes, what fails, and 5 new findings (hardcoded default credential, unresolved circular dependency, a failing orchestrator end-to-end test, untested packages, version drift) |
| `architecture/19-antigravity-cursor-mcp-audit-prompt.md` | Ready-to-paste prompt for Antigravity to audit both MCP servers (`mcp`, `critic-mcp`) for real Cursor readiness, grounded in `18`'s verified tool/resource/prompt counts |

**Working code:** `seokit/` — two MCP servers, 31 tests passing, already implements most of `architecture/15`.
`seokit/AGENTS.md` is the project constitution; Cursor reads it automatically.

**Start here to build:** `knowledge-base/README.md`, then `architecture/15`, then prompt 1 in `architecture/12`.

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

A table of **directly conflicting figures** — where two credible sources report different values for the same thing — is in §8 of `research/05-implementation-playbook.md`. Check it before quoting any statistic externally.

**The one number that should anchor your priorities:** across Cloudflare Radar's May 2026 data, Google sent **87.63%** of all search referral traffic, while every AI chatbot combined sent **0.29%**. AI search is growing fast and matters strategically — but classic SEO is still where essentially all the traffic is. Budget accordingly.
