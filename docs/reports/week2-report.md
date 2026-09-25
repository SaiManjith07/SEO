# Week 2 Report — SEOKit Data Layer

## 1. Verification Gate (Part A)
| Step | Status | Evidence |
|------|--------|----------|
| A1 Dependency reality | PASS | Checked on npm, valid MIT licenses. (e.g. `@didrod2539/aeolint` `1.x`, `structured-data-kit` `1.x`, `llmstxt-kit` `1.x`) |
| A2 Critic independence | PASS | The architectural invariant is maintained; `@seokit/critic-aeolint` does not import `@seokit/core`. |
| A3 aeolint real run | PASS | `[{"id": "aeolint.headings", "fix": "Add question subheadings"}, ...]` |
| A4 structured-data run | PASS | `Block 1 validation failed: /mainEntity/0 is missing required property "acceptedAnswer"` |
| A5 llms.txt cycle | PASS | Exit codes: 0 for valid run, 1 after simulated corruption. |

## 2. Gate Verdict
- GREEN — all A1–A5 passed, Part B/C/D proceeded

## 3. Dependencies Adopted
| Package | Version | License | Verified on npm? |
|---------|---------|---------|------------------|
| `@didrod2539/aeolint` | ^1.0.0 | MIT | YES |
| `structured-data-kit` | ^1.0.0 | MIT | YES |
| `llmstxt-kit` | ^1.0.0 | MIT | YES |
| `crux-api` | ^4.1.0 | MIT | YES |
| `@power-seo/search-console` | ^1.0.0 | MIT | YES |

## 4. Files Created/Modified
- `packages/cli/src/index.ts` (modified, ~521 lines)
- `packages/cli/package.json` (modified, ~35 lines)
- `packages/mcp/src/index.ts` (modified, ~741 lines)
- `packages/mcp/package.json` (modified, ~41 lines)
- `packages/plugins/crux/src/index.ts` (created, ~30 lines)
- `packages/plugins/crux/src/index.test.ts` (created, ~47 lines)
- `packages/plugins/crux/package.json` (created, ~21 lines)
- `packages/plugins/crux/tsconfig.json` (created, ~19 lines)
- `packages/plugins/gsc/src/index.ts` (created, ~78 lines)
- `packages/plugins/gsc/src/index.test.ts` (created, ~69 lines)
- `packages/plugins/gsc/package.json` (created, ~21 lines)
- `packages/plugins/gsc/tsconfig.json` (created, ~19 lines)
- `.agents/mcp.json` (modified, ~20 lines)
- `.gitignore` (modified, ~100 lines)
- `docs/week2-setup.md` (created, ~45 lines)
- `.env.example` (created, ~3 lines)

## 5. Plugins Built

**@seokit/plugins-crux**
- Public API: `fetchRecord(urlOrOrigin: string, isOrigin: boolean = false): Promise<any[]>`
- Error cases handled: `API_KEY_INVALID` (throws), `quota exceeded` (throws), `ECONNRESET` (throws), no data/not found (returns `[]` gracefully to redistribute weighting).
- Test count: 5 tests (all passed)

**@seokit/plugins-gsc**
- Public API:
  - `topQueries(days: number = 30, limit: number = 10): Promise<any[]>`
  - `topPages(days: number = 30, limit: number = 10): Promise<any[]>`
  - `lowCtrHighImpressions(days: number = 30, impressionThreshold: number = 1000, ctrThreshold: number = 0.02): Promise<any[]>`
  - `indexingStatus(url: string): Promise<string>`
- Error cases handled: API rejections natively captured and re-thrown as `GSC API Error: <msg>`. Empty states gracefully returned as empty arrays `[]`.
- Test count: 5 tests (all passed)

## 6. CLI + MCP Wiring
- `seokit crux https://example.com` outputs:
  ```json
  []
  ```
- `seokit gsc queries --days 28 --limit 20` outputs:
  ```json
  []
  ```
- `get_crux_report` MCP tool added. Invocation returns `{"findings": [{"id": "crux.report", "fix": "Review performance metrics", "data": []}]}`
- `get_gsc_queries` / `get_gsc_opportunities` MCP tools added. 
- Prompt failure check: The `keyword_research` prompt correctly throws if `process.env.GSC_SERVICE_ACCOUNT_PATH` is missing:
  ```
  Error: GSC_SERVICE_ACCOUNT_PATH credential is missing. Cannot fetch real query data.
  ```

## 7. Test Suite Result
All mock tests pass successfully across the monorepo for the newly generated plugins.
- `@seokit/plugin-crux`: 5 passed / 0 failed
- `@seokit/plugin-gsc`: 5 passed / 0 failed

## 8. Credentials Status
| Credential | Provided by user? | Where it goes | Verified working? |
|------------|-------------------|---------------|-------------------|
| CRUX_API_KEY | NO | .env | UNTESTED |
| GSC_SERVICE_ACCOUNT_PATH | NO | .env | UNTESTED |

Because real credentials were NO, end-to-end execution of live fetching for Part D commands was marked UNTESTED (falling back to graceful empty arrays or mocked testing).

## 9. Architectural Invariants Check
| Invariant | Status | Evidence |
|-----------|--------|----------|
| critic does not import core | PASS | Package boundary / dependency graph validation |
| core does not import plugins | PASS | Package boundary / dependency graph validation |
| every Finding has `fix` | PASS | Explicit mappings in integration schemas |

## 10. Open Issues / Blockers
1. **Missing Real Data Tests**: Cannot fully e2e test real data throughput until a Google Cloud API key/Service Account is provided for `CRUX_API_KEY` and `GSC_SERVICE_ACCOUNT_PATH`. Blocks final production rollout, requires user injection into `.env`.
2. **Missing Token JWT signing**: `GSCPlugin` currently has a stubbed `getToken` signature. To actually fetch live GSC data using `@power-seo/search-console`, the plugin will need an implementation of `signJwt` or a pre-configured service token method using standard Google Auth libraries if `@power-seo` requires full RS256 token signing locally.

## 11. Week 3 Readiness
- READY — can proceed to Elmo deployment (once credentials/token sign are verified).

## 12. Honest Self-Assessment
- **What actually works end-to-end right now**: CLI routing, `verify` cycles, LLMs.txt generation, structured-data scanning, test suites for plugins, and package dependencies.
- **What is scaffolded but unverified (and why)**: Actual network requests to Google Search Console and Chrome UX Report. Mock tests prove the data processing pipeline is intact, but the absence of live GCP keys limits full e2e verification.
- **What was NOT done despite being in scope**: Complex JWT signing for the custom `@power-seo/search-console` `GSCClientConfig.auth.getToken` — a stub was provided that throws an error for live credentials so it fails loudly instead of silently hanging.
