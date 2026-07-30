# Building SEOKit — Architecture Decision Record

**Decision date:** 27 July 2026
**Answering:** what to build, in what order, with what stack.

---

## 1. The answer, in one paragraph

**Build one framework-agnostic rule engine in TypeScript, and expose it through four thin adapters: MCP server, CLI, GitHub Action, and (later) a browser extension and dashboard. MCP is the primary surface, not an afterthought — because your actual requirement is "the IDE does SEO from the start," and MCP is the only protocol that puts tools in the agent's hands at authoring time.**

Everything else in this document is consequence.

---

## 2. The decisive reframe

You did not ask for an audit tool. You asked for something that makes SEO *happen automatically while you build*.

Those are different products:

| | **Audit tool** (what everyone builds) | **Build-time agent tooling** (what you want) |
|---|---|---|
| When it runs | After deploy | While code is being written |
| Input | A live URL | Source files, routes, components |
| Output | A PDF of problems | Correct code, generated files, blocked bad commits |
| Who acts on it | A human, later, maybe | The IDE agent, now |
| Value | Finds debt | **Prevents debt** |

Existing tools — Screaming Frog, Semrush Site Audit, Ahrefs — all live in the left column. They crawl what you already shipped. **The right column is genuinely unoccupied**, and it is where MCP has an unfair advantage.

So the product has **three modes**, and mode 2 is the differentiator:

| Mode | When | Example |
|---|---|---|
| **1. Scaffold** | `project init` | Detect Next.js → generate `sitemap.ts`, `robots.ts`, `<JsonLd>` component, metadata helpers, and write `SEO.md` rules into the repo |
| **2. Guard** ⭐ | Every page/component written | Agent calls `seo_check_source` before finishing a route. Missing `<h1>`? No metadata export? Client-only content? Fails, with the fix. |
| **3. Audit** | Pre-deploy, CI, scheduled | Crawl live URLs, render, score, diff against last run |

Mode 2 is why this is worth building. It is the only mode that requires MCP, and the only one that makes SEO free instead of a chore.

---

## 3. Stack — decided

| Layer | Choice | Why this, not the alternative |
|---|---|---|
| Language | **TypeScript, strict** | The projects you'll audit are JS/TS. Framework-aware analysis needs to parse their ASTs. The MCP SDK is TS-first. Python would force a bridge for zero gain. |
| Runtime | **Node 20+** | Playwright, cheerio, MCP SDK all first-class. |
| Monorepo | **pnpm workspaces + Turborepo** | One engine, many adapters — this is exactly the case workspaces exist for. pnpm over npm for strict peer isolation. |
| HTML parsing | **`cheerio`** | jsdom is 10x slower and you don't need a DOM, you need selectors. |
| JS rendering | **`playwright`** (optional peer dep) | Only loaded when rendering is requested. Keeps the CLI install light. |
| Source AST | **`ts-morph`** | Far better ergonomics than raw `typescript` compiler API for the codemods in Mode 1. |
| Schema validation | **`zod`** | Required by the MCP SDK anyway. Reuse for config and rule schemas. |
| MCP | **`@modelcontextprotocol/sdk`** | v1 is stable — build on it. v2 (2026-07-28 spec) is in beta and lands imminently; keep the adapter thin so migration is a single file. |
| Crawler queue | **`p-queue`** | Concurrency + rate limiting in 40 lines. Don't build this. |
| CLI | **`commander` + `picocolors`** | Boring, small, stable. |
| Testing | **`vitest`** | Fast, TS-native, same config as build. |
| Dashboard (later) | **Next.js + SQLite/Postgres via Drizzle** | Only when you need history. |

**Rejected, deliberately:**
- *Python* — wrong ecosystem for parsing the code you're targeting
- *Rust* — real performance win, 3x the build time, and crawling is I/O-bound anyway
- *Browser extension as primary* — a browser can't see your source tree, can't run in CI, can't be called by an agent. It's a fourth-priority adapter, not the core.

---

## 4. The one design decision that matters: a rule engine

Everything is a **rule**. A rule is a pure function. This is the whole architecture.

```ts
type Rule = {
  id: string;                    // 'html/missing-h1'
  category: 'technical' | 'content' | 'schema' | 'performance' | 'ai-access' | 'aeo';
  severity: 'error' | 'warning' | 'info';
  needs: 'source' | 'page' | 'site';   // which context it consumes
  docs: string;                  // link into your research pack
  check(ctx: Context): Finding[];
};

type Finding = {
  ruleId: string;
  severity: Severity;
  message: string;               // what is wrong
  fix?: string;                  // how to fix it — REQUIRED for agent usefulness
  location?: { file?: string; url?: string; line?: number; selector?: string };
  evidence?: unknown;
};
```

**Why this and nothing else:**

- **Extensibility is free.** New check = new file in `rules/`. No core changes, ever.
- **One engine, every surface.** MCP, CLI, CI and dashboard all just call `runRules()` and render `Finding[]` differently.
- **Testability.** Pure functions over fixtures. No mocking a browser to test a heading check.
- **Agent-native output.** `Finding.fix` is the field that makes this work in an IDE. A finding without a fix is a complaint; a finding with a fix is an instruction the agent can execute.
- **User rules.** Load `seokit.config.ts` → drop in project-specific rules with zero plugin API.

### Three context types

```ts
// Mode 1 & 2 — build time, no network, no browser
type SourceContext = {
  root: string;
  framework: 'next' | 'nuxt' | 'astro' | 'sveltekit' | 'remix' | 'static' | 'unknown';
  routes: RouteInfo[];
  file?: { path: string; content: string; ast?: SourceFile };
};

// Mode 3 — one live page
type PageContext = {
  url: string;
  status: number;
  headers: Record<string,string>;
  rawHtml: string;         // as served — what GPTBot sees
  renderedHtml?: string;   // post-JS — what Googlebot sees
  timings?: { ttfb: number; lcp?: number; cls?: number; inp?: number };
};

// Mode 3 — whole crawl
type SiteContext = {
  pages: PageContext[];
  robotsTxt: string | null;
  sitemapUrls: string[];
  linkGraph: Map<string, string[]>;
};
```

**`rawHtml` vs `renderedHtml` as separate fields is not incidental — it's the product's sharpest check.** Diff them, and you can tell a user exactly which content is invisible to ChatGPT, Claude and Perplexity (none of which execute JavaScript). No mainstream tool surfaces this well. Ship it in v0.1.

---

## 5. Monorepo layout

```
seokit/
├─ packages/
│  ├─ core/                    @seokit/core — the engine. Zero I/O opinions.
│  │  ├─ src/
│  │  │  ├─ types.ts
│  │  │  ├─ engine.ts          runRules(), rule registry
│  │  │  ├─ rules/
│  │  │  │  ├─ html/           h1, title, meta, canonical, alt, semantics
│  │  │  │  ├─ schema/         JSON-LD presence, validity, content parity
│  │  │  │  ├─ ai-access/      robots.txt bots, SSR-vs-CSR diff, 403 checks
│  │  │  │  ├─ aeo/            chunking, answer-first, pronoun density, freshness
│  │  │  │  ├─ perf/           CWV thresholds, render-blocking, image sizing
│  │  │  │  └─ site/           orphans, depth, redirect chains, cannibalisation
│  │  │  ├─ analyzers/         extract.ts, chunk.ts, schema.ts, readability.ts
│  │  │  ├─ crawler/           fetch.ts, render.ts, queue.ts, robots.ts
│  │  │  ├─ generators/        sitemap.ts, robots.ts, jsonld.ts, metadata.ts
│  │  │  └─ frameworks/        detect.ts, next.ts, nuxt.ts, astro.ts
│  │  └─ package.json
│  │
│  ├─ mcp/                     @seokit/mcp — PRIMARY adapter
│  ├─ cli/                     @seokit/cli — npx seokit
│  └─ action/                  @seokit/action — GitHub Action
│
├─ apps/
│  ├─ dashboard/               Next.js — Phase 4
│  └─ extension/               Chrome MV3 — Phase 5
│
├─ fixtures/                   HTML + repo fixtures for tests
├─ pnpm-workspace.yaml
└─ turbo.json
```

**Dependency rule, enforced:** `core` imports nothing from adapters. Adapters import only `core`. Break this and the whole design collapses into a monolith.

---

## 6. MCP tool surface — the exact list

Keep it small. Agents choose badly among 30 tools. **Ten tools, each with an obvious trigger.**

| Tool | Signature (in → out) | When the agent calls it |
|---|---|---|
| `seo_init` | `{ root, framework? }` → files written + `SEO.md` | Project start. Detects framework, scaffolds sitemap/robots/schema, writes rules into the repo. |
| `seo_check_source` ⭐ | `{ path }` → `Finding[]` | **After writing any page/route/component.** The guard. |
| `seo_scaffold` | `{ kind: 'sitemap'\|'robots'\|'jsonld'\|'metadata', ... }` → code | When a missing artifact is detected. |
| `seo_generate_schema` | `{ type, data }` → JSON-LD + validation | Adding structured data. |
| `seo_audit_url` | `{ url, render? }` → `Finding[]` + scores | Checking a live page. |
| `seo_crawl_site` | `{ url, maxPages, render? }` → site report | Full audit. |
| `seo_check_ai_access` ⭐ | `{ url }` → per-bot access matrix + CSR/SSR diff | **The differentiator.** Fetches as GPTBot/ClaudeBot/PerplexityBot, diffs raw vs rendered HTML. |
| `seo_extractability` | `{ url \| html }` → AEO score + chunk breakdown | Before publishing content. |
| `seo_diff` | `{ baseline, current }` → regressions | CI, pre-deploy. |
| `seo_explain` | `{ ruleId }` → rationale + docs link | When the agent needs to justify a fix to you. |

### Also expose as MCP **resources** (not tools)

```
seokit://rules              full rule catalogue
seokit://guidelines/{topic} the research pack in files 01–07
seokit://config             resolved project config
```

Resources are read into context without a tool call. **This is how the agent knows the rules from turn one** — which is precisely your "from starting onwards" requirement.

### And one MCP **prompt**

```
/seo-review   → structured review of the current diff against all source rules
```

---

## 7. How "SEO from the start" actually works

The mechanism, concretely:

1. **`seo_init` writes `SEO.md` into the repo root**, and appends a pointer to `CLAUDE.md` / `.cursorrules` / `AGENTS.md`.
   → Every future agent session reads the project's SEO constraints as ambient context. No prompting required.

2. **`seokit://guidelines/*` resources** expose the rule rationale on demand.
   → The agent can explain *why*, not just *what*.

3. **`seo_check_source` is cheap and local** — no network, milliseconds.
   → Safe for the agent to call after every file write. Put that instruction in `SEO.md`.

4. **`seo_scaffold` returns code, not advice.**
   → The agent applies it directly.

5. **The GitHub Action fails the PR** on new `error`-severity findings.
   → Backstop for when the agent isn't in the loop.

That chain is the product. Steps 1 and 3 are the ones nobody has built.

---

## 8. Build order

| Phase | Duration | Ship |
|---|---|---|
| **0** | 1 wk | Monorepo, types, `runRules()`, 10 HTML rules, vitest + fixtures |
| **1** | 1 wk | `@seokit/mcp` with `seo_check_source`, `seo_audit_url`, `seo_check_ai_access`, `seo_explain`. **Usable in Claude Code end of week 2.** |
| **2** | 1–2 wks | Crawler (queue, robots, Playwright render), `seo_crawl_site`, site-level rules, `@seokit/cli` |
| **3** | 1–2 wks | Framework detection + generators, `seo_init`, `seo_scaffold`, `SEO.md` emission, GitHub Action |
| **4** | 2–3 wks | AEO rules (chunking, answer-first, pronoun density), `seo_extractability` |
| **5** | 3–4 wks | Dashboard: scheduled crawls, history, `seo_diff` trends |
| **6** | 2–3 wks | Chrome extension — live SERP + on-page overlay only |

**Ship Phase 1 before building anything else.** A working MCP server with four tools is more useful than a perfect engine with no adapter. You'll learn more from one week of real use than a month of design.

---

## 9. What to deliberately *not* build

| Skip | Why | Use instead |
|---|---|---|
| Keyword volume database | Requires licensed clickstream data. Costs millions. Non-starter. | Google Keyword Planner / Search Console APIs |
| Backlink index | Requires a web-scale crawl. Ahrefs spent 15 years on it. | Ahrefs/Semrush API |
| Rank tracking at scale | SERP scraping is an arms race and legally grey | DataForSEO / SerpApi |
| Your own crawler primitives | Solved | `p-queue`, `robots-parser`, `playwright` |
| Custom CWV measurement | Lab data is misleading anyway | CrUX API + PageSpeed Insights API |

**Your moat is the build-time layer, not the data layer.** Buy or skip every data problem; build only the thing that lives inside the IDE.

---

## 10. Config contract

```ts
// seokit.config.ts
import { defineConfig } from '@seokit/core';

export default defineConfig({
  site: { url: 'https://example.com', name: 'Example' },
  framework: 'next',            // or 'auto'
  rules: {
    'html/missing-h1': 'error',
    'aeo/pronoun-density': 'warn',
    'perf/lcp': ['error', { threshold: 2500 }],
    'schema/organization': 'error',
  },
  ignore: ['/admin/**', '/api/**'],
  aiCrawlers: ['GPTBot', 'OAI-SearchBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended'],
  extends: ['@seokit/preset-recommended'],
});
```

ESLint-shaped on purpose. Every web developer already knows this contract — zero learning curve, and presets become the distribution mechanism.

---

## 11. Distribution

- `npm publish` under an `@seokit` scope
- **List the MCP server in the MCP registry** — this is your primary discovery channel
- `npx seokit init` as the entry point in the README
- GitHub Action in the Marketplace
- Open-source the core (MIT); if you monetise later, do it on the hosted dashboard, not the engine

---

## 12. Answering your question directly

> *"Is there in a MCP manner or is there any other things?"*

**Yes — MCP, and it should be the core, not an add-on.** MCP is the only one of your four surfaces that can act *while you build*. The CLI and Action are the same engine with different entry points, so they're nearly free once core exists. The browser extension is genuinely useful but genuinely last — it can't see your source tree, can't run in CI, and can't be called by an agent.

**One engine. Four adapters. MCP first.**

A working scaffold of Phase 0 + Phase 1 is in `seokit/` next to this file.
