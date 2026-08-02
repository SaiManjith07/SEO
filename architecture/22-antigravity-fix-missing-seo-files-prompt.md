# Task Prompt for Antigravity — Fix: SEOKit Never Creates sitemap.xml, robots.txt, or llms.txt

**Root cause already found — don't spend time rediscovering it.** This isn't a bug hunt, it's a scoped implementation fix. Read this section, then go straight to the "Your job" section below.

SEOKit can **detect** that `sitemap.xml`, `robots.txt`, and `llms.txt` are missing or malformed (via `plugins/seo/src/validators/sitemap.ts`, `plugins/seo/src/validators/robots.ts`, and `core/src/rules/ai-access.ts`'s `llmsTxtPresence` rule) and it can **describe** what should be done about it (every finding carries a `fix`/`fixPlan` text suggestion). But nothing in the codebase actually **writes these files to disk**, for three separate, confirmed reasons:

1. **`packages/orchestrator/src/orchestrator.ts:360-368`** — `proposeFix()` is the single entry point every fix-application path goes through (`applyAndBackupFix`, `applyTransactionalRemediation`). Its first action is:
   ```ts
   if (!fs.existsSync(filePath)) {
     throw new Error(`Target file to fix does not exist: ${filePath}`);
   }
   ```
   The entire remediation pipeline is architected as "edit an existing file's content." It has no concept of creating a new file. This alone blocks all three files from ever being generated when they're genuinely absent, regardless of what happens next.

2. **`packages/core/src/platform/fixer.ts:134`** — `SEOFixerEngine.generateSitemap(urls: string[])` exists, is fully implemented, produces valid sitemap XML, and has a passing unit test in `fixer.test.ts`. But it is **never called from `orchestrator.ts`'s fixType switch** (lines 374-391 handle `canonical`, `breadcrumbs`, `schema`, `title`, `description`, `alt`, `headings`, `internal-link`, `robots` — there is no `sitemap` case). The function is disconnected from the pipeline. `fixRobotsTxt` (fixer.ts:129) *is* wired into the switch at line 391 — but it can still never run for a missing file, because it never gets past the existence check in step 1.

3. **llms.txt has no generator at all.** `ai-access.ts`'s `llmsTxtPresence` rule (lines 146-165) only returns an informational finding with a text `fix` string ("Create an /llms.txt file containing markdown-formatted descriptions..."). There is no `generateLlmsTxt`-equivalent anywhere in `fixer.ts`, and nothing downstream turns that advisory string into a file write.

So: this is a real, well-defined gap, not a flaky bug. The fix has three parts.

---

## Prompt to paste into Antigravity

You're implementing a scoped fix, not doing open-ended investigation — the root cause is already established above with exact file/line citations. Verify it holds (read the three files/lines cited before changing anything), then implement the following. Do not consider this done until you've run it against a real test project with no sitemap.xml, robots.txt, or llms.txt and watched all three files actually appear on disk with correct content — a passing unit test on an isolated function is not sufficient evidence, since that's exactly the gap that let this go unnoticed (`generateSitemap` already had a passing unit test while being completely unreachable from the real pipeline).

### 1. Make the fix pipeline support file creation, not just file editing
In `packages/orchestrator/src/orchestrator.ts`, `proposeFix()` currently throws if `filePath` doesn't exist. Change this so that for fix types which are legitimately about creating a missing file (`sitemap`, `robots` when robots.txt is totally absent rather than just malformed, and the new `llms-txt` type from step 3), a missing file is valid input — treat `content` as `''` in that case instead of throwing, and let the relevant generator function produce the full file from scratch. Keep the throw behavior for fix types that only make sense against existing content (e.g. `canonical`, `alt`, `headings` — you can't "restructure headings" in a file that doesn't exist). Be precise about which fix types get the new behavior; don't blanket-disable the safety check.

### 2. Wire `generateSitemap` into the fix pipeline
Add a `sitemap` case to the fixType switch in `proposeFix()` (orchestrator.ts, alongside the existing cases at lines 374-391) that calls `SEOFixerEngine.generateSitemap(urls)`. The `urls` list needs to come from somewhere real — check what the orchestrator or workspace scanner already knows about site pages (likely `packages/workspace` or the crawler in `core/src/crawler/crawl.ts`) and use that as the source, rather than requiring the caller to pass URLs manually with no default. If no reliable URL list is available at fix-time, at minimum generate a sitemap containing the site's known root/homepage URL and document this as a starting point, not a complete sitemap.

### 3. Add a real llms.txt generator
Add a `generateLlmsTxt(siteName: string, description: string, pages: {title: string, url: string}[])`-style method to `SEOFixerEngine` in `packages/core/src/platform/fixer.ts`, following the current draft spec for `/llms.txt` (markdown-formatted: an H1 with the site/brand name, a short description, then an H2-grouped list of key page links — check llmstxt.org or the current spec if you have live access, since this standard is still evolving as of the `08-llmo.md` STD-33 reference in the knowledge base; don't invent a format from nothing if a real spec exists to follow). Wire it into `orchestrator.ts`'s switch as an `llms-txt` case, following the same pattern as `sitemap` from step 2. Add a unit test in `fixer.test.ts` matching the style of the existing tests there.

### 4. Confirm findings actually propose these fixes, not just that the fixer functions work in isolation
Trace whatever assembles the `fixes` array passed into `applyTransactionalRemediation` (likely in `packages/orchestrator/src/agents/*` — check `planner.ts`, `coding.ts`, or wherever fix proposals get built from findings). When the `seo.sitemap.missing` finding, the `robots-validator`'s missing-content finding, or the `ai-access/llms-txt-presence` finding fire, does anything map them to a `{ filePath, fixType: 'sitemap' | 'robots' | 'llms-txt', options }` entry automatically? If not, that's a fourth gap on top of the three above — the generator existing and being callable doesn't help if nothing in the automated flow ever calls it for these specific findings. Wire this mapping if it's missing.

### 5. Empirical proof, not unit tests in isolation
Create a real scratch project directory with zero sitemap.xml, robots.txt, or llms.txt. Run the actual end-to-end flow a real user would trigger (CLI `verify` + fix, or the MCP `apply_seo_fix` tool, or whatever the real entry point is — use the one an actual Cursor/Antigravity user would hit, not a direct internal function call). Confirm, by listing the directory afterward and reading file contents, that all three files now exist with real, valid content — not just that a function returned a string. Paste the actual generated `sitemap.xml`, `robots.txt`, and `llms.txt` contents into your report.

### 6. Don't break what already works
`fixRobotsTxt` already correctly handles the "file exists but is missing `User-agent: *`" case (fixer.ts:129-132) — this must keep working exactly as before. Also: once a fresh `sitemap.xml` is generated, the newly-created or newly-fixed `robots.txt` should reference it (`Sitemap: https://.../sitemap.xml`) — the existing `robots-validator` (`plugins/seo/src/validators/robots.ts:24`) already checks for a `sitemap:` line, so generating one without the other leaves that check failing. Make sure `fixRobotsTxt`/robots generation includes a sitemap reference when a sitemap URL is known.

### Required output
1. Confirmation the three root causes above are accurate (or a correction, with evidence, if something's changed).
2. What you changed, file by file, with the actual diff.
3. The real generated `sitemap.xml`, `robots.txt`, and `llms.txt` content from a genuine end-to-end run against a test project (step 5) — pasted in full, not summarized.
4. Confirmation of what mapped each missing-file finding to an automatic fix proposal (step 4), or an explicit note if that layer still needs separate follow-up work.
5. Test results — both the new unit tests and the real end-to-end run.

Do not report this as fixed based on a passing unit test alone. That is exactly the failure mode that let `generateSitemap` sit disconnected and untriggered for however long it's been in this codebase.
