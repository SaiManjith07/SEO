# MCP Server Architecture — Evaluator + Critic

**This is the canonical architecture document.** It supersedes and consolidates `08-seo-tool-architecture.md`, `09-critic-architecture.md`, and `13-system-architecture.md` into one spec. Those three files are kept for historical rationale but this file is what engineering builds against. It is grounded in `14-standards-knowledge-base.md` — every rule and benchmark below traces to a standard ID (`STD-##`) in that file, not to an invented threshold.

---

## 1. The product, in one paragraph

An MCP server pair that makes SEO/AEO/GEO happen **while an application is being built**, not after it ships. **Evaluator** (`seokit`) runs inside the IDE agent's loop and checks source code and generated HTML against the knowledge base the moment a page is written. **Critic** (`seokit-critic`) is a second, independent server that grades the deployed result against external, published benchmarks and cannot see or trust the evaluator's own reasoning. The two never merge into one server and never share rule code — that separation is the mechanism that keeps the grading honest.

```
              IDE agent (Cursor / Claude Code / any MCP client)
             ↙ builds                              ↘ verifies
   ┌────────────────────┐              ┌─────────────────────────┐
   │  seokit             │              │  seokit-critic          │
   │  EVALUATOR          │              │  CRITIC                 │
   │                     │              │                         │
   │  reads: source +    │              │  reads: what a crawler  │
   │  generated HTML     │              │  gets over the wire +   │
   │  own rules, from    │              │  third-party field data │
   │  the knowledge base │              │  (CrUX), from the same  │
   │                     │              │  knowledge base         │
   └──────────┬──────────┘              └────────────┬────────────┘
              │                                      │
              └──────────── reward + prioritised ─────┘
                            actions, fed back to
                            the agent's next move
```

---

## 2. Why two servers, not one

| | Two MCP servers | One server, two tools |
|---|---|---|
| Independence | Enforced by package boundary + a test that fails the build if `critic` imports `core` | Convention only — erodes on the first refactor |
| Failure isolation | Critic down ≠ evaluator down | Shared crash surface |
| Distribution | Critic works standalone against any site, including ones the evaluator never touched | Coupled |
| Honest grading | Cannot import the evaluator's assumptions — must re-derive everything from the wire | Nothing stops it |

If the critic shared rules with the evaluator, it would agree with the evaluator 100% of the time by construction and could never catch what the evaluator missed. That is not critique, it is a rubber stamp. This is the single design decision the rest of the document protects.

---

## 3. The knowledge base — three tiers

The knowledge base is not a single artifact; it is three tiers with different volatility and different owners.

### Tier 1 — Global standards (ships with the tool, read-only, versioned in git)

This is `14-standards-knowledge-base.md` in structured form: every `STD-##` becomes one rule (evaluator) or one benchmark (critic), each carrying its threshold, source citation, and gate/weight. Reviewed quarterly as research changes (e.g., a future core update, a revised CWV threshold). Exposed to the agent as an MCP **resource**, not a tool call, so it is read into context automatically:

```
seokit://guidelines        the rule catalogue an agent applies while writing
seokit://standards/{id}    a single STD-## entry: threshold, source, fix
```

### Tier 2 — Project knowledge (per repo, mostly static)

Human decisions the agent must respect and never re-litigate, plus the project's actual conventions (framework, routing, metadata approach). Stored locally (SQLite, `.seokit/memory.db`, gitignored):

```sql
CREATE TABLE project (
  id INTEGER PRIMARY KEY, root TEXT UNIQUE, site_url TEXT,
  framework TEXT, conventions TEXT, updated_at TEXT
);

CREATE TABLE decisions (
  id INTEGER PRIMARY KEY, project_id INTEGER REFERENCES project(id),
  rule_id TEXT, decision TEXT NOT NULL, rationale TEXT NOT NULL, created_at TEXT
);
```

`decisions` is the highest-value table here: "we do not add FAQ schema to product pages — legal requires reviewed copy" recorded once means no future agent session re-suggests the thing that was already rejected.

### Tier 3 — Outcomes (the tier that makes the system learn)

Every fix the critic predicted a reward gain for, and what actually happened when it shipped:

```sql
CREATE TABLE fix_outcomes (
  id INTEGER PRIMARY KEY, project_id INTEGER REFERENCES project(id),
  url TEXT, rule_id TEXT NOT NULL, fix_summary TEXT NOT NULL,
  reward_before REAL, reward_after REAL, predicted_gain REAL,
  worked INTEGER NOT NULL, created_at TEXT
);

CREATE TABLE grades (
  id INTEGER PRIMARY KEY, project_id INTEGER REFERENCES project(id),
  url TEXT, reward REAL, grade TEXT, confidence REAL, report TEXT, created_at TEXT
);
```

Storing `predicted_gain` next to `reward_after` gives a **calibration record**: if a standard's predicted gain consistently overshoots actual, that standard's weight or gate is wrong and can be corrected with evidence — the tool audits its own accuracy against real outcomes, not industry benchmarks.

**Why memory attaches to the evaluator, not the critic:** the critic must stay stateless and independent. It grades what is in front of it, with no memory of what it graded before. The host IDE agent holds both connections and closes the loop itself: evaluator makes a change → critic grades it (stateless) → the agent records the outcome via the evaluator's memory tools → next time, memory informs the fix. The critic never learns; the system does.

---

## 4. Evaluator — `seokit`

### 4.1 Three modes

| Mode | When | What it does |
|---|---|---|
| **Scaffold** | Project init | Detect framework → generate sitemap/robots/schema component/metadata helpers; write the knowledge base's rules into the repo as ambient context |
| **Guard** ⭐ | Every page/route/component written | Check source + rendered HTML against Tier-1 standards before the agent finishes a route. This is the differentiator — it is the only mode that requires MCP rather than a CI job |
| **Audit** | Pre-deploy / CI / scheduled | Fetch and check a live URL or full site |

### 4.2 Context types

```ts
type SourceContext = {           // Guard/Scaffold — build time, no network
  root: string;
  framework: 'next' | 'nuxt' | 'astro' | 'sveltekit' | 'remix' | 'static' | 'unknown';
  routes: RouteInfo[];
  file?: { path: string; content: string; ast?: SourceFile };
};

type PageContext = {             // Audit — one live page
  url: string; status: number; headers: Record<string,string>;
  rawHtml: string;               // what GPTBot/ClaudeBot see (STD-06)
  renderedHtml?: string;         // what Googlebot sees post-JS
  timings?: { ttfb: number; lcp?: number; cls?: number; inp?: number };
};

type SiteContext = {             // Audit — whole crawl
  pages: PageContext[]; robotsTxt: string | null;
  sitemapUrls: string[]; linkGraph: Map<string, string[]>;
};
```

`rawHtml` vs. `renderedHtml` as separate fields is the sharpest single check in the system — it directly implements STD-06 and is not offered well by any mainstream SEO tool.

### 4.3 Rule shape

Every check is a pure function traceable to a knowledge-base standard:

```ts
type Rule = {
  id: string;                          // e.g. 'ai-access/spa-shell' → STD-06
  standardId: string;                  // 'STD-06' — link into 14-standards-knowledge-base.md
  category: 'technical' | 'content' | 'schema' | 'performance' | 'ai-access' | 'aeo';
  severity: 'error' | 'warning' | 'info';
  needs: 'source' | 'page' | 'site';
  check(ctx: Context): Finding[];
};

type Finding = {
  ruleId: string; severity: Severity; message: string;
  fix: string;                         // REQUIRED — a finding without a fix is a complaint
  location?: { file?: string; url?: string; line?: number; selector?: string };
};
```

**`fix` is mandatory, not optional.** A finding with a fix is an instruction the IDE agent can execute directly; a finding without one is just a complaint that gets ignored.

### 4.4 Tool surface

| Tool | Signature | Standards checked | Trigger |
|---|---|---|---|
| `seo_init` | `{root, framework?}` → scaffolded files | STD-01, 05, 09, 10 | Project start |
| `seo_check_source` ⭐ | `{path}` → `Finding[]` | STD-17–19 (semantic HTML), source-level schema | After writing any page/route/component |
| `seo_check_html` | `{html}` → `Finding[]`, no network | STD-09–12, 17–19 | Lint a template, milliseconds |
| `seo_scaffold` | `{kind, ...}` → code | — | Missing sitemap/robots/schema detected |
| `seo_generate_schema` | `{type, data}` → JSON-LD + validation | STD-09–12 | Adding structured data |
| `seo_audit_url` | `{url, render?}` → `Finding[]` + scores | Full Tier-1 sweep | Checking a live page |
| `seo_check_ai_access` ⭐ | `{url}` → per-bot matrix + raw/rendered diff | STD-01, 02, 06, 07 | The differentiator — always run before calling a page done |
| `seo_extractability` | `{url\|html}` → AEO score | STD-20–25 | Before publishing content |
| `seo_crawl_site` | `{url, maxPages, render?}` → site report | Site-wide STD checks | Full audit |
| `seo_explain` | `{ruleId}` → rationale + `STD-##` citation | — | Agent needs to justify a fix |
| `seo_list_rules` | `{category?}` → rule catalogue | — | Discovery |
| `memory_load` | `{project_id, key?}` → Tier 2/3 entries | — | Start of a task |
| `memory_save_outcome` | `{...}` → outcome id | — | After a fix ships |
| `memory_save_decision` | `{...}` → decision id | — | A human overrules a suggestion |

Resources (read as ambient context, no tool call): `seokit://guidelines`, `seokit://standards/{id}`, `seokit://project`, `seokit://rules`.

---

## 5. Critic — `seokit-critic`

### 5.1 The rule that makes it real

**The critic imports zero rules from the evaluator.** Enforced three ways: (1) no package dependency — a test asserts `@seokit/critic` has zero import from `@seokit/core`; (2) different evidence — evaluator reasons from source and generated HTML, critic reasons from what a crawler actually receives over the wire plus third-party field data (CrUX); (3) different question — evaluator asks "does this follow the standard?", critic asks "does this meet the published external benchmark, independently re-measured?"

### 5.2 Benchmarks trace to the knowledge base

Every benchmark the critic scores against is one `STD-##` entry from `14-standards-knowledge-base.md`, carrying the same threshold and authority — the critic does not invent numbers. Field data (CrUX) is scored, not lab data (Lighthouse), because CrUX is what Google actually ranks on and cannot be gamed from markup.

When no CrUX key is configured or a URL lacks sufficient real-user traffic, the dimension is marked `unverified` and its weight redistributes (§10 of the knowledge base). The reward never silently invents a number it could not measure.

### 5.3 Reward function

```
reward = gate_multiplier × Σ (renormalised_weightᵢ × scoreᵢ)      → [0, 1]
```

Dimension weights and their source standards (from knowledge-base §10):

| Dimension | Weight | Standards |
|---|---|---|
| `indexability` | 0.20 | STD-01, 04, 05 |
| `ai_access` | 0.20 | STD-01–03, 06–08 |
| `performance` | 0.20 | STD-13–16 |
| `structured_data` | 0.15 | STD-09–12 |
| `content_quality` | 0.15 | STD-20–25 |
| `semantics` | 0.10 | STD-17–19 |

**Gates are multiplicative, not additive:**

| Gate | Multiplier | Standard | Rationale |
|---|---|---|---|
| Not indexable (`noindex`, 4xx/5xx, robots-blocked) | × 0.0 | STD-04 | Nothing else can matter |
| SPA shell — raw HTML has no meaningful content | × 0.25 | STD-06 | AI engines see nothing regardless of everything else |
| Retrieval bots blocked in robots.txt | × 0.5 | STD-01 | Voluntarily removed from AI answers |
| Invalid JSON-LD | × 0.9 | STD-09 | A syntax error voids the whole block |

An additive penalty would let a site compensate for being unindexable by polishing schema — exactly the failure a critic exists to prevent. This is the same prerequisite-ladder logic as knowledge-base §0: a Level 0 failure must zero out Level 2–4 scores, not just discount them.

### 5.4 `expectedRewardGain` — the counterfactual, not an estimate

Every prioritised action reports a **real recomputation**: flip one failing check to passing, rerun the whole reward function, report the delta. This is what turns a grade into a queue the evaluator can work down in priority order, and it is the field that makes `fix_outcomes.predicted_gain` in Tier 3 memory meaningful — it is checked against reality, not asserted.

### 5.5 Tool surface

| Tool | Purpose |
|---|---|
| `critic_grade_url` | Full grade: reward, per-dimension scores, triggered gates, prioritised actions with `expectedRewardGain` |
| `critic_verify_claim` | Evaluator/agent asserts "I fixed X" → critic independently confirms or refutes against the wire |
| `critic_compare` | Two URLs, or before/after → reward delta with named regressions |
| `critic_benchmarks` | Every benchmark with threshold, source `STD-##`, and publishing authority — auditable, not a black box |
| `critic_explain_reward` | The arithmetic: weights, gates, renormalisation, gameability limits |

Kept at five tools deliberately. The critic's authority comes from being small and fully auditable — every tool added is a place an assumption could leak in.

### 5.6 Honest limitation — this is gameable, and by how much

Four of six dimensions (`indexability` gate aside) are computed from HTML the evaluator's own project controls. An agent optimizing purely for reward could insert decorative statistics to pass `content_quality`, or satisfy a heading-shape check with text that helps no reader. Defenses and their limits:

| Defense | What it catches | What it doesn't |
|---|---|---|
| CrUX field data for performance | Cannot be faked from markup — measured on real users | Requires traffic; unavailable for new pages |
| Multiplicative gates on wire-level facts | Indexability, bot-fetch results are observed facts, not authored content | Only covers the four gated checks, not dimension scores |
| Content-parity checks (STD-12) | Invisible schema markup | Vacuous but visible text |

**Treat the reward as a floor, not a ceiling.** A low reward reliably means something is wrong. A high reward means nothing *obvious* is wrong — it does not mean the content is good. No automated critic can judge whether content is actually useful to a human, and this system must never be put in a loop that optimizes the reward without a human reading the output. That failure mode — technically-perfect, homogenized, worthless content — is exactly what Google's scaled-content-abuse enforcement (`01-SEO-fundamentals-2026.md` §3) now targets.

---

## 6. The agent loop — a protocol, not code

**Decision: do not build a third orchestration layer.** The IDE host (Cursor, Claude Code, any MCP client) already plans, selects tools, loops, and evaluates — that is what an IDE agent is. Building a separate orchestrator means maintaining a planning loop the IDE vendor already improves continuously, losing visibility into the open buffer/diff, and duplicating LLM spend the IDE subscription already covers. The orchestration that's actually needed is a **written protocol** the host agent follows, not a service — it lives in `AGENTS.md` / `.cursorrules` and costs nothing to maintain.

> **Rule:** if a capability can be expressed as an instruction to the host agent, it must not be built as code.

### Loop A — Authoring (runs constantly, cheap, local, no network)

```
1. About to write a page/route/component
2. Read seokit://guidelines + seokit://project (ambient context, no tool call)
3. Write the code
4. Call seo_check_source / seo_check_html on the output
5. Fix every ERROR; warnings are judgement calls
6. Re-check. Max 3 rounds.
7. Still failing after 3 → STOP and report. The diagnosis is wrong, not the fix.
```

### Loop B — Verification (after deploy)

```
1. critic_grade_url on the deployed URL
2. memory_load — prior outcomes on the top failing standards
3. Take actions[0] — highest expectedRewardGain
4. Check decisions — has a human already rejected this fix? Skip if so.
5. Apply the fix as a DIFF, never a direct write
6. Human reviews and merges
7. After deploy: critic_grade_url again
8. memory_save_outcome — predicted vs. actual gain
9. Repeat. Max 5 rounds per session.
```

### Loop C — Opportunity (weekly, needs external data)

```
1. seo_find_opportunities (Search Console: striking-distance + low-CTR pages)
2. For each candidate: seo_audit_url + critic_grade_url
3. Rank by (impressions × expectedRewardGain) — value, not just gain
4. Work the top 3, not the top 30
```

### Hard rules, all loops

- Loop caps are binding (3 authoring, 5 verification). A stuck loop usually means the wrong diagnosis, not a harder fix.
- Output diffs, never direct writes — every SEO change stays reviewable code.
- Never re-litigate a recorded decision — check `decisions` first, every time.
- The evaluator never grades itself. Only the critic's number counts as verification.

---

## 7. What is deliberately not built

| Skip | Why | Use instead |
|---|---|---|
| Keyword volume database | Requires licensed clickstream data at a cost that isn't recoverable for a build-time tool | Google Keyword Planner / Search Console API |
| Backlink index | Requires a web-scale crawl (Ahrefs spent 15 years on it) | Ahrefs/Semrush API |
| Rank tracking at scale | SERP scraping is an arms race, legally grey | DataForSEO / SerpApi |
| Custom CWV measurement | Lab data is misleading; the standard (STD-13–16) explicitly requires field data | CrUX API + PageSpeed Insights API |
| A generic coding-agent layer (file ops, git, generic test/lint/build tools) | Out of scope for this product — Cursor/Claude Code/any MCP host already provides this; duplicating it adds a second orchestration surface with no SEO-specific value | Let the IDE host's own tools handle generic code operations; this system only adds SEO/AEO/GEO-specific tools |

The moat is the build-time, standards-grounded, dual-server layer — not a generic dev-tool platform with SEO bolted on as one category among many.

---

## 8. Build status and order

| Phase | Status | Scope |
|---|---|---|
| 0 — engine + rules | Built | Types, registry, 23 rules mapped to `STD-##`, tests |
| 1 — evaluator MCP | Built | 7 tools, guidelines resource |
| 1.5 — critic MCP | Built | 23 benchmarks, reward function, 5 tools |
| 2 — crawler + CLI + GSC adapter | Next | Site-wide rules, `seo_find_opportunities`, `npx seokit` |
| 3 — scaffolding + memory | | Framework detection, `seo_init`, Tier 2/3 memory (SQLite), GitHub Action |
| 4 — AEO depth | | Chunk-level scoring, entity coverage |
| 5 — dashboard | | Scheduled crawls, history, regression diffs |

**Do not build memory (Tier 3) before `seo_init` exists.** It only becomes valuable with roughly a month of real grading history to learn from; built earlier, it's an empty database with no signal.

---

## 9. Why this is defensible, honestly

Reaudit and similar tools already do audit → fix → PR workflows, including AI-crawler and rendering checks, from low monthly fees. The workflow itself is not novel. What is defensible:

1. **Authoring-time, not post-deploy.** Every competitor starts from a live URL; this system sees the component being written.
2. **Deterministic, auditable grading.** Every threshold cites a published authority (`STD-##` → source). No proprietary 0–100 score with hidden weights.
3. **Calibration memory.** `predicted_gain` vs. `reward_after` means the tool measures its own accuracy against its own sites' real outcomes — not industry benchmarks it cannot verify.
4. **No third-party write access to the repo.** A licensing/trust posture, not a technical moat, but the argument that matters to a team deciding whether to grant a vendor commit rights.
