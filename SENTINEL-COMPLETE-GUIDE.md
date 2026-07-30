# Sentinel — Complete Product Guide (v0.1.0)

**Sentinel** is an open-source **MCP security gate** for AI coding agents. It turns security checks into **executable verdicts** (PASS / FAIL / ERROR from real scanner exit codes)—not LLM opinions—so tools like **Cursor**, **Claude Code**, and CI cannot claim “ship ready” unless the checks actually ran against the current code.

| | |
|---|---|
| **Product name** | Sentinel (`sentinel-mcp`) |
| **Version** | `0.1.0` (tag `v0.1.0`) |
| **License** | MIT |
| **Runtime** | Node.js 20+ |
| **Primary interfaces** | MCP server + CLI (`sentinel` / `sentinel-mcp`) |
| **Audience** | Teams using AI agents to write production code who need a fail-closed security gate |

This document is the long-form product and build guide: **what we built**, **how it works**, and **how to build and run it** (local, zip transfer, Cursor MCP, CI).

---

## Table of contents

1. [What Sentinel is (and is not)](#1-what-sentinel-is-and-is-not)
2. [The problem Sentinel solves](#2-the-problem-sentinel-solves)
3. [Founding principle](#3-founding-principle)
4. [What we built — feature inventory](#4-what-we-built--feature-inventory)
5. [Architecture overview](#5-architecture-overview)
6. [Security scanners and toolchain](#6-security-scanners-and-toolchain)
7. [Stack packs (framework detection)](#7-stack-packs-framework-detection)
8. [MCP tools reference](#8-mcp-tools-reference)
9. [CLI reference](#9-cli-reference)
10. [How to build Sentinel from source](#10-how-to-build-sentinel-from-source)
11. [How to install and connect Cursor (MCP)](#11-how-to-install-and-connect-cursor-mcp)
12. [First-run workflow and triage](#12-first-run-workflow-and-triage)
13. [CI / ship gate](#13-ci--ship-gate)
14. [Honesty, coverage, and accepted debt](#14-honesty-coverage-and-accepted-debt)
15. [Known limitations (v0.1.0)](#15-known-limitations-v010)
16. [FAQ](#16-faq)
17. [Related documentation](#17-related-documentation)

---

## 1. What Sentinel is (and is not)

### Is

- An **MCP (Model Context Protocol) server** that exposes security scan tools to AI agents.
- A **CLI** (`sentinel check`, `scan`, `status`, `init`, `accept`) for humans and CI.
- A **session ledger** that binds scan results to a **git working-tree hash** (`treeHash`).
- A **ship readiness gate**: PASS only when required checks freshly passed on the current tree.
- A set of **stack packs** (Next.js, Flutter, FastAPI, Firebase, Supabase, Express, agentic) that auto-detect and add framework-specific checks.
- Checksum-pinned downloads of **gitleaks**, **opengrep**, and **trivy**.

### Is not

- A guarantee that the application is “secure.”
- An LLM that judges risk by reading code and inventing a PASS.
- A replacement for penetration testing, threat modeling, or human review.
- A silent auto-switcher between native and Docker runners (unavailable runner → **ERROR**).

**One-line SEO summary:** *Sentinel is an MCP security gate for Cursor and AI coding agents that enforces real scanner exit codes instead of advisory AI prose.*

---

## 2. The problem Sentinel solves

AI coding agents are fluent at **claiming** security work is done. Without an executable gate, they can:

- Say “no secrets found” without running a secret scanner.
- Treat yesterday’s scan as today’s pass after the tree changed.
- Skip hard checks and still report “ready to ship.”
- Confuse “tool crashed” with “code is clean.”

Sentinel forces the agent (and CI) through tools that **must run**. Verdicts come from process exit codes and parsed findings. If a scanner did not run, the answer is **ERROR**, never PASS.

---

## 3. Founding principle

> **Verdicts come from exit codes, never from judgement.**

Learned conventions live in `AGENTS.md`. Highlights:

- Fail closed on ambiguity (e.g. unknown branch → treat as protected / blocking).
- Never silently substitute runners.
- Distinguish **tool broke** (ERROR / exit 2) from **code is bad** (FAIL / exit 1).
- No `force` / `skip` / `acknowledge` on `ship_readiness`.
- Spawn scanners with **argv arrays**, never shell-interpolated paths.
- Composers may **reclassify** severity only on positive evidence from a partner pack—not on “probably fine.”

---

## 4. What we built — feature inventory

Shipped as of **v0.1.0**:

### Core gate

| Capability | Description |
|------------|-------------|
| Session ledger | In-memory record of tool runs vs `treeHash` |
| `ship_readiness` | Gate tool; no bypass flags |
| Tree fingerprint | Edit after PASS → stale |
| Blocking vs advisory mode | Incremental scans advisory-only; never satisfy the gate |
| Honesty / `notChecked` | Every PASS/FAIL lists what was **not** examined |
| Coverage matrix | Language × vulnerability-class gaps via `sentinel_coverage` |

### Scanners

| Tool | Engine | Covers |
|------|--------|--------|
| Secrets | gitleaks 8.30.1 | Worktree + git history |
| SAST | opengrep 1.26.0 | Sentinel core + vendored GitLab SAST rules |
| Deps / misconfig | trivy 0.72.0 | Lockfile CVEs + infra misconfig |

### Stack packs

Auto-detected packs with rules and/or programmatic checks:

- **Next.js** — client env leaks, image remote patterns, Server Action auth signals, CORS
- **Flutter / Dart** — platform config (e.g. `allowBackup`, cleartext), Dart rules when opengrep succeeds
- **FastAPI** — CORS/debug rules, route-auth and rate-limit coverage checks
- **Firebase** — Firestore / RTDB / Storage rules analysis (open access, path-bound IDOR patterns)
- **Supabase** — RLS / migrations posture
- **Express** — security middleware / dangerous defaults
- **Agentic** — agent-framework dangerous defaults (iteration bounds, etc.)

### Product ops

| Capability | Description |
|------------|-------------|
| `sentinel init` | Writes `sentinel.config.json`; prints merge-safe Cursor + Claude MCP snippets with `process.execPath` |
| Accepted debt | CLI `accept` / `prune` → `.sentinel/accepted.json` (commit + review) |
| Baseline diffs | `--baseline` so only **new** fingerprints block |
| SARIF output | PR annotations |
| GitHub Actions workflow | `.github/workflows/sentinel.yml` |
| Native + Docker runners | Docker fail-closed if unpinned (opengrep Docker = ERROR by design) |
| Composers | Cross-pack severity reclassification (e.g. public client keys vs open Firebase/Supabase) |
| Fresh-machine docs | FIRST-RUN, KNOWN-ISSUES, OTHER-LAPTOP, TRANSFER-REQUIREMENTS, cold-path log |
| Measurement reports | Pack corpus reports under `benchmark/reports/` |

---

## 5. Architecture overview

```text
┌─────────────────┐     MCP (stdio)      ┌──────────────────────────┐
│ Cursor / Claude │ ◄──────────────────► │ sentinel-mcp (Node)      │
│ Code / agent    │                      │  tools → scanners/packs  │
└─────────────────┘                      │  ledger (in-process)     │
                                         └────────────┬─────────────┘
                                                      │
┌─────────────────┐     exit 0/1/2       ┌────────────▼─────────────┐
│ CI / human CLI  │ ◄──────────────────► │ sentinel check / scan    │
└─────────────────┘                      │  same scanners + packs   │
                                         └────────────┬─────────────┘
                                                      │
                      ┌───────────────────────────────┼──────────────────┐
                      ▼                               ▼                  ▼
               gitleaks (pinned)              opengrep (pinned)    trivy (pinned)
               ~/.sentinel/bin                + rules / packs      + DB cache
```

**Important split:** MCP `ship_readiness` only sees the **current MCP process** ledger. CLI `check` runs scanners and evaluates readiness in **one process**—prefer CLI for day-one full gates.

Scan root is controlled by `SENTINEL_ROOT` (MCP) or `--path` (CLI).

---

## 6. Security scanners and toolchain

Pinned in `toolchain.lock.json` (v0.1.0):

| Scanner | Version | Role |
|---------|---------|------|
| gitleaks | 8.30.1 | Secrets |
| opengrep | 1.26.0 | Semgrep-compatible SAST |
| trivy | 0.72.0 | CVE + misconfig |

- First run downloads checksum-verified binaries to `~/.sentinel/bin` (or `%USERPROFILE%\.sentinel\bin` on Windows).
- Overrides: `SENTINEL_GITLEAKS_PATH`, `SENTINEL_OPENGREP_PATH`, `SENTINEL_TRIVY_PATH`.
- Rules: core under `rules/core/`; GitLab MIT rules vendored at commit `d580dedc…` (`rules/vendor/gitlab/VENDORED.json`).
- Findings namespaced: `sentinel.*` / `gitlab.*` / `pack.<id>.*`.

---

## 7. Stack packs (framework detection)

Packs live under `packs/<id>/` with `pack.json` detect signals (dependencies, paths, imports). When detected, they join `requiredChecks` for the gate.

| Pack ID | Typical detect signals | Examples of checks |
|---------|------------------------|--------------------|
| `nextjs` | `next` dep, `next.config.*` | `NEXT_PUBLIC_*` secrets, wild image hosts, Server Action auth (advisory) |
| `flutter` | `pubspec.yaml` + Flutter SDK, `lib/**/*.dart` | Android/iOS platform config, Dart SAST rules |
| `fastapi` | `fastapi` in pyproject / imports | CORS wildcard + credentials, debug, route-auth coverage |
| `firebase` | `firebase.json`, rules files, `firebase` dep | Open Firestore rules, ownership gaps |
| `supabase` | `@supabase/supabase-js`, `supabase/migrations` | RLS not declared, service role exposure |
| `express` | `express` dep / import | Helmet / rate-limit / trust-proxy patterns |
| `agentic` | LangChain, CrewAI, MCP SDKs, etc. | Unbounded agent loops, tool-description injection signals |

**Monorepo note:** Detection is **scan-root scoped**. A real `mobile/` + `api/` + `web/` layout may need `check --path` per package until multi-root lands. The composite fixture is intentionally flat for cold-path smoke tests.

---

## 8. MCP tools reference

| Tool | Purpose |
|------|---------|
| `scan_secrets` | Run gitleaks (worktree + history) |
| `scan_code` | Run opengrep (combined ruleset) |
| `scan_trivy` | Dependency CVEs + infra misconfig |
| `ship_readiness` | Gate — PASS only if required checks are fresh full PASSes for current `treeHash` |
| `sentinel_status` | Diagnostics (not a security verdict) |
| `sentinel_coverage` | Coverage / gaps across claimed classes |
| `design_start` / `design_record` | Experimental design checklist — **never** blocks the gate |
| `change_since_design` | Advisory diff vs design record |

Agents should run scans, then `ship_readiness`. Humans should treat MCP PASS as “this process’s ledger says so,” not as CI.

---

## 9. CLI reference

```text
sentinel check   [--path .] [--mode blocking|advisory] [--baseline <git-ref>] [--format text|json|sarif] [--verbose]
sentinel scan    [--path .] [--tool gitleaks|opengrep|trivy|<pack>] [--mode blocking|advisory] [--verbose]
sentinel status  [--path .]
sentinel init    [--path .]
sentinel accept  <fingerprint> --reason "..." [--expires-in 90d] [--path .]
sentinel accept  --list | --prune [--path .]
```

**Exit codes (`check`):**

| Code | Meaning |
|------|---------|
| 0 | PASS |
| 1 | FAIL (blocking findings) |
| 2 | ERROR (required check did not complete) |

---

## 10. How to build Sentinel from source

### Prerequisites

- Node.js **20+**
- npm
- Network (first toolchain / Trivy DB download)
- Git (optional; needed for history secret scans and baselines)

### Build steps

```bash
cd sentinel
npm install          # runs prepare → builds dist when TypeScript is available
npm run build        # tsc → dist/
npm test             # vitest
```

Artifacts:

- CLI: `dist/src/cli.js` (`sentinel`)
- MCP: `dist/src/index.js` (`sentinel-mcp`)

### Zip transfer (no git remote required)

Use the lean transfer archive (~1.2 MB): `sentinel-v0.1.0.zip` (excludes `node_modules` and benchmark corpora).

```bash
# other machine
unzip sentinel-v0.1.0.zip
cd sentinel
npm install
npm run build
node dist/src/cli.js status
```

Step-by-step for a second Windows laptop + Cursor: **`docs/OTHER-LAPTOP.md`**.

### Git install (when remote exists)

```bash
npm install --save-dev git+https://github.com/ORG/sentinel.git#v0.1.0
npx sentinel init
```

Or sidecar clone + MCP paths from `init`.

---

## 11. How to install and connect Cursor (MCP)

1. Build or unzip Sentinel; confirm `dist/src/index.js` exists.
2. Open the **application** repo in Cursor (the code under development).
3. Run:

   ```bash
   node path/to/sentinel/dist/src/cli.js init --path path/to/your-app
   ```

4. Merge the printed `sentinel` entry into `.cursor/mcp.json` (project) or `%USERPROFILE%\.cursor\mcp.json` (global).

   - `command`: absolute `node.exe` (`process.execPath`) — important on Windows GUI Cursor.
   - `args`: absolute path to `dist/src/index.js`.
   - `env.SENTINEL_ROOT`: absolute path to the **app**, not the Sentinel tools folder.

5. Restart Cursor / toggle MCP until Sentinel is connected.
6. Verify:

   ```bash
   node path/to/sentinel/dist/src/cli.js status --path path/to/your-app
   node path/to/sentinel/dist/src/cli.js check --path path/to/your-app --format text
   ```

Claude Code uses the same server entry shape (project `.mcp.json` or user config). Always **merge**; never replace the whole MCP file.

---

## 12. First-run workflow and triage

Expect **exit 1** on a real codebase. First cold run may take minutes (Trivy DB).

Triage buckets:

1. **Fix now** — true positives you own.
2. **Accept** — documented debt with reason + expiry (`sentinel accept …`); commit `.sentinel/accepted.json`.
3. **False positive / tooling** — file under `benchmark/RECOMMENDATIONS.md` or note in KNOWN-ISSUES.

Then use a baseline so only **new** issues block:

```bash
sentinel check --path . --baseline origin/main --format text
```

Full playbook: **`docs/FIRST-RUN.md`**.

---

## 13. CI / ship gate

Copy `.github/workflows/sentinel.yml` into the app repo (or call `npx sentinel check` from your pipeline).

Typical CI behavior:

- Run on pull requests.
- Pass `--baseline` as merge base (pre-existing debt visible but not necessarily blocking).
- Cache `~/.sentinel/bin` keyed on `toolchain.lock.json`.
- Upload SARIF for inline annotations.
- Fail job on exit **1**; treat exit **2** as tooling breakage.

---

## 14. Honesty, coverage, and accepted debt

- **PASS** means: required checks that ran found nothing in scope — **not** “the app is secure.”
- Results include **`notChecked`** derived from the coverage registry (undetected packs, unscanned classes).
- **Accepted debt** is intentional visibility: agents with shell can still call `accept`; the security boundary is **review of the committed JSON**, not a magical lock.
- **Design** tools are advisory and never gate `ship_readiness`.

---

## 15. Known limitations (v0.1.0)

Documented in **`docs/KNOWN-ISSUES.md`**. Highlights for operators:

| Area | Limitation |
|------|------------|
| Flutter / Dart | Opengrep may exit 2 on older trees → pack ERROR; platform checks may still report |
| Monorepo | Root-scoped detection; multi-package apps need per-path scans |
| MCP ledger | Empty until scans run in that MCP process |
| Trivy cold start | DB download dominates first-run time |
| Windows MCP | Prefer absolute `node.exe`; bare `node` often fails in GUI Cursor |
| Server Action auth | Advisory; measured ~2 TP / 1 FP on corpus |
| Product stage | Fresh-machine / cross-laptop path proven on fixtures; real-app diary is the next evidence loop |

---

## 16. FAQ

### Is Sentinel an AI security product?

It **uses** AI agents as the workflow surface, but **security verdicts are not AI-generated**. Scanners and packs produce exit codes; Sentinel reports them.

### Can I use Sentinel without Cursor?

Yes. The CLI works in any terminal and in CI. MCP is optional for agent integration.

### Does PASS mean production-safe?

No. It means the configured checks ran cleanly on the current tree. Always read `notChecked`.

### Zip vs git for another laptop?

Zip is enough for day one (`docs/OTHER-LAPTOP.md`). Git tag `v0.1.0` is for versioned installs once the remote is connected.

### What stacks get the most value today?

Apps with secrets + JS/TS/Python SAST, plus detected packs among Next.js, Flutter, FastAPI, Firebase, Supabase, Express, and agent frameworks.

---

## 17. Related documentation

| Doc | Purpose |
|-----|---------|
| `README.md` | Quick start and pins |
| `AGENTS.md` | Engineering conventions (fail-closed rules) |
| `docs/FIRST-RUN.md` | Cold install triage |
| `docs/OTHER-LAPTOP.md` | Step-by-step second machine + Cursor |
| `docs/TRANSFER-REQUIREMENTS.md` | Phase 2–4 requirements checklist |
| `docs/KNOWN-ISSUES.md` | Measured gaps and landmines |
| `docs/COLD-PATH-2026-07-29.md` | Cold-path proof log |
| `benchmark/reports/` | Pack measurement field reports |
| `ATTRIBUTION.md` | Third-party / vendored rules attribution |

---

## Suggested SEO / landing keywords

Use naturally in public pages (site, README badges, launch posts):

- MCP security gate for AI coding agents  
- Cursor MCP security scanner  
- Ship readiness for AI-generated code  
- Executable security checks vs LLM advice  
- gitleaks opengrep trivy MCP  
- Next.js Flutter FastAPI Firebase security pack  
- CI security gate with baseline debt  

**Primary pitch:** *Stop AI agents from rubber-stamping security. Sentinel makes Cursor and CI prove scans ran—exit codes, not opinions.*

---

*Document version: aligned with Sentinel v0.1.0. Update pins and pack tables when cutting a new release.*
