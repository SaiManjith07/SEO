# SEOKit — Full System Architecture

MCP servers, knowledge base, and agent loop. Synthesised from everything in this project.

---

## 1. One decision first: do not build an orchestration layer

Your research recommended three layers — IDE host, MCP servers, and a separate agent orchestration layer that plans, loops, evaluates and decides next actions.

**Skip the third layer. Cursor and Claude Code already are it.**

They plan, select tools, loop, evaluate results and decide next steps. That is what an IDE agent *is*. Building your own means:

- Maintaining a planning loop that Anthropic and Cursor improve weekly
- Losing IDE integration — your orchestrator can't see the open buffer or the diff
- Paying for LLM calls your IDE subscription already covers
- Doubling the surface area for a team of one

**The orchestration you actually need is a written protocol, not code.** It lives in `AGENTS.md`, the host agent follows it, and it costs nothing to maintain. §5 specifies it.

> **Rule:** if a capability can be expressed as an instruction to the host agent, it must not be built as code.

---

## 2. The system

```
┌──────────────────────────────────────────────────────────────┐
│  LAYER 1 — HOST                                              │
│  Cursor · Claude Code · VS Code · any MCP client             │
│  Plans, loops, decides. NOT built by you.                    │
│  Reads: AGENTS.md + SEO.md  (the protocol)                   │
└───────────┬──────────────────────────┬───────────────────────┘
            │                          │
   ┌────────▼─────────┐      ┌─────────▼──────────┐
   │  LAYER 2a        │      │  LAYER 2b          │
   │  seokit          │      │  seokit-critic     │
   │  BUILDER         │      │  GRADER            │
   │                  │      │                    │
   │  own rules       │      │  external          │
   │  source + HTML   │      │  benchmarks only   │
   │  + memory tools  │      │  STATELESS         │
   └────────┬─────────┘      └─────────┬──────────┘
            │                          │
   ┌────────▼──────────────────────────▼──────────┐
   │  LAYER 3 — PACKAGES                          │
   │                                              │
   │  @seokit/core     rule engine                │
   │  @seokit/critic   benchmarks + reward        │
   │  @seokit/data     GSC · CrUX · PSI (free)    │
   │  @seokit/memory   JSON knowledge base        │
   └──────────────────────────────────────────────┘
```

### Why memory attaches to the builder, not the critic

The critic must stay **stateless and independent**. It grades what is in front of it, with no memory of what it graded before and no knowledge of the builder's intentions. Give it memory and it starts carrying assumptions — which is exactly what its independence protects against.

The host agent holds both connections, so the loop still closes:

```
builder makes a change
  → critic grades it (stateless)
    → HOST records the outcome via builder's memory tools
      → next time, memory informs the fix
```

The critic never learns. The system does.

---

## 3. Knowledge base design

Three tiers. Only the third is interesting.

### Tier 1 — Global knowledge (ships with the tool, read-only)

Already built:

| Where | What |
|---|---|
| `core/src/rules/*` | 23 rules with fixes |
| `critic/src/benchmarks.ts` | 23 benchmarks with cited authorities |
| `mcp` resource `seokit://guidelines` | The rules an agent applies while writing |

Versioned in git, reviewed quarterly. Not a database.

### Tier 2 — Project knowledge (per repo, mostly static)

```sql
CREATE TABLE project (
  id            INTEGER PRIMARY KEY,
  root          TEXT NOT NULL UNIQUE,
  site_url      TEXT,
  framework     TEXT,        -- next | nuxt | astro | ...
  conventions   TEXT,        -- JSON: routing, component patterns, metadata approach
  updated_at    TEXT NOT NULL
);

-- Human decisions the agent must respect and never re-litigate.
CREATE TABLE decisions (
  id          INTEGER PRIMARY KEY,
  project_id  INTEGER NOT NULL REFERENCES project(id),
  rule_id     TEXT,          -- nullable: may be a general policy
  decision    TEXT NOT NULL, -- "We do not add FAQ schema to product pages"
  rationale   TEXT NOT NULL, -- "Legal requires reviewed copy on those pages"
  created_at  TEXT NOT NULL
);
```

`decisions` is the most underrated table here. Without it, every new agent session re-suggests the thing you already rejected, and you re-explain it every time. One row ends that permanently.

### Tier 3 — Outcomes (the part that makes the system learn)

```sql
-- Did a fix actually move the reward? This is the feedback loop.
CREATE TABLE fix_outcomes (
  id             INTEGER PRIMARY KEY,
  project_id     INTEGER NOT NULL REFERENCES project(id),
  url            TEXT,
  rule_id        TEXT NOT NULL,      -- or benchmark_id
  fix_summary    TEXT NOT NULL,      -- what was actually changed
  files_touched  TEXT,               -- JSON array
  reward_before  REAL,
  reward_after   REAL,
  predicted_gain REAL,               -- critic's expectedRewardGain
  worked         INTEGER NOT NULL,   -- 0/1
  created_at     TEXT NOT NULL
);

CREATE TABLE grades (
  id          INTEGER PRIMARY KEY,
  project_id  INTEGER NOT NULL REFERENCES project(id),
  url         TEXT NOT NULL,
  reward      REAL NOT NULL,
  grade       TEXT NOT NULL,
  confidence  REAL NOT NULL,
  report      TEXT NOT NULL,         -- full JSON CriticReport
  created_at  TEXT NOT NULL
);
```

**Why `predicted_gain` alongside `reward_after` is the key column.**

The critic predicts a fix is worth +0.511. You apply it. The reward moves +0.48. Store both.

Over time this gives you something no competitor has: **a calibration record for your own tool.** If predicted gains consistently overshoot for a rule, that rule's weight or gate is wrong and you can correct it with evidence. The tool audits itself.

It also answers the only question that matters: *which fixes actually worked on our sites?* Not industry benchmarks — yours.

### Storage

**JSON Files**, located in the `.seokit/` directory at the repo root, gitignored by default.

Local, zero-config, no server, simple to parse, human-readable, and git-friendly.


---

## 4. Tool surface, complete

### Builder — `seokit` (14 tools at completion)

| Tool | Phase | Purpose |
|---|---|---|
| `seo_check_html` | ✅ built | Lint HTML. No network. Milliseconds. |
| `seo_audit_url` | ✅ built | Audit a live page |
| `seo_check_ai_access` | ✅ built | Per-bot access + rendering diff |
| `seo_extractability` | ✅ built | AEO citation-readiness score |
| `seo_generate_schema` | ✅ built | Validated JSON-LD |
| `seo_explain` | ✅ built | Rule rationale |
| `seo_list_rules` | ✅ built | Rule catalogue |
| `seo_find_opportunities` | prompt 1–2 | GSC: striking-distance and low-CTR pages |
| `seo_page_performance` | prompt 2 | GSC: real data for one page |
| `seo_crawl_site` | prompt 3–4 | Site crawl, findings grouped by rule |
| `seo_init` | prompt 5 | Framework detection + scaffolding |
| `memory_load` | prompt 7 | Project profile, decisions, prior outcomes for a rule |
| `memory_save_outcome` | prompt 7 | Record a fix and whether it worked |
| `memory_save_decision` | prompt 7 | Record a human decision, permanently |

### Critic — `seokit-critic` (5 tools, stays small and stateless)

| Tool | Purpose |
|---|---|
| `critic_grade_url` | Reward, dimensions, gates, prioritised actions |
| `critic_verify_claim` | Independently confirm or refute a builder claim |
| `critic_compare` | Reward delta with named regressions |
| `critic_benchmarks` | Every benchmark with threshold and authority |
| `critic_explain_reward` | The arithmetic, and the gameability limits |

**Keep the critic at five tools.** Its authority comes from being small and auditable. Every tool added is a place assumptions can leak in.

### Resources (loaded as context, no tool call)

```
seokit://guidelines          rules to apply while writing
seokit://project             this repo's profile and decisions
seokit://rules               full rule catalogue
```

---

## 5. The agent loop — a protocol, not code

Goes in `AGENTS.md`. The host agent follows it.

### Loop A — Authoring (the common case, runs constantly)

```
1. About to write a page/route/component
2. Read seokit://guidelines and seokit://project     (context, no tool call)
3. Write the code
4. Call seo_check_html on the rendered output
5. Fix every ERROR. Warnings are judgement calls.
6. Re-check. Max 3 rounds.
7. If still failing after 3, STOP and report — the diagnosis is wrong,
   not the fix.
```

Cheap, local, no network. Should run on every page.

### Loop B — Verification (after deploy)

```
1. critic_grade_url on the deployed URL
2. memory_load for prior outcomes on the top failing rules
3. Take actions[0] — the highest expectedRewardGain
4. Check decisions: has a human already rejected this? If so, skip it.
5. Apply the fix as a DIFF, not a direct write
6. Human reviews and merges
7. After deploy: critic_grade_url again
8. memory_save_outcome with predicted vs actual gain
9. Repeat. Max 5 rounds per session.
```

### Loop C — Opportunity (weekly)

```
1. seo_find_opportunities (real GSC data)
2. For each striking-distance page: seo_audit_url + critic_grade_url
3. Rank by (impressions × expectedRewardGain) — value, not just gain
4. Work the top 3. Not the top 30.
```

Loop C is where the free-data advantage compounds: real impressions weighting real reward gains, with no subscription.

### Hard rules for every loop

- **Loop cap is binding.** 3 rounds authoring, 5 rounds verification. Then stop and report what was tried. An agent stuck repairing usually has the wrong diagnosis.
- **Output diffs, never direct writes.** SEO changes are reviewable code.
- **Never re-litigate a recorded decision.** Check `decisions` first.
- **The builder never grades itself.** Only the critic's number counts.

---

## 6. Skill packs — the expansion path

The core stays frozen. Capability grows by adding rules and benchmarks, not by changing the engine.

| Pack | Adds | Status |
|---|---|---|
| **Technical SEO** | `core/rules/html`, `schema` | ✅ built |
| **AI access** | `core/rules/ai-access` | ✅ built |
| **AEO/GEO** | `core/rules/aeo` | ✅ built |
| **Performance** | CrUX + PSI benchmarks | partial |
| **Content** | Readability, topical coverage, freshness | later |
| **Internal linking** | Orphans, depth, anchor distribution | later — needs crawler |
| **LLMO / machine readability** | Semantic HTML, entity clarity, chunk quality | mostly covered by `semantics` + `aeo` |

**On the acronyms:** do not add a module per marketing term. LLMO is machine-readability — already covered by the semantics and AEO rules. AEO and GEO share most checks. Organise by *check type*, never by acronym, or you will maintain four modules that test the same thing.

Adding a pack = new files in `rules/`, one import line. The engine never changes. That was the point of the rule-engine design.

---

## 7. Build order from here

| # | Build | Unlocks | Effort |
|---|---|---|---|
| 1–2 | GSC adapter + tools | Real data. Biggest upgrade available. | 1.5 sessions |
| 3–4 | Crawler + `seo_crawl_site` | Site-wide checks | 1.5 sessions |
| 5 | `seo_init` | SEO correct from commit one | 1 session |
| **7** | **`@seokit/memory`** | **The loop closes. System learns.** | 1 session |
| 6 | CLI | CI gating | 30 min |

**Build memory after `seo_init`, not before.** It only becomes valuable once you have enough grading history to learn from — roughly a month of real use. Building it earlier means an empty database and no signal.

---

## 8. What this is, honestly

**A free, local, authoring-time SEO system with an independent deterministic grader and a memory that records which fixes actually worked.**

Reaudit does audit → fix → PR, including AI-crawler and server-rendering checks, from €50/month. Okara and AlignAgent do variants of the same. The workflow is not novel.

**What remains genuinely yours:**

1. **Authoring-time.** Every competitor starts from a deployed URL. None sees the component you are writing.
2. **Deterministic auditable grading.** Every threshold cites a published authority. No proprietary 0–100 score.
3. **Calibration memory.** `predicted_gain` vs `reward_after` means the tool measures its own accuracy. No competitor exposes this, because a proprietary score cannot be falsified.
4. **Free, local, no third-party write access to your repos.**

Point 4 is a licensing posture, not invention — but for a company deciding whether to hand a vendor commit rights, it is the argument that actually matters.
