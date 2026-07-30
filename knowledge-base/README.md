---
id: kb-overview
type: overview
discipline: [SEO, AEO, GEO, LLMO]
tags: [pipeline, prerequisite-ladder, reward-weights, limitations]
related: [kb-index, kb-diagnostics]
last_updated: 2026-07-29
---

# SEO / AEO / GEO / LLMO Knowledge Base

**Purpose:** the single, structured, machine-consumable ground truth of what a page or site must satisfy to rank #1 on Google and be cited by AI answer engines. Every standard in this folder is a discrete, checkable unit: it has an ID, a pass/fail (or scored) threshold, a cited authority, and a verification method. This is the knowledge base the MCP evaluator (build-time rules) and critic (post-deploy grader) both read from — narrative rationale lives in `../research/`; this folder is the checklist / data form of the same evidence.

This folder is the physical implementation of **Tier 1 — Global standards** described in `../architecture/15-mcp-evaluator-critic-architecture.md` §3. Each standard here is designed to be exposed as an MCP resource (`seokit://standards/{id}`) once the evaluator/critic code is built.

**This knowledge base is built using `.md` files only** — no JSON, no data files. `INDEX.md` is the full lookup table (every standard and tool, in one place); if this ever needs to be machine-parsed, that file is the source to parse.

---

## Folder layout

```
knowledge-base/
├── README.md               this file — mental model, prerequisite ladder, limitations, weights
├── INDEX.md                 full markdown lookup table — every STD-##/TOOL-## in one place
├── diagnostics.md           symptom → likely failing stage → which standards to check
│
├── SEO/                       README.md + groups/ (6 functional files: keyword analysis,
│                              GSC, traffic ID, crawler, page performance, competitive analysis)
├── AEO/                       README.md + groups/ (6 functional files: answer structuring,
│                              question research, FAQ/HowTo schema, chunking, snippet/AIO
│                              tracking, freshness ops)
├── GEO/                       README.md + groups/ (6 functional files: query fan-out mapping,
│                              evidence density, off-site mentions, AI visibility panel,
│                              platform-specific optimization, YouTube)
├── LLMO/                      README.md + groups/ (4 functional files: training-corpus access,
│                              third-party integrations, cross-surface readiness, RAG readiness)
│                              (all four disciplines point INTO standards/ below — content lives once)
├── architecture-notes/retrieval-architecture.md   the retrieval design this KB is shaped for
│
├── standards/                the actual standard content — organized by what breaks, not by acronym
│   ├── 01-access-indexability.md      STD-01–05  (Level 0, HARD gates)
│   ├── 02-rendering.md                STD-06–08  (Level 0/1, the AI-visibility differentiator)
│   ├── 03-structured-data.md          STD-09–12  (Level 1, schema)
│   ├── 04-performance.md              STD-13–16  (Level 2, Core Web Vitals)
│   ├── 05-semantic-html.md            STD-17–19  (Level 1)
│   ├── 06-aeo-geo-content.md          STD-20–25  (Level 2, answer-engine content)
│   ├── 07-off-site-authority.md       STD-26–30  (Level 3/4, off-site + measurement)
│   └── 08-llmo.md                     STD-31–32  (LLM optimization umbrella)
└── tools/
    └── tools-reference.md             TOOL-01–08 — what to check in GSC, GA4, CrUX, etc., and what values mean
```

**Two ways to browse this folder.** If you think in disciplines ("what does GEO require?"), start in `SEO/`, `AEO/`, `GEO/`, or `LLMO/` — each is a short index pointing at the relevant standards. If you think in failure modes ("why isn't this page indexing?"), go straight to `standards/` or `diagnostics.md`. Either path lands on the same standard content in `standards/` — nothing is duplicated, only indexed twice.

**How to read this document:** standards are grouped into the same five levels the ranking pipeline actually enforces (§2 below). A standard at a lower level is a precondition for every standard above it — do not work a Level 3 standard while failing a Level 0 one. Each standard carries a **Gate** flag: `HARD` means failing it can zero out everything else (multiplicative, not additive); `SOFT` means it contributes a weighted score but doesn't zero the total.

---

## 1. The pipeline

Google's ranking stack is a pipeline; a page can die at any stage, and most "ranking problems" are actually earlier-stage failures:

```
Discovery → Crawl → Render → Index → Retrieval → Ranking → Presentation
```

## 2. The prerequisite ladder

From `../research/07-algorithms-and-how-ranking-works.md` Part 3 — each level is worthless without the one below it:

| Level | Name | Covers | Standards folder |
|---|---|---|---|
| **0** | Existence | Crawlable, indexable, HTTPS, content in server-rendered HTML, robots.txt/CDN not blocking | `standards/01-access-indexability.md`, `standards/02-rendering.md` |
| **1** | Comprehensibility | Semantic HTML, titles/meta, canonicals, schema, mobile-responsive | `standards/03-structured-data.md`, `standards/05-semantic-html.md` |
| **2** | Quality | Content that fully answers the query, E-E-A-T signals, Core Web Vitals green | `standards/04-performance.md`, `standards/06-aeo-geo-content.md` |
| **3** | Authority | Backlinks, brand mentions, topical depth, entity consistency | `standards/07-off-site-authority.md` |
| **4** | Compounding | Original research, community presence, video, named frameworks, refresh cadence | `standards/07-off-site-authority.md` |

**Most sites fail at Level 0 or 1 while buying Level 4 tactics.** The evaluator and critic must enforce this ordering: never let a Level 3–4 score compensate for a Level 0 failure. This is the source of the "gates are multiplicative, not additive" reward design in `../architecture/15-mcp-evaluator-critic-architecture.md` §5.3.

---

## 3. Honest limitations of this knowledge base

- **Only STD-23's evidence (Princeton GEO paper) is peer-reviewed.** Every threshold sourced from vendor/agency studies (AirOps, Semrush, ALM Corp, SE Ranking, Omnibound) should be treated as directionally reliable, not precise to the decimal. See the conflicting-figures table in `../research/05-implementation-playbook.md` §8 before quoting any number externally.
- **Content-quality standards (STD-20–25) are gameable.** They are computed from HTML the author controls. A statistic can be decorative rather than informative; a quote can be padding. No automated check can confirm content is *actually useful* to a human — that judgment call is explicitly out of scope for this knowledge base and must stay with a human reviewer.
- **Field-data standards (STD-13–16, performance) are the one category that cannot be faked from markup** — CrUX is measured on real users. Treat performance scores as the most trustworthy signal in this knowledge base precisely because the site being graded cannot author its way to a false pass.
- **Off-site standards (STD-26–30) are not verifiable by a single-URL fetch.** They require external data sources (GSC, brand monitoring, manual panels) and are documented for completeness of the standard, not as build-time or single-page critic checks.

---

## 4. Cross-reference: standards → reward dimensions → weights

For the reward function that consumes this knowledge base (full design in `../architecture/15-mcp-evaluator-critic-architecture.md` §5.3):

| Dimension | Weight | Standards |
|---|---|---|
| `indexability` | 0.20 | STD-01, STD-04, STD-05 |
| `ai_access` | 0.20 | STD-01, STD-02, STD-03, STD-06, STD-07, STD-08 |
| `performance` | 0.20 | STD-13, STD-14, STD-15, STD-16 |
| `structured_data` | 0.15 | STD-09, STD-10, STD-11, STD-12 |
| `content_quality` | 0.15 | STD-20, STD-21, STD-22, STD-23, STD-24, STD-25 |
| `semantics` | 0.10 | STD-17, STD-18, STD-19 |

Weights renormalize over verifiable dimensions only — if performance is `unverified` (no CrUX data), its weight redistributes across the rest rather than being silently assumed as zero or as passing.

STD-31/STD-32 (LLMO) and STD-26–30 (off-site) are not part of the automated reward dimensions above — they are tracked standards without a build-time or single-URL scoring path (see `standards/08-llmo.md` and `standards/07-off-site-authority.md` for why).

---

## Sources

All standards trace to `../research/01`–`07` (SEO fundamentals, AEO, GEO, technical requirements, implementation playbook, tools, algorithms), which in turn cite: Princeton GEO paper (arXiv:2311.09735, KDD 2024 — the field's only peer-reviewed source), Google Search Central, Google Quality Rater Guidelines, Chrome UX Report, schema.org, Cloudflare Radar, AirOps 2026 State of AI Search Report, Semrush AI traffic study, ALM Corp AIO citation study, SE Ranking llms.txt study. Tool usage details (`tools/tools-reference.md`) trace to `../research/06-tools-and-platforms.md`. See `../00-INDEX.md` for the full source library with links.
