# SEO Tools & Platforms — What Exists, What Each Does, How to Use It

**Prices verified July 2026. They change often — always check the vendor page before buying.**

---

## The honest framing before you spend anything

The SEO tool market is worth billions and is very good at selling you things you do not need. Three truths that will save you money:

1. **Google Search Console is the only tool with Google's actual data about your site.** Everything else is estimation, scraping, or third-party panels. GSC is free, and it is more important than any paid tool.
2. **Most teams need exactly two paid tools:** one all-in-one suite (Ahrefs *or* Semrush — not both) and one crawler (Screaming Frog). That's roughly $130–260/month total.
3. **Tools do not do SEO.** They measure and diagnose. The work — technical fixes, content, earning mentions — is done by people. A team with GSC and discipline outperforms a team with $2,000/month of software and no process.

---

## 1. Essential and free — start here, always

| Tool | What it does | How you actually use it |
|---|---|---|
| **[Google Search Console](https://search.google.com/search-console)** | Google's own data on your site: impressions, clicks, queries, average position, indexation status, Core Web Vitals field data, manual actions, structured data errors | **The single most important tool in SEO.** Weekly: check Performance for query/page trends. Monthly: check Coverage for indexation problems, CWV report, Enhancements for schema errors. Use URL Inspection to see exactly how Googlebot renders any page. Set up on day one. |
| **[Bing Webmaster Tools](https://www.bing.com/webmasters)** | Bing's equivalent — and Bing's index feeds **Microsoft Copilot** | Free, 10 minutes to set up. Now genuinely worth doing because of Copilot. Includes a decent free keyword tool and site scanner. |
| **[Google Analytics 4](https://analytics.google.com)** | Traffic, behaviour, conversions, revenue attribution | Connect to GSC. Build a custom channel group for AI referrals (see file `05` §6). This is where you prove SEO produced money, not just traffic. |
| **[PageSpeed Insights](https://pagespeed.web.dev/)** | Core Web Vitals — both real-user field data (CrUX) and lab diagnostics | Run on your key templates. **Field data is what counts for ranking**; lab data is for debugging. Gives specific fix recommendations. |
| **[Google Rich Results Test](https://search.google.com/test/rich-results)** | Validates structured data and shows which rich results a page qualifies for | Run after every schema change. Must return zero errors. |
| **[Schema.org Validator](https://validator.schema.org/)** | Validates schema against the full vocabulary, not just Google's supported subset | Use alongside the Rich Results Test — catches things Google's tool ignores. |
| **[Google Trends](https://trends.google.com)** | Relative search demand over time, seasonality, regional variation, rising queries | Validate that a topic is growing before investing in it. Excellent for spotting seasonality and comparing branded demand against competitors. |
| **[Chrome DevTools Lighthouse](https://developer.chrome.com/docs/lighthouse)** | Built into Chrome — performance, accessibility, SEO basics audit | Fast local check during development. Lab data only. |
| **[CrUX Dashboard](https://developer.chrome.com/docs/crux/dashboard)** | Historical Core Web Vitals trends from real Chrome users | Track whether performance work actually moved the p75 over the 28-day window. |
| **[Ahrefs Webmaster Tools](https://ahrefs.com/webmaster-tools)** | Free tier of Ahrefs, restricted to sites you verify: backlinks + site audit | Genuinely useful free backlink data for your own domain. No competitor data. |
| **[Screaming Frog SEO Spider](https://www.screamingfrog.co.uk/seo-spider/) (free tier)** | Desktop crawler — up to 500 URLs free | Enough for small sites. See §3 for what it does. |

**If you do nothing else on this page: install Search Console and Analytics, and connect them.** That covers the majority of what most sites need for diagnosis.

---

## 2. All-in-one suites — pick ONE

These overlap ~80%. Paying for two is the most common wasted SEO spend.

### Ahrefs — *from ~$129/month*
**Strength: backlink data accuracy and the largest referring-domain index.**

| Module | Use it for |
|---|---|
| Site Explorer | Analyse any domain's backlinks, top pages, organic keywords — yours or a competitor's |
| Keywords Explorer | Keyword research with click data (not just search volume — *clicks*, which matters in a zero-click era) |
| Site Audit | Technical crawl, 130+ issue types, health score |
| Content Explorer | Find pages mentioning a topic — **the best way to find unlinked brand mention opportunities** |
| Rank Tracker | Position tracking with SERP-feature detection |
| Brand Radar | AI visibility / share-of-voice tracking |

**Choose Ahrefs if:** link building and competitive research are central, or you want the most accurate backlink index.

### Semrush — *from ~$139/month (SEO only), ~$199/month with AI-visibility tools; Guru tier ~$249.95/month*
**Strength: breadth. It is a marketing suite, not just an SEO tool.**

| Module | Use it for |
|---|---|
| Keyword Magic Tool | The best keyword research interface on the market — huge database, excellent filtering |
| Site Audit | 140+ automated technical checks with health scoring |
| Position Tracking | Rank tracking, including local and SERP features |
| Backlink Analytics + Audit | Link research and toxic-link identification |
| Topic Research / Content Template | Content briefs and topical gap analysis |
| AI Toolkit | AI visibility tracking (higher tiers) |
| PPC, Social, PR toolkits | Bundled — useful if one team owns all channels |

**Choose Semrush if:** you want one platform covering SEO + PPC + content + social, or keyword research is your primary workflow.

### Moz Pro — *Standard ~$99/month*
**Strength: simplicity and price.**

Domain Authority (DA) and Page Authority — Moz's metrics that became industry shorthand — plus keyword research, link explorer, site crawl and rank tracking. Smaller index than Ahrefs or Semrush.

**Choose Moz if:** you are a freelancer, small business, or small agency running up to ~10 straightforward campaigns. It covers roughly 80% of solo-SEO needs at ~70% of the price.

> **Reality check on "Domain Authority":** DA is a *Moz* metric, not a Google one. Google does not use it. It is a useful relative comparison tool and a terrible KPI. Same for Ahrefs' Domain Rating (DR). Never set a target of "reach DA 50."

### Quick decision

| Your situation | Pick |
|---|---|
| Link building and competitor research are core | **Ahrefs** |
| Keyword research is core, or one team owns SEO+PPC+content | **Semrush** |
| Small budget, straightforward site | **Moz** or Ahrefs Webmaster Tools (free) + Screaming Frog |
| Enterprise, large site, need JS-rendering crawls at scale | **Botify** or **Lumar** (see §3) |

---

## 3. Technical SEO and crawling

| Tool | Price | What it does | How to use it |
|---|---|---|---|
| **[Screaming Frog SEO Spider](https://www.screamingfrog.co.uk/seo-spider/)** | Free ≤500 URLs; **£259/year** unlimited | Desktop crawler. The industry standard. Crawls your site like a search engine and dumps everything: status codes, redirects, titles, meta, headings, canonicals, hreflang, schema, orphan pages, broken links. JS rendering supported. | **Buy this one.** Run monthly. Connect the GSC and GA APIs to overlay traffic data on crawl data. Custom extraction (XPath/regex) pulls any element off any page at scale — invaluable for auditing schema or content patterns. |
| **[Sitebulb](https://sitebulb.com/)** | ~$45+/month | Crawler with strong visualisations and prioritised, explained recommendations | Better than Screaming Frog for *presenting* audits to non-technical stakeholders. Explains *why* each issue matters. |
| **[Botify](https://www.botify.com/)** | Enterprise (£££) | Log-file analysis + crawl at massive scale, crawl budget optimisation | For sites with 100k+ URLs. Combines server logs with crawl data to show what Googlebot actually fetches vs. ignores. |
| **[Lumar](https://www.lumar.io/)** (was DeepCrawl) | Enterprise | Cloud crawler, automated monitoring, CI/CD integration | Catch SEO regressions before they ship — hook it into your deploy pipeline. |
| **[JetOctopus](https://jetoctopus.com/)** | ~$130+/month | Crawler + log analyser, cheaper enterprise alternative | Good middle ground for large sites without enterprise budget. |
| **[Screaming Frog Log File Analyser](https://www.screamingfrog.co.uk/log-file-analyser/)** | £99/year | Parses server logs to show real bot behaviour | **The only way to verify AI crawlers are getting 200s, not 403s.** Nothing else gives you ground truth on GPTBot, ClaudeBot, PerplexityBot. |
| **[WebPageTest](https://www.webpagetest.org/)** | Free / paid tiers | Deep performance testing from real devices and locations | When PageSpeed Insights says "fix LCP" and you need to know exactly why. |

---

## 4. Keyword and content research

| Tool | Price | Best for |
|---|---|---|
| **[Google Keyword Planner](https://ads.google.com/home/tools/keyword-planner/)** | Free (Google Ads account) | Raw volume data from Google itself. Ranges are broad without ad spend, but it's the source everyone else estimates from. |
| **Semrush Keyword Magic** | In Semrush | Best-in-class filtering and clustering |
| **Ahrefs Keywords Explorer** | In Ahrefs | Click data and parent-topic grouping |
| **[AnswerThePublic](https://answerthepublic.com/)** | Free tier / ~$99/mo | Visualises question-shaped queries. **Directly useful for AEO** — these are the questions to make into H2s. |
| **[AlsoAsked](https://alsoasked.com/)** | Free tier / ~$15+/mo | Maps People Also Asked trees. Excellent for building the sub-question set that query fan-out will target. |
| **[Keywords Everywhere](https://keywordseverywhere.com/)** | Credit-based, cheap | Browser extension showing volume inline on Google, YouTube, Amazon |
| **[Google Search Console](https://search.google.com/search-console)** | Free | **Your own best keyword tool.** The Performance report shows real queries you already get impressions for — including ones you never targeted. Mine positions 5–20 for quick wins. |
| **[Reddit](https://www.reddit.com) / [Quora](https://www.quora.com) / niche forums** | Free | Real language real people use. Also a citation source for ChatGPT — so presence here is doubly valuable. |
| **Your own support tickets and sales calls** | Free | The highest-quality question source you have and almost nobody uses it. |

---

## 5. AI visibility / GEO tools

**Newest and least mature category.** These tools query AI engines on a schedule and record whether you appear. They all disagree with each other, because they are sampling a probabilistic system.

| Tool | Price (July 2026) | Notes |
|---|---|---|
| **[Profound](https://www.tryprofound.com/)** | ~$82.50/mo Starter (50 prompts, annual); ~$332.50/mo Growth (100 prompts, annual). Demos, no free trial | Enterprise category leader. Deepest analytics and reporting. |
| **[Peec AI](https://peec.ai/)** | €89/mo Starter (25 prompts); €199/mo Pro (100 prompts) | Best depth-to-price ratio for mid-market. |
| **[Otterly.AI](https://otterly.ai/)** | $25/mo Lite (15 prompts, annual); $160/mo Standard (100 prompts) | Most accessible entry point. Its 25-factor GEO audit per prompt gives real diagnostic value beyond mention counts. |
| **Semrush AI Toolkit** | Bundled at ~$199+/mo tiers | Convenient if you already pay for Semrush. |
| **Ahrefs Brand Radar** | In Ahrefs | Same logic — brand mention and AI visibility tracking inside a tool you may already have. |
| **[Scrunch AI](https://www.scrunchai.com/)**, **Goodie**, **Trakkr**, **Georion** | Varies | Fast-moving field; new entrants monthly. |

### How to use them properly

- **Do not trust a single sample.** Citations are probabilistic — the same prompt returns different sources on different runs. Any tool showing a clean "you rank #3 in ChatGPT" is oversimplifying.
- **Track the trend, not the number.** Month-over-month direction is meaningful; the absolute value is not comparable across tools.
- **The narrative gap is the real output.** Which queries name your competitors and not you? That is your roadmap.
- **Keep a manual panel alongside.** 50–100 queries, run by hand quarterly, 3–5 samples each. Tedious, and more trustworthy than any dashboard.

**Verdict:** worth $25–100/month once you have the technical foundation fixed and content restructured. Not worth anything before that — you would be paying to watch a number that you have not yet given any reason to move.

---

## 6. Rank tracking

| Tool | Price | Notes |
|---|---|---|
| **[AccuRanker](https://www.accuranker.com/)** | ~$129+/mo | Fastest, most accurate dedicated tracker. On-demand refresh. |
| **[Nightwatch](https://nightwatch.io/)** | ~$39+/mo | Good value, strong local/geo tracking |
| **[SE Ranking](https://seranking.com/)** | ~$65+/mo | All-in-one at lower cost than Ahrefs/Semrush; also publishes solid original research |
| Built into Ahrefs / Semrush / Moz | Included | Fine for most teams — no need for a separate tool |

**Caveat that matters more every month:** rank tracking measures a surface that is shrinking. With 58.5% of searches ending click-free and AI Overviews decoupling rank from citation, "position 3" means much less than it did. Track rankings, but never make them your headline KPI.

---

## 7. Backlinks, digital PR and brand mentions

Given that **brand mentions correlate ~3x more strongly with AI visibility than backlinks**, this category matters more than it used to — and the goal has shifted from links to mentions.

| Tool | Price | Use |
|---|---|---|
| **Ahrefs Site Explorer / Content Explorer** | In Ahrefs | Backlink analysis; Content Explorer finds **unlinked mentions** of your brand — outreach gold |
| **Semrush Backlink Analytics / Link Building Tool** | In Semrush | Link research + outreach workflow management |
| **[Majestic](https://majestic.com/)** | ~$50+/mo | Link-only specialist. Trust Flow / Citation Flow metrics. |
| **[Brand24](https://brand24.com/)** | ~$79+/mo | Brand mention monitoring across web and social, with sentiment |
| **[Mention](https://mention.com/)** | ~$49+/mo | Similar; real-time alerts |
| **[Google Alerts](https://www.google.com/alerts)** | Free | Crude but free brand mention monitoring. Set one up today. |
| **[Featured](https://featured.com/)** / **[Qwoted](https://www.qwoted.com/)** / **[SourceBottle](https://www.sourcebottle.com/)** | Free–$$ | HARO successors — journalists request expert quotes, you supply them, you get quoted in credible publications. **Directly feeds the Tier-1 mentions that drive AI visibility.** |
| **[Help a B2B Writer](https://helpab2bwriter.com/)** | Free | B2B-focused equivalent |

---

## 8. Local SEO

| Tool | Price | Use |
|---|---|---|
| **[Google Business Profile](https://business.google.com/)** | Free | **Non-negotiable if you have any physical presence or serve a geography.** Complete every field, post regularly, respond to all reviews. |
| **[BrightLocal](https://www.brightlocal.com/)** | ~$39+/mo | Local rank tracking, citation building, review management |
| **[Whitespark](https://whitespark.ca/)** | ~$25+/mo | Local citation building specialist |
| **[Yext](https://www.yext.com/)** | Enterprise | Syncs business listings across hundreds of directories at scale |

---

## 9. Content optimisation

| Tool | Price | Use |
|---|---|---|
| **[Surfer SEO](https://surferseo.com/)** | ~$99+/mo | On-page optimisation scoring against top-ranking competitors. Useful — but do not chase its score at the cost of readability. |
| **[Clearscope](https://www.clearscope.io/)** | ~$189+/mo | Premium content briefs and term coverage |
| **[Frase](https://www.frase.io/)** | ~$45+/mo | Content briefs with an AEO/answer-engine angle |
| **[MarketMuse](https://www.marketmuse.com/)** | ~$99+/mo | Topical authority modelling and content gap analysis |
| **[Hemingway](https://hemingwayapp.com/)** | Free / $20 once | Sentence complexity. **Genuinely useful for GEO** — simple declarative sentences extract better. |
| **[Yoast](https://yoast.com/) / [Rank Math](https://rankmath.com/)** | Free / ~$59+/yr | WordPress on-page SEO plugins — meta, sitemaps, schema, basic checks |

**Warning on this category:** tools like Surfer optimise toward *statistical similarity with pages that already rank*. That is inherently backward-looking and produces homogenised content. Under 2026's scaled-content-abuse enforcement and AI's preference for original data, blending in is a liability. Use them as a checklist, never as a target.

---

## 10. Structured data

| Tool | Price | Use |
|---|---|---|
| **[Google Rich Results Test](https://search.google.com/test/rich-results)** | Free | Validate against Google's supported types |
| **[Schema.org Validator](https://validator.schema.org/)** | Free | Validate against the full vocabulary |
| **[Schema Markup Generator (Merkle)](https://technicalseo.com/tools/schema-markup-generator/)** | Free | Generate JSON-LD without writing it by hand |
| **[Schema App](https://www.schemaapp.com/)** | Enterprise | Manages schema and entity relationships at scale |

---

## 11. Where to actually learn — free first

### Primary sources (read these before any blog)

| Resource | Why |
|---|---|
| **[Google Search Central Documentation](https://developers.google.com/search/docs)** | **The authoritative source.** SEO Starter Guide, crawling/indexing docs, structured data reference, spam policies. Everything else is interpretation of this. |
| **[Google Search Central Blog](https://developers.google.com/search/blog)** | Where updates are announced first |
| **[Google Search Quality Rater Guidelines (PDF)](https://guidelines.raterhub.com/searchqualityevaluatorguidelines.pdf)** | ~170 pages. The written definition of E-E-A-T that human raters apply. Long, dry, and the single most underread document in SEO. |
| **[Google Search Central YouTube](https://www.youtube.com/@GoogleSearchCentral)** | Office hours, explainers direct from the search team |
| **[Bing Webmaster Guidelines](https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a)** | Matters now because of Copilot |
| **[Schema.org](https://schema.org/)** | The structured data vocabulary itself |
| **[web.dev](https://web.dev/)** | Google's performance and Core Web Vitals documentation |

### Free courses and certifications

| Resource | Notes |
|---|---|
| **[Ahrefs Academy](https://ahrefs.com/academy)** + [Ahrefs Blog](https://ahrefs.com/blog) | Practical, data-backed, genuinely excellent. Their blog runs original studies. |
| **[Semrush Academy](https://www.semrush.com/academy/)** | Wide course range, beginner → advanced, **free certificates** |
| **[HubSpot Academy SEO Certification](https://academy.hubspot.com/)** | Best structured beginner course. Free certificate. |
| **[LearningSEO.io](https://learningseo.io/)** | Free curated learning roadmap by Aleyda Solís. **The best free starting point that exists** — a structured path, not a course to sell you something. |
| **[Yoast SEO Academy](https://yoast.com/academy/)** | Free tier; strong for WordPress users |
| **[Moz Beginner's Guide to SEO](https://moz.com/beginners-guide-to-seo)** | The classic. Still one of the clearest introductions. |
| **[Backlinko](https://backlinko.com/)** | Well-structured guides and studies |

### Paid, if you want structure
- **UC Davis SEO Specialization (Coursera)** — the most complete academic program online; strategic + technical
- **Semrush / Ahrefs paid tiers** include deeper training with subscriptions

### Staying current
| Source | What it is |
|---|---|
| **[Search Engine Land](https://searchengineland.com/)** | Industry news of record |
| **[Search Engine Roundtable](https://www.seroundtable.com/)** | Barry Schwartz — fastest reporting on algorithm volatility |
| **[Search Engine Journal](https://www.searchenginejournal.com/)** | News and guides |
| **[Aleyda Solís — SEOFOMO newsletter](https://www.aleydasolis.com/en/seofomo/)** | Best weekly roundup in the industry |
| **[Lily Ray](https://x.com/lilyraynyc)**, **[Barry Schwartz](https://x.com/rustybrick)**, **[Glenn Gabe](https://x.com/glenngabe)** | Practitioners worth following on algorithm updates |
| **r/SEO, r/TechSEO** | Community discussion — variable quality, useful for sanity checks |

---

## 12. Recommended stacks by budget

### $0/month — solo, side project, early startup
```
Google Search Console  +  Google Analytics 4  +  Bing Webmaster Tools
Screaming Frog (free, 500 URLs)  +  PageSpeed Insights
Ahrefs Webmaster Tools (free, own site)  +  Google Alerts
AlsoAsked + AnswerThePublic (free tiers)
```
This genuinely covers most needs for a site under a few hundred pages. **Do not pay for anything until this stack stops answering your questions.**

### ~$150–300/month — small business, growing startup
```
Everything above
+ Ahrefs OR Semrush (~$129–139)
+ Screaming Frog paid (£259/year ≈ $27/mo)
+ Otterly.AI (~$25) once technical foundation is fixed
```

### ~$500–1,000/month — scaling company, small agency
```
Everything above
+ Semrush Guru (~$250) or Ahrefs higher tier
+ Peec AI (~€199) or Profound Starter
+ Sitebulb (~$45)
+ Brand24 (~$79)
+ Surfer or Clearscope if running a content team
```

### Enterprise
```
Botify or Lumar (crawl + logs at scale)
+ Ahrefs AND Semrush (justifiable at this size)
+ Profound Growth
+ AccuRanker
+ Schema App
+ Dedicated log analysis
```

---

## 13. What to buy first, in order

1. **Search Console + Analytics** — free, day one, non-negotiable
2. **Screaming Frog paid** (~£259/yr) — cheapest high-impact purchase in SEO
3. **Ahrefs or Semrush** — one, not both
4. **Log File Analyser** (£99/yr) — the only way to verify AI crawler access
5. **An AI visibility tool** — *only after* technical foundation and content restructuring are done
6. Everything else — only when you have a specific question your current stack cannot answer

---

## Sources

- [Semrush vs Ahrefs vs Moz (2026): Features & Pricing — CS Web Solutions](https://www.cswebsolutions.ca/blog/semrush-vs-ahrefs-vs-moz-features-pricing-comparison-2026/)
- [Semrush vs Ahrefs: Complete Comparison Guide (2026) — SEOmator](https://seomator.com/blog/semrush-vs-ahrefs)
- [Best AI Visibility Tools 2026: Profound vs Peec vs Otterly — Surmado](https://www.surmado.com/blog/best-ai-visibility-tools-2026)
- [AI Visibility Tool Pricing Compared 2026 — Acromatico](https://acromatico.com/ai-visibility-tool-pricing-compared)
- [The 8 best AI visibility tools in 2026 — Zapier](https://zapier.com/blog/best-ai-visibility-tool/)
- [Best Technical SEO Audit Tools for 2026 — Ighenatt](https://ighenatt.es/en/blog/seo-audit-tools-2026/)
- [15 Best SEO Audit Tools For 2026 (Free & Paid) — OnSaaS](https://www.onsaas.me/blog/best-seo-audit-tools)
- [9 Courses That Actually Teach SEO and AI Search — Backlinko](https://backlinko.com/seo-certification-guide)
- [17 Best Free SEO Courses and Certifications in 2026 — ALM Corp](https://almcorp.com/blog/free-seo-courses/)
