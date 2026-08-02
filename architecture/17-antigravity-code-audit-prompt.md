# Task Prompt for Antigravity — Enterprise Code Audit of SEOKit (v2, corrected scope)

**Read this before pasting anything in.** This prompt originally assumed a 4-package repo (core, mcp, critic, critic-mcp). That was correct when first written but is now stale — the repo has grown to **23 packages** including an orchestrator, providers, a plugin system, and a CLI, which earlier versions of this prompt wrongly said didn't exist. A full ground-truth pass has already been run and written up at `../architecture/18-seokit-codebase-analysis-report.md` — **read that file first.** It contains verified build/test results and several concrete findings (a hardcoded default credential, a failing end-to-end orchestrator test, an unexplained circular dependency, packages with no tests at all). Your job is to verify those findings hold up, then go deeper than that report's stated scope limits — it explicitly did not read every file line by line, and you should.

---

## Prompt to paste into Antigravity

You are acting as an independent Principal Software Architect and enterprise reviewer. Your task is NOT to review documentation, and it is also not to repeat work already done. Read `SEO/architecture/18-seokit-codebase-analysis-report.md` first — it is a verified-by-build-and-test analysis of this exact repository, dated 2 August 2026, and it names its own scope limits explicitly in its final section. Treat its findings as a starting baseline to confirm or refute, not as something to rediscover from scratch. Then review the ACTUAL SOURCE CODE in `SEO/seokit/` for everything that report did not cover. Assume nothing. Trust nothing beyond what you can point to in code.

### Review rules

Perform a strict, production-grade audit. Do not be optimistic. Look for: architectural flaws, hidden bugs, incorrect abstractions, missing implementations, fake/placeholder logic, duplicated code, dead code, unnecessary complexity, incorrect dependency direction, coupling, race conditions, async issues, cache-invalidation issues, configuration leaks, scheduler correctness, plugin isolation, and event-ordering issues. This time, all of these are legitimate things to check — the repo genuinely has a scheduler (`core/src/scheduler.ts`), a plugin system (`core/src/platform/plugins.ts` + eight `plugins/*` packages), an orchestrator (`packages/orchestrator`), and provider abstractions (`packages/providers`). Unlike the first version of this prompt, do not assume any of these are out of scope.

### Actual repository scope (verified 2 Aug 2026 — see report §1)

23 packages: `cli`, `coder-mcp`, `core`, `critic`, `critic-mcp`, `diagnostics`, `events`, `framework-detector`, `mcp`, `orchestrator`, `parser`, `providers`, `sdk`, `website`, `workspace`, plus `plugins/{accessibility,aeo,framework,geo,performance,security,seo,structured-data}`.

Verified facts from the report — do not re-derive these, build on them:
- All 23 packages compile clean under strict TypeScript (`pnpm -r build`), once built in dependency order.
- Test results: 13 packages pass clean, 4 have failing tests (`coder-mcp`, `plugins/performance`, `orchestrator`, `cli`), 6 have no test script at all (`events`, `parser`, `sdk`, `website`, `workspace`, `plugins/framework`).
- The critic/core independence invariant is real and enforced by an actual test (`packages/critic/src/reward.test.ts:75-115`) — confirmed, not aspirational.
- `packages/mcp/src/registry.ts` and `sdk.ts` share a hardcoded default credential (`'seokit_secret'`) between the token a caller supplies by default and the token expected — effectively no real authentication unless a caller explicitly overrides it, and there's no documented env var to do so.
- `pnpm install` reports a cyclic workspace dependency between `core` and `plugins/accessibility` that is not visible in either package's direct `dependencies` field — unresolved, needs `pnpm why` tracing.

### Your job — go where the report didn't

**1. Resolve the open findings from the report**
- Trace the actual cycle behind the `core` ↔ `plugins/accessibility` warning using `pnpm why @seokit/core --filter @seokit/plugin-accessibility` (or equivalent) and report the real dependency path.
- Read `packages/plugins/performance/src/validators/lighthouse.ts` and determine exactly why `lhResult.passed` is `false` when the test's fixture implies it should pass. Is the validator's threshold logic wrong, or is the test fixture wrong?
- Read `packages/orchestrator/src/orchestrator.ts`, `loop.ts`, and `agents/verification.ts`. The report found the primary end-to-end test fails with `success: false, score: 0, errors: 26`. Find the actual root cause — is this a broken agent, a broken scoring function, a fixture mismatch, or something else? This is the single highest-priority item in this whole audit: if the orchestrator's core loop doesn't work, most of what depends on it (the CLI's `verify` command, the MCP's `verify_workspace` tool) is standing on a broken foundation.
- Read `packages/cli/src/index.ts` around the `init` subcommand and determine whether the `'/usr/bin/node'` vs `'npx'` mismatch is a real regression or a stale test.
- Determine whether the `better-sqlite3` test failures in `coder-mcp` are purely this-sandbox artifacts (no network/build toolchain) or would also fail in a normal CI environment — check if there's a fallback/mock path for environments without native module support, and whether the absence of one is itself a gap.

**2. Everything the report explicitly did not cover**
- `core/src/scheduler.ts` and `core/src/sandbox.ts` — is there a real DAG scheduler with real dependency resolution and a real sandboxed execution boundary, or is this scaffolding around a linear loop? `engine.ts`'s `runRules()` already does topological sort + cascade pruning directly (not via `scheduler.ts`) — is `scheduler.ts` actually used anywhere, or is it dead code sitting next to the thing that actually does the job?
- `core/src/lifecycle/*` (decay.ts, effectiveness.ts, engine.ts, queue.ts, refresher.ts, workflow.ts) — the decay-scoring and refresh-queue-ordering logic described generically in the original enterprise-audit template. Is the math (decay function, effectiveness scoring) sound? Is there a test for each, and does the test verify the actual formula or just that it runs without throwing?
- `core/src/tracking/*` (analyzer.ts, engine.ts, provider-manager.ts, store.ts) — moving averages, volatility, momentum claims from the original template. Verify against actual code, not assumption.
- `core/src/outreach/*` — engine.ts, generator.ts, scorer.ts. What does this actually do, and does it work?
- `packages/providers/src/*` (base.ts, google.ts, bing.ts, browser.ts, build.ts, localdev.ts, oauth.ts, remote.ts, resolver.ts, static.ts) — provider fallback, OAuth handling, resolver logic. Any hardcoded credentials or unsafe patterns here too, given what was found in `mcp/registry.ts`?
- `packages/parser/src/*` — AST-based extraction for Next.js/Remix. Zero tests exist for this package per the report. Is the code itself sound despite that, or does reading it reveal why no one wrote tests (e.g., it doesn't actually work)?
- `packages/sdk/src/index.ts` — the third-party plugin SDK, also untested. This is a public API surface for external plugin authors; audit it as such.
- Every `plugins/*/src/validators/*.ts` — spot-check at least three across different plugin packages for the "fake implementation" pattern: does the validator's logic actually inspect real evidence, or does it return a hardcoded/mocked-looking result regardless of input (the way the auth token turned out to be decorative)?

**3. Security pass, informed by what's already been found**
Given the hardcoded-credential finding in `mcp/registry.ts`, specifically check `packages/providers/src/oauth.ts`, any `.env`/config-loading code, and `packages/core/src/platform/policy.ts` and `certification.ts` for the same pattern: default values that silently satisfy their own validation. Also check path handling in `packages/core/src/scaffold/init.ts` and anywhere user-supplied paths are used for filesystem writes (path traversal).

### Required output

1. **Resolution of the report's open findings** — for each of the five items in "Your job" §1, a definitive answer with file/line evidence, not a repeat of the uncertainty.
2. **Architecture Review** — every package listed above, individually: ✅ Complete / ⚠️ Needs Improvement / ❌ Incorrect / 🔍 Dead code (exists but unused), with file/line evidence.
3. **Core Logic Review** — scheduler, sandbox, lifecycle/decay scoring, tracking analyzer, outreach engine, each: Correct / Partially Correct / Incorrect / Cannot verify (no tests), with reasoning.
4. **Hidden Technical Debt** — specific to this codebase.
5. **Security Findings** — the confirmed credential issue plus anything found in §3, ranked by severity.
6. **Missing Functionality vs. Documentation** — check the current repo's own `README.md`, `AGENTS.md`, and `.cursorrules` (not just `architecture/15`, which is now known to undersell what actually exists) — what do they claim that code doesn't back up, and vice versa (what does code do that documentation doesn't mention)?
7. **Production Readiness Score** — Architecture, Code Quality, Scalability, Reliability, Maintainability, Performance, Security, Testing, Documentation, Developer Experience — each /10, for the platform this repo actually is now (a 23-package SEO verification platform with an orchestrator and plugin system), not the smaller tool it used to be.
8. **Final Verdict** — one of: ✅ Enterprise Production Ready / ⚠️ Ready With Minor Improvements / ⚠️ Needs Significant Refactoring / ❌ Not Production Ready.
9. **Final Questions, answered with evidence only:**
   1. Does the orchestrator's core loop actually work end to end?
   2. Is the "critic never depends on core" invariant still true once you account for the full 23-package graph, not just critic and core in isolation?
   3. Is there any other hardcoded credential or auth-bypass pattern beyond the one already found?
   4. Is the scheduler/sandbox real infrastructure or unused scaffolding?
   5. Which of the 6 untested packages (`events`, `parser`, `sdk`, `website`, `workspace`, `plugins/framework`) most urgently need tests, ranked by risk if they silently broke?
   6. Would you approve this repository for a production release today?

Do not be polite. Be exact. Every conclusion must cite a file and, where possible, a line number. If you cannot verify something, say so rather than assuming based on a file's name or a comment's claim.
