# Technical Requirements — The Engineering Checklist

Everything in files 01–03 depends on this file. If a machine cannot fetch, render and parse your content, no amount of content strategy matters.

---

## 1. Crawler access — check this first

### 1.1 robots.txt: the most common own-goal

Many sites are invisible to AI search because they block the bots without realising it. **Audit `/robots.txt` before anything else.**

| Bot | Operator | Purpose | Should you allow it? |
|---|---|---|---|
| `Googlebot` | Google | Search index — **also feeds AI Overviews** | **Always.** Blocking it removes you from Google entirely |
| `Google-Extended` | Google | Gemini training / grounding | Yes, if you want Gemini visibility |
| `GPTBot` | OpenAI | Training crawl | Yes for long-term corpus presence; blocking costs future visibility |
| `OAI-SearchBot` | OpenAI | **ChatGPT live search** | **Yes — critical.** Blocking this removes you from ChatGPT search results |
| `ChatGPT-User` | OpenAI | User-initiated fetch | Yes |
| `ClaudeBot` / `Claude-SearchBot` | Anthropic | Training / search | Yes |
| `PerplexityBot` | Perplexity | Index + citation | Yes |
| `Bingbot` | Microsoft | Bing index — **feeds Copilot** | Yes |
| `Applebot` / `Applebot-Extended` | Apple | Siri, Apple Intelligence | Yes |
| `Bytespider` | ByteDance | Aggressive training crawl | Optional — heavy load, low return |
| `CCBot` | Common Crawl | Open corpus feeding many models | Yes — high leverage per crawl |

**Working baseline `/robots.txt`:**

```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /cart/
Disallow: /*?sessionid=
Disallow: /internal-search/

User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: https://example.com/sitemap.xml
```

### 1.2 The Cloudflare trap

**Cloudflare now blocks AI crawlers by default on many plans.** Since its default-block rollout, sites that never touched robots.txt are silently invisible to AI search.

Check under **Cloudflare → Security → Bots → AI Scrapers and Crawlers**, and review any WAF rules matching AI user agents. The same applies to Akamai, Fastly and AWS WAF bot-management defaults. **Verify at the edge, not just in robots.txt** — a permissive robots.txt means nothing if your CDN returns 403.

### 1.3 The trade-off, stated fairly

Allowing training crawlers means your content trains models that may answer questions without sending traffic. Cloudflare Radar's crawl-to-refer ratios (Jan–Mar 2026):

| Crawler | Pages crawled per referral sent |
|---|---|
| Google | **~5 : 1** |
| OpenAI GPTBot | ~1,276 : 1 (improving; ~857:1 by May 2026) |
| Anthropic ClaudeBot | ~23,951 : 1 (improved to ~11,122:1 later in 2026) |

**Important caveat, stated by Cloudflare themselves:** traffic referred by Claude's and other providers' **native apps carries no `Referer:` header**, so it is invisible to this measurement. The referral side counts only web-based tools. Cloudflare's own words: *"these calculations may overstate the respective ratios, but it is unclear by how much."* The real ratios are better than the headline numbers — by an unknown margin.

The asymmetry is nonetheless real: most AI crawling is training, which returns almost no traffic. **But blocking is usually the wrong response for a commercial brand** — you remove yourself from the answer layer while competitors stay in it, and you cannot buy your way back in later. Publishers monetising pageviews face a genuinely different calculation than a business that wants to be recommended.

**Sensible middle path:** allow all search/retrieval bots (`OAI-SearchBot`, `PerplexityBot`, `Claude-SearchBot`, `Google-Extended`) unconditionally. Make a deliberate decision on pure training bots (`GPTBot`, `CCBot`, `Bytespider`) based on your business model.

### 1.4 Verify, don't assume

- Search Console → **Crawl Stats** (Googlebot reality)
- **Server logs** — the only ground truth for non-Google bots. Filter by user agent, confirm 200s not 403s.
- `curl -A "OAI-SearchBot" -I https://yoursite.com/page` — check the status code you actually return
- Bot analytics tooling (Cloudflare Radar, Bot Analytics, Vercel logs) for which pages AI crawlers hit most

---

## 2. Rendering — the silent killer

### **ChatGPT's crawler does not execute JavaScript.**

This is the single most consequential technical fact in this document.

| Crawler | JavaScript rendering |
|---|---|
| Googlebot | Yes — Chromium-based, but deferred and budget-limited |
| Bingbot | Limited |
| **GPTBot / OAI-SearchBot** | **No** |
| **PerplexityBot** | **Limited / no** |
| **ClaudeBot** | **No** |

**If your content is client-side rendered, it does not exist for most AI engines.** A React or Vue SPA that ships an empty `<div id="root">` and hydrates on the client is a blank page to ChatGPT.

### Requirements

- **Server-side rendering (SSR) or static site generation (SSG) for all content you want cited.** Next.js SSR/SSG, Nuxt, Astro, Remix, or plain server-rendered HTML.
- **All primary content in the initial HTML response.** Not injected post-load.
- **No content behind interaction.** Accordions, tabs and "read more" toggles must have their content present in the DOM at load, hidden with CSS — not fetched on click.
- **Do not block `/js/` or `/css/` in robots.txt.** Googlebot needs them to render; blocking them causes it to see a broken page.

### How to test

```bash
# What a non-JS crawler sees — your content should be in this output
curl -s https://yoursite.com/your-page | grep -i "your key sentence"
```

Or: disable JavaScript in Chrome DevTools and reload. What remains is roughly what ChatGPT sees.

Also use Search Console → **URL Inspection → View Crawled Page** for Googlebot's rendered view specifically.

---

## 3. Structured data (schema)

### Why it matters
- **65%** of AI-cited pages use structured data
- Pages with proper schema are reported at **~2.5x** higher likelihood of appearing in AI-generated answers

Schema tells retrieval systems what your content *is* rather than making them infer it. That reduces ambiguity, and ambiguity is what gets you skipped.

### Format
**JSON-LD in a `<script type="application/ld+json">` block.** Google's explicit recommendation. Keeps markup separate from HTML, easy to generate, easy to validate. Do not use Microdata or RDFa for new work.

### Priority types

| Type | Use on | Why it matters |
|---|---|---|
| **Organization** | Site-wide, on homepage | **Highest priority.** Establishes brand as a coherent entity — the first thing AI uses to judge source reliability |
| **Article / BlogPosting** | All editorial content | Author, dates, publisher — feeds E-E-A-T and freshness signals |
| **FAQPage** | Pages with genuine Q&A | Directly matches the question-answer shape of AI queries |
| **HowTo** | Step-by-step guides | Highly extractable procedural content |
| **Product** | Product pages | name, description, brand, SKU, GTIN, image, offers, aggregateRating |
| **LocalBusiness** | Location pages | How AI matches location-based queries |
| **BreadcrumbList** | All pages | Communicates site hierarchy |
| **Person** | Author bio pages | Author entity + credentials — E-E-A-T evidence |
| **WebSite** + `SearchAction` | Homepage | Sitelinks search box |

### The hard rule: content parity

**Every schema property must correspond to something a human can see on the rendered page.**

If schema claims an FAQ that isn't visible, or a rating that appears nowhere, Google flags it as **spammy structured data** — a policy violation with real ranking consequences. This is enforced, not theoretical.

### Organization schema — the one to get right

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://example.com/#organization",
  "name": "Example Inc",
  "url": "https://example.com",
  "logo": "https://example.com/logo.png",
  "description": "One-sentence factual description of what the company does.",
  "foundingDate": "2019-03-15",
  "sameAs": [
    "https://www.linkedin.com/company/example",
    "https://x.com/example",
    "https://www.youtube.com/@example",
    "https://github.com/example",
    "https://en.wikipedia.org/wiki/Example_Inc"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer support",
    "email": "support@example.com"
  }
}
```

**`sameAs` is the entity-disambiguation array.** It tells AI systems that this website, this LinkedIn page, this YouTube channel and this Wikipedia entry are all the same entity. Include every authoritative profile you control. A Wikipedia or Wikidata entry, if you legitimately qualify for one, is disproportionately valuable here.

### Validation
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema.org Validator](https://validator.schema.org/)
- Search Console → Enhancements (ongoing monitoring)

---

## 4. Core Web Vitals

As of the **March 2026 core update**, Google scores CWV as a **site-wide holistic composite** of LCP, INP and CLS — not page by page. Optimising only top landing pages no longer works.

### Thresholds

| Metric | Measures | Good | Needs improvement | Poor |
|---|---|---|---|---|
| **LCP** — Largest Contentful Paint | Loading | **< 2.5s** | 2.5–4.0s | > 4.0s |
| **INP** — Interaction to Next Paint | Responsiveness | **< 200ms** | 200–500ms | > 500ms |
| **CLS** — Cumulative Layout Shift | Visual stability | **< 0.1** | 0.1–0.25 | > 0.25 |

**Scoring:** 75th percentile of real user visits (CrUX field data), 28-day rolling window. 75% of visits must be "good" to pass. Lab tools like Lighthouse are diagnostic only — they do not determine your score.

**43% of sites still fail the 200ms INP threshold.** INP is the most commonly failed vital in 2026, and it is almost always a JavaScript problem.

### Fixes by metric

**LCP**
- Identify the LCP element (usually hero image or headline) in DevTools
- `<link rel="preload">` the LCP image; never lazy-load it
- Serve AVIF/WebP with correct responsive `srcset`
- `fetchpriority="high"` on the LCP image
- Eliminate render-blocking CSS/JS; inline critical CSS
- Improve TTFB: CDN, edge caching, server response < 200ms

**INP** — the hard one
- **Ship less JavaScript.** Audit the bundle; remove unused dependencies
- Break long tasks (> 50ms) with `scheduler.yield()` or `setTimeout` chunking
- Defer non-critical third-party scripts — analytics, chat widgets, tag managers are the usual culprits
- Debounce expensive event handlers
- Avoid layout thrashing (read/write DOM in batches)
- Use `content-visibility: auto` for offscreen content

**CLS**
- Explicit `width`/`height` on all images and video, or `aspect-ratio` in CSS
- Reserve space for ads, embeds, banners with min-height containers
- `font-display: optional` or `swap` + `<link rel="preload">` for webfonts
- Never insert content above existing content after load

### Measurement
- Search Console → **Core Web Vitals** report (field data, authoritative)
- [PageSpeed Insights](https://pagespeed.web.dev/) (field + lab)
- [CrUX Dashboard](https://developer.chrome.com/docs/crux/dashboard) for trends
- `web-vitals` JS library for your own RUM collection

---

## 5. Semantic HTML

Models parse the HTML structure to identify chunk boundaries. Div soup destroys extractability.

**Requirements:**
- One `<h1>` per page; `<h2>`/`<h3>` in strict hierarchical order, never skipping levels
- Headings must be **real heading tags**, not styled `<div>`s or `<span>`s
- Lists must be `<ul>`/`<ol>`/`<li>`, not paragraphs with bullet characters
- Tables must be `<table>` with `<thead>`, `<th scope>`, `<tbody>` — not CSS grid divs
- Landmarks: `<main>`, `<article>`, `<section>`, `<nav>`, `<aside>`, `<header>`, `<footer>`
- Descriptive `alt` on every meaningful image
- `<time datetime="2026-07-27">` for dates
- Visible author byline linked to an author page carrying `Person` schema

**Rule of thumb:** if your page reads correctly as plain text with all CSS removed, it will chunk correctly. Test it.

---

## 6. Indexing hygiene

| Item | Requirement |
|---|---|
| XML sitemap | All indexable URLs, accurate `<lastmod>`, submitted in Search Console, split at 50k URLs |
| Canonical tags | Self-referencing on every page; consistent absolute URLs |
| Redirects | 301 for permanent; no chains longer than one hop; never redirect everything to homepage |
| 404s | Return real 404 status, not soft-404 200s |
| Pagination | Real crawlable `<a href>` links, not JS-only "load more" |
| Faceted navigation | `noindex` or `robots.txt`-block parameter combinations to protect crawl budget |
| URL structure | Lowercase, hyphenated, stable, shallow, no session IDs |
| hreflang | Bidirectional, with `x-default`, if multilingual |
| HTTPS | Enforced site-wide with HSTS; no mixed content |

---

## 7. The 404 hallucination problem

**AI assistants send visitors to 404 pages ~2.87x more often than Google Search does.**

Models generate plausible-looking URLs that don't exist — `/pricing-plans` when yours is `/pricing`, `/docs/getting-started` when yours is `/guide/start`. Real prospects, arriving with high intent, hitting a dead end.

**Mitigation:**

1. **Monitor 404s by referrer.** Filter server logs / GA4 for 404s where the referrer is `chatgpt.com`, `perplexity.ai`, `gemini.google.com`, `claude.ai`.
2. **Redirect the recurring hallucinated paths** to the correct pages. This is a maintenance loop — check monthly.
3. **Build a genuinely useful 404 page:** site search box, links to top sections, clear next actions. Assume the visitor is a qualified lead, not a lost crawler.
4. **Consider claiming obvious aliases** proactively — if your pricing page is `/plans`, also make `/pricing` resolve to it.

This is cheap to fix and directly recovers your highest-converting traffic segment.

---

## 8. llms.txt — the honest assessment

**Current verdict: optional, unproven, near-zero measured impact.**

The evidence:

| Finding | Source |
|---|---|
| 10.13% adoption across 300,000 domains after ~18 months | SE Ranking |
| Of 500M+ AI bot visits over 90 days, only **408** fetched `/llms.txt` | Bot monitoring study |
| Google's Gary Illyes (July 2025): Google does not support it, no plans to | On the record |
| John Mueller compared it to the discredited keywords meta tag | On the record |
| No W3C, IETF or standards-body backing | — |
| As of Q1 2026, no major AI lab has publicly committed to reading it in production | — |

GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot and Google-Extended overwhelmingly skip the file and crawl HTML directly.

**Recommendation:** if it takes an hour to generate and maintain automatically, add it — the downside is zero and the standard may gain traction. **Do not treat it as an AI-visibility strategy, do not pay an agency for it, and do not prioritise it above any item in sections 1–7 of this file.** Server-side rendering and unblocked crawlers matter thousands of times more.

---

## 9. Pre-launch technical audit

Run in order. Stop and fix before moving on.

**Access**
- [ ] robots.txt allows Googlebot, OAI-SearchBot, PerplexityBot, ClaudeBot, Google-Extended
- [ ] CDN/WAF (Cloudflare AI Scrapers setting) not blocking AI crawlers at the edge
- [ ] `curl -A "OAI-SearchBot"` returns 200 with full content
- [ ] Server logs confirm AI bots receiving 200s, not 403s
- [ ] No accidental `noindex` on production

**Rendering**
- [ ] Primary content present in raw HTML (`curl` test passes)
- [ ] SSR or SSG in place for all content pages
- [ ] Accordion/tab content in DOM at load
- [ ] JS and CSS not blocked in robots.txt
- [ ] Search Console URL Inspection shows content in rendered HTML

**Structured data**
- [ ] Organization schema on homepage with full `sameAs` array
- [ ] Article/BlogPosting on all editorial content with author + dates
- [ ] FAQPage where genuine Q&A is visible on page
- [ ] Product/LocalBusiness where applicable
- [ ] All schema passes Rich Results Test with zero errors
- [ ] Content parity verified — nothing marked up that isn't visible

**Performance**
- [ ] LCP < 2.5s at p75, site-wide
- [ ] INP < 200ms at p75, site-wide
- [ ] CLS < 0.1 at p75, site-wide
- [ ] Search Console CWV report green across URL groups

**Structure**
- [ ] Semantic HTML: real headings, lists, tables
- [ ] Single H1, no skipped heading levels
- [ ] Descriptive alt text throughout
- [ ] Author bylines linked to Person-schema author pages

**Hygiene**
- [ ] XML sitemap accurate and submitted
- [ ] Self-referencing canonicals
- [ ] No redirect chains
- [ ] HTTPS enforced
- [ ] 404s monitored by AI referrer, recurring hallucinated URLs redirected

---

## Sources

- [The crawl before the fall of referrals — Cloudflare Blog](https://blog.cloudflare.com/ai-search-crawl-refer-ratio-on-radar/)
- [GEO Data Report 2026: Crawl-to-Refer Ratios — SEOmator](https://seomator.com/blog/crawl-to-refer-ratio-ai-crawlers-llm-bots)
- [Cloudflare Blocks AI Crawlers by Default](https://noticemesenpai.com/news/cloudflare-blocks-ai-crawlers-default-pay-per-use/)
- [Schema Markup for AI Search: 65% of AI-Cited Pages Use It — Alhena](https://alhena.ai/blog/schema-markup-ai-search-ecommerce/)
- [Structured Data in 2026: The Schema Markup AI Actually Uses — GlobeRunner](https://globerunner.com/structured-data-schema-markup-ai-2026/)
- [Core Web Vitals 2026: INP, LCP & CLS Optimization — Digital Applied](https://www.digitalapplied.com/blog/core-web-vitals-2026-inp-lcp-cls-optimization-guide)
- [What Are the Core Web Vitals? (2026) — corewebvitals.io](https://www.corewebvitals.io/core-web-vitals)
- [The State of llms.txt in 2026 — aeo.press](https://ai.aeo.press/the-state-of-llms-txt-in-2026)
- [LLMs.txt Guide: What It Does and Doesn't Do (2026) — Derivatex](https://derivatex.agency/blog/llms-txt-guide/)
- [We Analyzed robots.txt Across Cloudflare's Network — TechnologyChecker](https://technologychecker.io/blog/robots-txt-ai-crawlers-blocking-report)
