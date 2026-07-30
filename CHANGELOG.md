# Changelog

All notable changes to the SEOKit workspace project will be documented in this file.

---

## [1.0.0] - 2026-07-30

### Added
*   **Platform Core Release (v1.0.0)**: Stable engine loop, validator registry, capability registry, and custom semver compatibility loaders.
*   **Standards Governance Framework**: Linking every executable validator rule to its governing repository policy code (`STD-XX`) inside the evidence log structures.
*   **Hashed Evidence Storage**: Encapsulated filesystem storage providers saving evidence records under deterministic hashes: `sha256(treeHash + ruleId + taskId + ruleVersion + validatorVersion + capabilityVersion + frameworkSdkVersion)`.
*   **Dynamic Plugin Loading**: Config-driven runtime import loader loading external workspace plugins (`seo`, `performance`, `accessibility`, `aeo`, `geo`) dynamically based on `.seokit/config.json` specifications, avoiding compile-time circular references.
*   **Standardized CLI Experience**: Exposing production commands via the `seokit` binary interface:
    *   `seokit init`: Scaffolds workspace template configurations.
    *   `seokit verify`: Runs dynamic plugin validations against project source files.
    *   `seokit report`: Generates audit summaries in JSON, HTML dashboard, Markdown, and SARIF compliance formats.
    *   `seokit fix`: Resolves failed rules and lists deterministic correction strategies based on rule `FixPlan` suggestions.
*   **Princeton GEO Verifiability**: Incorporated statistics density validators (visibility lift +25.9%) and named quotations presence validators (visibility lift +27.8%).
*   **Robots Crawler Auditing**: Created robots.txt crawler verification maps verifying target retrieval crawlers (`OAI-SearchBot`, etc.) are explicitly allowed access.
*   **WCAG Form Input Labels & Keyboard Controls**: Created WCAG accessibility checks auditing custom elements focus patterns and input element field tags.
*   **Developer Handbooks Suite**: Added complete handbooks under `SEO/docs/`:
    *   [Plugin Author Guide](docs/plugin-author-guide.md)
    *   [Standards Author Guide](docs/standards-author-guide.md)
    *   [Architecture Handbook](docs/architecture-handbook.md)

### Security / Hardening
*   Isolated sandbox testing verifying E2E CLI execution using packed `.tgz` binaries and local NPM installation simulation outside the monorepo context.
