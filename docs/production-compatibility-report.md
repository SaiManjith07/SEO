# SEOKit v2 Provider / Framework Compatibility Report

This report documents the compatibility matrix between SEOKit v2 providers and supported target web frameworks.

---

## Compatibility Matrix

| Provider / Framework | Static HTML | Next.js | React | Vue / Nuxt | Angular | Astro | Svelte |
|----------------------|-------------|---------|-------|------------|---------|-------|--------|
| **StaticProvider**   | ✅ Full     | ⚠️ (1)  | ⚠️ (1) | ⚠️ (1)     | ⚠️ (1)  | ✅     | ⚠️ (1) |
| **BuildProvider**    | ✅ Full     | ✅ Full | ✅    | ✅         | ✅      | ✅     | ✅     |
| **RemoteProvider**   | ✅ Full     | ✅ (2)  | ⚠️ (3) | ✅ (2)     | ⚠️ (3)  | ✅     | ⚠️ (3) |
| **LocalDevProvider** | ✅ Full     | ✅ (2)  | ⚠️ (3) | ✅ (2)     | ⚠️ (3)  | ✅     | ⚠️ (3) |
| **BrowserProvider**  | ✅ Full     | ✅ Full | ✅ Full| ✅ Full    | ✅ Full | ✅ Full| ✅ Full|

### Legend & Architectural Notes
*   **✅ Full**: Excellent compatibility. The provider captures all resource tags, HTML states, sitemaps, headers, and javascript hydration.
*   **⚠️ (1) Pre-render required**: `StaticProvider` reads source files directly from disk. JavaScript-rendered frameworks require static export/pre-rendering first to produce crawlable HTML.
*   **⚠️ (2) Dynamic content**: Standard remote crawlers retrieve raw server HTML. If the framework uses client-side rendering (CSR) without SSR/SSG enabled, content may be missing.
*   **⚠️ (3) JavaScript hydration**: Standard HTTP remote providers do not execute JavaScript. Use `BrowserProvider` (`render: true`) to ensure all dynamic framework client elements load before rule checks run.
