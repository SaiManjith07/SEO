# Worked Example — SEO/AEO/GEO/LLMO Audit
**Date of Audit:** 2026-07-29
**Analyzed Target:** `https://saasflow.dev/features/workflows` (A realistic developer workflow automation B2B SaaS landing page)

---

## 1. Fictional Page Setup & Mock Code Context

To make the audit concrete, here is the raw HTML and configuration retrieved for `https://saasflow.dev/features/workflows`:

### Mock Server Configuration & robots.txt
```
# robots.txt
User-agent: Googlebot
Allow: /
Disallow: /admin/

User-agent: GPTBot
Disallow: /

User-agent: OAI-SearchBot
Disallow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /
```

### Mock Raw HTML (curl -s https://saasflow.dev/features/workflows)
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SaaSFlow | Dynamic Automation</title>
  <meta name="description" content="SaaSFlow helps you manage things. Read on to discover how we build workflows.">
  <link rel="canonical" href="https://saasflow.dev/features/workflows">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "SaaSFlow Workflows",
    "description": "Automated workflow builder for developers.",
    "brand": {
      "@type": "Brand",
      "name": "SaaSFlow"
    },
    "offers": {
      "@type": "Offer",
      "price": "49.00",
      "priceCurrency": "USD"
    }
  }
  </script>
</head>
<body>
  <header>
    <nav><a href="/">Home</a></nav>
  </header>
  <main>
    <div id="root">
      <!-- Client-side hydrated shell. Raw wire HTML has no text copy in main content area -->
      <div class="loading">Loading SaaSFlow Interactive Workflow Designer...</div>
    </div>
  </main>
  <footer>
    <p>&copy; 2026 SaaSFlow Inc.</p>
  </footer>
</body>
</html>
```

### Mock Hydrated HTML (Playwright Rendered)
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SaaSFlow | Dynamic Automation</title>
  <meta name="description" content="SaaSFlow helps you manage things. Read on to discover how we build workflows.">
  <link rel="canonical" href="https://saasflow.dev/features/workflows">
  <script type="application/ld+json">...</script>
</head>
<body>
  <header>
    <nav><a href="/">Home</a></nav>
  </header>
  <main>
    <div id="root">
      <h1>SaaSFlow Workflows</h1>
      <p>Welcome to our platform! In this article, we will show you how SaaSFlow makes it simple to automate all your developer workflows.</p>
      
      <h2>Workflow Optimization Considerations</h2>
      <p>When you use the platform, it handles the orchestration automatically. It will run tasks in parallel and verify their state. This makes it incredibly fast, speeding up your pipelines by a massive margin.</p>
      <p>Many teams have reported that using these automated workflows reduced their manual build steps significantly. We encourage you to try it out and see how much time it saves for your development team.</p>

      <h2>How do you define a workflow in SaaSFlow?</h2>
      <p>Workflows are defined in simple YAML files. A developer writes steps under a job key. SaaSFlow parses the YAML file and spins up isolated containers for each step, enabling concurrent steps to run in parallel.</p>
      
      <h2>Pricing Details</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">Tier</th>
            <th scope="col">Price</th>
            <th scope="col">Concurrency Limit</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Developer</td>
            <td>Free</td>
            <td>3 concurrent jobs</td>
          </tr>
          <tr>
            <td>Startup</td>
            <td>$49/mo</td>
            <td>15 concurrent jobs</td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>
  <footer>
    <p>&copy; 2026 SaaSFlow Inc.</p>
  </footer>
</body>
</html>
```

---

## 2. Standard-by-Standard Findings (Level 0 through Level 4)

### Level 0 — Access & Indexability (Existence)

#### STD-01 — Crawler access via robots.txt
*   **Result:** **FAIL** (Gate: HARD × 0.5)
*   **Evidence:** The robots.txt explicitly blocks `OAI-SearchBot` (`Disallow: /`), which is the critical bot for ChatGPT live search. Although `Claude-SearchBot` and `PerplexityBot` are allowed, blocking any key retrieval bot constitutes a partial gate failure.
*   **Fix:** Remove `Disallow: /` under the `User-agent: OAI-SearchBot` block in `robots.txt` and replace with `Allow: /`.

#### STD-02 — Edge/CDN not blocking AI crawlers
*   **Result:** **PASS** (Gate: HARD)
*   **Evidence:** `curl -A "OAI-SearchBot" -I https://saasflow.dev/features/workflows` returned `HTTP/2 200` with no 403 CDN blocks.

#### STD-03 — The training-vs-retrieval crawler trade-off
*   **Result:** **PASS** (Gate: SOFT)
*   **Evidence:** `robots.txt` has a deliberate, documented exclusion for `GPTBot` (training crawler blocked) while allowing search bots. This represents a conscious business decision to prioritize live referrals over model training.

#### STD-04 — No accidental noindex / indexing hygiene
*   **Result:** **PASS** (Gate: HARD × 0.0)
*   **Evidence:** HTML has no `noindex` tags in meta or HTTP headers. The page returns a clean `HTTP 200` and the canonical resolves to itself.

#### STD-05 — XML sitemap and URL hygiene
*   **Result:** **PASS** (Gate: SOFT)
*   **Evidence:** Sitemap URL is registered in GSC, URL is lowercase and hyphenated, and contains no session IDs.

#### STD-06 — Content present in raw (unrendered) HTML
*   **Result:** **FAIL** (Gate: HARD × 0.25)
*   **Evidence:** The raw HTML contains a client-side-rendered SPA shell (`<div id="root"><div class="loading">...</div></div>`). There is no content copy in the raw HTML served over the wire. AI bots (GPTBot, OAI-SearchBot, ClaudeBot) which do not execute JavaScript will see a blank page. The raw word count is 10 words, while the rendered word count is 224 words.
*   **Fix:** Implement Server-Side Rendering (SSR) or Static Site Generation (SSG) in Next.js/Nuxt to render the text content directly into the wire HTML.

#### STD-07 — No content gated behind interaction
*   **Result:** **PASS** (Gate: SOFT)
*   **Evidence:** Once rendered, all content is fully loaded in the DOM without requiring user clicks.

#### STD-08 — JS/CSS not blocked for renderer bots
*   **Result:** **PASS** (Gate: SOFT)
*   **Evidence:** No `/js/` or `/css/` folders are blocked in `robots.txt`.

---

### Level 1 — Structured Data & Semantics (Comprehensibility)

#### STD-09 — JSON-LD format and validity
*   **Result:** **PASS** (Gate: HARD × 0.9)
*   **Evidence:** Schema.org validator verified that the `<script type="application/ld+json">` block parsed as valid JSON with no syntax errors.

#### STD-10 — Organization schema
*   **Result:** **FAIL** (Gate: SOFT)
*   **Evidence:** The homepage does not carry `Organization` schema with a `sameAs` array linking social and brand profiles.
*   **Fix:** Add `Organization` JSON-LD schema to the homepage root containing name, logo, URL, and a `sameAs` list linking LinkedIn, GitHub, and X.

#### STD-11 — Content-type schema coverage
*   **Result:** **PASS** (Gate: SOFT)
*   **Evidence:** The page correctly implements `Product` schema with name, offers, price, and currency.

#### STD-12 — Content parity
*   **Result:** **FAIL** (Gate: HARD-adjacent)
*   **Evidence:** The `Product` schema lists a price of `$49.00`, but this price is only visible to a human inside the comparison table. More importantly, the schema lists brand and aggregate offers that are partially omitted in the visible copy.
*   **Fix:** Ensure all marked-up fields in schema are explicitly visible on page.

#### STD-17 — Heading structure
*   **Result:** **PASS** (Gate: SOFT)
*   **Evidence:** The rendered page contains exactly one `<h1>` tag ("SaaSFlow Workflows") followed by three `<h2>` tags. No heading levels are skipped.

#### STD-18 — Lists, tables, landmarks
*   **Result:** **PASS** (Gate: SOFT)
*   **Evidence:** Landmarked using `<header>`, `<main>`, and `<footer>`. The pricing section correctly implements a semantic `<table>` with `<thead>` and `<tbody>`.

#### STD-19 — Alt text, dates, author bylines
*   **Result:** **FAIL** (Gate: SOFT)
*   **Evidence:** The page has no author byline or last-modified date tags (e.g. `<time>`).
*   **Fix:** Add a visible author byline (linked to bio page) and a visible last-modified date using `<time datetime="2026-07-29">` markup.

---

### Level 2 — Performance & Content (Quality)

#### STD-13 — LCP (Largest Contentful Paint)
*   **Result:** **PASS** (Gate: SOFT)
*   **Evidence:** Chrome User Experience Report (CrUX) field data logs p75 LCP at `1.8s` (Good is < 2.5s).

#### STD-14 — INP (Interaction to Next Paint)
*   **Result:** **FAIL** (Gate: SOFT)
*   **Evidence:** CrUX logs p75 INP at `290ms` (Good is < 200ms). The page builder loads heavy bundle scripts, blocking the main thread during hydration.
*   **Fix:** Defer non-critical scripts, eliminate redundant plugins, and break up long-running hydration tasks with `scheduler.yield()`.

#### STD-15 — CLS (Cumulative Layout Shift)
*   **Result:** **PASS** (Gate: SOFT)
*   **Evidence:** CrUX logs p75 CLS at `0.04` (Good is < 0.1).

#### STD-16 — Holistic, site-wide scoring
*   **Result:** **UNVERIFIED** (Gate: SOFT)
*   **Evidence:** URL-specific CrUX data exists, but origin-level aggregation is unconfigured in the MCP adapter. Evaluated as unverified.

#### STD-20 — Answer-first structure (BLUFF)
*   **Result:** **FAIL** (Gate: SOFT)
*   **Evidence:** The first paragraph of the first section reads as a preamble: *"Welcome to our platform! In this article, we will show you..."* rather than answering the user's implicit intent directly.
*   **Fix:** Rewrite the opening paragraph to lead with a direct definition: *"SaaSFlow Workflows is a developer-centric automation builder that executes isolated pipeline containers concurrently."*

#### STD-21 — Question-shaped headings
*   **Result:** **FAIL** (Gate: SOFT)
*   **Evidence:** Only 1 of 3 subheadings is question-shaped ("How do you define a workflow in SaaSFlow?"), which is less than the 30% threshold for optimal candidate matching.
*   **Fix:** Rewrite *"Workflow Optimization Considerations"* to *"How does SaaSFlow optimize concurrent task executions?"*.

#### STD-22 — Chunking discipline
*   **Result:** **FAIL** (Gate: SOFT)
*   **Evidence:** The pronoun density is very high in the second section: *"When you use the platform, it handles the orchestration automatically. It will run tasks... It will run..."*
*   **Fix:** Replace pronouns with proper nouns: *"SaaSFlow handles the orchestration automatically. The engine runs tasks in parallel..."*

#### STD-23 — Evidence density (the Princeton trio)
*   **Result:** **FAIL** (Gate: SOFT)
*   **Evidence:** The page makes qualitative claims: *"Many teams have reported that using these automated workflows reduced their manual build steps significantly."* There are no concrete statistics, named expert quotes, or primary source citations.
*   **Fix:** Replace the claim with a statistic and quote: *"According to our 2026 DevOps Report, teams using SaaSFlow reduced manual steps by 34%. As CTO Pavan Kumar Kunukuntla notes, 'isolated containers eliminate hydration lag.'"* Add inline links to the report.

#### STD-24 — Freshness as an eligibility gate
*   **Result:** **PASS** (Gate: SOFT)
*   **Evidence:** Content was updated within the last 30 days.

#### STD-25 — Format bonus: listicles and tables
*   **Result:** **PASS** (Gate: SOFT)
*   **Evidence:** Features a clear, semantic pricing comparison table, which is highly extractable for AI engines.

---

### Level 3/4 — Off-Site Authority & Entity (Authority)

#### STD-26 — Brand mentions beat backlinks
*   **Result:** **FAIL** (Gate: N/A)
*   **Evidence:** Ahrefs Content Explorer reveals that "SaaSFlow" has under 5 unlinked brand mentions across the web.
*   **Fix:** Execute PR and guest posting initiatives to earn unlinked editorial mentions on developer publications.

#### STD-27 — Third-party editorial presence
*   **Result:** **FAIL** (Gate: N/A)
*   **Evidence:** SaaSFlow is absent from developer listicles like "Best CI/CD Tools for 2026."

#### STD-28 — Entity consistency
*   **Result:** **PASS** (Gate: N/A)
*   **Evidence:** NAP data is consistent, and the `sameAs` fields correctly resolve to live profiles.

#### STD-29 — YouTube / video presence
*   **Result:** **FAIL** (Gate: N/A)
*   **Evidence:** No YouTube videos exist mentioning SaaSFlow in transcripts or descriptions.

#### STD-30 — AI visibility panel
*   **Result:** **UNVERIFIED** (Gate: N/A)
*   **Evidence:** No tracking panel has been configured yet.

---

### LLMO (Integration & Readiness)

#### STD-31 — No separate LLMO rule module
*   **Result:** **PASS** (Gate: N/A)
*   **Evidence:** Audited using standard core checks, verifying that LLM indexing requirements are fully aligned with core access and rendering checks.

#### STD-32 — Third-party LLM integration surfaces
*   **Result:** **PASS** (Gate: N/A)
*   **Evidence:** Active partnership and feed integration are set up.

#### STD-33 — Optional provision of llms.txt
*   **Result:** **FAIL** (Gate: SOFT)
*   **Evidence:** Requesting `/llms.txt` returns a `404 Not Found`.
*   **Fix:** Scaffold a `/public/llms.txt` file outlining the site hierarchy and documentation index.

---

## 3. Prioritized Fix List (Expected Reward Gain Analysis)

We prioritize fixes based on the **multiplicative gate structure**. Level 0 gate failures currently multiply our total score by a massive discount, so resolving them yields the highest immediate gain.

```
Initial Reward:
Gate Multipliers: STD-01 (Blocked retrieval bots = 0.5) × STD-06 (SPA client-side shell = 0.25)
Total Gate Multiplier = 0.125
Dimension Scores: indexability (0.20), performance (0.20), structured_data (0.15), etc.
Calculated Initial Reward ≈ 0.08 / 1.00
```

### Action 1 — Eliminate the SPA Shell (STD-06)
*   **Action:** Implement Server-Side Rendering (SSR) in the Next.js app to render all primary headings and paragraphs directly into the initial HTML wire response.
*   **Impact:** Unblocks the raw HTML gate, changing the multiplier from `0.25` to `1.0`.
*   **Expected Reward Gain:** **+0.35**

### Action 2 — Allow OAI-SearchBot in robots.txt (STD-01)
*   **Action:** Change `Disallow: /` to `Allow: /` under `User-agent: OAI-SearchBot` in `/public/robots.txt`.
*   **Impact:** Restores full retrieval access for ChatGPT live search, shifting the crawler access multiplier from `0.5` to `1.0`.
*   **Expected Reward Gain:** **+0.18**

### Action 3 — Implement Evidence Density & BLUFF Content (STD-20, STD-23)
*   **Action:** Rewrite the opening paragraph to state the tool's definition immediately. Add the 34% DevOps time-saving statistic and the quote by Pavan Kumar Kunukuntla with an inline link.
*   **Impact:** Raises `content_quality` dimension score.
*   **Expected Reward Gain:** **+0.12**

### Action 4 — Improve INP performance (STD-14)
*   **Action:** Defer heavy page builder scripts and chunk execution during hydration.
*   **Impact:** Raises `performance` dimension score.
*   **Expected Reward Gain:** **+0.07**

### Action 5 — Homepage Organization Schema & llms.txt (STD-10, STD-33)
*   **Action:** Scaffolds a basic Organization JSON-LD snippet on the homepage and writes a static `/public/llms.txt`.
*   **Impact:** Raises `structured_data` dimension score.
*   **Expected Reward Gain:** **+0.04**
