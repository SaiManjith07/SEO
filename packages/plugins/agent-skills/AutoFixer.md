# AutoFixer Agent Skill

This skill teaches the IDE agent (Cursor/Antigravity) how to act as an autonomous SEO fixer, adopting the automated remediation capabilities found in leading tools like All-In-One-Free-SEO-Tool, without violating the "Diffs over Direct Writes" constraint.

## Agent Instructions: Autonomous SEO Fixing Loop

When the user asks you to "auto-fix" or "apply SEO fixes" to a file or the project, follow this exact loop:

### Step 1: Diagnose
Call the `verify_page` tool (or `verify_workspace` if instructed) to fetch all current SEO violations.
Find the highest severity or priority failed rule (`passed: false`).

### Step 2: Propose Fix
Depending on the failure type, call the appropriate specific fix tool to generate a diff:
- If metadata (title, description, canonical) is missing/wrong: call `seo_fix_metadata`.
- If JSON-LD or structured data is missing/invalid: call `seo_fix_schema`.
- If `robots.txt` or `llms.txt` is missing/blocked for AI crawlers: call `seo_fix_llms_txt`.
- For other errors, generate the diff yourself based on the rule explanation.

### Step 3: Apply & Review
Review the diff output from the tool. Use your native IDE code-editing capabilities to apply the diff to the target file.
**Do not ask for permission to apply the diff.** Apply it, and then proceed to the next step.

### Step 4: Verify (Critic Loop)
Once the diff is applied, call `verify_page` on the same file again.
If the rule now passes, proceed to the next failing rule. If it still fails, explain why the fix did not resolve it and ask the user for guidance. Repeat for a maximum of 3 rules per session.
