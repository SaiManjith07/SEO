# SEOKit v3 — Feature & Architectural Specification

SEOKit v3 is a build-time website validation, grading, and automated remediation engine. It is specifically designed to maximize visibility and compliance for traditional search engines (Google, Bing) and AI search agents (ChatGPT, Claude, Perplexity).

---

## 1. Core Architecture: How It Works

SEOKit operate on a **Unified Rule Engine** architecture. Every verification check is represented as a pure function processing target content (source files, live URLs, or DOM structures) and producing structured feedback called `Finding`.

```
[Target Path / Source Files] 
      │
      ▼
[Workspace/Resource Providers] (Cheerio Parser / Headless Playwright virtualization)
      │
      ▼
[Unified Verification Engine] ─── (Plugin Rules: SEO, AEO, GEO, Security, Schema)
      │
      ├─► Terminal Logs & Mapped IDE Diagnostics
      ├─► Reports (.seokit/reports/ - JSON, HTML, SARIF, Markdown)
      └─► Execution Logs (.seokit/logs/verification.log)
```

---

## 2. Technical SEO Features

SEOKit parses raw HTML and DOM trees to check for baseline discoverability, indexability, and structural tags:

*   **Canonical Validation**: Checks for the existence of absolute canonical tags (`<link rel="canonical" href="...">`) to prevent duplicate indexing issues.
*   **Metadata Optimization**: Analyzes `<title>` tag lengths (optimal: 50-60 characters) and description lengths (optimal: 120-160 characters).
*   **Heading Structure Hierarchy**: Verifies that pages contain exactly one `<h1>` tag and ensures subheadings (`<h2>`, `<h3>`) descend in a logical hierarchical sequence.
*   **Image Accessibility**: Scans for `<img>` tags missing the `alt` description attribute.
*   **Sitemap & Robots.txt Checks**: Parses XML sitemaps to verify link structures and checks `robots.txt` configuration syntaxes for compatibility.

---

## 3. Structured Data & Schema Validation

Structured data is a core trust signal for both traditional search snippet generation and AI citation crawlers.
*   **JSON-LD Validation**: Validates the syntax of all nested `<script type="application/ld+json">` tags to ensure they conform to Schema.org standards.
*   **Entity Verification**: Checks for core entity schemas (e.g. `Organization`, `Article`, `LocalBusiness`) to confirm correct metadata fields such as `sameAs` or social links are configured.
*   **Content Parity Audit**: Confirms that textual contents declared inside Schema.org structures match the visible text presented on the client viewport.

---

## 4. AEO (Answer Engine Optimization) & GEO (Generative Engine Optimization)

AI engine citations (Perplexity, Claude, ChatGPT) are retrieved differently than standard search snippets. SEOKit v3 includes specialized rules derived from academic research (e.g., Princeton University's GEO studies) to improve citation probability:

### AEO & GEO Verification Metrics:
*   **Answer-First Format**: Verifies if definitions or queries are answered concisely within the first 1-2 sentences of matching paragraph nodes.
*   **Pronoun Density Checks**: Computes density ratios for first and second-person pronouns (`I`, `we`, `you`). High pronoun density lowers the perceived "factual objectivity" scored by AI algorithms; SEOKit highlights sections that need restructuring into passive or objective voices.
*   **Citation & Statistic Sign-offs**: Checks for the density of external citations, statistics (`%`, numbers), and references. Adding factual statistics and backing up assertions with citations increases perceived content authority, which is highly ranked by Generative Search engines.
*   **Chunk-Size Density**: Audits text blocks to ensure they do not exceed optimal semantic indexing sizes (approx. 200-300 words), enabling clean parsing by LLM vector embedding processes.

---

## 5. AI Access and Crawler Audits

SEOKit compares the static HTML sent by the server against the fully rendered HTML generated in the browser:

*   **JS-Rendering Diff (CSR vs. SSR)**: AI search bots (e.g., `GPTBot`, `ClaudeBot`, `PerplexityBot`) often fetch pages without executing Javascript to save performance. SEOKit checks if core content disappears when JS is disabled, flags discrepancies, and alerts you when your SPA layout is blank to AI crawlers.
*   **Robots.txt Access Checker**: Scans robots.txt configurations to confirm AI-specific user agents (`GPTBot`, `ClaudeBot`, `PerplexityBot`, `Applebot-extended`) are explicitly permitted to scan the site directory.

---

## 6. Automated Remediation Engine

When rules fail, SEOKit does not just report issues—it offers code-fixes through its **Automated Fixer**:

*   **Diff Previews**: Generates clear git-like code diffs of the proposed updates before writing them to the disk.
*   **Transactional Multi-file Operations**: Applies fixes across multiple files atomically. If a single file write fails, the entire transaction is rolled back.
*   **Automated Backups**: Creates temporary directory backups of changed source files prior to modifications, allowing you to invoke a rollback (`seokit rollback`) instantly.

---

## 7. Diagnostics and Log Outputs

SEOKit v3 outputs execution records across three layers:
1.  **IDE Diagnostics**: Integrates with workspace agents to highlight problems on specific code lines.
2.  **Report Exporters**: Emits structured reports in HTML, JSON, Markdown, and SARIF for CI pipelines.
3.  **Logs Directory**: Writes real-time execution steps, timestamps, and diagnostic statuses to `.seokit/logs/verification.log`.
