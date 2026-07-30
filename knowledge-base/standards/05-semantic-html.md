---
id: std-semantic-html
type: standard-doc
discipline: [SEO, AEO, GEO, LLMO]
level: 1
tags: [semantic-html, headings, alt-text, accessibility]
related: [std-structured-data, std-content-aeo-geo]
last_updated: 2026-07-29
---

# Level 1 — Semantic HTML

Prerequisite level 1 in `../README.md` §2.

---

### STD-17 — Heading structure
**Requirement:** exactly one `<h1>` per page; `<h2>`/`<h3>` in strict hierarchical order, never skipping levels; headings must be real heading tags, not styled `<div>`/`<span>`.
**Source:** `../../research/04-technical-requirements.md` §5; HTML Living Standard.
**Gate:** SOFT, weighted (`semantics` dimension, 0.10 weight).

---

### STD-18 — Lists, tables, landmarks
**Requirement:** real `<ul>`/`<ol>`/`<li>` (not bulleted paragraphs); real `<table>` with `<thead>`, `<th scope>`, `<tbody>` (not CSS-grid divs); landmark elements (`<main>`, `<article>`, `<section>`, `<nav>`, `<aside>`, `<header>`, `<footer>`) used correctly.
**Rule of thumb:** if the page reads correctly as plain text with CSS removed, it will chunk correctly for retrieval.
**Source:** `../../research/04-technical-requirements.md` §5.
**Gate:** SOFT, weighted.

---

### STD-19 — Alt text, dates, author bylines
**Requirement:** descriptive `alt` on every meaningful image; `<time datetime="...">` for dates; visible author byline linked to an author page carrying `Person` schema.
**Source:** `../../research/04-technical-requirements.md` §5.
**Gate:** SOFT, weighted.
