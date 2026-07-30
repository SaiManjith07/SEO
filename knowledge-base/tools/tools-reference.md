---
id: kb-tools-reference
type: tool-doc
discipline: [SEO, AEO, GEO, LLMO]
tags: [gsc, ga4, crux, ahrefs, semrush, ai-visibility-tools]
related: [kb-index]
last_updated: 2026-07-29
---

# Tools & Platforms — What to Check and What the Values Mean

Every standard in `../standards/` needs a tool to verify it and a value that tells you whether you passed. This file is the operational layer: for each tool, what report to open, what number to look at, and what "good" looks like. Full tool comparisons, pricing, and buying stacks are in `../../research/06-tools-and-platforms.md` — this file only covers *which metric proves which standard*.

---

### TOOL-01 — Google Search Console (free, non-negotiable, set up day one)

| Report | What to check | What "good" looks like | Verifies |
|---|---|---|---|
| **Performance** | Impressions, Clicks, CTR, Average Position — filter by query/page/device, compare trailing 3 months vs. prior period | Impressions and clicks trending together; if impressions rise while clicks flatten, that's an AI Overview absorbing the click, not a failure — investigate before "fixing" | Presentation-stage diagnosis (`../diagnostics.md`) |
| **Pages (Coverage)** | Indexed count vs. reasons under "Not indexed": *Crawled – currently not indexed*, *Discovered – currently not indexed*, *Excluded by noindex tag*, *Duplicate without user-selected canonical*, *Soft 404*, *Server error (5xx)* | Indexed count should match your believed-indexable URL count; any spike in "Crawled – currently not indexed" is a quality signal, any "Duplicate" spike is a canonical problem | STD-04, STD-05 |
| **Core Web Vitals** | URL groups bucketed Good/Needs Improvement/Poor, mobile and desktop separately | **≥75% of URLs "Good"** — this is the literal p75 threshold behind STD-13–16, reported directly | STD-13, STD-14, STD-15, STD-16 |
| **Enhancements** (Structured data types you use — Products, FAQ, Breadcrumbs, etc.) | Valid items vs. Invalid items count | **Zero invalid.** Any invalid count is an active STD-09 failure, not a warning | STD-09, STD-10, STD-11 |
| **Manual Actions** | Presence/absence of any action | **Must be empty.** Check this first, always — takes 10 seconds and rules out the most catastrophic cause of a drop | Diagnostic gate |
| **Security Issues** | Presence/absence | Must be empty | STD-04 (indexability precondition) |
| **URL Inspection → Live Test → View Crawled Page** | "URL is on Google" status; "Page fetch": Successful; indexing allowed; Google-selected vs. user-declared canonical; rendered screenshot + rendered HTML | Rendered HTML should contain the same primary content as the raw response — this is Googlebot's own rendering, useful as a cross-check against STD-06's raw-vs-rendered diff | STD-04, STD-06 |
| **Links** | Top linking sites, top linked pages, internal link counts | Priority pages should not show near-zero internal links — that's a PageRank-distribution problem | STD-05, off-site tier |
| **Sitemaps** | Submitted count vs. indexed count | Large gaps between submitted and indexed flag a systemic problem, not a per-page one | STD-05 |

**Cadence:** Performance — weekly. Coverage, CWV, Enhancements — monthly. Manual Actions/Security — check first on any traffic drop.

#### How to use it:
1. **Verification & Setup:** Sign in to [Google Search Console](https://search.google.com/search-console). Click "Add property", then select "Domain" verification (requires adding a TXT record to your DNS configuration) or "URL prefix" verification (requires uploading a verification HTML file to your public root folder).
2. **Submitting Sitemaps:** Navigate to the "Sitemaps" report in the left sidebar. Enter your sitemap path (e.g. `sitemap.xml`) and click "Submit". Check daily until the status reads "Success".
3. **URL Inspection & Live Rendering:** Paste any URL into the top search bar and press Enter. Click "Inspect URL" to check its indexed status. To test the live, current code, click "Test Live URL" (top right), then choose "View Tested Page" to inspect the rendered HTML and verify that all key content is readable by Googlebot.
4. **Analyzing Coverage & Indexation:** Open the "Pages" report under the "Index" section. Look for indexing errors and warnings. Click into "Not indexed" rows (e.g., "Crawled - currently not indexed" or "Duplicate, Google chose different canonical than user") to export URLs and troubleshoot site hygiene.

---

### TOOL-02 — Google Analytics 4 (free)

| Report / setup | What to check | What "good" looks like | Verifies |
|---|---|---|---|
| **Custom channel group: "AI Search"** | Create a channel matching source contains `chatgpt.com`, `openai.com`, `perplexity.ai`, `gemini.google.com`, `copilot.microsoft.com`, `claude.ai`, `you.com`, `phind.com` | Session count and share of total traffic, trending — this is the closest direct measurement of AI-referral traffic, though it undercounts (see caveat below) | STD-30, measurement layer |
| **Engagement / Key events by channel** | Engagement rate, conversion rate, revenue per channel — compare "AI Search" channel against "Organic Search" | Directionally expect AI-referred sessions to convert higher (reported 4.4–9x in vendor studies) — but treat the multiple as approximate; attribution for AI referrals is measurably poor | STD-30 |
| **Landing page + referrer exploration, filtered to 404** | Build an exploration: landing page = error/404 page, segmented by referrer domain | **Should trend toward zero** for AI-bot referrers (`chatgpt.com`, `perplexity.ai`, `gemini.google.com`, `claude.ai`) — any recurring hallucinated path is a redirect you haven't shipped yet | The "404 hallucination" standard, `../../research/04-technical-requirements.md` §7 |
| **Direct traffic trend** | Month-over-month trend of the Direct channel | Rising Direct alongside rising branded search in GSC is the best available proxy for AI-driven awareness that analytics cannot attribute directly | STD-26, measurement layer |
| **Custom form field: "How did you hear about us?"** | Include "ChatGPT / AI assistant" as an explicit option on signup/demo forms | Self-reported attribution is often more accurate than analytics for this channel specifically, given how badly AI referrals are stripped by missing `Referer` headers | STD-30 |

**Cadence:** monthly channel-mix and conversion review; 404-by-AI-referrer check monthly, same cycle as the technical re-audit.

#### How to use it:
1. **Custom AI Search Channel Setup:** Go to Admin -> Data Settings -> Channel Groups in Google Analytics. Click "Create new channel", name it "AI Search", and add a rule condition where `Session source` matches the regular expression `(chatgpt\.com|openai\.com|perplexity\.ai|gemini\.google\.com|copilot\.microsoft\.com|claude\.ai|you\.com|phind\.com)`. Save and move this channel to the top of your custom channel list.
2. **Attribution & Engagement Analysis:** Open Reports -> Engagement -> Pages and screens. Segment the traffic by your new "AI Search" Custom Channel Group. Analyze metrics like average engagement time, conversion rate, and key event count, comparing them to standard "Organic Search" visits.
3. **Tracking Hallucinated 404 Traffic:** Go to Explore -> Create a blank Exploration. Add "Page path and screen class" and "Session source" as Dimensions, and "Active users" as a Metric. Add a filter to restrict the exploration to pages containing `404` or `/page-not-found`. Check which AI search referrers are driving users to dead URLs.

---

### TOOL-03 — PageSpeed Insights / CrUX Dashboard / CrUX API (free)

| What to check | What "good" looks like | Verifies |
|---|---|---|
| **Field data section** (real users) — LCP, INP, CLS at p75, Mobile and Desktop tabs separately | LCP < 2.5s, INP < 200ms, CLS < 0.1, at ≥75% of real visits | STD-13, STD-14, STD-15 |
| **Lab data** (Lighthouse simulation) | Diagnostic only — use the specific "Opportunities" list (render-blocking resources, oversized images, etc.) to find *why* field data is failing. Never treat the 0–100 lab score itself as a ranking signal | Root-cause path to STD-13–15 |
| **CrUX Dashboard trend line** | After shipping a performance fix, wait the full **28-day rolling window** before checking whether p75 crossed into "Good" — checking sooner will show stale data | STD-16 (site-wide, field-data-only scoring) |
| **Cross-check against GSC's Core Web Vitals report** | The two should agree (same underlying CrUX dataset) — a mismatch usually means one is querying URL-level data and the other origin-level | STD-16 |

**Cadence:** run on key templates during development; re-check 28 days after any performance fix ships, not before.

#### How to use it:
1. **Direct Audit:** Visit [PageSpeed Insights](https://pagespeed.web.dev/). Paste your target URL and click "Analyze".
2. **Review Real-User Data (CrUX):** Look first at the "Discover what your real users are experiencing" section (Field Data). Check the Largest Contentful Paint (LCP), Interaction to Next Paint (INP), and Cumulative Layout Shift (CLS) at the 75th percentile (p75). Only these field metrics affect ranking algorithms.
3. **Diagnose and Fix Lab Regressions:** Scroll down to the "Diagnostics" and "Opportunities" sections (Lighthouse Lab Data). Expand the suggestions (e.g., "Eliminate render-blocking resources", "Defer offscreen images") to identify the specific scripts or stylesheets degrading performance.
4. **Setup CrUX Dashboard:** Open Google Looker Studio, choose the "Chrome UX Report" connector, enter your site URL, and click "Create" to build a historical CWV tracker.

---

### TOOL-04 — Rich Results Test + Schema.org Validator (free)

| What to check | What "good" looks like | Verifies |
|---|---|---|
| **Rich Results Test** — run after every schema change | Zero errors. Warnings are worth reviewing but not blocking | STD-09 |
| **Schema.org Validator** — run alongside, catches things Google's tool ignores | Valid against full schema.org vocabulary, not just Google's supported subset | STD-09 |
| **Manual content-parity check** — neither tool does this for you | Every property in the JSON-LD (rating, FAQ answer, price) has a visible on-page match | STD-12 |

#### How to use it:
1. **Testing Live URLs:** Go to the [Rich Results Test](https://search.google.com/test/rich-results). Paste your URL and click "Test URL". Review the "Detected structured data" list for Product, Article, or FAQ items. Ensure the status displays "Valid items".
2. **Testing Code Snippets:** Copy your JSON-LD code block and click the "Code" tab in the Rich Results Test. Paste the code and click "Test Code". This allows validation in development before deploy.
3. **Validating Full Schema Vocabulary:** Copy your page URL or code snippet and paste it into the [Schema.org Validator](https://validator.schema.org/). Review the hierarchy tree. Unlike Google's tool, this will catch semantic errors and properties outside Google's specific rich snippets.
4. **Manual Content Parity Verification:** Open the raw source of your page (e.g. `ctrl+u`) and locate your `<script type="application/ld+json">` block. Compare values (such as product pricing, author profiles, and FAQ answers) directly with what is visible on the rendered screen. If a schema property has no visible match, remove or update it.

---

### TOOL-05 — Server logs / Screaming Frog Log File Analyser (the only ground truth for bot access)

| What to check | What "good" looks like | Verifies |
|---|---|---|
| **Hits by user-agent** — filter for `Googlebot`, `GPTBot`, `OAI-SearchBot`, `ClaudeBot`, `PerplexityBot`, `Bingbot` | Each target bot should appear in logs at all — zero hits from `OAI-SearchBot` means either it isn't finding you or something is silently blocking it | STD-01, STD-02, STD-03 |
| **Status code distribution per bot** | Overwhelmingly 200s. Any concentration of 403 (WAF/CDN block) or 5xx (server issue) for a specific bot is a live failure, invisible to a robots.txt read alone | STD-02 (the "CDN trap") |
| **Most/least crawled URL segments** | Should roughly track your priority pages; heavy crawl spend on low-value parameter URLs is a crawl-budget leak | STD-05 (faceted navigation hygiene) |

**Cadence:** monthly, or immediately after any CDN/WAF configuration change (the single most common silent breakage point).

#### How to use it:
1. **Export Logs:** Access your hosting panel (AWS CloudFront, Cloudflare, Nginx, or Apache console) and download the raw server logs for the desired timeframe.
2. **Import into Log File Analyser:** Open the Screaming Frog Log File Analyser desktop application. Click "New Project" and drag-and-drop your exported `.log` or `.csv` files.
3. **Filter by Bot User-Agents:** Go to the "User-Agent" tab and filter by crawlers (e.g., `Googlebot`, `OAI-SearchBot`, `GPTBot`, `ClaudeBot`, `PerplexityBot`).
4. **Analyze Response Code Distribution:** Check the "Status Codes" column for the filtered bots. Confirm that retrieval bots are returning `200 OK`. If you see high rates of `403 Forbidden`, investigate your WAF rules or CDN security settings.

---

### TOOL-06 — Ahrefs / Semrush (pick one; full comparison in `../../research/06-tools-and-platforms.md` §2)

| What to check | What "good" looks like | Verifies |
|---|---|---|
| **Site Audit health score** | Trending flat or up; a sudden drop flags a deploy-introduced regression | Cross-cutting technical check, overlaps STD-04–19 |
| **Organic traffic / keyword distribution (top 3 / top 10 / top 100)** | Growing share in top 10, not just raw keyword count — raw count is easy to inflate with irrelevant long-tail | Ranking-stage health |
| **Referring domains count and quality** | Track trend, not absolute Domain Rating/Authority — **DA/DR are vendor metrics Google does not use; never set a target against them** | STD-26 (weak proxy — mentions matter more) |
| **Content Explorer — unlinked brand mentions** | A growing list of unlinked mentions is the raw material for outreach; the count itself isn't a pass/fail, it's a backlog | STD-26, STD-27 (narrative-gap sourcing) |

#### How to use it:
1. **Run a Technical Site Audit:** Go to the Site Audit module, click "New Project", verify ownership (or configure crawler access), and run a complete crawl. Review the "Health Score" and resolve high-severity issues (broken redirects, canonical loops, 404s).
2. **Analyze Organic Keywords & Content Gaps:** Enter your domain in Site Explorer. Go to "Organic Keywords" to inspect query rankings. Use the "Content Gap" tool to enter your competitor URLs, showing queries they rank for that you do not.
3. **Find Unlinked Brand Mentions (Ahrefs Content Explorer):** Go to Content Explorer. Enter your brand query: `"Brand Name" -site:yourdomain.com`. Set search to "In content". Filter pages by Language = English and Domain Rating (DR) > 30. Export the list and verify whether the pages link back to you. If not, launch an outreach campaign to request a link.

---

### TOOL-07 — AI-visibility tools (Profound, Peec AI, Otterly.AI, Semrush AI Toolkit, Ahrefs Brand Radar)

| What to check | What "good" looks like | Verifies |
|---|---|---|
| **Citation frequency %** across N sampled runs of your query panel (never a single sample — citations are probabilistic) | Trend direction month-over-month; do not compare absolute values across different vendor tools, their panels and sampling differ | STD-30 |
| **Competitor co-mention list ("narrative gap")** | This *is* the actionable output — every query where a competitor is named and you are not becomes a content/PR roadmap item, ranked by commercial value | STD-27, STD-30 |
| **Manual panel cross-check** | Run the same 50–100 queries by hand, 3–5 samples each, quarterly at minimum — treat the paid tool as a sampling convenience, not a replacement | STD-30 |

**Verdict on when to pay for this category:** only after the technical foundation (Level 0–1 standards) and content restructuring are done. Paying to watch a number you haven't yet given a reason to move is the most common wasted spend in this category.

#### How to use it:
1. **Configure Your Query Panel:** Create a list of 50–100 commercially-valuable search terms (representing your target services, comparisons, and informational topics). Upload this keyword file to the tool.
2. **Monitor AI Citation Share:** Track your brand's citation frequency (%) across Google AI Overviews, ChatGPT, Gemini, and Perplexity over time. Set reports to run on a weekly or monthly schedule.
3. **Perform a Narrative Gap Audit:** Go to the Competitor Analysis reports. Look for queries where a competitor is cited in the generative summary and your brand is omitted. Open the cited competitor pages, analyze their structure and evidence density, and rewrite your pages to bridge the gap.

---

### TOOL-08 — Google Business Profile (free, local/physical-presence businesses only)

| What to check | What "good" looks like | Verifies |
|---|---|---|
| **Views / searches (direct vs. discovery)** | Discovery searches (found via search terms, not brand name) trending up | Local entity visibility, adjacent to STD-28 |
| **Actions** (calls, direction requests, website clicks) | Trending with traffic, not diverging from it | Conversion-adjacent local signal |
| **Review count, average rating, response rate** | 100% owner response rate on reviews; rating trend stable or improving | E-E-A-T trust signal at the local level |

#### How to use it:
1. **Claim and Verify Your Business:** Go to [Google Business Profile](https://business.google.com/). Search for your business name and address, then request verification via physical postcard, phone call, or email.
2. **Optimize Business Details:** Navigate to the "Edit Profile" dashboard. Fill in your business category, address, phone number, website URL, operating hours, and a descriptive, keyword-rich business summary.
3. **Engage with Customer Reviews:** Go to the "Read Reviews" tab. Write personalized responses to all reviews (positive and negative) within 24–48 hours to show Google's local algorithm that the listing is actively managed.

---

## Tool → standard verification map

A single lookup: which tool is the source of truth for which standard.

| Standard(s) | Verified by |
|---|---|
| STD-01, STD-02, STD-03 (crawler access) | Server logs / Log File Analyser (ground truth) + `curl -A "<bot>"` spot-check + GSC Crawl Stats |
| STD-04, STD-05 (indexability, hygiene) | GSC Pages/Coverage report, GSC Sitemaps report |
| STD-06, STD-07, STD-08 (rendering) | GSC URL Inspection (View Crawled Page) + manual raw/rendered `curl` diff |
| STD-09–STD-12 (schema) | Rich Results Test, Schema.org Validator, GSC Enhancements |
| STD-13–STD-16 (performance) | GSC Core Web Vitals report, PageSpeed Insights field data, CrUX Dashboard/API |
| STD-17–STD-19 (semantic HTML) | Screaming Frog custom extraction, manual review |
| STD-20–STD-25 (AEO/GEO content) | `seo_extractability` (evaluator tool), manual editorial review — no external tool scores this directly |
| STD-26–STD-29 (off-site authority) | Ahrefs/Semrush Content Explorer, Google Alerts, Brand24/Mention |
| STD-30 (AI visibility panel) | Manual panel + Profound/Peec/Otterly as a sampling aid |
| STD-31, STD-32 (LLMO) | No dedicated tool — tracked via the same access/content tools above, plus manual monitoring of vendor GPT/plugin ecosystems and licensing announcements |
