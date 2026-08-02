---
client: Nabhi Labs
type: branded-seo-action-checklist
companion_to: keyword-strategy.md
status: ready to execute
last_updated: 2026-08-02
---

# Nabhi Labs — Branded Search #1 Ranking Checklist

Companion to `keyword-strategy.md`. That file targets service-intent keywords ("AI development company"); this one targets the brand name itself ("Nabhi Labs") — usually the fastest, least competitive win available, since you're not fighting anyone else's SEO, you're just proving to Google that your domain *is* the brand.

**One assumption to confirm before starting: the exact domain.** Everything below assumes there's one canonical site at a single domain (e.g. `nabhilabs.com`). If Nabhi Labs isn't live yet or the domain isn't locked in, Phases 1-4 can be built in staging, but Phases 5-9 (external mentions, indexing, tracking) can't start until the real domain is public — brand mentions pointing at a domain that later changes are wasted effort.

Two corrections to the original plan below (Phase 3 and the "what to expect" section) based on current (Aug 2026) research on how Google actually builds Knowledge Panels — worth reading before you build the schema.

---

## Phase 1 — Brand Identity Consistency (highest priority)

Pick the exact string once — likely `Nabhi Labs` (two words, capital N, capital L) — and use it verbatim, character-for-character, everywhere:

- [ ] Page `<title>` tags
- [ ] Logo `alt` text
- [ ] H1 on homepage
- [ ] Footer text
- [ ] Copyright line (`© 2026 Nabhi Labs`)
- [ ] Open Graph tags (`og:site_name`, `og:title`)
- [ ] `Organization` structured data `name` field
- [ ] Every social profile display name and handle/bio

**Do not alternate** between `Nabhi Labs`, `NabhiLabs`, `nabhi labs`, or `Nabhi Labs Inc.` across these — pick one and use `alternateName` in schema (Phase 3) if you need a variant documented, rather than using different strings in different places.

---

## Phase 2 — Homepage Optimization

```html
<title>Nabhi Labs | AI Development & Custom Software Engineering Company</title>
<meta name="description" content="Nabhi Labs builds AI solutions, custom software, SaaS platforms, automation systems, web applications, and enterprise technology products.">
```

```html
<h1>Nabhi Labs</h1>
<h2>Engineering AI Solutions That Solve Real Business Problems</h2>
```

- [ ] Title includes the exact brand string first, before any descriptor
- [ ] Meta description mentions the brand name once and summarizes real services (matches what's in `keyword-strategy.md`'s pillar list — don't let homepage copy drift from the keyword doc)
- [ ] H1 is the brand name alone; H2 carries the value proposition
- [ ] `og:site_name` matches the brand string exactly

---

## Phase 3 — Organization Schema (corrected)

**Correction to the original plan:** there is no Google-mandated "required fields" list for Organization schema — Google's own guidance is to include whichever recommended properties genuinely apply. But the properties that actually move the needle for Knowledge Panel eligibility are specific: `name`, `url`, `logo`, and — critically — `sameAs` links that include **Wikidata and Wikipedia entries where they exist**, not just social profiles. Sites with comprehensive Organization schema are meaningfully more likely to earn a Knowledge Panel than sites with a bare-minimum block. If Nabhi Labs doesn't have a Wikidata entry yet, creating one (factual, no promotional language, meets Wikidata's notability bar) is a real lever most companies skip — worth adding as its own task, not just implied by "structured data."

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://nabhilabs.com/#organization",
  "name": "Nabhi Labs",
  "alternateName": "NabhiLabs",
  "url": "https://nabhilabs.com",
  "logo": "https://nabhilabs.com/logo.png",
  "description": "Nabhi Labs builds AI solutions, custom software, SaaS platforms, automation systems, and enterprise technology products.",
  "foundingDate": "YYYY-MM-DD",
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "sales",
    "email": "hello@nabhilabs.com"
  },
  "sameAs": [
    "https://www.linkedin.com/company/nabhi-labs",
    "https://github.com/nabhi-labs",
    "https://twitter.com/nabhilabs",
    "https://www.crunchbase.com/organization/nabhi-labs",
    "https://en.wikipedia.org/wiki/Nabhi_Labs",
    "https://www.wikidata.org/wiki/Q_______"
  ]
}
```

- [ ] `@id` set to a stable URL fragment (ties the schema to one canonical entity Google can reference)
- [ ] `sameAs` includes every real, live profile from Phase 5 below — don't list a profile here before it exists
- [ ] Validate with [Google's Rich Results Test](https://search.google.com/test/rich-results) after publishing, not just a generic JSON-LD validator
- [ ] `foundingDate` included if Nabhi Labs wants to build a timeline/history narrative later — optional but cheap to add now while you know the real date

---

## Phase 4 — Supporting Pages

- [ ] `/about`
- [ ] `/services`
- [ ] `/ai-development`
- [ ] `/software-development`
- [ ] `/contact`
- [ ] `/careers`
- [ ] `/blog`

Each of these should carry the brand name in its title tag (`Services | Nabhi Labs`, not just `Services`) — this is what eventually produces sitelinks under the brand SERP, since sitelinks are steered by site hierarchy and internal linking, not requested or configured directly.

---

## Phase 5 — Brand Mentions (external profiles)

Create once, keep identical name/handle/bio across all:

- [ ] LinkedIn Company Page
- [ ] GitHub Organization
- [ ] X (Twitter)
- [ ] Medium
- [ ] Dev.to
- [ ] Crunchbase
- [ ] Product Hunt (launch post when there's a real product ready — a placeholder listing is worse than none)
- [ ] Relevant startup/business directories (region-specific if Nabhi Labs has a physical base — e.g. Hyderabad startup directories per the tracked query list below)
- [ ] **Wikidata entry** (see Phase 3 correction — this is the one most plans skip, and it's a direct Knowledge Panel signal, not just a social mention)

Every one of these should link back to the real domain, and every `sameAs` entry in Phase 3's schema should point to one of these, once live.

---

## Phase 6 — Branded Content

Publish a small number of articles that naturally use the brand name in a real sentence, not just the title:

- [ ] "Why Nabhi Labs Built SEOKit"
- [ ] "AI Development at Nabhi Labs"
- [ ] "Engineering at Nabhi Labs"
- [ ] "How Nabhi Labs Builds AI Agents"

These reinforce the brand-domain association for Google and give you natural internal-link anchor text opportunities (Phase 8).

---

## Phase 7 — Indexing

- [ ] Verify site in [Google Search Console](https://search.google.com/search-console)
- [ ] Submit XML sitemap
- [ ] Request indexing individually for: Homepage, About, Services, Contact, and each new blog post as it publishes

---

## Phase 8 — Internal Linking

- [ ] Use branded anchor text ("Learn more about Nabhi Labs") instead of generic anchors ("Click here") wherever a link points back to the homepage or About page
- [ ] Every blog post from Phase 6 links back to the homepage or a relevant service page using branded or service-branded anchor text

---

## Phase 9 — Monitor Branded Search Performance

Track these queries in Search Console's Performance report, filtered to Query:

- [ ] `Nabhi Labs`
- [ ] `Nabhi Labs AI`
- [ ] `Nabhi Labs software`
- [ ] `Nabhi Labs Hyderabad` (or whatever city/region applies — confirm this before tracking; if the plan's mention of Hyderabad was a guess rather than a confirmed location, swap in the real one)
- [ ] `Nabhi Labs engineering`

Watch impressions, clicks, CTR, and average position for each. Rising impressions on the bare brand query with position climbing toward 1 is the clearest signal this whole effort is working.

---

## What to actually expect (lightly corrected)

- **1-2 weeks:** Google indexes the domain; brand query may start appearing, particularly if there's no competing "Nabhi Labs."
- **1-3 months:** the official site typically reaches position 1 for the exact brand query as trust signals and external mentions (Phase 5) accumulate — this part of the original plan is realistic and matches how branded-query ranking generally behaves.
- **3-6+ months, not guaranteed:** sitelinks and a Knowledge Panel *may* appear, but only if third-party signals (Wikidata, press mentions, consistent citations across LinkedIn/Crunchbase/directories) reach a real authority threshold. **Correction to the original plan:** this isn't just a function of "site authority increasing" — Knowledge Panels are earned through external corroboration Google can independently verify (Wikidata being the strongest single lever), not something that appears automatically from on-site SEO alone. Don't set a hard deadline expectation on this phase; treat Phases 5 and the Wikidata entry as the actual drivers, and treat the Knowledge Panel as a possible outcome, not a scheduled one.

---

## On the "Brand Authority Module" idea for SEOKit

You floated automating this as a continuous check in SEOKit rather than a one-time manual pass — noted, not built yet. If you want it, it would live as a new package under `seokit/packages/plugins/` (parallel to the existing `plugins/seo`, `plugins/aeo`, etc.) and could check: brand-name string consistency across page titles/H1/footer/schema, Organization schema completeness (including the sameAs/Wikidata check above), favicon presence, and — via the GSC integration already planned for other standards — branded-query position/CTR trend over time. Say the word and I'll scope it as an actual implementation task the way the rest of the seokit work in this conversation has been handled: read the existing plugin pattern first, then build to match it, then verify with real tests.

---

## Sources

- [Organization Schema Markup | Google Search Central](https://developers.google.com/search/docs/appearance/structured-data/organization)
- [A Guide To 'Organization' Structured Data For Rich Google Results | Search Engine Journal](https://www.searchenginejournal.com/google-do-not-put-organization-schema-markup-on-every-page/289981/)
- [Organization Schema Markup: Complete Guide to Knowledge Graph & Entity SEO (2026) | Stackmatix](https://www.stackmatix.com/blog/organization-schema-knowledge-graph)
- [Knowledge Graph SEO – The Ultimate 2026 Guide | ClickRank](https://www.clickrank.ai/knowledge-graph-seo-guide/)
- [Google Search Profiles: Own Your Brand in the SERP | Digital Applied](https://www.digitalapplied.com/blog/google-search-profiles-2026-brand-serp-ownership-guide)
- [Google Knowledge Panel: What It Is and How to Claim It | G2 Learn](https://learn.g2.com/google-knowledge-panel)
