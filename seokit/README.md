# SEOKit

Build-time SEO tooling for AI-era search. **Two MCP servers: a builder and a critic.**

**Status:** builder and critic both working end to end.
Verified: **31/31 tests passing** (12 core + 19 critic), clean `tsc --strict`,
both MCP servers handshake and serve real tool calls over stdio.

```
        IDE agent
       ↙         ↘
  seokit         seokit-critic
  (builder)      (independent grader)
  own rules      external benchmarks only
       ↖         ↙
    reward + prioritised actions
```

The critic **shares no rules with the builder** — enforced by a test. If it did,
it would agree by construction and could never catch what the builder missed.

---

## Why this exists

Every existing SEO tool audits a site *after* you deploy it. This one runs *while
you write the code*, inside your IDE, through MCP.

The differentiating check: **GPTBot, ClaudeBot and PerplexityBot do not execute
JavaScript.** SEOKit fetches your page both ways and tells you exactly which
content AI search engines cannot see. Rank tracking will not tell you this.

---

## Quick start

```bash
# Requires Node 20+
npm i -g pnpm@9          # or: corepack enable
pnpm install
pnpm build
pnpm test
```

Optional — enables the JavaScript-rendering diff:

```bash
pnpm add -D playwright -w
npx playwright install chromium
```

### Wire it into Claude Code

```bash
claude mcp add seokit -- node /absolute/path/to/seokit/packages/mcp/dist/index.js
```

### Or into any MCP client (Cursor, Claude Desktop, Windsurf)

```json
{
  "mcpServers": {
    "seokit": {
      "command": "node",
      "args": ["/absolute/path/to/seokit/packages/mcp/dist/index.js"]
    }
  }
}
```

### Add the critic as a second server

```bash
claude mcp add seokit-critic -- node /absolute/path/to/seokit/packages/critic-mcp/dist/index.js
```

```json
{
  "mcpServers": {
    "seokit": {
      "command": "node",
      "args": ["/abs/path/seokit/packages/mcp/dist/index.js"]
    },
    "seokit-critic": {
      "command": "node",
      "args": ["/abs/path/seokit/packages/critic-mcp/dist/index.js"],
      "env": { "CRUX_API_KEY": "your-google-api-key" }
    }
  }
}
```

`CRUX_API_KEY` is optional but recommended — without it, performance is scored
from no data and marked `unverified` rather than guessed at. Get one from the
Google Cloud console with the Chrome UX Report API enabled.

Then just ask: *"Check this page for SEO issues"*, *"Can ChatGPT see my pricing
page?"*, or *"Grade the live site and tell me what to fix first."*

---

## Tools exposed

### Builder — `seokit`

| Tool | What it does |
|---|---|
| `seo_check_html` | Lint an HTML string. No network. Milliseconds. **Call after writing any template.** |
| `seo_audit_url` | Fetch and audit a live URL. Optional JS rendering. |
| `seo_check_ai_access` | **The differentiator.** robots.txt per bot + live fetch as each AI crawler + served-vs-rendered diff. |
| `seo_extractability` | AEO citation-readiness score with per-check breakdown. |
| `seo_generate_schema` | Emit validated JSON-LD for 10 schema.org types. |
| `seo_explain` | Rationale and docs for any rule id. |
| `seo_list_rules` | All 23 rules, filterable by category. |

Plus resource `seokit://guidelines` — the project's SEO rules, which the agent
reads as ambient context so it applies them from turn one.

### Critic — `seokit-critic`

| Tool | What it does |
|---|---|
| `critic_grade_url` | Reward 0–1, grade, per-dimension scores, triggered gates, prioritised actions |
| `critic_verify_claim` | Builder says "I fixed X" → critic independently confirms or refutes it |
| `critic_compare` | Two URLs, or before/after → reward delta with named regressions |
| `critic_benchmarks` | Every benchmark with threshold and publishing authority — auditable, not a black box |
| `critic_explain_reward` | The arithmetic: weights, gates, renormalisation, and the known gameability limits |

**Reward function**

```
reward = gate_multiplier × Σ (renormalised_weightᵢ × scoreᵢ)
```

Gates are **multiplicative, not additive** — a noindexed page scores 0 no matter
how good everything else is. An additive penalty would let a site compensate for
being unindexable by polishing schema, which is exactly the failure a critic exists
to prevent.

`expectedRewardGain` on each action is a **real counterfactual**: flip one check to
passing, recompute the whole reward, report the delta. Real output from a test run
against an SPA shell:

```
+0.511  [ai_access] Server-render the page content...
+0.016  [indexability] Add a self-referencing absolute canonical...
+0.012  [structured_data] Add Organization schema...
```

One fix dominates by 30x because it releases a multiplicative gate. That is the
report telling the builder exactly what to do first.

**Honest limitation:** four of six dimensions are computed from HTML the builder
controls, so an agent optimising for this reward can game it. CrUX field data is the
exception — measured on real users, unfakeable from markup. Treat the reward as a
floor, not a ceiling: a low score reliably means something is wrong; a high score
only means nothing *obvious* is wrong. No automated critic can judge whether content
is actually useful to a human.

---

## Architecture in one paragraph

Everything is a **rule**: a pure function from a `Context` to `Finding[]`.
Rules declare which context they need (`source` | `page` | `site`) and are
registered at import time. `runRules()` filters by context kind, applies config
severity overrides, and catches throwing rules so a bug never blocks a
developer. Adapters (MCP, CLI, CI) just call `runRules()` and format the output
differently. Adding a check means adding one file to `rules/` — the core never
changes.

**Every finding carries a `fix` string.** A finding without a fix is a complaint;
a finding with one is an instruction an agent can execute. This is the single
design choice that makes the tool useful inside an IDE.

Full rationale in `../08-seo-tool-architecture.md`.

---

## Layout

```
packages/
  core/                @seokit/core — the engine, zero I/O opinions
    src/
      types.ts         Rule, Finding, Context definitions
      engine.ts        registry + runRules()
      analyzers/       HTML extraction (cheerio)
      crawler/         fetch as any bot, optional Playwright render
      rules/
        html.ts        10 rules — title, h1, canonical, alt, lang, noindex
        ai-access.ts   3 rules — CSR/SSR diff, empty shell, blocked bots
        schema.ts      5 rules — JSON-LD validity, Organization, content parity
        aeo.ts         6 rules — answer-first, question headings, stats,
                       citations, pronoun density, chunk size
  mcp/                 @seokit/mcp — builder MCP server

  critic/              @seokit/critic — NO dependency on core (test-enforced)
    src/
      benchmarks.ts    23 benchmarks, each with threshold + publishing authority
      evidence/        independent fetcher + CrUX API client
      evaluate.ts      Evidence -> Checks against benchmarks
      reward.ts        weights, multiplicative gates, counterfactual actions
      grade.ts         end-to-end grading + report comparison
  critic-mcp/          @seokit/critic-mcp — critic MCP server
```

The duplicated fetcher in `core/crawler` and `critic/evidence` is **deliberate**.
Sharing it would couple the servers and let a bug in one silently mask itself in
the other.

## Rule categories

| Category | Count | Covers |
|---|---|---|
| `technical` | 7 | Title, h1, headings, canonical, lang, noindex |
| `schema` | 5 | JSON-LD validity, Organization, sameAs, content parity |
| `aeo` | 6 | Princeton GEO findings — statistics, citations, structure |
| `ai-access` | 3 | JS-rendering diff, SPA shells, blocked AI crawlers |
| `content` / `performance` | 2 | alt text, image dimensions (CLS) |

---

## Adding a rule

```ts
// packages/core/src/rules/my-rule.ts
import { defineRule } from '../engine.js';
import { extract } from '../analyzers/extract.js';
import type { PageContext } from '../types.js';

export const myRule = defineRule<PageContext>({
  id: 'technical/my-check',
  category: 'technical',
  severity: 'warning',
  needs: 'page',
  description: 'One line shown in tool output.',
  check(ctx) {
    const { title } = extract(ctx.rawHtml);
    if (!title?.includes('needle')) {
      return [{
        ruleId: 'technical/my-check',
        severity: 'warning',
        message: 'What is wrong.',
        fix: 'Exactly what to do about it.',   // always provide this
        location: { url: ctx.url },
      }];
    }
    return [];
  },
});
```

Then add `import './rules/my-rule.js';` to `src/index.ts`. That's the whole
extension API.

---

## Config

```ts
// seokit.config.ts
import { defineConfig } from '@seokit/core';

export default defineConfig({
  site: { url: 'https://example.com' },
  rules: {
    'html/missing-h1': 'error',
    'aeo/high-pronoun-density': 'off',
    'schema/missing-organization': 'warning',
  },
});
```

ESLint-shaped deliberately — zero learning curve.

---

## Roadmap

| Phase | Status | Scope |
|---|---|---|
| 0 — engine + rules | **done** | Types, registry, 23 rules, tests |
| 1 — builder MCP | **done** | 7 tools, guidelines resource |
| 1.5 — critic MCP | **done** | 23 benchmarks, reward function, 5 tools, 19 tests |
| 2 — crawler + CLI | next | Queue, sitemap parsing, site-wide rules, `npx seokit` |
| 3 — scaffolding | | Framework detection, `seo_init`, generators, GitHub Action |
| 4 — AEO depth | | Chunk-level scoring, freshness, entity coverage |
| 5 — dashboard | | Scheduled crawls, history, regression diffs |
| 6 — extension | | Chrome MV3 — live SERP and on-page overlay |

## Deliberately not built

Keyword volume databases, backlink indexes, and SERP scraping at scale. Those
are data problems solved by Ahrefs, Semrush and DataForSEO — buy them via API.
The moat here is the build-time layer.

## Known limitations

- `parseRobots` handles the "blocked entirely" case, not full RFC 9309 path matching
- No source-context (`needs: 'source'`) rules yet — that's Phase 3
- Core Web Vitals rules need the CrUX API wired up (Phase 2)
- MCP SDK v1; v2 (2026-07-28 spec) migration is one file when it stabilises

MIT.
