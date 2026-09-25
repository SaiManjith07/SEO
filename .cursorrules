# SEOKit — Agent Context

Read this before making any change. It is the project's constitution.
Works with Cursor, Claude Code, Windsurf, and any agent that reads `AGENTS.md`.

---

## What this project is

Two MCP servers for SEO/AEO/GEO:

- **`@seokit/mcp`** (builder) — runs SEO rules at authoring time, inside the IDE
- **`@seokit/critic-mcp`** (critic) — independently grades live URLs against published external benchmarks and emits a reward signal

Built for internal company use. **No subscriptions, no paid APIs, local-first.**

---

## Non-negotiable invariants

Breaking any of these is a bug, not a tradeoff.

1. **`@seokit/critic` must NEVER import from `@seokit/core`.**
   The critic's entire value is independent evidence. A test in
   `packages/critic/src/reward.test.ts` enforces this. Do not weaken that test.

2. **`@seokit/core` must not import from any adapter.**
   Dependency direction is one-way: adapters → core. Never the reverse.

3. **Every `Finding` and every failing `Check` must carry a `fix` string.**
   A finding without a fix is a complaint. A finding with one is an instruction
   an agent can execute. This is the whole point of the tool.

4. **Every benchmark in `packages/critic/src/benchmarks.ts` must cite a real
   published authority with a working URL.** No invented thresholds. Ever.

5. **Never fabricate a measurement.** If data is unavailable (no CrUX traffic,
   no API key), mark the dimension `verified: false` and let the weight
   redistribute. Never substitute a guess or a lab number for field data.

6. **No paid APIs, no paid data sources.** If a feature needs a subscription,
   it does not go in. Free tiers with keys (CrUX, PSI) are acceptable.

7. **No SERP scraping.** It violates Google's Terms of Service. Use Search
   Console's average position instead — it is Google's own number, free and legitimate.

---

## Stack

- TypeScript, `strict: true`, ESM (`"type": "module"`)
- Node 20+, `module`/`moduleResolution`: `NodeNext`
- pnpm workspaces
- `cheerio` for HTML parsing (not jsdom — 10x slower, unnecessary)
- `zod` for MCP input schemas
- `vitest` for tests
- `playwright` as an **optional** peer dep, lazily imported

**Import style:** ESM with explicit `.js` extensions on relative imports
(required by NodeNext), even though the source files are `.ts`.

```ts
import { extract } from '../analyzers/extract.js';  // correct
import { extract } from '../analyzers/extract';     // WRONG — will not resolve
```

---

## Layout

```
packages/
  core/         @seokit/core        rule engine, zero I/O opinions
  mcp/          @seokit/mcp         builder MCP server
  critic/       @seokit/critic      benchmark grading + reward (independent)
  critic-mcp/   @seokit/critic-mcp  critic MCP server
```

---

## Core concepts

**Rule** (`core`) — a pure function `(Context) => Finding[]`. Declares `needs:
'source' | 'page' | 'site'`. Registered at import time via `defineRule`.
Adding a check = adding one file to `rules/` + one import line in `index.ts`.
The core engine never changes.

**Benchmark** (`critic`) — a published threshold with an authority and source URL.

**Check** (`critic`) — one evaluation against one benchmark, recording what was
`observed` and what was `expected`. Falsifiable, not an opinion.

**Reward** (`critic`) —
`reward = gate_multiplier × Σ(renormalised_weightᵢ × scoreᵢ)`.
Gates are **multiplicative**, not additive: a noindexed page scores 0 regardless
of everything else. An additive penalty would let a site compensate for being
unindexable by polishing schema — the exact failure a critic exists to prevent.

**`expectedRewardGain`** — a real counterfactual. Flip one check to passing,
recompute the entire reward, report the delta. Never a heuristic estimate.

---

## Conventions

- Rule ids: `namespace/kebab-case` — `html/missing-h1`, `ai-access/blocked-ai-crawlers`
- Benchmark ids: `namespace/kebab-case` — `perf/inp`, `geo/statistics-present`
- MCP tool names: `snake_case` — `seo_check_html`, `critic_grade_url`
- A throwing rule must degrade to an `info` finding, never crash the run
- Prefer explicit types over inference on public APIs
- Comments explain **why**, not what. Skip comments that restate the code.

---

## Commands

```bash
pnpm install
pnpm build                              # all packages
pnpm test                               # all tests
pnpm --filter @seokit/core test         # one package
pnpm --filter @seokit/core typecheck
```

**Build order matters:** `core` and `critic` must build before their MCP servers.

### Verify an MCP server actually works

```bash
cd packages/mcp && printf '%s\n' \
'{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"t","version":"1"}}}' \
'{"jsonrpc":"2.0","method":"notifications/initialized"}' \
'{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' \
| node dist/index.js
```

---

## Definition of done

A change is not complete until all of these pass:

- [ ] `pnpm typecheck` clean (strict mode, zero errors)
- [ ] `pnpm test` green — **31 tests currently pass; that number must not go down**
- [ ] New behaviour has a test, including at least one failure case
- [ ] Every new failing check has an actionable `fix`
- [ ] Every new benchmark cites a real authority and a working URL
- [ ] The critic still has zero imports from core
- [ ] MCP server still handshakes if you touched it

---

## Things that have already gone wrong — don't repeat them

- **Scoring with insufficient data.** An empty page once scored 100/100 on
  extractability, because all AEO rules bail out on short content and produced no
  findings. Now `extractabilityScore` returns `null` below 200 words. When a metric
  cannot be computed honestly, return `null` — never a default that reads as success.

- **Over-broad static checks.** The critic-independence test originally matched any
  file *mentioning* `@seokit/core`, so it flagged its own doc comments. It now matches
  real import syntax and excludes test files. When writing a static check, also write
  a test proving it detects a genuine violation.

- **Bare network errors.** `fetch failed` with no context is useless to an agent.
  Network failures must explain likely causes.

---

## The agent loop — follow this protocol

Orchestration lives here as instructions, not as code. The host agent (Cursor,
Claude Code) already plans and loops — do not build a second orchestrator.

### Loop A — Authoring (runs constantly, cheap, no network)

```
1. About to write a page, route or component
2. Read seokit://guidelines and seokit://project
3. Write the code
4. Call seo_check_html on the rendered output
5. Fix every ERROR. Warnings are judgement calls.
6. Re-check. MAX 3 ROUNDS.
7. Still failing after 3? STOP and report. The diagnosis is wrong, not the fix.
```

### Loop B — Verification (after deploy)

```
1. critic_grade_url on the deployed URL
2. memory_load prior outcomes for the top failing rules
3. Take actions[0] — highest expectedRewardGain
4. Check recorded decisions. Already rejected by a human? Skip it.
5. Apply the fix as a DIFF, never a direct write
6. Human reviews and merges
7. Re-grade after deploy
8. memory_save_outcome with predicted vs actual gain
9. MAX 5 ROUNDS per session.
```

### Loop C — Opportunity (weekly)

```
1. seo_find_opportunities (real Search Console data)
2. For each striking-distance page: seo_audit_url + critic_grade_url
3. Rank by (impressions x expectedRewardGain) — value, not raw gain
4. Work the top 3. Not the top 30.
```

### Binding rules for every loop

- **Loop caps are hard.** 3 authoring, 5 verification. Then stop and report what
  was tried. An agent stuck repairing usually has the wrong diagnosis.
- **The builder never grades its own work.** Only the critic's number counts.
- **Never re-litigate a recorded decision.** Check `decisions` first.
- **Prioritise by `expectedRewardGain`, not by finding order.** One fix is often
  worth 30x the rest because it releases a multiplicative gate.

---

## Autofix safety boundary

When SEOKit gains the ability to write code (Phase 3+), this boundary is binding.

**Safe to auto-fix** — mechanical, reversible, no judgement about meaning:

- Title tags and meta descriptions (when generated from existing on-page content)
- Canonical tags
- JSON-LD structured data
- `sitemap.xml` and `robots.txt`
- Missing `alt` attributes
- Heading level order (h2 → h4 skips)
- `lang` attribute

**Never auto-fix — propose only, human decides:**

- Content strategy and keyword targeting
- Page rewrites of any size
- Redirect strategy
- Anything touching meaning, legal claims, pricing, or brand voice
- Deleting or merging pages

**Output as a diff, never a direct write.** Every fix must be reviewable before it
lands. SEO changes become reviewable code, not uncontrolled edits. When a
`write: true` mode exists, it must never overwrite an existing file — report the
skip instead.

**Loop cap.** Any repair loop stops after 5 rounds and reports what it tried. An
agent stuck in an endless fix-verify cycle burns budget and usually means the
diagnosis was wrong, not the fix.

---

## Out of scope — do not build

Keyword volume databases, backlink indexes, SERP rank tracking, competitor
intelligence. These are data-network businesses requiring licensed clickstream data
or 15 years of web-scale crawling. Use Google Search Console for first-party truth
and accept the gap.

**Compose, don't rebuild.** For commodity capability, wrap existing MIT/Apache
licensed tools (Open SEO Crawler, LibreCrawl, Lighthouse) rather than reimplementing.
Keep original code pointed at the parts nobody else covers: authoring-time checks,
AI-crawler visibility, deterministic benchmark grading.
