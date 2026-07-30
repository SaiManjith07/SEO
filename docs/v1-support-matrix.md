# SEOKit v1.0 Official Support Matrix

This document outlines the official support boundaries, system prerequisites, and environments for the stable **SEOKit v1.0.0** release line.

---

## 1. Supported Website Types

SEOKit v1.0 is optimized for **static HTML and client-side pre-rendered content validation**:
*   **Static HTML projects**: Fully supported. Direct analysis of `.html` assets, metadata, sitemaps, and crawler policies.
*   **Server-Side Rendered (SSR) projects (Next.js / Astro / Nuxt)**: *Out-of-scope for v1.0*. Dynamic runtime verification belongs to **SEOKit v2**.

---

## 2. Environments and Runtimes

*   **Node.js**: `v18.x`, `v20.x`, and `v22.x` (LTS releases).
*   **Package Managers**: `pnpm` (v9.x+ recommended), `npm`, or `yarn`.
*   **Operating Systems**: Windows, macOS, and Linux (Ubuntu/Debian).

---

## 3. Supported Capability Plugins

The following plugins are officially certified for the v1.0.0 platform loaders:
*   **`@seokit/plugin-seo`**: Validates basic tags (canonical, titles, robots, headings).
*   **`@seokit/plugin-performance`**: Evaluates LCP, CLS, INP web vitals, preloads, and payloads.
*   **`@seokit/plugin-accessibility`**: Validates WCAG semantic structure and attributes.
*   **`@seokit/plugin-aeo`**: Checks chunking, definition phrases, FAQ schemas, and AI crawler access.
*   **`@seokit/plugin-geo`**: Checks entities, local citations, quotations, sameAs connections, and statistics density.

---

## 4. Supported CLI Interfaces

The following core command utilities are stable and locked under the v1 compatibility contract:
*   `seokit init`: Scaffold default workspace configs.
*   `seokit verify [path]`: Run core rules verification tests against active workspace.
*   `seokit report <taskId> <format>`: Generate JSON, HTML, Markdown, or SARIF reports.
*   `seokit fix <taskId>`: Run auto-fix routines.
*   `seokit cache clean`: Purge caching items securely.
