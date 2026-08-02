---
type: design-spec
status: proposed — not yet implemented
supersedes: architecture/15-mcp-evaluator-critic-architecture.md (scope), keeps its evaluator/critic split
last_updated: 2026-08-02
---

# One Focused Cursor MCP for SEO + AEO + GEO + LLMO

## The idea in one sentence

A single MCP server, installed in Cursor, that can look at the page or project a developer is actually working on and tell them — with real evidence, not a canned checklist — what's wrong for search engines, answer engines, generative engines, and LLM retrieval, then either fix it directly or hand back a fix a human approves, using Cursor's own model to do the judgment calls a rule engine can't.

Everything below is designed around that sentence. Anything that doesn't serve it got cut.

---

## The one architectural decision everything else follows from

**The MCP server should not call out to its own LLM API to do "AI diagnosis" or "AI fix generation."** This is the naive design and it's worth naming explicitly so it doesn't get built by default: SEOKit embeds an OpenAI/Anthropic key, makes its own completion calls inside a tool handler, and returns AI-generated text as a tool result. It works, but it's the wrong shape for an MCP server specifically running inside Cursor — Cursor's own agent is *already* an LLM sitting in the loop, already has the page open, already has full conversational context, and the user is already paying for those tokens. Making the MCP server independently call out to a second LLM to re-diagnose the same page is redundant cost, redundant latency, a second API key to manage and secure (this repo's track record with credential defaults is not reassuring on that front), and — worse — it produces a diagnosis with no visibility into what Cursor's own agent already knows about the surrounding code.

The right shape: **deterministic rules do what they're good at (fast, cheap, exact), and everything that needs judgment gets handed to Cursor's own model via MCP's `prompts` primitive** — a prompt template the tool returns, pre-filled with real evidence (actual HTML, actual finding data, actual standard text), that Cursor's agent then reasons over as part of the normal conversation. No second API key. No redundant call. The "AI" in "AI diagnoses," "AI generates fixes," and "AI explains findings" is Cursor's own model, fed real evidence through prompts — not a hidden second model the user never sees or approves.

One exception, worth designing for but not defaulting to: a **headless/CI mode** (no live Cursor session, e.g. a scheduled full-site audit) genuinely has no host LLM to hand off to. That path can optionally use its own configured LLM key — but it should be an explicit, separately-configured mode, not the default behavior of the interactive Cursor tools.

This single decision resolves most of the "should this be a tool or a prompt" questions below: if it's checkable without judgment, it's a tool that returns structured findings. If it needs judgment, it's a prompt that hands evidence to Cursor's model. If it writes to disk, it's a tool — but one that returns a diff for approval by default, not a silent write (see Safety, below).

---

## What "ready" means, per discipline

Grounded in the 32 standards already written into the knowledge base (`knowledge-base/standards/01` through `08`) — this design doesn't invent new coverage, it decides how the existing coverage gets exposed and where AI judgment plugs in.

**SEO** — deterministic: indexability, canonical correctness, sitemap/robots validity, structured data schema validity, Core Web Vitals thresholds, meta tag presence/length. AI judgment: does this content actually match the query intent it's targeting; is it meaningfully different from the top-ranking pages or just thin duplication.

**AEO** — deterministic: FAQ schema presence, question-formatted headings, word count floor. AI judgment: would this paragraph actually get selected as a direct answer to the query it's meant to answer; is the answer complete enough to stand alone if quoted.

**GEO** — deterministic: citation/statistic presence, Organization/Person schema, `sameAs` links, date metadata. AI judgment: would an LLM treat this page as a citable authority for this claim; is the entity (author, organization) clearly enough established for a generative engine to attribute a fact to it.

**LLMO** — deterministic: `llms.txt` presence, AI-crawler access in `robots.txt` (already covered by `ai-access.ts`), server-rendered content ratio. AI judgment: is this content structured in a way that chunks cleanly for retrieval (heading hierarchy, self-contained sections) rather than being one undifferentiated block.

---

## What to keep, cut, and fix from the current seokit

| Component | Verdict | Why |
|---|---|---|
| `core`'s rule engine, topological execution, event bus | **Keep** | Real, tested (146 tests), does genuine HTML inspection — verified directly against a deliberately broken fixture. |
| The 32 standards + knowledge base | **Keep** | This is the actual product knowledge; nothing about the MCP redesign changes what "correct" means. |
| `critic` / `critic-mcp` as a separate process | **Keep, as-is** | The core/critic independence invariant is real and enforced by a test, not aspirational. Keeping it a genuinely separate MCP server (not just a separate module) enforces the boundary at the process level, which is a stronger guarantee than a lint rule — worth the extra server. |
| `orchestrator`'s plan → code → verify → critic loop | **Trim and keep** | The multi-step agent loop is legitimate for a "fully automated fix" flow. Strip out everything in it not needed for that loop specifically. |
| `core/src/scheduler.ts` | **Cut** | Already confirmed dead code — `engine.ts` does topological sort directly; the scheduler isn't called from the real execution path. |
| `core/src/lifecycle/*` (decay/effectiveness scoring) | **Cut** | This is ranking-decay/content-freshness marketing analytics, not "is this page correct for SEO/AEO/GEO/LLMO right now." Different product. |
| `core/src/tracking/*` (moving averages, volatility) | **Cut** | Same reasoning — this is a rank-tracking dashboard feature, orthogonal to in-editor verification. |
| `core/src/outreach/*` | **Cut** | Link-building/outreach tooling has nothing to do with a Cursor MCP for code-level SEO correctness. |
| `core/src/sandbox.ts` | **Cut** | Confirmed scaffolding, never wired into the real execution path. |
| `coder-mcp` (generic `list_files`/`read_file`/`run_tests`/etc.) | **Cut, for this design specifically** | Cursor already has native file read/write/exec tools. A generic coder MCP re-implementing them adds a third server and real setup friction without any SEO-specific value. Worth keeping as a *separate*, non-Cursor-specific package if there's a future non-Cursor MCP host that lacks native file tools — but it shouldn't be part of "the Cursor MCP." |
| The file-creation gap (sitemap/robots/llms.txt never get created, only edited) | **Fix, already scoped** | See `architecture/22` — that fix is a prerequisite for this design's `apply_fix` tool to work for missing files, not optional. |
| Hardcoded `SEOKIT_SECRET` fallback | **Fix as part of this rebuild** | Low severity today (stdio-only) but shouldn't ship into a redesigned, more prominent single server without a real fix — see Safety section. |

Net effect: this cuts roughly half of what's currently in `core` and drops one of the three current MCP servers, in exchange for a single, coherent tool surface that maps directly onto "check and fix SEO/AEO/GEO/LLMO for the thing I'm looking at right now."

---

## The unified tool surface

One server. Three primitive types, used deliberately per the architectural decision above.

### Tools (deterministic actions, structured results)

| Tool | What it does | Discipline coverage |
|---|---|---|
| `audit_page` | Runs every deterministic rule against one URL or local file. Returns findings grouped by discipline (SEO/AEO/GEO/LLMO), each tagged with standard ID, severity, and raw evidence. | All four |
| `audit_site` | Site-wide checks: sitemap.xml validity, robots.txt validity + AI-crawler access, llms.txt presence, cross-page canonical/duplicate detection. | SEO, LLMO |
| `apply_fix` | Takes a `fixType` + target + (for AI-drafted content) the text Cursor's agent produced via a prompt below. Returns a **diff**, not a silent write (see Safety). Handles both editing existing files and creating missing ones (sitemap.xml, robots.txt, llms.txt — per the `architecture/22` fix). | All four |
| `get_standard` | Returns the full text of one standard (requirement, threshold, source, verify method, gate weight) by ID — lets Cursor's agent quote the actual rule back to the user instead of paraphrasing. | All four |
| `score_page` | Calls into `critic-mcp` (separate process, unchanged) and returns the independent grade for a page/fix — this is the one tool that deliberately does *not* live in the same process as `audit_page`, preserving the independence invariant. | All four |

### Resources (readable reference data)

| Resource | Content |
|---|---|
| `standards://{id}` | One of the 32 standards, full text — same pattern as the current `seokit://standards/{id}` resource, kept as-is. |
| `guidelines` | The knowledge-base overview/README content — kept as-is. |
| `reports://{sessionId}` | A generated audit report (json/md/html) from a prior `audit_page`/`audit_site` call — kept as-is. |

### Prompts (evidence handed to Cursor's own model for judgment)

This is the new layer — the actual mechanism for "AI diagnoses / AI generates fixes / AI explains findings" without a second LLM call.

| Prompt | Fills in with | What it asks Cursor's model to do |
|---|---|---|
| `diagnose-answerability` | The page's real content + the target query/topic | Judge whether this content would actually be selected as a direct answer (AEO judgment call rules can't make) |
| `diagnose-citation-worthiness` | The page's real content + entity/schema evidence | Judge whether an LLM would treat this as a citable source (GEO judgment call) |
| `diagnose-content-match` | The page's real content + target keyword/intent | Judge topical match and thin-content risk (SEO judgment call) |
| `diagnose-chunk-quality` | The page's heading structure + body text | Judge whether this content is structured well for retrieval chunking (LLMO judgment call) |
| `draft-fix-content` | One finding's evidence + the relevant standard text | Ask Cursor's model to draft the actual replacement content — a real meta description, real FAQ schema entries, real alt text (not the current fixer's placeholder `"SEO Optimized Image"` string), a real `llms.txt` body | 
| `explain-finding` | One finding + audience hint (`developer` \| `stakeholder`) | Ask Cursor's model to explain why this finding matters and how to prioritize it, in language suited to who's asking — this is what makes "AI explains findings conversationally" real instead of a static templated message |

The flow: a tool call returns findings; if a finding needs judgment or drafted content, the tool response points at the matching prompt; Cursor's agent invokes that prompt, reasons over the real evidence already in front of it, and produces the diagnosis or draft; if the result should be written to disk, `apply_fix` is called with that content and returns a diff for the user to approve inside Cursor's normal edit flow — the same review step any other Cursor-suggested edit gets, not a special-cased silent write.

---

## Worked example, start to finish

A developer is looking at `app/blog/[slug]/page.tsx` in Cursor and asks the agent to check it.

1. Cursor's agent calls `audit_page` with the rendered URL. It gets back: an AEO finding (no FAQ schema, word count fine), a GEO finding (no `Organization` JSON-LD, no `sameAs`), and a passing SEO check (canonical present and correct).
2. The agent reads the AEO finding, sees it's flagged as needing judgment (not just "missing," but "is the existing content answer-shaped at all"), and invokes `diagnose-answerability` with the page's real body text.
3. Cursor's model reasons over the actual paragraph and concludes the content answers the question but the H2 isn't phrased as a question — a fixable, specific issue rather than a generic "add FAQ schema" template line.
4. The agent invokes `draft-fix-content` for that finding, gets back a Cursor-model-authored rephrased heading and a real FAQ schema JSON block built from the page's actual Q&A content — not a placeholder.
5. The agent calls `apply_fix` with that drafted content. The tool returns a diff. Cursor shows it inline as an edit for the user to accept, exactly like any other suggested change.
6. Once accepted, the agent can optionally call `score_page`, which hits `critic-mcp` — a separate process with no access to the reasoning above — and gets back an independent grade, so the fix isn't just self-certified by the same reasoning that produced it.

Nothing in this flow needed a second LLM API key. Every judgment call happened in Cursor's own model, fed real evidence. The only thing the MCP server itself ever did was run deterministic checks and, at the end, write an approved diff to disk.

---

## Safety — the one thing not to compromise on

`apply_fix` should default to **returning a diff, not writing directly to disk.** The current `orchestrator.ts` has an `applyAndBackupFix` path that writes immediately with a backup/rollback safety net — that's reasonable for a batch/CI flow, but for the interactive Cursor case, a direct write bypasses the review step Cursor already gives every other AI-suggested edit. Route through Cursor's own edit-and-approve mechanism by default; keep the direct-write-with-backup path available as an explicit opt-in for non-interactive/CI use, not the default for the tool a developer calls mid-conversation.

Separately: this rebuild is the right moment to fix the `SEOKIT_SECRET` default-credential issue properly — refuse to start in any mode other than local stdio unless a real secret is explicitly configured, rather than falling back to a known constant. A single, more visible server is a worse place to carry that weakness forward than the current fragmented one.

---

## Migration plan (package-level, ready to become an implementation prompt)

| Package | Action |
|---|---|
| `packages/core` | Keep; delete `scheduler.ts`, `lifecycle/*`, `tracking/*`, `outreach/*`, `sandbox.ts` and their tests; keep everything else. |
| `packages/mcp` | Rework into the single unified server described above — trim tool count to the 5 tools listed, add the 6 prompts, keep the 3 resources. |
| `packages/critic-mcp` | Keep as-is, unchanged, still a separate process. |
| `packages/coder-mcp` | Remove from the Cursor install path; keep the package in the monorepo only if there's a non-Cursor MCP host target later. |
| `packages/orchestrator` | Keep only the plan → code → verify → critic loop needed for a possible future "fully automated fix" tool; strip anything tied to the cut `core` modules above. |
| `packages/plugins/*` (seo, aeo, geo, performance, accessibility, security, structured-data) | Keep — these are exactly the deterministic-rule implementations this design routes `audit_page`/`audit_site` through. |
| `packages/providers`, `packages/parser`, `packages/framework-detector`, `packages/workspace`, `packages/events`, `packages/diagnostics`, `packages/website`, `packages/sdk` | Keep, unaffected by this redesign — they're plumbing (crawling, parsing, framework detection, reporting) the trimmed `mcp` server still depends on. |
| `packages/cli` | Keep; fix the version-inconsistency issue found earlier while touching this anyway (align to whatever the new server's real version is). |

---

## Open questions to settle before implementation starts

1. **Does `audit_page` take a live URL, a local file path, or both?** A developer mid-edit in Cursor usually wants to check the file they're looking at, not a deployed URL — but some checks (robots.txt, AI-crawler access, CrUX field data) only make sense against a live, deployed site. The tool probably needs both modes with a clear "these specific checks require a live URL" boundary communicated in the result, not silently skipped.
2. **Where does `diagnose-*` evidence come from for a page that isn't deployed yet?** Rendered HTML for a local dev server is fine for most checks; some GEO/LLMO judgment calls (would an LLM cite this) are easier to reason about with real content regardless of deployment state, so this is probably fine — but worth confirming before building.
3. **How much should `explain-finding`'s two audiences (`developer` / `stakeholder`) actually diverge?** If they end up producing near-identical text, that's one prompt with a tone parameter, not two. Worth prototyping both before committing to the split.

This document is meant to be read, argued with, and adjusted before anything gets built — say what you'd change and I'll fold it in, or if it's close enough, the next step is turning the migration table into an actual Antigravity implementation prompt the same way `architecture/17` through `22` were built.
