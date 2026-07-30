---
id: seo-group-crawler
discipline: SEO
group: crawler
type: functional-group
tags: [crawling, indexing, robots-txt, server-logs, technical-audit]
related: [seo-group-google-search-console, std-access-indexability, std-rendering]
last_updated: 2026-07-29
---

# Crawler

## Overview

The functional group responsible for the most fundamental question in this whole knowledge base: **can anything — Googlebot, GPTBot, a human — actually reach and read this content?** This is Level 0 of the prerequisite ladder (`../../README.md` §2) — nothing else in the knowledge base matters until this group passes.

## How it works

```
robots.txt check (per bot user-agent)
        │
        ▼
Edge/CDN check — independent of robots.txt (Cloudflare, Akamai, WAF can
403 a bot that robots.txt explicitly allows)
        │
        ▼
Live fetch as each target bot — curl -A "<bot>" or a real crawl
        │
        ▼
Raw-vs-rendered diff — what's in the HTML before JS executes vs. after
        │
        ▼
Server-log cross-check — the only ground truth; robots.txt is a
request, logs show what actually happened
```

**The two traps this group exists to catch:** a permissive robots.txt means nothing if the CDN 403s the bot at the edge (STD-02); and a page that renders beautifully in a browser can be a blank shell to any crawler that doesn't execute JavaScript (STD-06) — which is most AI crawlers, not just an edge case.

## Standards it touches

| Standard | File |
|---|---|
| STD-01 — Crawler access via robots.txt | `../../standards/01-access-indexability.md` |
| STD-02 — Edge/CDN not blocking AI crawlers | `../../standards/01-access-indexability.md` |
| STD-03 — Training-vs-retrieval crawler trade-off | `../../standards/01-access-indexability.md` |
| STD-04 — No accidental noindex / indexing hygiene | `../../standards/01-access-indexability.md` |
| STD-05 — XML sitemap and URL hygiene | `../../standards/01-access-indexability.md` |
| STD-06 — Content present in raw HTML | `../../standards/02-rendering.md` |
| STD-08 — JS/CSS not blocked for renderer bots | `../../standards/02-rendering.md` |

## Tools & what to check — full detail

| Tool | Role |
|---|---|
| Server logs / Screaming Frog Log File Analyser (`../../tools/tools-reference.md` TOOL-05) | **Ground truth.** The only way to confirm AI bots are getting 200s, not 403s |
| Screaming Frog SEO Spider (full crawl) | Site-wide technical audit: status codes, redirects, canonicals, orphan pages |
| Google Search Console — Pages, Sitemaps, URL Inspection (TOOL-01) | Google's own view of what it crawled and indexed |
| `curl -A "<bot-name>" -I https://site/page` | Fastest single-URL spot-check |

## Key metrics / thresholds

- Every target retrieval bot (`OAI-SearchBot`, `PerplexityBot`, `Claude-SearchBot`, `Google-Extended`, `Googlebot`, `Bingbot`) unconditionally allowed in robots.txt
- `curl -A "OAI-SearchBot" -I` returns **200**, not 403
- Server logs show each target bot appearing at all, with a status-code distribution overwhelmingly **200**
- Raw HTML word count for a content page is **not near-zero** — the STD-06 test

**Cadence:** monthly, or immediately after any CDN/WAF configuration change — the single most common silent breakage point.
