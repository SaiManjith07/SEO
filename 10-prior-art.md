# Prior Art — Has Anyone Built This?

**Short answer, revised twice: yes, substantially. The remaining gap is narrower than I first claimed.**

Researched 27 July 2026. **Two corrections recorded below — read §0 first.**

---

## 0. Corrections log

Keeping these visible rather than quietly editing, so the reasoning trail stays honest.

| # | What I claimed | What's actually true | Impact |
|---|---|---|---|
| 1 | "ESLint for SEO was requested but nobody shipped it" | 7+ VS Code SEO extensions exist, including one published as `ai-seo-linter` | Guard mode downgraded from *novel* to *differentiated* |
| 2 | "AI-crawler visibility diffing — not found in any tool surveyed" | **Reaudit detects robots.txt AI-crawler blocks AND server-rendering regressions, and opens GitHub PRs to fix them** | **The moat is much narrower than I said.** See §2b. |

Correction 2 is the significant one. I was wrong because I searched for "SEO MCP servers" and "IDE SEO tools" but not for "SEO GitHub PR automation" — which is where this category actually lives. You found it; I didn't.

---

## 1. SEO MCP servers already exist — and the category is crowded

As of mid-2026 the SEO vertical is reportedly **the most commercially mature in the entire MCP ecosystem**. You are not early to "SEO + MCP."

| Server | What it does | Type |
|---|---|---|
| **Screaming Frog v24** (May 19, 2026) | **Native, official** MCP. ~29 tools. Drives a live desktop crawler on your machine — start, pause, monitor, export. | Local crawler control |
| **SE Ranking MCP** | 160+ tools. Keyword metrics, competitor gaps, project management, AI visibility, multi-client. Strongest for agencies. | Remote API |
| **Semrush MCP** | Enterprise competitive intelligence. | Remote API |
| **Ahrefs MCP** | Backlinks, keywords, rank data. | Remote API |
| **DataForSEO MCP** | Raw keyword + SERP data. | Remote API |
| **Google Search Console MCP** | Your own impressions, queries, positions. | Remote API |
| **Firecrawl MCP** | Crawl/scrape pages into agent context. | Remote API |
| **Community Screaming Frog wrappers** (`bzsasson`, `acamolese`) | CLI wrappers with a locked-down tool surface for CI and unattended agents. | Local |

**Every one of these is a data pipe.** They take an existing product's data and pipe it into an agent's context. That is genuinely useful — and it is a different job from what SEOKit does.

---

## 2. IDE SEO tooling — more crowded than I first reported

> **Correction.** An earlier draft of this file claimed "ESLint for SEO was requested but never shipped." That was wrong. A search of the VS Code marketplace turns up a working category of SEO extensions. Recording the correction rather than quietly editing it.

### VS Code extensions that already exist

| Extension | What it does |
|---|---|
| **SEOSiri Enterprise: AI Content & E-E-A-T Auditor** (`ai-seo-linter`) | E-E-A-T auditing, keyword segmentation, competitor maps, content decay |
| **MDX SEO Validator** (Rampify) | Real-time SEO validation of MDX/Markdown with live Google preview |
| **better-seo** (Jan Schulte) | Catches common SEO traps while writing blog posts |
| **Seo IntelliSense** | Snippets for SEO meta tags and JSON-LD schema |
| **SEO Checker** (Compass Solutions) | Checks HTML files against SEO best practices |
| **TechComms — SEO AI Tools** | Integrated SEO tooling inside VS Code |
| **HTML5 SEO Meta Snippets** | Automates meta tag insertion |

JetBrains coverage appears much thinner — no significant equivalents surfaced.

### Build-time / framework tooling

| Prior art | Covers | Gap |
|---|---|---|
| **`next/core-web-vitals` ESLint preset** | Blocks unoptimised images and sync scripts at lint time | Code patterns only — blind to rendered output, schema validity, crawler access |
| **Next.js 16 native MCP server** | Feeds agents build errors, route maps, runtime diagnostics | Framework diagnostics, not SEO — but confirms the *pattern*: Vercel shipped an MCP for build-time agent feedback |
| **`vercel/next.js` discussion #22058** | Long-running request for an ESLint-style SEO analyzer | Still open *in-framework*, though marketplace extensions partly fill it |

### What these extensions do and don't do

**They do:** lint markup and content in the editor, in real time, with inline feedback. That is genuinely the same *category* as SEOKit's guard mode.

**They don't:**
- Expose an **agent-callable interface** — they render squiggles for a human, not tool results for an agent. An IDE agent writing a component cannot query them.
- Fetch the **live URL as GPTBot/ClaudeBot** and diff served vs rendered HTML.
- Emit a **machine-consumable reward** or prioritised action queue.
- Grade against **external field data** like CrUX.

So the honest framing is narrower than "nobody built this": **editor-time SEO linting is an occupied category. Agent-callable SEO linting over MCP, with AI-crawler visibility checks and a deterministic reward, is not.**

---

## 2b. The closest competitor: Reaudit (verified from their own docs)

**This is the product that occupies most of the space I told you was open.**

From [docs.reaudit.io/github-integration](https://docs.reaudit.io/github-integration), verbatim — what its coding agent auto-fixes via pull request:

- Missing or incorrect page metadata (titles, meta descriptions, Open Graph)
- **"Robots.txt rules that block AI crawlers (GPTBot, ClaudeBot, PerplexityBot, etc.)"**
- Missing `llms.txt`
- Missing JSON-LD structured data
- Missing `sitemap.xml`
- Image alt attributes
- **"Server-rendering regressions that prevent indexing"**

Those two bolded items are the exact checks I described as unoccupied.

**Also shipping:** an MCP server with **192 tools**, a 0–100 score across technical SEO / on-page / AI readiness / performance / accessibility, JSON-LD auto-generation, AI visibility tracking across ChatGPT/Claude/Perplexity, and Reddit monitoring. From **€50/month**; done-for-you services from €1,499/month.

Adjacent products in the same category: **Okara** (audit findings → code → PR, including JSON-LD and `llms.txt`), **AlignAgent** (framework-aware patches with exact file locations).

### What honestly remains different

| | Reaudit | SEOKit |
|---|---|---|
| Cost | €50+/month, per-seat scaling | **Free, local** |
| When it runs | **Post-hoc** — audits a deployed site, then opens a PR | **Authoring time** — checks the file before it's committed |
| Repo access | Requires granting a **third-party GitHub App write access** to your repositories | Nothing leaves your machine |
| Scoring | Proprietary 0–100 score | **Published external benchmarks with cited authorities** |
| Prioritisation | Issue list | **Counterfactual reward gain per fix** |
| Data residency | SaaS — your site data on their servers | Local |

**Honest read:** the *capability* is largely occupied. What's left is **free, local, authoring-time, and auditable** — four adjectives, not a new feature category.

For your stated goal that's fine, because you're not selling against Reaudit. You're deciding whether to pay them €50/month plus give them write access to your company's repos. But any claim that this is a novel product should be retired.

**The strongest argument that survives:** Reaudit runs *after* you ship. SEOKit runs *while you write*. Nobody else does the second, and Reaudit structurally can't — its whole model starts from an audit of a live URL.

---

## 3. Agent critics and reward signals are an established pattern

The critic design isn't novel in the abstract — it is standard practice in agent evaluation:

- **LLM-as-judge** rubric grading, aligned to human ratings
- **Trajectory grading** — 7 deterministic metrics scoring tool selection, step efficiency, goal progress
- **RL fine-tuning loops** where an SLM judge conditioned on rubrics computes online rewards
- **MCP evaluation frameworks** (Toloka, Future AGI) scoring whether agents use returned data correctly
- **MCP-AgentBench** (arXiv:2509.09734) — benchmarking agent performance over MCP-mediated tools

**The two-server builder/critic split is also not novel as a pattern.** Multi-agent MCP architectures routinely pair a generator with a verifier — it appears in LangGraph/A2A systems, in IBM's published MCP architecture patterns, and in `design-pattern-mcp`, which supplies structural templates and *anti-pattern guards* during code generation. Production agent systems use this shape regularly.

**What's different here is the scoring path, not the topology:** those judges score *the agent's behaviour* using an LLM as the rubric. SEOKit's critic scores *the artefact* — a live URL — against **deterministic published thresholds**. No LLM anywhere in scoring, so the same page grades identically every run. That distinction is the whole value: an LLM judge is non-deterministic and can be argued with; `LCP 4100ms > 2500ms` cannot.

---

## 4. So what's actually unbuilt

| Layer | Prior art | Verdict |
|---|---|---|
| **Data access via MCP** | Saturated — 8+ servers; Reaudit alone has 192 tools | **Occupied.** Don't build. |
| **Post-hoc site auditing** | Saturated — Screaming Frog, Semrush, Ahrefs | **Occupied.** |
| **Editor-time SEO linting** | 7+ VS Code extensions | **Occupied** — human-facing, not agent-callable |
| **Builder/critic topology** | Common in multi-agent MCP systems | **Occupied as a pattern**, not applied to SEO |
| **AI-crawler + SSR checks** | **Reaudit does both, and auto-fixes via PR** | **Occupied.** ← *my error* |
| **Audit → fix → PR loop** | Reaudit, Okara, AlignAgent | **Occupied.** |
| **Authoring-time (pre-deploy) SEO for agents** | Not found — every competitor starts from a live URL | **Open** |
| **Deterministic external-benchmark grading** | LLM-judge rubrics exist; deterministic artefact grading doesn't | **Open** |
| **Free / local / no third-party repo access** | Every competitor is SaaS | **Open by choice, not by innovation** |

**What actually survives — one feature and one posture:**

1. **Authoring-time checks.** Every competitor found — Reaudit, Okara, AlignAgent, Screaming Frog, Semrush — begins with a *deployed URL*. None can look at the component you are writing right now. This is structural for them, not an oversight: their entire model is audit-then-fix. SEOKit's `seo_check_html` and `seo_check_source` run before anything is committed.

2. **Deterministic counterfactual reward.** `expectedRewardGain` recomputed by flipping one check, graded against cited external thresholds with no LLM in the scoring path. Reaudit has a 0–100 score, but it is proprietary and unauditable. Observed in testing: server-rendering scored **+0.511** while every other fix scored ~0.01, because it releases a multiplicative gate.

**Everything else is a licensing and deployment posture** — free, local, no third-party GitHub write access — not a technical differentiator. That posture is worth real money to a company, but it isn't invention.

---

## 5. Honest assessment

**Where you'd lose:** competing on data. Ahrefs' index took 15 years. SE Ranking has 160 tools. Screaming Frog's crawler is 15 years mature and now has official MCP support. Don't fight there.

**Where you'd win:** nobody is competing on the build-time layer, and the incumbents structurally can't. Screaming Frog's MCP drives a *desktop crawler* — it needs a deployed site. Semrush and Ahrefs need a *live URL with traffic history*. **None of them can look at a component you just wrote and tell you it will be invisible to ChatGPT**, because none of them see source code, and all of them arrive after the mistake is already shipped.

**The strategic read:** the incumbents' MCP servers make their existing products agent-accessible. That is a distribution move, not a product move. The product move — SEO that happens during authoring rather than auditing — is open, and the Next.js 16 MCP shipping build-time diagnostics to agents suggests the industry is heading that way anyway.

**Realistic caveat:** "unoccupied" and "valuable" aren't the same thing. It may be unoccupied partly because the audience — developers who want SEO enforced at authoring time — is smaller than the audience for keyword data. Validate with your own projects before assuming a market.

---

## Sources

- [Best SEO MCP servers worth adding to your workflow in 2026 — SE Ranking](https://seranking.com/blog/best-seo-mcps/)
- [Screaming Frog SEO Spider Update – Version 24.0](https://www.screamingfrog.co.uk/blog/seo-spider-24/)
- [Screaming Frog 24 official MCP vs custom — Claudio Novaglio](https://www.claudio-novaglio.com/en/blog/seo-ai-lab/screaming-frog-24-official-mcp-vs-custom)
- [Screaming Frog v24 MCP: The Complete Agency Guide — Rich Voller](https://richvoller.com/blog/screaming-frog-v24-mcp-agency-guide)
- [screaming-frog-mcp — bzsasson (GitHub)](https://github.com/bzsasson/screaming-frog-mcp)
- [Best MCP Server for SEO: Top Tools & Use Cases in 2026 — SEOProfy](https://seoprofy.com/blog/best-mcp-server-for-seo/)
- [Configuration: ESLint — Next.js](https://nextjs.org/docs/app/api-reference/config/eslint)
- [Guides: AI Coding Agents — Next.js](https://nextjs.org/docs/app/guides/ai-agents)
- [SEO Analyzer tool (like eslint) — vercel/next.js Discussion #22058](https://github.com/vercel/next.js/discussions/22058)
- [SEOSiri Enterprise: AI Content & E-E-A-T Auditor — VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=SEOSiri.ai-seo-linter)
- [MDX SEO Validator — VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=Rampify.mdx-seo-validator)
- [better-seo — VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=janschulte.better-seo)
- [Seo IntelliSense — VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=BilalMrn.seo-intellisense)
- [vs-code-seo — Compass Solutions (GitHub)](https://github.com/CompassSolutionsGa/vs-code-seo)
- [Model Context Protocol architecture patterns for multi-agent AI systems — IBM](https://developer.ibm.com/articles/mcp-architecture-patterns-ai-systems/)
- [mcp-agent — lastmile-ai (GitHub)](https://github.com/lastmile-ai/mcp-agent)
- [Demystifying evals for AI agents — Anthropic](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
- [MCP-AgentBench (arXiv:2509.09734)](https://arxiv.org/pdf/2509.09734)
- [The importance of MCP evaluations in agentic AI — Toloka](https://toloka.ai/blog/the-importance-of-mcp-evaluations-in-agentic-ai/)
