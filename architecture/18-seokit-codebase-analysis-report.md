# SEOKit Codebase Analysis Report

**Date:** 2 August 2026 (analysis run; repo files dated as recently as 31 July 2026 in `packages/orchestrator/.seokit/history/`)
**Method:** not a documentation review. The repo was copied into an isolated sandbox, installed, built, and tested for real (`pnpm install`, `pnpm -r build`, `pnpm -r test`), and specific claims were checked against source with `grep`/direct file reads. Every finding below cites the exact evidence. Where I did not verify something, I say so — this report does not claim more coverage than it has.

**Why this file exists:** the two prior Antigravity audit prompts (`17`, and the Cursor-MCP one referenced in this conversation) were drafted against an earlier, much smaller snapshot of this repo (4 packages). The repo has since grown to **23 packages**. This report replaces those assumptions with verified facts and is the grounding document both prompts now reference.

---

## 1. Scale — what actually exists now

23 workspace packages under `seokit/packages/` (plus `packages/plugins/*`):

`cli`, `coder-mcp`, `core`, `critic`, `critic-mcp`, `diagnostics`, `events`, `framework-detector`, `mcp`, `orchestrator`, `parser`, `providers`, `sdk`, `website`, `workspace`, and eight plugin packages: `plugins/accessibility`, `plugins/aeo`, `plugins/framework`, `plugins/geo`, `plugins/performance`, `plugins/security`, `plugins/seo`, `plugins/structured-data`.

This is no longer the small builder+critic pair described in `architecture/15`. It has grown into something closer to what the original pasted "Enterprise Code Audit" template (in this conversation, before `17` was written) assumed — an orchestrator, providers, a plugin system, a CLI. That template's scope complaints were premature at the time but are now largely legitimate against the current repo.

`packages/orchestrator/.seokit/` contains real runtime artifacts — `history/*.json` timestamped 30–31 July 2026, `evidence/*.json`, a `project.json`, a `tasks/` folder — meaning the orchestrator has actually been run repeatedly against something, not just written and left untested.

## 2. Build status — verified by actually building

**All 23 packages compile clean under strict TypeScript (`tsc -p tsconfig.json`) once built in dependency order.** This is a genuinely strong result for a repo this size.

Two install-time gotchas, both environment artifacts rather than code defects:
- `pnpm install`'s bin-linking step tries to symlink workspace binaries (e.g., `seokit` → `packages/core/dist/cli.js`) before anything is built, so a first-ever `pnpm install` on a clean checkout throws `Failed to create bin` warnings. Harmless — they resolve once `pnpm build` runs — but worth knowing before assuming something is broken.
- `better-sqlite3` (native module, used by the memory/tracking layer) failed to compile in this sandbox — no network access to fetch prebuilt binaries and no native toolchain. This is very likely a sandbox limitation, not a repo bug; a normal dev machine or CI runner with either internet access or build tools would not hit this. Flagged here because it's a real operational dependency worth documenting (README/CONTRIBUTING should probably say "requires either network access at install time or a C++ build toolchain").

`@seokit/sdk` failed to build in one early test run — traced to my own test methodology (I built it via `pnpm --filter @seokit/sdk build` without first building its declared workspace dependency `@seokit/core`). Not a repo bug: `sdk`'s `package.json` correctly declares `"@seokit/core": "workspace:^1.0.0"`, and it built cleanly once `core` was built first. Noted here so nobody re-discovers this as a false alarm.

## 3. Test status — the real numbers

Ran `pnpm -r test --no-bail` across all 23 packages.

**13 packages pass clean:** `core`, `critic`, `critic-mcp`, `mcp`, `diagnostics`, `framework-detector`, `providers`, `plugins/accessibility`, `plugins/aeo`, `plugins/geo`, `plugins/security`, `plugins/seo`, `plugins/structured-data`.

**4 packages have failing tests:**

| Package | Failure | Likely cause |
|---|---|---|
| `coder-mcp` | 1 test — `Could not locate the bindings file` for `better_sqlite3.node` | Same native-module sandbox limitation as §2 — needs re-verification in a normal environment before concluding it's a real bug |
| `plugins/performance` | 1 test — `expect(lhResult.passed).toBe(true)` receives `false` | **Real, environment-independent logic bug.** The Lighthouse validator returns `passed: false` for a scenario its own test says should pass. `packages/plugins/performance/src/validators/lighthouse.ts` needs inspection — not yet done in this pass. |
| `orchestrator` | 2 of 9 tests in `index.test.ts` | **The most severe finding in this report.** `should run a complete mock orchestrator execution successfully` expects `success: true` and gets `success: false, score: 0, errors: 26`. This is the primary end-to-end workflow test — plan → code → verify → critic — and it fails against the orchestrator's own fixtures. `should verify live mock HTML using VerificationAgent` also fails the same way (`expected false to be true`). Root cause not yet traced — needs a read of `orchestrator/src/orchestrator.ts`, `loop.ts`, and `agents/verification.ts`. |
| `cli` | 1 test — `expect(cursorConfig.mcpServers.seokit.command).toBe('npx')` receives `'/usr/bin/node'` | **Real bug or stale test** — the `init` subcommand writes a Cursor MCP config with the resolved Node binary path instead of `npx`. Either the implementation regressed from an intended `npx`-based launch command, or the test is asserting an outdated expectation. Either way, code and test disagree. |

**6 packages have no test script at all:** `events`, `parser`, `sdk`, `website`, `workspace`, `plugins/framework`. `sdk` (the third-party plugin SDK — a public API surface) and `parser` (AST-based content extraction) are both architecturally significant and completely untested.

## 4. One claim verified TRUE — the critic/core independence invariant

`architecture/09` and `architecture/15` both claim the critic "must never depend on `@seokit/core`," enforced by a test. **This is real, not aspirational.** `packages/critic/src/reward.test.ts` (lines 75–115) contains two tests: one regex-checks the package's own source files for any `import ... from '@seokit/core'` or `require("@seokit/core")` pattern, the other loads `package.json` and asserts `@seokit/core` is not a key in `dependencies`. `packages/critic/package.json` also carries the comment `"INVARIANT: must never depend on @seokit/core. Enforced by reward.test.ts."` — the documentation and the code agree, and the code actually enforces it. This is the strongest, cleanest result in the whole audit.

## 5. New findings from this pass, not covered by the two prior prompts

### 5.1 — Hardcoded default credential in the MCP auth path (security — high priority)

`packages/mcp/src/registry.ts`:
```ts
export function validateMcpAuth(authToken?: string, expectedToken: string = 'seokit_secret'): boolean {
  if (!authToken || authToken !== expectedToken) {
    throw new Error('Unauthorized remote MCP connection: Invalid token.');
  }
  return true;
}
```
`packages/mcp/src/sdk.ts`:
```ts
constructor(registry: MCPToolRegistry, streamer: MCPResourceStreamer, authToken: string = 'seokit_secret') {
```
**The default caller-supplied token and the default expected token are the same hardcoded literal.** Any code path that instantiates `AgentSDK` without explicitly passing a real token authenticates successfully against the function's own default — this is not authentication, it's a check that passes itself by construction. `packages/mcp/src/mcp.test.ts` encodes this as expected behavior (`validateMcpAuth('seokit_secret')` → `true`). `.env.example` has no `SEOKIT_SECRET` or equivalent variable, so there's no documented way to configure a real value either. If "remote MCP" access (mentioned in `architecture/15`'s transport discussion) is ever exposed beyond local stdio, this needs a real secret-management story before that happens — right now it's decorative.

### 5.2 — Unresolved cyclic workspace dependency warning

`pnpm install` reports: `There are cyclic workspace dependencies: packages/core, packages/plugins/accessibility`. Checked both packages' declared `dependencies` directly — `core`'s only deps are `@opentelemetry/api` and `cheerio`; `plugins/accessibility` depends on `@seokit/core` (one-directional, expected). The cycle pnpm is detecting is **not visible in either package's direct dependency list** — it likely comes from a peer dependency, a devDependency, or something in the lockfile graph. Not traced further in this pass; `pnpm why @seokit/core` run from `packages/plugins/accessibility` would find it in under a minute and should be step one of any follow-up.

### 5.3 — `events` and `website` packages build only via implicit PATH hoisting

Both declare `"dependencies": {}` and no `devDependencies` at all, yet their `build`/`typecheck` scripts run `tsc`. They build successfully in this monorepo only because pnpm's `run` command walks up the directory tree adding ancestor `node_modules/.bin` folders to `PATH`, and the workspace root declares `typescript` as a devDependency. **This works here but would break immediately if either package were extracted or published standalone** — they have no self-contained build contract.

### 5.4 — Version inconsistency

Root `package.json` and most packages are `1.0.0`. `packages/cli/package.json` is `3.0.0`, and the MCP server it wraps self-identifies internally as `{ name: 'seokit-v3', version: '3.0.0' }` in `packages/mcp/src/index.ts`. `packages/cli/package.json`'s `bin` field declares three aliases — `seokit`, `seokit-v2`, `seokit-v3` — all pointing at the same `dist/index.js`. This reads like leftover naming from version churn rather than an intentional multi-version-alias strategy; worth a deliberate decision either way.

### 5.5 — MCP server tool/resource/prompt surface (ground truth for the Cursor-MCP audit prompt)

Direct count via `grep` on `packages/mcp/src/index.ts` (660 lines): **10 `registerTool` calls, 3 `registerResource` calls, 8 `registerPrompt` calls.** This is substantially richer than the old README's "7 tools + 1 resource" claim — prompts exist now and were previously undocumented in this conversation's assumptions. `packages/critic-mcp/src/index.ts` (359 lines): **5 `registerTool` calls, 0 resources, 0 prompts** — matches prior documentation exactly, unchanged.

## 6. Scope limits — what this report did NOT do

Roughly 250 source files exist across 23 packages. This pass did not read every file line by line. It established ground truth via a real build and test run (the highest-value, hardest-to-fake evidence), then targeted specific files to verify or refute claims already in play in this conversation (critic/core independence, MCP tool counts, the auth mechanism, the cyclic-dependency warning). Not yet examined in any depth: the DAG scheduler (`core/src/scheduler.ts`), the lifecycle/decay-scoring system (`core/src/lifecycle/*`), the tracking analyzer (`core/src/tracking/*`), the outreach engine (`core/src/outreach/*`), the provider resolvers (`packages/providers/src/*`), and the orchestrator's agent implementations (`packages/orchestrator/src/agents/*`) beyond the fact that their integration test fails. That deeper pass is exactly what `architecture/17` (revised) and `architecture/19` (new) now ask Antigravity to do, using this report as the starting evidence rather than a blind start.

## Evidence log

- `pnpm install` (sandbox): cyclic dependency warning, better-sqlite3 native build failure — see §2, §5.2
- `pnpm -r build` (dependency-ordered): 23/23 succeed, zero TypeScript errors
- `pnpm -r test --no-bail`: 13 pass / 4 fail / 6 no-test-script — see §3
- `grep -rn "@seokit/core" packages/critic/src/` → only comments and the enforcing test, no real import — see §4
- `packages/critic/src/reward.test.ts:75-115` — the independence-enforcing test, read directly
- `packages/mcp/src/registry.ts`, `packages/mcp/src/sdk.ts`, `packages/mcp/src/mcp.test.ts` — the hardcoded-token chain, read directly
- `packages/mcp/src/index.ts`, `packages/critic-mcp/src/index.ts` — grep counts for tool/resource/prompt registration
- `packages/core/package.json`, `packages/plugins/accessibility/package.json` — dependency lists, read directly
- `packages/events/package.json`, `packages/website/package.json`, `.npmrc` (absent) — read directly
- `packages/cli/package.json`, root `package.json` — version fields, read directly
