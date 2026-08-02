# Task Prompt — Live Cursor IDE Installation & 100%-Utilization Verification (new machine)

**Purpose.** All prior verification (`architecture/18`–`20`) happened inside a build/test sandbox. It never confirmed the thing that actually matters to the user: on a *different, real laptop*, installed fresh, connected to *Cursor* specifically — does every server actually show as connected, does every tool/resource/prompt actually work when invoked from Cursor's chat, and is anything silently unavailable or erroring. "Tests pass in CI" and "works inside Cursor on a real machine" are different claims. This prompt verifies the second one.

Paste this into Cursor's agent chat (or Antigravity, if running the check from there against this machine's Cursor install) on the new laptop, after cloning/copying the `seokit` folder onto it.

---

## Prompt to paste

You are verifying, on this specific machine, whether SEOKit's MCP servers are fully installed, fully connected to Cursor, and every single feature they expose actually works when invoked — not just whether the code builds. Produce a scorecard at the end: X of Y features verified working, as a percentage, with every failure named explicitly. Do not round up. Do not mark anything "working" without having actually invoked it and read real output.

### Step 0 — Capture this machine's environment
Record and report: OS and version, `node -v`, `npm -v`, `pnpm -v` (install pnpm if missing — `npm i -g pnpm`), Cursor version, and the absolute path where `seokit/` lives on this machine. This matters because prior findings (native module compile failures, PATH-hoisting fragility in `events`/`website`) were environment-dependent — if something fails here, we need to know if it's a real bug or specific to this machine.

### Step 1 — Fresh install and build, from nothing
- `pnpm install` from a clean checkout (no pre-existing `node_modules`). Report any errors verbatim, including warnings — don't summarize them away.
- Confirm `better-sqlite3` is not pulled in anywhere (`grep -rn "better-sqlite3" packages/*/package.json` should be empty) and confirm install completes without attempting any native module compilation.
- `pnpm -r build`. Report pass/fail per package — all 23 should build clean. If any fail on this machine but didn't in the sandbox, that's a real finding, not noise.

### Step 2 — Configure Cursor
- Run whatever this repo's own installer provides (`node packages/cli/dist/index.js init <path-to-a-real-test-project>`, or the documented equivalent) to generate `.cursor/mcp.json`.
- Open the generated `.cursor/mcp.json` and paste its literal contents into your report. Check the `command` field for each server entry — is it `npx`, or an absolute path to this machine's `node`? Either can work, but report exactly what was written, since a hardcoded absolute path from this machine won't be portable to a different one.
- If `SEOKIT_SECRET` is referenced anywhere in the generated config or a `.env` file, report its actual value. If it's the literal default (`seokit_secret`) or matches `.env.example`, flag that plainly — this was a known open issue.
- Register all three relevant servers if not already present: `@seokit/mcp`, `@seokit/critic-mcp`, `@seokit/coder-mcp`.

### Step 3 — Confirm real connection in Cursor
- Restart Cursor (or reload the MCP config) and open Cursor's MCP/tools settings panel.
- For each of the three servers, report the actual connection status shown by Cursor: connected/green, error, or not listed at all. If any server shows an error, capture the exact error text Cursor displays — don't paraphrase it.
- If a server fails to connect, diagnose why before moving on (missing build output, wrong path in config, port/permission issue) and report the root cause, not just "it didn't connect."

### Step 4 — Invoke every tool, resource, and prompt for real

Do not just list what's registered — actually call each one from Cursor's chat interface (or via a raw JSON-RPC call over the server's stdio if Cursor's UI doesn't expose a direct invoke path) and read the real response.

**`@seokit/mcp`** — expect 10 tools, 3 resources, 8 prompts (per `architecture/18` §5.5; re-confirm the count first, it may have changed):
- List every tool by name. For each, invoke it against a real small test page or project (create one if needed — a minimal HTML file with a title, meta description, and canonical link is enough) and confirm it returns real, non-empty, non-error output. Name any tool that errors, times out, or returns an empty/placeholder-looking response.
- List every resource by URI. Read each one and confirm it returns real content.
- List every prompt. Fetch each one's definition and confirm it has a usable template, not a stub.
- Specifically run `verify_workspace` against the real test project and read the actual generated report (check that it wrote files under `.seokit/reports/` in the five documented formats — json/md/html/pdf/sarif — and that at least the json and md ones contain real findings, not an empty shell).

**`@seokit/critic-mcp`** — expect 5 tools, 0 resources, 0 prompts:
- Invoke each of the 5 tools against real evidence (e.g., feed it the output from `verify_workspace` above) and confirm it returns a real score/grade, not a stub.

**`@seokit/coder-mcp`** — expect 10 tools (`list_files`, `read_file`, `search_code`, `apply_patch`, `run_tests`, `run_lint`, `run_build`, `git_diff`, `save_memory`, `load_memory`):
- Invoke each one for real inside a real project directory on this machine. For `save_memory`/`load_memory` specifically: save an entry, then confirm a `.seokit/coder-memory.json` file was actually written to disk with real content (read the file directly, don't just trust the tool's return value) — this is the JSON-storage replacement for the old SQLite backend, and this is the first time it's been verified against Cursor's actual invocation path rather than a test harness.
- For `apply_patch`: apply a small real patch to a scratch file and confirm the file changed on disk.
- For `run_tests`/`run_lint`/`run_build`: confirm they actually shell out and return real command output (not a mocked/hardcoded string) by deliberately breaking something (e.g. a syntax error) and confirming the tool reports the real failure.

### Step 5 — End-to-end workflow, inside Cursor
Using only Cursor's chat and the connected tools (no direct terminal shortcuts), do one full realistic task: ask Cursor to verify a real small project via `@seokit/mcp`, have it pull the critic's grade via `@seokit/critic-mcp`, and have it save a note about the result via `@seokit/coder-mcp`'s `save_memory`. Confirm this works as a natural chain a real user would drive, not just as isolated tool calls you triggered manually.

### Required output — the scorecard
1. **Environment summary** (Step 0).
2. **Install/build result** — pass/fail, any machine-specific issues found.
3. **Connection status** — all three servers, exact status shown by Cursor.
4. **Feature-by-feature table**: every tool (10 + 5 + 10 = 25), every resource (3), every prompt (8) — 36 total surface items. Each row: ✅ Verified Working (real output observed) / ❌ Broken (error, with exact message) / ⚠️ Connects but returns placeholder/empty output. No other status.
5. **Utilization percentage**: (# ✅) / 36, stated plainly, e.g. "31/36 = 86%." List every non-✅ item by name with its actual failure reason.
6. **End-to-end workflow result** — did the natural chained task (Step 5) work start to finish inside Cursor.
7. **Anything that worked in the build sandbox but doesn't work here** — call these out specifically, since that gap (sandbox vs. real machine vs. real Cursor) is exactly what this pass exists to catch.

Be exact. If you can't invoke something through Cursor's UI directly, say so and explain what you did instead (raw stdio call, etc.) rather than skipping it.
