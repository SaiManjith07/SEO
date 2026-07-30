# SEOKit Critic — Architecture & Reward Design

**The second MCP server.** Grades a live site against published external benchmarks and emits a reward signal the builder MCP consumes.

---

## 1. The system

```
                    ┌──────────────────────────┐
                    │   IDE agent (you)        │
                    └────┬────────────────┬────┘
                         │                │
              builds     │                │  grades
                         ▼                ▼
         ┌───────────────────┐   ┌───────────────────┐
         │  seokit (builder) │   │  seokit-critic    │
         │  MCP #1           │   │  MCP #2           │
         │                   │   │                   │
         │  own rules        │   │  EXTERNAL         │
         │  source + HTML    │   │  benchmarks only  │
         └───────────────────┘   └─────────┬─────────┘
                    ▲                      │
                    │   reward + report    │
                    └──────────────────────┘
```

**The loop:** builder ships → critic measures against external ground truth → reward + prioritised actions → builder acts → repeat.

---

## 2. The rule that makes this real

> **The critic must not import a single rule from `@seokit/core`.**

If it did, it would be the same check run twice. It would agree with the builder 100% of the time by construction, and could never find anything the builder missed. That is not critique, it is a rubber stamp.

Enforced three ways:

| Mechanism | Detail |
|---|---|
| **No dependency** | `@seokit/critic` has zero dependency on `@seokit/core`. A test asserts this. |
| **Different evidence** | Builder reasons from *source code and generated HTML*. Critic reasons from *what a crawler actually receives over the wire*, plus third-party field data. |
| **Different question** | Builder asks "does this follow best practice?" Critic asks "does this meet a published, external, measurable standard?" |

---

## 3. Benchmarks — the external ground truth

Every score traces to a documented, citable threshold. No invented numbers.

| Dimension | Benchmark | Threshold | Authority |
|---|---|---|---|
| **Performance — LCP** | Core Web Vitals | < 2.5s at p75 | Google, CrUX field data |
| **Performance — INP** | Core Web Vitals | < 200ms at p75 | Google, CrUX field data |
| **Performance — CLS** | Core Web Vitals | < 0.1 at p75 | Google, CrUX field data |
| **Indexability** | Search Essentials | HTTP 200, no `noindex`, canonical resolves, not robots-blocked | Google Search Central |
| **AI access** | Crawler behaviour | Content present in raw HTML; retrieval bots not blocked | Observed; Cloudflare Radar |
| **Structured data** | schema.org + Rich Results | Valid JSON-LD, required properties present, content parity | schema.org, Google |
| **Content quality** | Princeton GEO benchmark | Statistics, citations, quotations present | arXiv:2311.09735 (peer-reviewed) |
| **Semantics** | HTML Living Standard / WCAG 2.2 AA | One h1, no skipped levels, alt text, lang | W3C |

**Field data over lab data.** Performance is scored from the **CrUX API** — real Chrome users at the 75th percentile over 28 days. That is the number Google actually ranks on. Lighthouse runs a synthetic test on one machine and routinely disagrees. Using lab data here would let the builder pass by optimising a benchmark Google does not use.

When no CrUX key is configured, or a URL has insufficient real-user traffic, performance is marked **`unverified`** and its weight is redistributed. The reward never silently invents a number it could not measure.

---

## 4. The reward function

```
reward = gate_multiplier × Σ (weightᵢ × scoreᵢ)      →  [0, 1]
```

### Dimension weights

| Dimension | Weight | Why |
|---|---|---|
| `indexability` | 0.20 | Precondition for everything |
| `ai_access` | 0.20 | Binary visibility to ChatGPT/Claude/Perplexity |
| `performance` | 0.20 | Site-wide composite since the March 2026 core update |
| `structured_data` | 0.15 | ~65% of AI-cited pages carry it |
| `content_quality` | 0.15 | The measurable GEO factors |
| `semantics` | 0.10 | Enables chunking and retrieval |

Weights renormalise over verifiable dimensions only.

### Gates — multiplicative, not additive

This is the important design choice.

| Gate | Multiplier | Rationale |
|---|---|---|
| Page not indexable (`noindex`, 4xx/5xx, robots-blocked) | **× 0.0** | Nothing else can matter. Perfect schema on a noindexed page is worth zero. |
| Raw HTML has no meaningful content (SPA shell) | **× 0.25** | AI engines see nothing. Google may eventually render; nobody else will. |
| Retrieval bots blocked in robots.txt | **× 0.5** | Voluntarily removed from AI answers. |
| Invalid JSON-LD | **× 0.9** | A syntax error voids the whole block. |

**Why multiplicative:** an additive penalty lets a site compensate for being unindexable by polishing everything else. That is exactly the failure mode a critic exists to prevent. Gates make certain failures uncompensable — which is the truth of how search works.

### Output

```jsonc
{
  "reward": 0.63,
  "grade": "C",
  "confidence": 0.8,          // drops when dimensions are unverified
  "dimensions": {
    "indexability":    { "score": 1.00, "verified": true },
    "ai_access":       { "score": 0.33, "verified": true },
    "performance":     { "score": null, "verified": false,
                         "reason": "No CrUX data — insufficient real-user traffic" },
    "structured_data": { "score": 0.60, "verified": true },
    "content_quality": { "score": 0.67, "verified": true },
    "semantics":       { "score": 0.85, "verified": true }
  },
  "gates": [
    { "id": "spa-shell", "multiplier": 0.25, "triggered": true,
      "message": "Raw HTML contains 12 words; AI crawlers see an empty page." }
  ],
  "actions": [
    { "action": "Server-render page content",
      "dimension": "ai_access",
      "expectedRewardGain": 0.41,     // counterfactual, not a guess
      "benchmark": "Retrieval bots do not execute JavaScript" }
  ]
}
```

### `expectedRewardGain` — the field that makes this a training signal

Computed as a **counterfactual**: recompute the reward with that one failing check flipped to pass, and report the delta. Not an estimate, not a heuristic — an actual recomputation.

This turns the report from a grade into a **prioritised queue**. The builder MCP sorts by `expectedRewardGain` and works down the list. That is what makes the two servers a loop rather than two tools.

---

## 5. Reward hacking — the honest caveat

**This design is gameable, and you should know exactly how.**

The builder controls the HTML. Four of six dimensions are computed *from that HTML*. So an agent optimising for reward can:

- Insert statistics that are decorative rather than informative, to pass `content_quality`
- Add schema for content that technically appears but is buried
- Hit heading and alt-text checks with text that satisfies a parser and helps no reader

**Three defences, and their limits:**

| Defence | What it does | Limit |
|---|---|---|
| **CrUX field data** for performance | Cannot be faked from HTML — it is measured on real users' devices | Requires traffic; unavailable for new pages |
| **Multiplicative gates** on observable facts | Indexability and bot-fetch results are wire-level facts, not authored content | Only covers gates, not dimension scores |
| **Content parity checks** | Schema must match visible rendered text | Catches invisible markup, not vacuous visible text |

**What this means practically:** treat the reward as a *floor*, not a ceiling. A low reward reliably means something is wrong. A high reward means nothing obvious is wrong — it does not mean the page is good. **No automated critic can assess whether content is actually useful to a human**, and any tool claiming otherwise is overselling.

Do not put this reward in a loop that optimises it without a human reading the output. That is the mechanism by which SEO tools produce homogenised, technically-perfect, worthless pages — and in 2026 that content class is specifically targeted by Google's scaled-content-abuse enforcement.

---

## 6. MCP tool surface

| Tool | Purpose |
|---|---|
| `critic_grade_url` | Full grade: reward, dimensions, gates, prioritised actions |
| `critic_verify_claim` | Builder asserts "I fixed X" → critic independently confirms or refutes |
| `critic_compare` | Two URLs (or before/after) → reward delta, regression detection |
| `critic_benchmarks` | List every benchmark with threshold and authority — auditable, not a black box |
| `critic_explain_reward` | Show the arithmetic: weights, gates, renormalisation |

`critic_verify_claim` is the adversarial one. The builder cannot mark its own homework; it states a claim and the critic tests it against the wire.

---

## 7. Package layout

```
packages/
  critic/                      @seokit/critic — NO dependency on @seokit/core
    src/
      types.ts                 Benchmark, Evidence, Dimension, Reward
      benchmarks.ts            The registry: threshold + authority + citation
      evidence/
        fetch.ts               Independent fetcher (own implementation)
        crux.ts                CrUX API — real field data
      dimensions/              One evaluator per dimension
      reward.ts                Gates, weights, renormalisation, counterfactuals
      report.ts                Machine-readable output for the builder
  critic-mcp/                  MCP server
```

Duplication between `core/crawler/fetch.ts` and `critic/evidence/fetch.ts` is **deliberate**. Sharing the fetcher would couple the two servers and let a bug in one silently mask itself in the other.

---

## 8. Why two servers rather than one tool

| | Two MCP servers | One server, two tools |
|---|---|---|
| Independence | Enforced by package boundary | Convention only — erodes on the first refactor |
| Failure isolation | Critic down ≠ builder down | Shared crash surface |
| Distribution | Critic works standalone on any site | Coupled |
| Honest grading | Cannot import builder's assumptions | Nothing stops it |

The package boundary is the mechanism that keeps the independence real over time.
