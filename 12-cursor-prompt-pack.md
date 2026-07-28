# Cursor Prompt Pack — SEOKit

**How we work:** I write the prompts, you paste them into Cursor, Cursor writes the code, you run the verification command and paste back anything that fails.

---

## Setup (once)

1. Open the `seokit/` folder in Cursor.
2. `AGENTS.md` and `.cursorrules` are already there — Cursor reads them automatically. **This is the cost optimisation**: the project's architecture, invariants and conventions load on every request, so the prompts below stay short.
3. Initialise git before starting:

```bash
cd seokit
git init && git add -A && git commit -m "Phase 0-1.5: core engine, builder MCP, critic MCP"
```

---

## Rules for this workflow

**Commit after every prompt that passes.** If prompt 3 breaks something, you want to `git diff` against a known-good state, not archaeology.

**Run the verification command before moving on.** Never chain two prompts on unverified code — errors compound and each fix costs another request.

**Paste failures back verbatim.** Don't summarise the error. Cursor fixes exact stack traces far better than descriptions.

**Use Agent mode with the whole repo as context.** Not inline edit — these prompts touch multiple files.

**If Cursor starts rewriting files you didn't ask about, stop it.** Say: *"Revert everything outside `packages/data/`. Only touch the files listed in the prompt."* Scope creep is where the requests get burned.

---

# Prompt 1 — Search Console adapter

**Why first:** this is the single biggest upgrade available. It turns SEOKit from "checks your markup" into "knows which of your pages are actually underperforming." Free, OAuth only, no API cost.

```
Create a new package `@seokit/data` at packages/data for free, first-party data
sources. Start with a Google Search Console adapter.

CONTEXT
- Read AGENTS.md first. Follow every invariant in it.
- This package must NOT be imported by @seokit/critic — that would break the
  critic's independence. It is a peer of core and critic, not a dependency.
- No paid APIs. GSC is free and uses OAuth only.

CREATE
packages/data/package.json      name @seokit/data, type module, deps: googleapis
packages/data/tsconfig.json     copy packages/core/tsconfig.json exactly
packages/data/src/types.ts
packages/data/src/gsc.ts
packages/data/src/index.ts
packages/data/src/gsc.test.ts

TYPES (src/types.ts)
  export interface GscRow {
    query?: string; page?: string;
    clicks: number; impressions: number; ctr: number; position: number;
  }
  export interface GscCredentials {
    clientId: string; clientSecret: string; refreshToken: string;
  }
  export interface OpportunityPage {
    page: string; impressions: number; clicks: number;
    ctr: number; position: number;
    opportunity: 'striking-distance' | 'low-ctr' | 'declining' | 'healthy';
    reason: string;
  }

FUNCTIONS (src/gsc.ts)
  createClient(creds: GscCredentials)
    OAuth2 client via googleapis.

  queryPerformance(client, siteUrl, opts): Promise<GscRow[]>
    opts: { startDate, endDate, dimensions: ('query'|'page')[], rowLimit? }
    MUST paginate with startRow until fewer than rowLimit rows return.
    GSC caps rows per request; a single call silently truncates data.

  findOpportunities(rows: GscRow[]): OpportunityPage[]
    Classify each page:
      'striking-distance' — position between 5 and 20 (best effort-to-return
                            work in SEO; already relevant, just needs a push)
      'low-ctr'           — position <= 5 but ctr < 0.02 (ranking well, title
                            or meta not earning the click)
      'healthy'           — otherwise
    Sort by impressions descending. Set `reason` to a human-readable
    explanation naming the actual numbers.

CONSTRAINTS
- Explicit .js extensions on all relative imports (NodeNext).
- No network calls in tests. Test findOpportunities as a pure function over
  fixture rows.
- Every exported function needs an explicit return type.
- Comment WHY, not what.

TESTS (src/gsc.test.ts)
- position 12 with high impressions -> 'striking-distance'
- position 3 with ctr 0.005 -> 'low-ctr'
- position 2 with ctr 0.15 -> 'healthy'
- results sorted by impressions descending
- empty input returns empty array
```

**Verify:**
```bash
pnpm install && pnpm --filter @seokit/data typecheck && pnpm --filter @seokit/data test
```

**Then commit:** `git add -A && git commit -m "feat: Search Console adapter"`

---

# Prompt 2 — Expose GSC through the builder MCP

```
Add two tools to packages/mcp/src/index.ts that expose the @seokit/data
Search Console adapter.

CONTEXT
- Read AGENTS.md. Follow existing tool patterns in the file exactly — same
  `text()` helper, same error handling shape, same registerTool signature.
- Add "@seokit/data": "workspace:*" to packages/mcp/package.json.

CREDENTIALS
Read from env: GSC_CLIENT_ID, GSC_CLIENT_SECRET, GSC_REFRESH_TOKEN, GSC_SITE_URL.
If any are missing, the tool must return a clear message explaining which env
vars are needed and how to obtain them — never throw, never return a bare error.

TOOL 1 — seo_find_opportunities
  description: "Find pages with the best improvement potential using real
  Google Search Console data. Returns striking-distance pages (position 5-20)
  and low-CTR pages, ranked by impressions."
  inputSchema:
    days: z.number().default(28)
    limit: z.number().default(20)
  Fetch page-dimension rows for the window, run findOpportunities, and format a
  table: page, position, impressions, clicks, CTR, opportunity type, reason.

TOOL 2 — seo_page_performance
  description: "Get real Search Console performance for one page: impressions,
  clicks, CTR, average position, and the top queries it ranks for."
  inputSchema:
    page: z.string().describe("Full URL")
    days: z.number().default(28)
  Show page totals plus its top 10 queries with position and clicks.

CONSTRAINTS
- Do not modify any existing tool.
- Wrap all network calls in try/catch and return a helpful message on failure,
  following the networkError pattern used in critic-mcp/src/index.ts.
```

**Verify:**
```bash
pnpm build
cd packages/mcp && printf '%s\n' \
'{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"t","version":"1"}}}' \
'{"jsonrpc":"2.0","method":"notifications/initialized"}' \
'{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' \
| node dist/index.js
```
Expect **9 tools** listed.

---

# Prompt 3 — Site crawler

**Note:** we write this one rather than wrapping an OSS crawler, because we need it in-process to feed `SiteContext` to existing site-level rules. It's ~150 lines using mature libraries — not a from-scratch crawler.

```
Add a polite site crawler to @seokit/core that produces the SiteContext type
already defined in packages/core/src/types.ts.

CONTEXT
- Read AGENTS.md.
- SiteContext already exists. Do not change its shape.
- Site-level rules already exist in rules/ai-access.ts and expect it.

CREATE
packages/core/src/crawler/crawl.ts
packages/core/src/crawler/crawl.test.ts

DEPENDENCIES
Add to packages/core/package.json: p-queue, robots-parser

FUNCTION
  crawlSite(startUrl: string, opts): Promise<SiteContext>
  opts: {
    maxPages?: number;      // default 100 — HARD cap, never exceed
    concurrency?: number;   // default 3
    delayMs?: number;       // default 200 between requests
    respectRobots?: boolean;// default true
    render?: boolean;       // default false
  }

BEHAVIOUR
- BFS from startUrl. Same origin only — never follow external links.
- Fetch and parse /robots.txt first. When respectRobots is true, skip
  disallowed paths. This is non-negotiable politeness.
- Fetch /sitemap.xml, parse <loc> entries, seed the queue with them.
- Use p-queue for concurrency plus the delay. Do not hammer a server.
- Skip non-HTML by content-type, and skip URL fragments.
- Normalise URLs: strip #fragments, strip trailing slash except root, and
  dedupe so the same page is never fetched twice.
- Build linkGraph as Map<url, string[]> of internal outbound links.
- On a failed fetch, record the page with its status and continue. One 500
  must never abort the crawl.

CONSTRAINTS
- Reuse fetchPage from crawler/fetch.ts. Do not write a second fetcher.
- Explicit .js extensions on relative imports.
- maxPages is a hard stop, checked before every enqueue.

TESTS (no real network — mock fetch)
- respects maxPages exactly
- does not follow external-origin links
- deduplicates URLs differing only by trailing slash or fragment
- continues after a 500 response
- skips robots.txt-disallowed paths when respectRobots is true
- builds linkGraph correctly for a 3-page fixture site
```

**Verify:**
```bash
pnpm --filter @seokit/core typecheck && pnpm --filter @seokit/core test
```

---

# Prompt 4 — `seo_crawl_site` tool

```
Add a seo_crawl_site tool to packages/mcp/src/index.ts using crawlSite from
@seokit/core.

CONTEXT
- Read AGENTS.md. Match the existing tool patterns in the file.

TOOL — seo_crawl_site
  description: "Crawl a site and run all page-level and site-level SEO rules.
  Returns findings grouped by rule with affected URL counts, plus site-wide
  issues like blocked AI crawlers."
  inputSchema:
    url: z.string().url()
    maxPages: z.number().default(50)
    render: z.boolean().default(false)

OUTPUT — this matters. Do NOT dump every finding for every page.
  1. Summary: pages crawled, total findings, errors/warnings/infos
  2. Findings GROUPED BY RULE, sorted by affected-page count descending:
       [ERROR] html/missing-h1 — 23 pages affected
         FIX: <the rule's fix text, once>
         Examples: /a, /b, /c  (first 3 URLs only)
  3. Site-level findings in full — there are few, and each matters
  4. A "worst pages" list: the 5 URLs with the most errors

RATIONALE
A 50-page crawl can produce 400 findings. An agent given 400 lines will lose
the signal. Grouping by rule turns it into ~15 actionable items.
```

**Verify:** rebuild, list tools, expect **10 tools**.

---

# Prompt 5 — `seo_init` project scaffolding

**This is the one that delivers "SEO from the start."**

```
Add framework detection and project scaffolding to @seokit/core, then expose it
as seo_init in the builder MCP.

CONTEXT
- Read AGENTS.md.
- The Framework type already exists in packages/core/src/types.ts.

CREATE
packages/core/src/frameworks/detect.ts
packages/core/src/generators/scaffold.ts
packages/core/src/frameworks/detect.test.ts

DETECTION (detect.ts)
  detectFramework(root: string): Framework
  Read package.json dependencies and check for marker files:
    next        -> "next" dep, or next.config.{js,ts,mjs}
    nuxt        -> "nuxt" dep
    astro       -> "astro" dep
    sveltekit   -> "@sveltejs/kit" dep
    remix       -> "@remix-run/react" dep
    static      -> an index.html at root with no framework dep
    unknown     -> none of the above
  Return 'unknown' rather than guessing. Never throw on a missing package.json.

SCAFFOLDING (scaffold.ts)
  scaffoldFor(framework, opts): { path: string; content: string }[]
  opts: { siteUrl: string; siteName: string }

  Return file contents — do NOT write to disk. The MCP layer decides that.

  For 'next' (App Router):
    app/sitemap.ts        MetadataRoute.Sitemap
    app/robots.ts         MetadataRoute.Robots — MUST explicitly allow
                          GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot,
                          PerplexityBot and Google-Extended
    components/JsonLd.tsx  typed JSON-LD component
    lib/seo.ts            metadata helper with title/description/canonical/OG

  For other frameworks: emit static public/robots.txt and public/sitemap.xml
  with the same AI-crawler allowances.

  ALWAYS emit SEO.md containing the project's SEO rules. Copy the GUIDELINES
  constant from packages/mcp/src/index.ts as the base and append the detected
  framework's specific guidance.

MCP TOOL — seo_init
  inputSchema:
    root: z.string()
    siteUrl: z.string().url()
    siteName: z.string()
    write: z.boolean().default(false)
  With write=false, preview what would be created.
  With write=true, write the files but NEVER overwrite an existing file —
  report skipped files instead.
  Always append a pointer to SEO.md into AGENTS.md and .cursorrules if present,
  so future agent sessions load the rules automatically.

TESTS
- detects next from a dependency
- detects next from next.config.mjs with no dependency
- returns 'unknown' for an empty directory
- does not throw on a missing package.json
- scaffoldFor('next') includes app/sitemap.ts and app/robots.ts
- generated robots content mentions every required AI crawler
```

**Verify:**
```bash
pnpm --filter @seokit/core test && pnpm build
```
Then try it on a real project of yours with `write: false` first.

---

# Prompt 6 — CLI

```
Create packages/cli as @seokit/cli, a thin wrapper over @seokit/core and
@seokit/critic. No new logic — adapters only.

CONTEXT
- Read AGENTS.md. This package contains zero business logic.

DEPS: commander, picocolors

COMMANDS
  seokit audit <url> [--render]        page-level rules
  seokit crawl <url> [--max 50]        site crawl, grouped output
  seokit grade <url> [--json]          critic reward report
  seokit init [--write]                scaffolding
  seokit rules [--category <c>]        list rules

REQUIREMENTS
- Exit code 1 when any error-severity finding exists, 0 otherwise.
  This makes it usable as a CI gate with no extra wiring.
- --json on every command for machine consumption.
- Colour via picocolors, auto-disabled when not a TTY.
- bin entry "seokit" in package.json.
```

**Verify:**
```bash
pnpm build && node packages/cli/dist/index.js rules | head -20
```

---

# Prompt 7 — Knowledge base (`@seokit/memory`)

**Build this AFTER prompt 5, not before.** It only becomes valuable once you have grading history to learn from — roughly a month of real use. Built earlier, it's an empty database with no signal.

```
Create a new package `@seokit/memory` at packages/memory — a local SQLite
knowledge base for project profiles, human decisions, and fix outcomes.

CONTEXT
- Read AGENTS.md first, especially "The agent loop".
- @seokit/critic must NOT import this. The critic is stateless and independent
  by design. Memory attaches to the builder only.
- Local SQLite, no server. Do not add Postgres or any network database.

CREATE
packages/memory/package.json     deps: better-sqlite3
packages/memory/tsconfig.json    copy packages/core/tsconfig.json
packages/memory/src/schema.sql
packages/memory/src/db.ts
packages/memory/src/index.ts
packages/memory/src/db.test.ts

STORAGE
  .seokit/memory.db in the project root. Create the directory if missing.
  Add .seokit/ to .gitignore.

SCHEMA (schema.sql) — exactly these four tables

  project(id, root UNIQUE, site_url, framework, conventions TEXT, updated_at)

  decisions(id, project_id FK, rule_id NULLABLE, decision NOT NULL,
            rationale NOT NULL, created_at)

  fix_outcomes(id, project_id FK, url, rule_id NOT NULL, fix_summary NOT NULL,
               files_touched TEXT, reward_before REAL, reward_after REAL,
               predicted_gain REAL, worked INTEGER NOT NULL, created_at)

  grades(id, project_id FK, url NOT NULL, reward REAL NOT NULL,
         grade TEXT NOT NULL, confidence REAL NOT NULL, report TEXT NOT NULL,
         created_at)

  Index fix_outcomes on (project_id, rule_id) — that is the hot read path.

FUNCTIONS (db.ts)
  openDb(root: string)                     idempotent; runs schema on first open
  upsertProject(db, profile)
  getProject(db, root)
  saveDecision(db, projectId, decision)
  getDecisions(db, projectId, ruleId?)     ruleId omitted returns all
  saveOutcome(db, projectId, outcome)
  getOutcomes(db, projectId, ruleId)       most recent first, limit 10
  saveGrade(db, projectId, report)
  getGradeHistory(db, projectId, url, limit)

  getCalibration(db, projectId): CalibrationRow[]
    Per rule_id, aggregate:
      attempts, success_rate,
      avg_predicted_gain, avg_actual_gain,
      calibration_error = avg_predicted - avg_actual
    THIS IS THE POINT OF THE PACKAGE. It measures whether the critic's
    predictions are accurate on THIS project. A rule that consistently
    overpredicts has a wrong weight or gate, and this is the evidence.

CONSTRAINTS
- better-sqlite3 is synchronous — do not wrap in async.
- Prepared statements for every query. No string concatenation into SQL, ever.
- Explicit .js extensions on relative imports.
- Every exported function needs an explicit return type.

TESTS (use an in-memory or temp-file DB, never a real project)
- openDb is idempotent — calling twice does not error or duplicate schema
- upsertProject updates rather than duplicating on the same root
- getOutcomes returns most-recent-first and respects the limit
- getDecisions filters by rule_id when given, returns all when omitted
- getCalibration computes success_rate and calibration_error correctly
  from a fixture of 5 outcomes with known values
- SQL injection attempt in a decision string is stored literally, not executed
```

**Verify:**
```bash
pnpm install && pnpm --filter @seokit/memory typecheck && pnpm --filter @seokit/memory test
```

---

# Prompt 8 — Memory tools in the builder MCP

```
Add three memory tools to packages/mcp/src/index.ts using @seokit/memory.

CONTEXT
- Read AGENTS.md, especially "The agent loop".
- Add "@seokit/memory": "workspace:*" to packages/mcp/package.json.
- Do not modify any existing tool.

TOOL — memory_load
  description: "Load what this project already knows: framework profile, human
  decisions that must be respected, and whether a given fix has worked here
  before. Call this BEFORE proposing a fix."
  inputSchema:
    root: z.string()
    ruleId: z.string().optional()
  Output, in this order:
    1. Project profile (framework, site URL, conventions)
    2. DECISIONS — flag these prominently. If a decision exists for this
       ruleId, the output must say clearly: "A human already rejected this.
       Do not propose it again." with the rationale.
    3. Prior outcomes for the rule: attempts, success rate, what was changed
    4. Calibration for the rule if there are >= 3 attempts

TOOL — memory_save_outcome
  description: "Record that a fix was applied and whether it moved the critic's
  reward. Call this AFTER re-grading a page you changed."
  inputSchema:
    root, url, ruleId, fixSummary, filesTouched (string[]),
    rewardBefore, rewardAfter, predictedGain
  Compute worked = rewardAfter > rewardBefore.
  Return a short confirmation INCLUDING prediction accuracy, e.g.
  "Predicted +0.51, actual +0.48 — critic well calibrated for this rule."

TOOL — memory_save_decision
  description: "Permanently record a human decision so no future agent session
  re-suggests it. Use when the user rejects a recommendation."
  inputSchema:
    root, ruleId (optional), decision, rationale
  Rationale is REQUIRED — a decision without a reason is unreviewable later.

ALSO
  Add resource seokit://project returning the project profile and all decisions
  as markdown, so the agent loads them as context without a tool call.
```

**Verify:** rebuild, list tools, expect **14 tools**.

---

# Maintenance prompts (keep these)

**Quarterly benchmark review:**
```
Review packages/critic/src/benchmarks.ts. For each benchmark, verify the
threshold still matches what the cited authority currently publishes. Report
any that have changed, with the old value, the new value, and the source URL.
Do not change code — report only.
```

**Adding a rule:**
```
Add a rule `<namespace>/<name>` to @seokit/core that checks <X>.
Follow the pattern in packages/core/src/rules/html.ts exactly.
Read AGENTS.md first.
Include a `fix` string. Add tests for both the passing and failing case.
Add the import line to packages/core/src/index.ts.
```

**Adding a benchmark:**
```
Add a benchmark `<namespace>/<name>` to packages/critic/src/benchmarks.ts
checking <X> against <published standard>.
It MUST cite a real authority with a working URL — no invented thresholds.
Add the corresponding Check to the right function in evaluate.ts, with
`observed`, `expected` and a `fix`.
Add a test covering both pass and fail.
```

---

## Sequence and effort

| # | Prompt | Unlocks | Rough effort |
|---|---|---|---|
| 1 | GSC adapter | Real performance data | 1 session |
| 2 | GSC MCP tools | Ask "what should I fix?" in-IDE | 30 min |
| 3 | Crawler | Site-wide checks | 1 session |
| 4 | `seo_crawl_site` | Full-site audit from the IDE | 30 min |
| 5 | `seo_init` | SEO correct from commit one | 1 session |
| — | **← use it for a month here** | Generates the history memory needs | — |
| 7 | `@seokit/memory` | The loop closes; system learns | 1 session |
| 8 | Memory MCP tools | Decisions respected, calibration visible | 30 min |
| 6 | CLI | CI gating | 30 min |

**Stop after prompt 5 and actually use it for a month.** Prompts 7–8 build a knowledge base that learns from grading history — with no history, it's an empty database. Prompt 6 only matters once you have CI worth gating.

---

## If Cursor gets stuck

| Symptom | Say this |
|---|---|
| Editing unrelated files | *"Revert everything outside `packages/<x>/`. Only touch the files listed in the prompt."* |
| Import resolution errors | *"This is an ESM NodeNext project. All relative imports need explicit `.js` extensions."* |
| Tests failing after a change | Paste the full failure output verbatim. Add: *"Fix the code, not the test, unless the test asserts wrong behaviour — and say which you chose and why."* |
| Rewriting working code | *"Do not refactor existing code. Add new files only, plus the specific edits listed."* |
| Vague or partial output | *"Show the complete file contents for every file you changed."* |
