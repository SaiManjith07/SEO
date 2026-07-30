# Competitive Teardown & the Zero-Cost Stack

**Your constraint:** no subscriptions, no paid APIs, no dependency on another firm's data.
**The question:** is that a limitation to work around, or a position to attack from?

**Answer: mostly the second — but not entirely, and the exceptions matter.**

---

## Part 1 — What the incumbents do well, and how

### Ahrefs — the backlink index

**What's best:** the largest referring-domain index in the industry, and *click* data rather than just search volume.

**How they built it:** their own web-scale crawler, running continuously for 15+ years. AhrefsBot is among the most active crawlers on the internet. The index is the product; the UI is a thin shell over it.

**What to steal:** *click* data over volume data. In a 58.5%-zero-click world, "10,000 searches/month" is meaningless if 8,000 never click. Ahrefs was early to measure the thing that actually matters.

**What you cannot replicate:** the index. Fifteen years and enormous infrastructure. Do not try.

---

### Semrush — breadth and keyword UX

**What's best:** Keyword Magic Tool. The filtering, clustering and intent-tagging UX is the category benchmark.

**How they built it:** licensed clickstream data (panel providers, ISP data, browser extensions) combined with their own crawl, then heavy investment in the query interface.

**What to steal:** the *clustering* concept — grouping keywords into topics and intents. Clustering is an algorithm, not a dataset. You can implement it on any keyword source, including your own Search Console data.

**What you cannot replicate:** the clickstream licences. That is a multi-million-dollar annual line item.

---

### Screaming Frog — the crawler

**What's best:** 15 years of edge-case handling. It parses malformed HTML, weird redirect chains, hreflang tangles and JS-heavy sites that break naive crawlers. Shipped **native MCP in v24 (May 2026)** with ~29 tools driving a live desktop crawl.

**How they built it:** desktop-first, Java, no server costs, single licence fee (£259/yr). Brilliantly simple business model — no infrastructure to fund, so no subscription treadmill.

**What to steal:** **the desktop-first model.** It is the closest thing to your goal already in the market. No servers means no recurring cost means the tool can be cheap or free. It also means user data never leaves their machine.

**What you cannot easily replicate:** the edge-case handling. But you can inherit most of it by using mature libraries rather than writing a crawler from scratch.

---

### Google Search Console — the only ground truth

**What's best:** it is not an estimate. Real impressions, real clicks, real average position, real queries, straight from Google. Free, forever, with an API.

**How they built it:** they are Google.

**What to steal:** **everything.** This is the single most underused asset in SEO, and it is the foundation of the zero-cost stack. See Part 3.

---

### The VS Code SEO extensions

**What's best:** immediate inline feedback while writing. Zero context switch.

**How they built it:** editor APIs, diagnostics providers, regex and DOM checks on the open buffer.

**What to steal:** the immediacy. Feedback at authoring time beats a report next week.

**Their ceiling:** they lint the buffer. They cannot see the deployed page, cannot fetch as a bot, and cannot talk to an agent.

---

## Part 2 — Structural weaknesses (the ones they cannot fix)

Not bugs. Consequences of their business model. That is what makes them attackable.

| Weakness | Why it is structural | Your opening |
|---|---|---|
| **Subscription treadmill** | Server and data-licence costs must be recovered monthly | Desktop/local execution costs nothing to run |
| **Post-hoc only** | They audit a *deployed URL*. None see source code. | Author-time checks on files that aren't deployed yet |
| **Googlebot-shaped crawling** | Their crawlers render JavaScript, like Googlebot | They structurally cannot show what GPTBot sees, because they don't crawl like it |
| **Estimates presented as data** | Third-party volume/traffic numbers are modelled, not measured | Use Search Console — real numbers, free |
| **Human-facing output** | Dashboards and PDFs built for analysts | Machine-readable output an agent can act on |
| **Vendor metrics as KPIs** | DA/DR exist to make the tool feel authoritative | Grade against *published external thresholds* only |
| **Data sent to their servers** | SaaS requires it | Local-first: nothing leaves the machine |
| **Score without prioritisation** | "47 issues found" — all weighted equally | Counterfactual reward: this one fix is worth 30x the others |

**The deepest one:** every incumbent's core asset is *data about sites you don't own*. That is what justifies the subscription. But for optimising **your own** site, you don't need estimates about others — you need ground truth about yourself, and Google gives that away free.

---

## Part 3 — What is genuinely free (verified July 2026)

### Free and excellent

| Source | Limit | What it gives |
|---|---|---|
| **Search Console API** | Free; row caps per query, paginate around them | Real impressions, clicks, CTR, position, by query and page. **Ground truth.** |
| **CrUX API** | Free, **150 queries/minute**. *You cannot pay for more — Google does not sell extra quota.* | Real-user LCP/INP/CLS at p75 |
| **PageSpeed Insights API** | Free, **25,000 requests/day**. No paid tier exists. | Lab diagnostics + recommendations |
| **Bing Webmaster Tools API** | Free | Bing/Copilot data, plus a free keyword tool |
| **Lighthouse** | Open source (Apache 2.0) | Full audit engine, runs locally |
| **Playwright / Chromium** | Open source | JS rendering, screenshots, real interaction timing |
| **Your own crawler** | Free | Unlimited crawls of your own sites |
| **Wikidata / Wikipedia API** | Free | Entity data for `sameAs` and disambiguation |
| **Common Crawl** | Free, petabyte-scale | Backlink discovery, corpus analysis |
| **Schema.org vocabulary** | Free | Structured data validation |
| **Ollama + a local model** | Free, runs on your machine | Content quality analysis with no API bill |

**The CrUX quota point deserves emphasis:** Google does not sell increased quota. Semrush, Ahrefs and you all get the same 150/minute. On the single most important ranking signal — real-user Core Web Vitals — **there is no paid tier to be outspent on.** That is a rare level playing field, and your critic already uses it.

### Free but constrained

| Source | Catch |
|---|---|
| **Google Keyword Planner** | Free with a Google Ads account, but volume shows as wide buckets without active spend |
| **Google Trends** | Relative interest only, no absolute volume; no official API |
| **OpenLinkProfiler** | Free backlink data, far smaller index than Ahrefs |
| **Open-source crawlers** (Open SEO Crawler, LibreCrawl, Apache Nutch) | MIT/Apache licensed, no page caps, self-hosted — genuinely good, but no keyword or backlink network |

### Not free, and honestly not replicable

| Capability | Why | What to do |
|---|---|---|
| **Keyword search volume at scale** | Needs licensed clickstream data | Use Search Console for *your* queries; Keyword Planner for new ones |
| **Web-scale backlink index** | Needs 15 years of continuous crawling | Common Crawl subset + Search Console links report |
| **Competitor keyword/traffic data** | Same clickstream problem | **You lose this. Accept it.** |
| **Automated SERP position tracking** | Scraping Google violates its Terms of Service and is an ongoing arms race | Use Search Console's *average position* — real, free, and Google's own number |

**On SERP scraping:** I'm not going to design around it. It breaches Google's ToS, gets IPs blocked, and produces data Search Console already gives you legitimately for your own site. The only thing you lose is competitors' positions.

---

## Part 4 — Converting each weakness into a strength

| Their weakness | Your strength | Mechanism |
|---|---|---|
| Monthly subscription | **Zero marginal cost** | Runs locally. No servers to fund. |
| Requires a deployed URL | **Works before deploy** | Source and HTML-string checks, no network |
| Renders JS like Googlebot | **Sees what AI actually sees** | Fetch as GPTBot/ClaudeBot, diff raw vs rendered |
| Estimated traffic data | **Measured data** | Search Console + CrUX are first-party truth |
| Dashboards for humans | **Structured output for agents** | MCP tools returning findings with fixes |
| Proprietary DA/DR scores | **Published external thresholds** | Every benchmark cites Google/W3C/schema.org/a paper |
| Flat issue lists | **Counterfactual prioritisation** | Recompute reward with one check flipped |
| Data leaves your machine | **Local-first, private** | Nothing transmitted except fetches you request |
| Tool grades its own work | **Independent critic** | Second server, zero shared rules |

---

## Part 5 — The unique position, stated plainly

> **A local-first, zero-cost, agent-native SEO system that optimises at authoring time, verifies against published external benchmarks, and shows you what AI search engines actually see.**

Four claims, each defensible:

1. **Local-first / zero-cost** — no subscription, no data leaving your machine. Screaming Frog proved the model; nobody has done it agent-native.
2. **Authoring-time** — the incumbents structurally cannot, because they need a deployed URL.
3. **External benchmarks only** — no invented metrics. Auditable, falsifiable.
4. **AI-crawler visibility** — nobody surveyed does the raw-vs-rendered diff.

**Deliberately not claimed:** keyword volume, backlink index, competitor intelligence, rank tracking. Those are data-network businesses. Competing there with no budget is how the project dies.

---

## Part 6 — Concrete additions to SEOKit

Ordered by value per unit of work.

| # | Addition | Why | Cost |
|---|---|---|---|
| 1 | **Search Console OAuth adapter** | Turns estimates into ground truth. Biggest single upgrade available. | Free, OAuth only |
| 2 | **PSI API integration** | Lab diagnostics with specific fixes, 25k/day | Free key |
| 3 | **Keyword clustering over GSC data** | Steal Semrush's best idea, apply to your real queries | Free — it's an algorithm |
| 4 | **Local crawler with `p-queue` + `robots-parser`** | Site-wide rules, unlimited pages | Free |
| 5 | **Local LLM (Ollama) content analysis** | Content quality judgement with no API bill | Free, runs locally |
| 6 | **Common Crawl backlink lookup** | Partial backlink visibility | Free |
| 7 | **Wikidata entity lookup** | Auto-generate `sameAs` arrays | Free |
| 8 | **Historical store (SQLite)** | Trends without a hosted dashboard | Free |

**Start with #1.** Search Console data changes the tool from "checks your markup" to "knows which of your pages are actually underperforming and by how much."

### Where this lands architecturally

```
@seokit/core       rules engine            (built)
@seokit/critic     benchmark grading       (built)
@seokit/data       NEW — free data adapters:
                     gsc.ts       Search Console OAuth
                     crux.ts      already in critic, promote to shared
                     psi.ts       PageSpeed Insights
                     commoncrawl.ts
                     wikidata.ts
                     local-llm.ts Ollama
@seokit/store      NEW — SQLite history
```

`@seokit/data` stays a peer of core and critic, not a dependency of either — so the critic keeps its independence.

---

## Part 7 — On wanting it "perfect, with no weakness"

I'd push back on this one, because chasing it is the most reliable way to fail.

**Every tool that tried to have no weakness became bloated and beat nothing.** Semrush has 50+ tools; most users touch four. Breadth is how you get a product that is second-best at everything.

**A useful tool has a sharp edge and honest gaps.** Screaming Frog has no keyword data at all, and it's the industry-standard crawler. Search Console does one thing and is more valuable than any paid suite.

**Your honest gaps, stated up front, are:**

- No keyword volume database → use Search Console and Keyword Planner
- No backlink index → use Common Crawl and Search Console's links report
- No competitor intelligence → this is the real cost of the free constraint
- No SERP rank tracking → use Search Console average position
- The critic's reward is gameable on four of six dimensions → CrUX is the exception; treat the score as a floor

**Stating these clearly is a feature.** Every incumbent overstates precision on modelled data. A tool that says "I measure this exactly, and I don't measure that at all" is more trustworthy than one that estimates everything with false confidence — and trustworthiness is the one thing you can be genuinely best at from day one.

---

## Sources

- [CrUX API — Chrome for Developers](https://developer.chrome.com/docs/crux/api)
- [PageSpeed Insights API — DebugBear](https://www.debugbear.com/blog/pagespeed-insights-api)
- [Google Search Console API Limits — SearchCans](https://www.searchcans.com/blog/google-search-console-api-limits-explained/)
- [open-seo-crawler (MIT) — GitHub](https://github.com/puneetindersingh/open-seo-crawler)
- [Open-Source SEO Crawlers in 2026 — Seodisias](https://seodisias.com/blog/open-source-seo-crawlers/)
- [The Open Source SEO Stack That's Honest About What It Replaces — SEOJuice](https://seojuice.com/blog/top-open-source-tools-for-seo/)
- [Best Open Source SEO Tools in 2026 — RankSaver](https://ranksaver.com/blog/open-source-seo-tools)
- [Screaming Frog SEO Spider v24.0](https://www.screamingfrog.co.uk/blog/seo-spider-24/)
