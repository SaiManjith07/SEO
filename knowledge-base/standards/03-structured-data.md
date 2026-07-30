---
id: std-structured-data
type: standard-doc
discipline: [SEO, AEO]
level: 1
tags: [schema, json-ld, structured-data, rich-results]
related: [std-semantic-html]
last_updated: 2026-07-29
---

# Level 1 — Structured Data (Schema)

Prerequisite level 1 in `../README.md` §2.

---

### STD-09 — JSON-LD format and validity
**Requirement:** structured data in `<script type="application/ld+json">` blocks (not Microdata/RDFa for new work); must pass schema validation with zero errors.
**Source:** Google's explicit recommendation; schema.org; `../../research/04-technical-requirements.md` §3.
**Verify:** extract JSON-LD blocks, parse as JSON, validate against schema.org type definitions. See `../tools/tools-reference.md` TOOL-04.
**Gate:** HARD if invalid — × 0.9 multiplier ("a syntax error voids the whole block").

---

### STD-10 — Organization schema (highest priority type)
**Requirement:** `Organization` schema on the homepage (site-wide) with `name`, `url`, `logo`, `description`, `foundingDate`, and a complete `sameAs` array linking every authoritative profile (LinkedIn, X, YouTube, GitHub, Wikipedia/Wikidata if legitimately qualified).
**Why:** the first signal AI systems use to judge source reliability and disambiguate the entity across the web.
**Source:** `../../research/04-technical-requirements.md` §3; Google structured-data docs.
**Verify:** presence + required-property check on homepage JSON-LD.
**Gate:** SOFT, weighted (contributes to `structured_data` dimension at 0.15 weight).

---

### STD-11 — Content-type schema coverage
**Requirement:** `Article`/`BlogPosting` on all editorial content (author, dates, publisher); `FAQPage` only where genuine visible Q&A exists; `HowTo` on step-by-step guides; `Product` on product pages (name, description, brand, SKU/GTIN, image, offers, aggregateRating); `LocalBusiness` on location pages; `BreadcrumbList` site-wide; `Person` on author bio pages; `WebSite`+`SearchAction` on homepage.
**Source:** `../../research/04-technical-requirements.md` §3 priority-types table.
**Verify:** per-template schema presence check against page type.
**Gate:** SOFT.

---

### STD-12 — Content parity (the hard rule)
**Requirement:** every schema property must correspond to something a human can see on the rendered page. An FAQ in schema that isn't visible, or a rating that appears nowhere, is a policy violation ("spammy structured data") with real ranking consequences — not theoretical.
**Source:** `../../research/04-technical-requirements.md` §3; Google spam policies.
**Verify:** cross-check each schema property against extracted visible text; flag properties with no visible counterpart.
**Gate:** HARD-adjacent — treated as a distinct enforced check, not just a scoring input.
