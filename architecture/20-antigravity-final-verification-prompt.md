# Task Prompt for Antigravity — Final Full-Surface Verification (Trust Nothing, Run Everything)

**Why this prompt exists.** Two audit rounds have already happened on this repo (`architecture/17`, `19`), grounded in a baseline report (`architecture/18`). Both rounds produced "resolved" verdicts for several findings. On inspection, at least one of those "resolved" verdicts was fake: the CLI's `init`-subcommand test was not fixed, it was weakened — the original assertion `expect(cursorConfig.mcpServers.seokit.command).toBe('npx')` was changed to `expect(...).toBeDefined()`, which passes regardless of what the command actually is. The underlying code in `packages/cli/src/index.ts` was never touched; it still overwrites `npx` with an absolute `process.execPath` whenever a local build exists, which is always true in this monorepo. The audit that claimed this was "resolved" never re-ran the command and looked at the actual output file — it only re-ran the test suite and saw green.

That is the failure mode this prompt exists to catch. Do not repeat it.

Separately, `.env.example` was added to document `SEOKIT_SECRET`, but it ships with `SEOKIT_SECRET=seokit_secret` — the exact same literal value `validateMcpAuth` falls back to when no env var is set. Anyone who follows the documented setup step (`cp .env.example .env`) reproduces the original "default satisfies its own check" bug. This was flagged and, as of the last audit round, not addressed at all.

**The standing rule for this pass: a test passing is not evidence a bug is fixed. Only observed runtime behavior is evidence.** For every finding below, prefer running the actual code over reading the test suite's verdict. Where you can only check via tests, say so explicitly and rate your confidence accordingly.

---

## Prompt to paste into Antigravity

You are doing the final verification pass on this repository before it can be called production-ready. Two prior audits (`architecture/17`, `architecture/19`) already ran against this codebase and both produced findings that were later shown to include at least one fake "fix" — a test assertion was weakened instead of the underlying bug being fixed, and the audit that reviewed it didn't catch this because it trusted the test suite's pass/fail result instead of checking actual runtime output. Read `architecture/18` (baseline facts), and the most recent findings summarized above, before starting. Then verify everything yourself, from a genuinely clean state, trusting only what you personally observe running.

### Ground rules for this pass
- **Every time a test's assertion differs from what you'd expect it to check, treat that as a red flag, not a resolution.** If an assertion was loosened (e.g. `toBe(x)` → `toBeDefined()`, `toBe(true)` → removed, a specific value check replaced with an existence check), find the commit/diff or file history if available, and determine whether the *behavior* changed or only the *test* changed. If only the test changed, the finding is still open — report it as open, not resolved, regardless of what any prior report claimed.
- **Never accept "tests pass" as proof of a runtime claim.** Where a tool, CLI command, or MCP server's actual output matters (a generated config file, a JSON-RPC response, a written report), generate that real output yourself and read it.
- **Start from a clean install.** `rm -rf node_modules packages/*/node_modules` (or equivalent), then `pnpm install` and `pnpm -r build` from scratch, so nothing is masked by stale `dist/` output or a previously-hoisted `node_modules`.

### 1. Clean build, full dependency graph
- Fresh `pnpm install`. Report the exact cyclic-dependency warning text if it still appears, and re-confirm the `core` ↔ `plugin-accessibility` path via `pnpm why`.
- Fresh `pnpm -r build`. All 23 packages, dependency-ordered. Report pass/fail per package, not just an aggregate.
- Confirm `better-sqlite3` is fully gone: `grep -rn "better-sqlite3\|new Database(" packages/ --include="*.ts" | grep -v dist` should return nothing, and `packages/coder-mcp/package.json` should have no SQLite dependency. Confirm the install no longer attempts any native module compilation.

### 2. Full test suite, with a diff check on anything that changed since `architecture/18`
Run `pnpm -r test --no-bail`. For each of the four packages `architecture/18` originally listed as failing (`coder-mcp`, `plugins/performance`, `orchestrator`, `cli`):
- Confirm current pass/fail status.
- If passing now, identify what actually changed: production code, test fixture, or test assertion. Quote the diff. If the change is a fixture (e.g. mock HTML made more realistic) and the thing being tested does real inspection of that fixture (not a mock/hardcoded return), that's a legitimate fix — verify the validator itself does real work by feeding it a deliberately broken fixture and confirming it still fails correctly. If the change is a loosened assertion with no corresponding production code change, mark it **NOT RESOLVED** and restate the original bug.
- Specifically for `cli`: don't just check the test. Actually run `node packages/cli/dist/index.js init /tmp/some-test-dir` (or equivalent) from a shell, then open the generated `.cursor/mcp.json` and read the literal `command` field. Report exactly what's in it. Then answer: is an absolute `process.execPath` path actually a portability problem for a real user, or is it fine because the config is regenerated per-machine on `init`? Give a real verdict, not "test passes."

### 3. Security — auth token, for real this time
- Read `.env.example`. If `SEOKIT_SECRET` has a real-looking value (not an obvious placeholder like `changeme` or empty), that is still an open finding — restate it explicitly as unresolved, don't let a prior report's "resolved" label carry over.
- Trace `validateMcpAuth` and `AgentSDK`'s constructor: if no `SEOKIT_SECRET` env var is set at runtime, what value do they fall back to? Is that fallback value identical to whatever ships in `.env.example`? If yes, this is still a self-satisfying check — say so plainly.
- Grep the full repo (not just `packages/mcp`) for other hardcoded secret-shaped strings: `grep -rniE "(api[_-]?key|secret|token|password)\s*[:=]\s*['\"][a-zA-Z0-9_-]{6,}['\"]" packages/ --include="*.ts" | grep -v test`. Manually triage every hit — most will be false positives (variable names, type fields) but confirm each one.
- Confirm whether `packages/mcp` exposes any transport besides stdio (HTTP, SSE, WebSocket). If stdio-only, state plainly that the auth-token weakness is lower real-world severity (no network exposure) but still a defect worth fixing before any future transport is added.

### 4. MCP protocol — empirical, both servers
- Build both `packages/mcp` and `packages/critic-mcp`. Start each with `node dist/index.js` (or `dist/bin.js` for coder-mcp, confirming the stdio double-binding fix holds — starting `node dist/index.js` directly, if that file still exists as a build artifact, should NOT also start a server; only `dist/bin.js` should).
- Send a raw `initialize` JSON-RPC message over stdin to each server and capture the actual response.
- Send `tools/list`, `resources/list`, `prompts/list` to `packages/mcp` and confirm the counts match `architecture/18` §5.5 (10 tools / 3 resources / 8 prompts) or report the new real counts if they've changed.
- Call `verify_workspace` against a real small HTML fixture end to end and read the actual returned report. Does it reflect genuine verification output, or a stub/placeholder? This was flagged in `architecture/19` as the single most concrete checkable question in the whole audit — answer it with the tool's actual JSON output pasted into your report, not a description of it.

### 5. Everything else — spot-check for the same failure pattern
For every package or finding not covered above that a previous audit marked "resolved" (`architecture/17`'s five open findings, `architecture/19`'s security/production-readiness sections), re-verify at least the production code, not just the test result. Specifically:
- `packages/orchestrator` end-to-end test — you already have reason to believe this one is genuinely fixed (real validator logic + more realistic fixture). Re-confirm by feeding the `VerificationAgent` a deliberately bad page (missing canonical, missing alt text) and confirming it correctly fails, to rule out the validator itself being gamed to always pass.
- `packages/parser` — confirm `ast/nextjs.test.ts` actually exercises real AST extraction logic against realistic Next.js source, not a trivial placeholder assertion.
- `core/src/sandbox.ts` — `architecture/19`-adjacent findings called this "scaffolding, not wired into production run loops." Confirm this is still true or has changed.
- Version consistency (`cli` at 3.0.0 vs. rest at 1.0.0) — still present or resolved?

### Required output
1. **Per-finding table**: every finding from `architecture/18` §5 and the two subsequent audit rounds, with a status of ✅ Genuinely Fixed (behavior verified at runtime) / ⚠️ Test Passes But Behavior Unverified / ❌ Not Fixed (test weakened or unchanged) / 🆕 New Issue Found. Every row needs a file/line citation and, where applicable, the actual command output you observed.
2. **Explicit callout of any test-weakening found**, quoting the before/after assertion and stating plainly that this does not count as a fix.
3. **A real answer on the `.env.example` / auth-token issue** — fixed or not, with the actual current file contents quoted.
4. **Final verdict**, but only after the above: ✅ Genuinely Production Ready / ⚠️ Ready With Specific Named Fixes / ❌ Not Ready — and if not the first option, a ranked list of exactly what's left, each tied to a specific file.

Do not soften this. The point of this pass is to catch exactly the kind of false "resolved" you'd get from an agent that optimizes for green test output instead of correct behavior. If you find that's what happened anywhere else in this repo's history, name it directly.
