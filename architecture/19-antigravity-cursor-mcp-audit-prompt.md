# Task Prompt for Antigravity — Enterprise MCP Readiness Audit (Cursor Verification), grounded

**Read `../architecture/18-seokit-codebase-analysis-report.md` §5.5 first.** It already establishes real counts for both MCP servers by direct grep, so Antigravity doesn't need to rediscover them: `packages/mcp/src/index.ts` (660 lines) registers **10 tools, 3 resources, 8 prompts**; `packages/critic-mcp/src/index.ts` (359 lines) registers **5 tools, 0 resources, 0 prompts**. That report also found a hardcoded default credential in `packages/mcp/src/registry.ts`/`sdk.ts` — directly relevant to this audit's §10 Security section. This prompt assumes that context; don't have Antigravity re-derive it.

There are **two** MCP servers in this repo, not one — `packages/mcp` (the builder/verification server, now much larger than originally documented) and `packages/critic-mcp` (the independent grader, unchanged and small by design). Audit both, separately, and do not average their results together — a strong critic-mcp shouldn't paper over a weak mcp or vice versa.

---

## Prompt to paste into Antigravity

Act as a Principal MCP Architect and perform a strict audit of `packages/mcp` and `packages/critic-mcp` in this repository. Do not trust documentation, walkthroughs, or the summary in `architecture/18` beyond its cited evidence — verify everything yourself against the actual implementation, but don't waste time re-counting things `architecture/18` already grepped and cited exact line numbers for. Your objective: is each server genuinely Cursor MCP production ready?

### Review rules
- Review source code only: `packages/mcp/src/*.ts` and `packages/critic-mcp/src/*.ts`, plus their `package.json`/`tsconfig.json`.
- Do not assume a feature exists unless implemented. Reference actual files and line numbers.
- Be extremely critical — review this the way you'd review an open-source MCP server before recommending it to others.

### 1. MCP Server — both servers, separately
Check for each: stdio transport, JSON-RPC handling (via `@modelcontextprotocol/sdk` — confirm which SDK version, check `package.json`), MCP initialization, capability negotiation, server lifecycle, graceful shutdown, request routing, error handling. Status per server: ✅ Complete / ⚠️ Partial / ❌ Missing, with evidence.

Specifically test empirically, not just by reading: build both servers (`pnpm --filter @seokit/mcp --filter @seokit/critic-mcp build`), start each with `node dist/index.js`, and send a raw `initialize` JSON-RPC message over stdin. Report the actual response, not an assumption about what the SDK should do.

### 2. MCP Protocol Compliance
`packages/mcp` claims (per `architecture/18`) 10 tools, 3 resources, 8 prompts. Verify:
- `tools/list` returns all 10 with valid JSON schemas (not just that `registerTool` was called 10 times — confirm each has a real, non-empty `inputSchema`).
- `resources/list` and `resources/read` work for all 3 registered resources — read each resource's actual URI scheme and confirm it resolves.
- `prompts/list` and `prompts/get` work for all 8 registered prompts — this is new since the last documentation pass; nothing in this repo's prior docs described prompts at all, so there's no baseline to check against except the code itself. Read each prompt's definition and assess whether it's a real, useful prompt template or a stub.
- `packages/critic-mcp` claims 5 tools, 0 resources, 0 prompts — confirm `tools/list` returns exactly 5 with valid schemas, and confirm resources/prompts endpoints correctly return empty rather than erroring.
- progress notifications, cancellation, logging, structured error responses — check for each, in both servers, independently.

### 3. Tool Registry & Execution
For every one of the 10 `mcp` tools and 5 `critic-mcp` tools: does it actually execute against real logic, or does any tool's handler return a hardcoded/mocked response regardless of input? This question is not hypothetical here — `architecture/18` already found one hardcoded-value pattern in this exact package (the auth token default). Check every tool handler for the same category of issue: does `verify_workspace` (in `packages/mcp/src/index.ts`) actually call through to `@seokit/orchestrator`'s real verification logic, and given `architecture/18` found the orchestrator's core end-to-end test failing (`success: false, score: 0, errors: 26`), does that failure propagate into what this tool returns to Cursor? Trace this specific chain — it's the most concrete, checkable question in this whole audit.

### 4. Prompt Registry
List and evaluate all 8 prompts in `packages/mcp/src/index.ts`. For each: does it have a clear name, description, and argument schema Cursor could actually present to a user? Is any prompt dead weight — defined but never meaningfully different from another, or referencing functionality that doesn't work (see §3)?

### 5. Resources
List and evaluate all 3 resources. Confirm URI scheme, confirm `resources/read` returns real content (not a placeholder string), and check whether any resource is meant to stream or support subscriptions — if so, is that actually implemented or just structured to look like it might be later?

### 6. Cursor Integration
Check `packages/mcp/package.json` and `packages/critic-mcp/package.json` for `bin`, `main`, `exports`, and build output. `architecture/18` found `packages/cli/package.json` declares three bin aliases (`seokit`, `seokit-v2`, `seokit-v3`) pointing at the same file, and versions are inconsistent across the monorepo (cli at 3.0.0, most packages at 1.0.0, mcp server self-identifying internally as `seokit-v3`). Does this versioning inconsistency create any actual risk of Cursor launching the wrong binary or a stale config referencing an old bin name? Also check: does `packages/cli`'s `init` subcommand (which `architecture/18` found has a failing test — writes `/usr/bin/node` instead of `npx` as the launch command) actually produce a working `.cursor/mcp.json`? If the command path is wrong, would Cursor actually be able to launch the server from that generated config, or is this a real breakage a new user would hit on first install?

### 7. Installation
Can a user reach a working server via `npm install`, `pnpm install`, `npx`, global install, or workspace install? Given `architecture/18` found `events` and `website` packages build only through implicit PATH-hoisting of the root's `typescript` devDependency (not a self-contained dependency declaration), check whether `packages/mcp` and `packages/critic-mcp` have the same fragility — could either package be installed and run completely standalone (outside this monorepo), or does it silently depend on hoisting/sibling packages being present?

### 8. Configuration
Verify support for `.cursor/mcp.json`, environment variables (cross-check against `.env.example` — `architecture/18` found no auth-token variable documented there despite one existing in code), workspace configs, multi-project support.

### 9–13. (Tool Execution details, Security, Production Readiness, Distribution, Cursor UX)
Follow the original structure — parameter validation, async execution, error handling, cancellation, timeout, logging; authentication (start from the confirmed hardcoded-token finding and determine severity — is this reachable only over local stdio, where it's low-risk, or could it be exposed over a network transport where it becomes a real vulnerability? Check `packages/mcp` for any HTTP/SSE transport setup, not just stdio); retries, telemetry, resource cleanup, memory leaks; package exports, types, README/LICENSE/CHANGELOG accuracy against what you actually found; and finally, role-play as Cursor itself — discover tools, discover prompts, discover resources, execute a tool, read a resource, and report whether the experience would actually be smooth for a real user, given everything found above.

### Hidden Problems checklist
Stub implementations, placeholder methods, fake MCP handlers, missing protocol handlers, hardcoded responses (you already have one confirmed instance — find any others), missing schemas, broken startup, protocol violations, tool/resource/prompt discovery failures, JSON-RPC violations.

### Testing
`packages/mcp` passed its own test suite per `architecture/18` (`mcp.test.ts`, `mcp-interop.test.ts` both green). Read what those tests actually assert — do they test protocol compliance and interop, or only the auth-token logic already flagged as weak? Is there a real handshake test, a real tool-execution test per tool, a resource test, a prompt test? Name what's covered and, explicitly, what a server this size should have and doesn't.

### Final Score
Rate /10: Architecture, Protocol Compliance, Cursor Compatibility, Code Quality, Security, Reliability, Developer Experience, Documentation, Testing, Distribution — for `packages/mcp` and `packages/critic-mcp` **separately**, not averaged.

### Final Verdict
One of, per server: ✅ Cursor MCP Production Ready / ⚠️ Ready with Minor Improvements / ⚠️ Not Yet Ready / ❌ Requires Major MCP Refactoring.

### Final Questions — answer with evidence only
1. Will Cursor successfully start each server?
2. Will Cursor discover all 10 tools (mcp) and all 5 tools (critic-mcp)?
3. Will Cursor discover all 8 prompts and all 3 resources in `packages/mcp`?
4. Does `verify_workspace`'s output reflect the orchestrator's actual (currently failing) behavior, or does it mask that failure somehow?
5. Is the hardcoded auth-token pattern a real production risk given the actual transport this server uses, or a latent one?
6. What's the single highest-priority fix before either server should be published or recommended to others?

Use only the actual source code and empirical testing (running the servers) as evidence — not documentation, not `architecture/18`'s summary beyond its cited line numbers, not this prompt's own assumptions.
