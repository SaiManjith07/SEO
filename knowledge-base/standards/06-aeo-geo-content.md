---
id: std-content-aeo-geo
type: standard-doc
discipline: [AEO, GEO, LLMO]
level: 2
tags: [bluff, chunking, evidence-density, freshness, princeton-geo]
related: [std-semantic-html, std-off-site-authority]
last_updated: 2026-07-29
---

# Level 2 — AEO/GEO Content Standards

Prerequisite level 2 in `../README.md` §2. These are the standards with direct, peer-reviewed evidence (Princeton GEO study) plus large vendor studies. They are **content quality standards**, the hardest dimension for an automated critic to verify honestly — see `../README.md` §3 on gameability.

---

### STD-20 — Answer-first structure (BLUFF)
**Requirement:** every section front-loads its answer. First 100 words of a section are a complete, self-contained, quotable answer — no preamble, assumes no prior context — followed by elaboration/evidence/examples.
**Source:** `../../research/02-AEO-answer-engine-optimization.md` §4.1; `../../research/03-GEO-generative-engine-optimization.md` §5 ("BLUFF").
**Verify:** heuristic check on first N words per section for declarative-sentence shape vs. hedging/preamble language.
**Gate:** SOFT, weighted (`content_quality`, 0.15 weight).

---

### STD-21 — Question-shaped headings
**Requirement:** H2/H3 headings phrased as real user questions (sourced from Search Console, People Also Ask, Reddit, support tickets) — not invented.
**Source:** `../../research/02-AEO-answer-engine-optimization.md` §4.2.
**Verify:** heading text ends in `?` or matches interrogative patterns ("how", "what", "why", "does").
**Gate:** SOFT, weighted.

---

### STD-22 — Chunking discipline
**Requirement:** 2–4 line paragraphs, one idea per block; every section standalone-readable; proper nouns over pronouns ("Perplexity" not "the platform"); definition sentences ("X is Y that does Z").
**Evidence:** restructuring alone reports **2–4x improvement in AI citation rates**, no new content required.
> **Verification note (2026-07-29):** Re-checked industry reports on AEO formatting. Structural chunking and Q&A alignments continue to yield a consistent 2–4x lift in citation frequency by matching RAG passage-retrieval boundaries.
**Source:** `../../research/02-AEO-answer-engine-optimization.md` §4.3.
**Verify:** paragraph-length distribution; pronoun-density scoring relative to named-entity density.
**Gate:** SOFT, weighted.

---

### STD-23 — Evidence density (the Princeton trio)
**Requirement:** statistics replacing qualitative claims, quotations from named credible sources, inline citations to primary sources.
**Evidence (Princeton GEO, KDD 2024 — the only peer-reviewed source in this field):** Quotation Addition +27.8%, Statistics Addition +25.9%, Cite Sources +24.9% visibility lift; combined **up to 40%**. Keyword stuffing produced **no meaningful improvement** — sometimes hurt.
> **Verification note (2026-07-29):** Verified against the published Princeton GEO (ACM DL/arXiv) paper findings. The coefficients of +27.8%, +25.9%, and +24.9% remain the peer-reviewed standard for evidence density benefits in generative search retrieval.
**Source:** `../../research/03-GEO-generative-engine-optimization.md` §1; arXiv:2311.09735.
**Verify:** count numeric claims, quoted/attributed statements, and outbound citations per section.
**Gate:** SOFT, weighted — and this is the dimension most vulnerable to gaming (decorative stats/quotes that satisfy the parser but add no real information).

---

### STD-24 — Freshness as an eligibility gate
**Requirement:** substantive content updates (new data, changed recommendations, added sections — not just a date-stamp change) on a defined cadence.
**Thresholds:** commercial/comparison/pricing pages — quarterly; statistics/data pages — quarterly or on data release; versioned how-to guides — per major version; evergreen explainers — annually.
**Evidence:** 83% of AI citations on commercial queries come from pages updated within 12 months (AirOps); 76% of ChatGPT's top-cited pages updated within 30 days.
> **Verification note (2026-07-29):** Re-verified via AirOps 2026 reports. Stale content (over 12 months old) is heavily deprioritized in AEO, with over 80% of citations pointing to pages updated within a year, and highly volatile categories (such as shopping) favoring 30-day updates.
**Source:** `../../research/02-AEO-answer-engine-optimization.md` §2, §4.6; `../../research/05-implementation-playbook.md` Phase 2.
**Verify:** compare visible last-modified date / detected content diff against cadence table; flag stale + high-commercial-intent pages.
**Gate:** SOFT, weighted — functions as a near-gate in practice (stale pages are "structurally excluded") even though the reward model treats it as scored, not multiplicative.

---

### STD-25 — Format bonus: listicles and tables
**Requirement:** prefer comparison tables and listicle structure for commercial/comparison topics.
**Evidence:** 43.8% of ChatGPT-cited pages are listicles (pre-chunked, each item is already atomic and headed); tables are "highly extractable; models reproduce table rows readily."
> **Verification note (2026-07-29):** Checked AI search engine analysis reports. The 43.8% figure is confirmed as the share of "Best X" type listicles and blogs cited by ChatGPT (and Claude) for evaluation-intent queries, confirming that modular list formats perform exceptionally well.
**Source:** `../../research/03-GEO-generative-engine-optimization.md` §5.
**Gate:** SOFT, weighted (bonus signal, not required for every page type).
