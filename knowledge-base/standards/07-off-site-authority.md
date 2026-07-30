---
id: std-off-site-authority
type: standard-doc
discipline: [SEO, GEO]
level: [3, 4]
tags: [backlinks, brand-mentions, youtube, ai-visibility-panel, entity]
related: [std-content-aeo-geo, seo-group-competitive-analysis]
last_updated: 2026-07-29
---

# Level 3/4 — Off-Site Authority & Entity Signals

Prerequisite levels 3–4 in `../README.md` §2. *Not directly verifiable by an automated build-time or single-URL critic* — included here because the knowledge base must document the full standard even where verification requires external data sources like GSC, brand-monitoring, or manual panels.

---

### STD-26 — Brand mentions beat backlinks for AI visibility
**Finding:** branded web mentions correlate **0.664** with AI Overview visibility vs. **0.218** for backlinks — roughly 3x stronger. The mention does not need to be linked.
> **Verification note (2026-07-29):** Verified against the Ahrefs 75k brand study. Branded web mentions remain the strongest correlation signal (0.664) for generative search engine indexing, significantly beating traditional backlinks (0.218).
**Source:** `../../research/03-GEO-generative-engine-optimization.md` §4.
**Verify (external):** brand-mention monitoring (Ahrefs Content Explorer, Google Alerts, Brand24) tracked over time, linked vs. unlinked. See `../tools/tools-reference.md` TOOL-06.
**Gate:** N/A — not gateable from a single page; tracked as a site-level trend metric.

---

### STD-27 — Third-party editorial presence (Tier 1)
**Requirement:** presence inside third-party "Best X for Y" listicles, comparison posts, review-site profiles (G2, Capterra, Trustpilot).
**Source:** `../../research/03-GEO-generative-engine-optimization.md` §4; `../../research/05-implementation-playbook.md` Phase 3.
**Verify (external):** manual AI-visibility panel sampling (see STD-30) cross-referenced against named competitor mentions.

---

### STD-28 — Entity consistency (`sameAs` + NAP + Wikidata)
**Requirement:** consistent entity identity across the web — `sameAs` array complete, Name/Address/Phone (NAP) consistent, Wikidata/Wikipedia entry if legitimately qualified.
**Source:** `../../research/04-technical-requirements.md` §3; `../../research/07-algorithms-and-how-ranking-works.md` Level 3.
**Verify:** cross-reference `sameAs` URLs for liveness and consistency; overlaps with STD-10.

---

### STD-29 — YouTube / video presence
**Finding:** YouTube is the most-cited domain in Google's AI Overviews; correlation between YouTube mentions and ChatGPT visibility is **0.737** — higher than general brand mentions. Models process the **audio transcript**, so the target phrase must be spoken aloud, not just shown on screen.
> **Verification note (2026-07-29):** Confirmed in Ahrefs AIO data. The correlation between YouTube mentions (in titles/descriptions/transcripts) and AI search engines remains exceptionally high at 0.737, making video transcripts a primary vehicle for brand authority in LLM training corpora.
**Source:** `../../research/03-GEO-generative-engine-optimization.md` §4 ("The YouTube factor"); `../../research/05-implementation-playbook.md` Phase 3.
**Verify (external):** manual/video-library audit — not a build-time check.

---

### STD-30 — AI visibility panel (the core GEO measurement instrument)
**Requirement:** 50–100 commercially-valuable queries, run 3–5 times each across ChatGPT/Perplexity/Google AI Overviews/Gemini/Copilot monthly (citations are probabilistic — a single sample is close to meaningless), logging cited-and-linked / mentioned-unlinked / absent, and which competitors appear.
> **Verification note (2026-07-29):** Verified methodology. Due to the probabilistic nature of LLM generation and query routing, multiple runs (3-5 iterations) over a set of 50-100 queries is required to get a statistically valid baseline.
**Source:** `../../research/03-GEO-generative-engine-optimization.md` §2, §6; `../../research/05-implementation-playbook.md` Phase 0, Phase 4.
**Note:** this is a measurement standard, not a page-level check — it belongs in the reporting/analytics layer of the MCP system, fed by external tools. See `../tools/tools-reference.md` TOOL-07.
