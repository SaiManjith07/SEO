# Task Prompt for Antigravity — Research, Validate, and Operationalize the Knowledge Base

**Purpose of this file:** a ready-to-paste prompt for Google Antigravity (or any other agentic IDE) to pick up this project and do three things a chat session can't do well: verify claims against live sources, prove the knowledge base actually works on a real example, and report back on exactly what changed. Copy everything below the line into Antigravity.

---

## Prompt to paste into Antigravity

You are working in a repository containing an SEO/AEO/GEO/LLMO knowledge base at `SEO/knowledge-base/` and a research pack at `SEO/research/`. Read `SEO/00-INDEX.md` first — it explains the whole folder structure and tells you where everything lives. Do not skip this step; the repo has a specific structure (discipline folders `SEO/`, `AEO/`, `GEO/`, `LLMO/`, each with a `README.md` and a `groups/` subfolder of functional areas, all pointing into `SEO/knowledge-base/standards/` where the actual 32 numbered standards live). Do not duplicate content that already exists — this repo's design principle is "index many times, store once."

Work through the following steps **in order**. Do not skip ahead. Stop and ask if a step's output contradicts what you find in an earlier step.

### Step 1 — Orient (15–30 min)

1. Read `SEO/00-INDEX.md`, `SEO/knowledge-base/README.md`, and `SEO/knowledge-base/INDEX.md` fully.
2. Skim every file in `SEO/knowledge-base/standards/` (8 files) and note which standards carry a specific numeric claim (a percentage, a correlation coefficient, a dollar figure, a date).
3. Produce a short list: every standard ID with a hard numeric claim, and its cited source (most are in `SEO/research/`, ultimately tracing to `arXiv:2311.09735`, Cloudflare Radar, AirOps, ALM Corp, SE Ranking, Semrush, or Google's own documentation).

### Step 2 — Research and verify (the core task)

For each numeric claim identified in Step 1:

1. Web-search the original source (the knowledge base gives you the citation — use it, don't re-derive from memory).
2. Confirm the figure is still the most current publicly available number. Note anything that looks stale (studies get updated; percentages from a "2025" or "early 2026" report may have a newer version by the time you read this).
3. Flag, don't silently fix: if a number has changed or a source has been superseded, add a note directly in the relevant `standards/*.md` file under the existing entry — do not delete or overwrite the original claim, append a dated verification note instead. Example format:

   ```
   > **Verification note (date you run this):** re-checked against [source]. Figure unchanged / figure now reads X instead of Y — see [new source].
   ```

4. Separately verify the two structural/mechanical claims that aren't statistics but are load-bearing: (a) that GPTBot, OAI-SearchBot, ClaudeBot, and PerplexityBot still do not execute JavaScript (STD-06) — check each vendor's current crawler documentation directly; (b) that the March/May 2026 Google core update descriptions in `standards/04-performance.md` and `research/01-SEO-fundamentals-2026.md` match Google Search Central's own changelog.
5. Do **not** invent new standards or renumber existing ones. If you find a genuine gap (a real, sourceable standard missing from the 32), propose it as `STD-33` onward in a new section at the end of the relevant `standards/*.md` file, and add it to `SEO/knowledge-base/INDEX.md`'s table — follow the exact format of the existing entries (Requirement / Threshold / Source / Verify / Gate).

### Step 3 — Make it useful: run a worked example

The knowledge base is currently reference material — prove it's operationally useful by applying it end to end, once, to a real or realistic case.

1. Pick **one real URL** (your own site, a client's, or a public example you have permission to analyze) or, if none is available, construct one realistic fictional page with realistic HTML.
2. Walk the standards in prerequisite order (`SEO/knowledge-base/README.md` §2 — Level 0 through Level 4). For each standard that applies, actually check it: fetch the robots.txt, curl the page as different user agents, run it through PageSpeed Insights, check the JSON-LD, etc. Use the exact tools listed in `SEO/knowledge-base/tools/tools-reference.md` for each check.
3. Produce a single worked-example file: `SEO/knowledge-base/architecture-notes/worked-example-<date>.md`. Structure it as: URL/page analyzed → standard-by-standard findings (pass/fail/unverified, with the actual evidence — a curl output, a screenshot description, a JSON-LD snippet) → prioritized fix list, ordered the way `SEO/architecture/15-mcp-evaluator-critic-architecture.md` §5.4 describes (`expectedRewardGain` logic: which fix unblocks the most value first, respecting that Level 0 gates dominate everything above them).
4. This worked example is the proof that the knowledge base's checklist form (not just its narrative form) is actually actionable by someone who has never read the research pack.

### Step 4 — Report

Produce `SEO/architecture-notes/antigravity-run-report-<date>.md` (create the `architecture-notes` folder at the `SEO/` root if `SEO/knowledge-base/architecture-notes/` isn't the right place — use your judgment on the single most discoverable location, but say clearly in the report where you put it). The report must cover, in this order:

1. **What you verified** — every numeric claim checked in Step 2, and for each: unchanged / updated / could-not-verify (with reason).
2. **What you changed** — exact list of files touched, and for each file, a one-line summary of the edit (verification notes added, new standards proposed, anything else).
3. **The worked example** — link to the file from Step 3, plus a 3–5 sentence summary of what it found and whether the knowledge base was sufficient to run the check without needing outside information not already in the repo.
4. **Gaps found** — anything the knowledge base claims to cover but doesn't actually give enough detail to check in practice; anything a real check needed that wasn't in `tools/tools-reference.md`.
5. **Open questions** — anything you were unsure about and left for a human to decide, rather than guessing.

Keep the report factual and specific — file paths, not vague summaries. Do not mark anything as verified that you did not actually check against a live source.

---

## Notes for whoever pastes this in

- This prompt assumes Antigravity has web access and file read/write access to this repository. If it doesn't have web access, it can still do Steps 1, 3 (partially — the tool-check steps that don't require external verification), and 4, but should say so explicitly in the report rather than fabricating verification results.
- Steps are intentionally sequential and gated ("do not skip ahead") because Step 3's worked example is only trustworthy if Step 2 already confirmed the standards it's checking against are current.
- If you want this run on a recurring basis (e.g., quarterly re-verification, matching the refresh cadence the knowledge base itself recommends for commercial content), say so when you paste this in — the report format is designed to diff cleanly against a prior run.
