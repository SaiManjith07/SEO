---
id: std-access-indexability
type: standard-doc
discipline: [SEO, AEO, GEO, LLMO]
level: 0
tags: [robots-txt, cdn, crawler-access, indexability, sitemap]
related: [std-rendering, seo-group-crawler]
last_updated: 2026-07-29
---

# Level 0 — Access & Indexability

**HARD gates live here.** These are the standards the reward model in `../../architecture/15-mcp-evaluator-critic-architecture.md` treats as multiplicative — failing one can zero out an otherwise-perfect page. Prerequisite level 0 in `../README.md` §2.

---

### STD-01 — Crawler access via robots.txt
**Requirement:** robots.txt must not block the bots that feed the surfaces you want to win.
**Bots and disposition:**

| Bot | Feeds | Default disposition |
|---|---|---|
| `Googlebot` | Google Search, AI Overviews | Always allow |
| `Google-Extended` | Gemini training/grounding | Allow |
| `GPTBot` | ChatGPT training corpus | Allow (business decision — see STD-03) |
| `OAI-SearchBot` | ChatGPT **live search** | Allow — critical |
| `ChatGPT-User` | User-initiated fetch | Allow |
| `ClaudeBot` / `Claude-SearchBot` | Claude training/search | Allow |
| `PerplexityBot` | Perplexity index + citation | Allow |
| `Bingbot` | Bing index, feeds Copilot | Allow |
| `Applebot` / `Applebot-Extended` | Siri, Apple Intelligence | Allow |
| `Bytespider` | ByteDance training | Optional — heavy load, low return |
| `CCBot` | Common Crawl, feeds many models | Allow — high leverage |

**Threshold:** every "search/retrieval" bot (`OAI-SearchBot`, `PerplexityBot`, `Claude-SearchBot`, `Google-Extended`, `Googlebot`, `Bingbot`) unconditionally allowed.
**Source:** Google Search Central; Cloudflare Radar; `../../research/04-technical-requirements.md` §1.
**Verify:** parse robots.txt per bot user-agent; confirm no blanket `Disallow: /` under any relevant `User-agent`. Cross-check with `../tools/tools-reference.md` TOOL-05.
**Gate:** HARD (× 0.5 in the reward model) if a retrieval bot is blocked.

---

### STD-02 — Edge/CDN not blocking AI crawlers
**Requirement:** WAF/CDN (Cloudflare, Akamai, Fastly, AWS WAF) must not 403 AI crawler user agents at the edge, independent of robots.txt.
**Threshold:** `curl -A "OAI-SearchBot" -I https://site/page` returns 200, not 403.
**Source:** Cloudflare's default-block-AI-scrapers rollout, 2025–2026; `../../research/04-technical-requirements.md` §1.2.
**Verify:** live fetch as each target user agent; check status code, not just robots.txt permission. See `../tools/tools-reference.md` TOOL-05.
**Gate:** HARD — a permissive robots.txt means nothing if the edge returns 403.

---

### STD-03 — The training-vs-retrieval crawler trade-off
**Requirement:** a deliberate, documented decision on pure-training bots (`GPTBot`, `CCBot`, `Bytespider`), separate from retrieval bots which should always be allowed.
**Context (crawl-to-referral ratio, Cloudflare Radar Jan–Mar 2026):** Google ~5:1, OpenAI GPTBot ~857–1,276:1, Anthropic ClaudeBot ~11,122–23,951:1. Caveat: native-app referrals send no `Referer:` header, so these ratios likely overstate the imbalance.
> **Verification note (2026-07-29):** Re-checked against Cloudflare Radar insights. Ratios remain highly extractive for training crawlers (ClaudeBot frequently ranging from 23,000:1 to over 70,000:1; GPTBot ranging from 400:1 to 1,700:1), while search bots maintain low ratios (e.g. Googlebot 5:1 to 14:1).
**Recommendation:** allow all search/retrieval bots unconditionally; decide on training bots based on business model (publisher monetizing pageviews vs. brand wanting to be recommended).
**Source:** Cloudflare Radar; `../../research/04-technical-requirements.md` §1.3.
**Gate:** SOFT (business/policy decision, not an automatic fail).

---

### STD-04 — No accidental noindex / indexing hygiene
**Requirement:** production pages must not carry `noindex`, must return real HTTP status codes (no soft-404s), must have self-referencing absolute canonicals, and must not sit in unresolved redirect chains.
**Threshold:** HTTP 200 · no `noindex` meta/header · canonical resolves to self · redirect chain ≤ 1 hop.
**Source:** Google Search Essentials; `../../research/04-technical-requirements.md` §6; `../../architecture/09-critic-architecture.md` benchmark table ("Indexability").
**Verify:** fetch page, parse `<meta name="robots">` and `X-Robots-Tag` header, resolve canonical, follow redirect chain. See `../tools/tools-reference.md` TOOL-01.
**Gate:** HARD — × 0.0 multiplier. "Nothing else can matter" if the page isn't indexable.

---

### STD-05 — XML sitemap and URL hygiene
**Requirement:** accurate XML sitemap with correct `<lastmod>`, submitted to Search Console, split at 50k URLs; URLs lowercase, hyphenated, stable, shallow, no session IDs; faceted-navigation parameter combinations `noindex`'d or blocked to protect crawl budget.
**Source:** `../../research/04-technical-requirements.md` §6.
**Verify:** sitemap parse + spot-check `<lastmod>` freshness; URL pattern lint. See `../tools/tools-reference.md` TOOL-01.
**Gate:** SOFT.
