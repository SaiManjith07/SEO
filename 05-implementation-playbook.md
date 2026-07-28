# Implementation Playbook — How to Actually Achieve It

Sequenced so each phase unblocks the next. Do not skip ahead: content work on an unrenderable site is wasted effort.

---

## Phase 0 — Baseline (Week 1)

You cannot prove improvement without a starting line. Capture all of this before changing anything.

| Capture | Where |
|---|---|
| Organic sessions, conversions, revenue — 12-month trend | GA4 |
| Impressions, clicks, avg. position, CTR — by query and page | Search Console |
| Current indexed page count | Search Console Coverage |
| Core Web Vitals at p75 | Search Console CWV report |
| Current rankings for top 50 commercial queries | Rank tracker |
| Branded search volume | Search Console, filtered to brand terms |
| AI referral traffic | GA4 custom channel group (see §6) |
| **AI visibility panel baseline** | Manual — see below |
| Backlink profile and referring domains | Ahrefs / Semrush |
| Brand mention count (linked + unlinked) | Ahrefs Content Explorer, Google Alerts, Brand24 |

### Build the AI visibility panel now

This is the core GEO measurement instrument and nothing replaces it.

1. Pick **50–100 queries** with real commercial value — "best X for Y", "X vs Y", "how to solve [problem your product solves]", "X pricing", "alternatives to [competitor]".
2. Run each across **ChatGPT, Perplexity, Google AI Overviews, Gemini, Copilot**.
3. Because citations are **probabilistic**, run each query **3–5 times** and record frequency, not a single yes/no.
4. Log per run: are you **cited and linked** / **mentioned but unlinked** / **absent**? Which competitors appear? Which sources are cited?
5. Store in a spreadsheet with a date column. Repeat monthly.

The competitor column is the important one. Every query where a competitor is named and you are not is a line item on your roadmap — the **narrative gap**.

---

## Phase 1 — Technical foundation (Weeks 1–4)

Work through the full audit in `04-technical-requirements.md`. Priority order:

| Priority | Task | Effort | Impact |
|---|---|---|---|
| **P0** | Unblock AI crawlers in robots.txt **and at the CDN/WAF** | Hours | Critical — binary |
| **P0** | Server-side render all content pages | Days–weeks | Critical — binary for ChatGPT |
| **P0** | Fix indexation blockers (noindex, canonical conflicts, 5xx) | Days | Critical |
| **P1** | Organization schema with full `sameAs` array | Hours | High |
| **P1** | Article/Product schema across templates | Days | High |
| **P1** | Semantic HTML in content templates | Days | High |
| **P2** | Core Web Vitals to green at p75, site-wide | Weeks | Medium–high |
| **P2** | 404 monitoring by AI referrer + redirect loop | Hours + ongoing | Medium |
| **P3** | llms.txt | Hours | Low — do last, or not at all |

**Gate:** do not begin Phase 2 until `curl -A "OAI-SearchBot" https://yoursite.com/key-page` returns your full content in the raw HTML. Everything downstream depends on it.

---

## Phase 2 — Content restructuring (Weeks 3–10)

**Restructuring existing content beats writing new content.** Reported gains of 2–4x in citation rate from formatting changes alone, with no new pages. Start here.

### Selection: find the sleepers

Pull from Search Console, last 6 months. Prioritise pages that are:

- **High impressions, low CTR** — being seen, not chosen
- **Ranking positions 4–15** — close to the citation threshold
- **Commercial or comparison intent** — where AI conversion is strongest
- **Not refreshed in 12+ months** — structurally excluded by freshness gating

Take the top 20. That is your first sprint.

### The restructure pattern, per page

1. **Rewrite the opening.** First 100 words answer the page's core question directly, completely, with no preamble. This is the primary citation target.

2. **Convert headings to questions.** Use real query phrasing from Search Console and People Also Ask, not invented wording.

3. **Apply BLUFF to every section.** 40–60 word direct answer immediately under each H2, then elaboration.

4. **Atomise the paragraphs.** 2–4 lines, one idea per block, each self-contained.

5. **De-pronoun.** Replace "it", "the platform", "this approach" with actual entity names. Chunking strips context; pronouns become meaningless.

6. **Add evidence** (the Princeton trio, ~40% combined lift):
   - **Statistics** — replace every qualitative claim with a number
   - **Quotations** — from named, credible people
   - **Citations** — inline links to primary sources

7. **Add a comparison table** where the topic allows. Highly extractable; models reproduce table rows readily.

8. **Consider listicle format** for commercial topics — 43.8% of ChatGPT-cited pages are listicles, because listicles are pre-chunked.

9. **Add an FAQ block** with genuine questions, and mark it up with FAQPage schema. Content must be visible on the page.

10. **Update substantively and stamp the date.** New data, changed recommendations, added sections. A date change without content change is detectable and worthless.

### New content: write to the question space, not the keyword

Because of query fan-out (9–11 sub-queries average, 400+ in deep research), you are not targeting a query — you are targeting the *set of sub-questions the system will invent*.

**Process:**
1. Take the head topic.
2. List every sub-question a curious buyer would need answered — 15–30 of them. Sources: PAA, Reddit threads, sales call transcripts, support tickets, competitor comparison pages.
3. Group into a pillar page plus supporting cluster pages.
4. Ensure each sub-question gets its own question-shaped H2 with a self-contained answer.
5. Interlink the cluster tightly.

### Standing refresh cadence

| Content type | Cadence |
|---|---|
| Commercial / comparison / pricing | **Quarterly** |
| Statistics and data pages | Quarterly or on data release |
| Versioned how-to guides | Per major version |
| Evergreen explainers | Annually |

83% of AI citations on commercial queries come from pages updated within 12 months; 76% of ChatGPT's top-cited pages within 30 days. Freshness is an eligibility gate, not a nice-to-have.

---

## Phase 3 — Off-site authority (Weeks 6+, permanent)

**The highest-leverage work, and the slowest.** Brand mentions correlate 0.664 with AI visibility vs. 0.218 for backlinks — roughly 3x — and **the mention does not need to be linked.**

### Tier 1 — Third-party editorial

Being *inside* "Best X tools for Y" articles is worth more than anything you publish about yourself. AI trusts third-party consensus over self-description.

**Tactics:**
- Identify the listicles and comparison posts AI already cites for your target queries (your panel data shows you exactly which)
- Outreach to those specific publishers for inclusion or correction
- Claim and complete profiles on review sites (G2, Capterra, Trustpilot, industry directories)
- Publish **original data** — proprietary surveys, benchmarks, aggregate product data. This is the most reliable way to earn unsolicited citations, and it feeds the "statistics" preference directly.
- Expert contribution and commentary to trade publications
- Analyst relations if you operate in a covered category

### Tier 2 — Community and UGC

Reddit is a foundational LLM training source and a heavy ChatGPT citation source. Quora, Stack Overflow, niche forums and Discord/Slack communities matter too.

**Rules:**
- Real accounts, real participation, disclosed affiliation
- Answer questions genuinely; recommend competitors when they fit better — this is what builds the credibility that makes your recommendations count
- **Do not astroturf.** It gets detected, banned, and generates negative sentiment in exactly the corpus you are trying to influence. There is no shortcut here and the downside is worse than doing nothing.

### Tier 3 — YouTube (most underused)

YouTube is the **most cited domain in Google's AI Overviews**, with a **0.737 correlation** between YouTube mentions and ChatGPT visibility.

**Because models process the audio transcript:**
- **Say the target phrase out loud in the video.** Spoken, not just on screen or in the title.
- Upload a corrected transcript rather than relying on auto-captions
- Detailed, timestamped descriptions and accurate chapters
- Answer-first structure, same as written content
- Repurpose existing top content into video — low incremental cost, high channel diversification

### Protect your originality

Name your frameworks after your brand — "The [Brand] Readiness Score", "The [Brand] Content Matrix". Generative models flatten unnamed concepts into generic advice and strip attribution. A named entity survives synthesis.

---

## Phase 4 — Measure and iterate (monthly, permanent)

### Monthly

- Re-run the AI visibility panel (3–5 samples per query)
- Update the narrative gap list — where competitors appear and you don't
- Review AI referral traffic and branded search trend
- Check 404s by AI referrer; redirect new hallucinated paths
- Search Console: impressions vs. clicks divergence by page
- Ship the next content restructure batch

### Quarterly

- Full technical re-audit against the `04` checklist
- Core Web Vitals review at p75
- Refresh all commercial and comparison pages
- Backlink and brand-mention delta
- Reassess platform mix — the AI referral landscape is moving fast (Gemini +231%, Claude +320% YoY)

---

## 5. Realistic expectations

| Work | Time to visible effect |
|---|---|
| Technical unblocking (robots.txt, CDN, SSR) | **Days to 2 weeks** — often the fastest win available |
| Content restructuring on existing pages | 2–8 weeks |
| Content refresh (freshness signals) | 2–6 weeks |
| Schema implementation | 2–6 weeks |
| Core Web Vitals (CrUX is a 28-day rolling window) | **Minimum 28 days** after fixes land |
| New content ranking | 3–6 months |
| Off-site mentions → AI visibility | 3–9 months |
| Training-corpus presence | 12+ months, next model generation |

**Anyone promising AI visibility in 30 days is selling the technical fixes as if they were strategy.** The technical fixes are real and fast. Everything else compounds slowly.

---

## 6. Tooling

### Essential, free
| Tool | Use |
|---|---|
| Google Search Console | Impressions, queries, indexation, CWV — the ground truth |
| Google Analytics 4 | Traffic, conversions, AI referral segmentation |
| PageSpeed Insights | CWV diagnosis |
| Rich Results Test | Schema validation |
| Google Trends | Demand direction |

### GA4 setup for AI referrals
Create a custom channel group, "AI Search", matching source contains any of:
```
chatgpt.com · openai.com · perplexity.ai · gemini.google.com
copilot.microsoft.com · claude.ai · you.com · phind.com
```
**Caveat:** a large share of AI-influenced sessions arrive with no referrer and land in Direct, or as branded organic search. Treat measured AI referrals as the visible tip. Watch **branded search volume** as the better proxy for total AI-driven awareness.

### Self-reported attribution
Add **"How did you hear about us?"** to signup and demo-request forms, with ChatGPT / AI assistant as an explicit option. Given how badly AI referrals are stripped from analytics, this is often your most accurate data source. Cheap to add, disproportionately informative.

### Paid — SEO
Ahrefs or Semrush (pick one — both cover backlinks, keywords, rank tracking, audits), Screaming Frog for crawling, Lumar/Botify at enterprise scale.

### Paid — AI visibility
Profound, Peec AI, Otterly, Semrush AI Toolkit, Ahrefs Brand Radar. All are early, all disagree with each other, and all measure a probabilistic system with small samples. Use one for trend direction; **do not let it replace your manual panel.**

### Bot analytics
Server logs are ground truth for non-Google crawlers. Cloudflare Radar, Vercel/Netlify logs, or dedicated bot analytics show which pages AI crawlers actually fetch — and whether they are getting 200s.

---

## 7. Prioritisation, if you can only do five things

1. **Unblock AI crawlers** — robots.txt *and* CDN/WAF. Binary; costs hours.
2. **Server-side render your content.** Binary for ChatGPT visibility.
3. **Restructure your top 20 commercial pages** — BLUFF openings, question headings, atomic paragraphs, statistics, tables.
4. **Ship Organization + Article schema** with a complete `sameAs` array.
5. **Get into third-party listicles and comparison articles** for your top commercial queries.

Items 1, 2 and 4 are engineering tasks measurable in days. Item 3 is a content sprint. Item 5 never ends — and matters most.

---

## 8. Conflicting figures — read before quoting any number

Different studies report materially different values for the same phenomena. Where sources disagree, both figures appear below.

| Claim | Reported range | Notes |
|---|---|---|
| CTR drop for #1 result when AI Overview present | **−58%** to **−61%** | Both late-2025/2026 studies; methodology differs |
| AI vs. organic conversion multiple | **4.4x** (Semrush, 500+ topics) to **23x** (per-business reports) | The 23x figure is from individual businesses in high-consideration categories; 4.4x is the broader study. Both inflated by attribution bias — measurable AI referrals skew to late-funnel clicks. |
| AIO citations from Google top-10 pages | **76%** (some 2026 studies) vs. **38%** (ALM Corp, 173k URLs, down from 76% YoY) | Likely the same trend measured at different points: the rate *fell* from 76% to 38% over a year. Treat "ranking well helps but no longer guarantees" as the reliable takeaway. |
| ChatGPT share of AI referrals | **62.6%** (B2B panels) to **74.8%** (consumer panels) | Panel composition drives the gap |
| ChatGPT-cited page freshness | **76%** within 30 days vs. **83%** within 12 months (AirOps) | Different platforms, different query types. Both say: refresh regularly. |

**Only the Princeton GEO paper is peer-reviewed.** Everything else is vendor or agency research with undisclosed methodology, often published by companies selling the solution. Use these figures to justify direction and priority. Do not put a decimal point in a board deck without checking the primary source.
