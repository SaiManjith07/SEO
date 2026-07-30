# Sentinel

MCP server that gives AI coding agents **executable security gates** instead of advisory prose.

An agent cannot claim a check passed unless the check actually ran and returned a real exit code against the current state of the code in this session. If a scanner did not run, the answer is `ERROR`, never `PASS`.

**Full product / SEO guide:** [`docs/SENTINEL-COMPLETE-GUIDE.md`](docs/SENTINEL-COMPLETE-GUIDE.md) — what we built, architecture, packs, build & Cursor MCP. Other-laptop steps: [`docs/OTHER-LAPTOP.md`](docs/OTHER-LAPTOP.md).

## Exit codes, not opinions

Every verdict comes from a real process exit code and real parsed output. Nothing in this codebase returns `PASS` based on reasoning, inference, or an LLM's judgment.

- A scan result is bound to a **working-tree fingerprint** (`treeHash`). Edit the code after a pass and the pass is stale.
- `ship_readiness` consults an in-memory **session ledger**, not the agent. Fresh means "this tool ran against this exact tree hash in this process."
- Unavailable runners produce a descriptive `ERROR`. There is **no silent fallback** between native and Docker.
- Incremental (changed-file) scans are allowed in **advisory** mode only. They are recorded, but they **never** satisfy `ship_readiness`.

## Install

Requires **Node 20+**.

### Pins (v0.1.0)

| Component | Version / id |
|-----------|----------------|
| Sentinel | `0.1.0` (tag `v0.1.0`) |
| gitleaks | `8.30.1` (`toolchain.lock.json`) |
| opengrep | `1.26.0` (`toolchain.lock.json`) |
| trivy | `0.72.0` (`toolchain.lock.json`) |
| GitLab SAST rules (vendored) | `d580dedc604363a7606bc0a7192f4edf3e675cae` (`rules/vendor/gitlab/VENDORED.json`) |
| Pack measurements | `benchmark/reports/2026-07-29-nextjs-pack.md`, `benchmark/reports/2026-07-29-flutter-pack.md` |

See `docs/FIRST-RUN.md` and `docs/KNOWN-ISSUES.md` for cold-install triage.

```bash
cd sentinel
npm install
npm run build
```

`npm install` runs `prepare`, which builds `dist/` when TypeScript is available. A zip/tag that already contains `dist/` works without a local `tsc`. The native runner downloads checksum-verified binaries into `~/.sentinel/bin` on first use (or uses `SENTINEL_GITLEAKS_PATH` / `SENTINEL_OPENGREP_PATH` / `SENTINEL_TRIVY_PATH` if set).

```bash
npm test
```

### Team setup

Four people should reach an identical setup without a wiki page.

**1. Install from your private git remote** (exact command — replace the URL; pin the tag):

```bash
npm install --save-dev git+ssh://git@github.com/ORG/sentinel.git#v0.1.0
# or HTTPS:
npm install --save-dev git+https://github.com/ORG/sentinel.git#v0.1.0
# sidecar clone instead of a dependency is also fine — see docs/FIRST-RUN.md
```

**2. Init** — writes `sentinel.config.json` if absent and prints **merge-safe** MCP wiring (`process.execPath` + absolute entry):

```bash
npx sentinel init
```

**3. MCP** — merge the printed `sentinel` key into Cursor or Claude Code config (do not replace the whole file). Paths are printed by `init`. `SENTINEL_ROOT` must point at the app repo you scan.

**4. Sanity check** — when someone's results differ from someone else's, run:

```bash
npx sentinel status
```

It reports runner, toolchain versions/checksums, active rule count, detected packs, and policy.

**5. CI** — copy `.github/workflows/sentinel.yml` from this package. It:

- runs on pull requests
- passes `--baseline` as the merge base (pre-existing debt does not block)
- caches `~/.sentinel/bin` on `toolchain.lock.json`
- uploads SARIF for inline PR annotations
- fails the job on exit code 1 (findings); exit 2 means tooling broke

**6. First run triage** — expect findings on an existing codebase. Follow `docs/FIRST-RUN.md`. With `--baseline`, only **new** fingerprints block. Pre-existing debt is counted in the summary (`FAIL — 2 new findings (11 pre-existing, 1 fixed)`) so it stays visible. Fix new issues; schedule debt separately.

**CLI** (CI cannot speak MCP — one process runs checks + gate):

```bash
npx sentinel check --path . --baseline origin/main --format text
npx sentinel check --format sarif > results.sarif
npx sentinel scan --tool gitleaks
```

Exit codes: `0` PASS · `1` FAIL · `2` ERROR.

`ship_readiness` PASS means the checks that ran found nothing — **not** that the application is secure. Every result lists `notChecked` (registry − active coverage). Undetected packs appear there too. MCP `ship_readiness` uses an in-process ledger — for a full gate in one shot, prefer CLI `check`.

## Native vs Docker runner

Default is **native**: run the pinned binary from `toolchain.lock.json` with the scan root as cwd.

Switch to Docker in `sentinel.config.json` at the scan root:

```json
{
  "runner": "docker"
}
```

Docker runs with `--network=none`, `--read-only`, a read-only bind mount of the scan root, `--tmpfs /tmp`, and memory/CPU limits. Images are pinned in `src/runners/docker.ts`.

**Deviation:** gitleaks has a pinned Docker image. Opengrep 1.26.0 does not publish an official matching image on Docker Hub / GHCR that we could pin with the same confidence as the Cosign-signed binary release, so Docker mode for `opengrep` returns a clear `ERROR` ("No pinned Docker image") rather than inventing a tag. Native is the supported path for `scan_code`.

If the configured runner is unavailable, Sentinel does **not** switch to the other one. Scans return `ERROR` with a fix hint instead.

## MCP client config

Prefer `npx sentinel init` — it prints merge-safe snippets with `process.execPath` and absolute paths.

### Cursor

Merge under `mcpServers` in project `.cursor/mcp.json` or `%USERPROFILE%\.cursor\mcp.json`:

```json
{
  "mcpServers": {
    "sentinel": {
      "command": "C:/Path/To/node.exe",
      "args": ["C:/path/to/sentinel/dist/src/index.js"],
      "env": {
        "SENTINEL_ROOT": "C:/path/to/your/workspace"
      }
    }
  }
}
```

### Claude Code

Same server entry shape. Typical locations: project `.mcp.json` (`mcpServers`) or user `~/.claude.json`. Merge — do not wipe other servers.

## Tools

| Tool | Role |
|------|------|
| `scan_secrets` | Runs gitleaks (worktree + git history). Verdict from exit code `0` / `1` / other (`ERROR`). |
| `scan_code` | Runs opengrep against the combined Sentinel + MIT GitLab ruleset. Findings expose `ruleSource` and namespaced `sentinel.*` / `gitlab.*` ids. |
| `scan_trivy` | Dependency CVEs + infrastructure misconfig. |
| `design_start` / `design_record` | **Experimental / advisory.** Persist a design checklist and decisions to `.sentinel/design.json`. Never gates `ship_readiness`. |
| `ship_readiness` | Gate. `PASS` only if every `requiredChecks` entry has a fresh **full** ledger `PASS` for the current tree hash. No force/skip flags. Incremental entries are rejected. Design is reported separately and never blocks. |
| `sentinel_status` | Diagnostics: runner, toolchain, policy, branch, mode, cache, ledger, **capabilities**, **coverage**, design-use signals. Not a security verdict. |
| `sentinel_coverage` | Combined language coverage matrix — applicable rules and plainly stated gaps across 12 claimed vulnerability classes. |

Typical flow: `design_start` (optional) → `scan_secrets` → `scan_code` → fix findings if needed → `ship_readiness`.

### Testing gates (advisory)

`sentinel check` always runs an advisory testing pass (never in `requiredChecks`):

- **Suite presence** — high finding if the tree has no tests / harness (one summary).
- **Changed files without tests** — medium summary finding; naming heuristic, coverage only when all/include semantics are confirmed.
- **JUnit report** — read only. Fresh report at `.sentinel/test-results/junit.xml` (or `testing.reportPaths`) yields a real pass/fail for that tool. **No report → unchecked and silent** (expected locally; reports are gitignored build artifacts).
- Optional `testing.command` (argv array, allowlisted binary) may run only in **blocking** mode. Never from `sentinel scan`.

CI must run tests **before** Sentinel with a reporter — see `.github/workflows/sentinel.yml`. That ordering is required for test verification to work.

### `.sentinel/design.json` and git

Design records are **committed** so a four-person team shares the same checklist and decisions. Expect occasional PR merge conflicts on this file; if that becomes painful, prefer a merge driver over gitignoring it — a gitignored design record helps nobody.

`.sentinel/test-results/` is a build artifact (JUnit / coverage) — do not commit it.

## Accepted debt

The sanctioned override for a finding that would fail the gate: a committed
`.sentinel/accepted.json` entry keyed by fingerprint, with a reason and an expiry.

```bash
npx sentinel accept <fingerprint> --reason "Public read-only endpoint; CORS intentional."
npx sentinel accept --list
npx sentinel accept --prune
```

There is **no** MCP `accept_finding` tool and **no** scan-time accept argument.
Acceptance is an operator/CI action via the CLI. An agent with shell access can
still run `sentinel accept` and commit the result next to the vulnerability —
that is the same trust model as editing `failOn` in config.

**The tool makes abuse visible. It does not make it impossible.** This is only a
boundary if review of `accepted.json` diffs is part of it. Pretending otherwise
would be the dishonest part.

Load-bearing properties:

- Per-fingerprint only — never a rule-wide or file-wide mute
- Reason is mandatory paperwork (empty / whitespace / single token rejected). It
  is not proof of judgment; an agent will write grammatical, empty reasons
- `policy.debtExpiryDays` is both default and maximum (default 90). Hard ceiling
  180 regardless of configuration. `--expires-in` above the cap is **rejected**
  with the cap named — never silently clamped
- Any severity may be accepted under that single global cap. Critical acceptances
  are listed individually in the gate summary
- Acceptance demotes the finding from `blocking` when the scan verdict and ledger
  entry are computed — findings stay in `findings`
- `acceptedBy` is derived from git config when available and is never authentication
- `expiresAt` compares as end of day UTC
- Project-level summary findings fingerprint on a constant snippet, so one
  acceptance covers the whole finding — that is intentional, not a rule mute

## `sentinel.config.json`

Optional file at the scan root. Defaults:

```json
{
  "runner": "native",
  "protectedBranches": ["main", "master", "production", "release"],
  "requiredChecks": ["gitleaks", "opengrep"],
  "failOn": {
    "gitleaks": ["critical", "high", "medium"],
    "opengrep": ["critical", "high"]
  }
}
```

Mode resolution (`resolveMode`):

1. `intent === "deploy"` → blocking
2. Current branch in `protectedBranches` → blocking
3. Detached HEAD or not a git repo → blocking (fail closed)
4. Otherwise → advisory

In advisory mode findings are still reported, but `blocking` is empty and the scan verdict is `PASS`. Overrides belong in this config file (an auditable diff), not in tool arguments.

## Opengrep

### Why opengrep (not Semgrep)

Semgrep ships as a Python package. Opengrep ships self-contained, Cosign-signed single binaries that bundle their own runtime — which is what keeps Sentinel's native runner viable without Docker. Opengrep is a fork of the Semgrep OSS engine and consumes the same YAML rule syntax.

### Verified CLI (opengrep 1.26.0)

```
opengrep scan --config <rules-dir> --json -o <report.json> --error --disable-version-check <targets…>
```

| Flag | Purpose |
|------|---------|
| `scan` | Subcommand that runs rules on targets |
| `--config` | YAML file, or directory of `.yml`/`.yaml` rules |
| `--json` / `-o` | JSON report written to a file (portable; avoids `/dev/stdout`) |
| `--error` | **Exit 1 when there are findings** (without it, findings still exit 0) |
| `--disable-version-check` | No network version probe |

**Exit-code semantics (verified empirically):**

| Exit | Meaning |
|------|---------|
| `0` | Clean (or findings when `--error` is absent — do not use that mode) |
| `1` | Findings present (`--error` set) |
| `7` | Invalid / missing configuration |
| other | Scanner / parse / fatal error → Sentinel maps to `ERROR` |

With `--error`, the contract matches gitleaks: `0` = clean, `1` = findings, anything else = tool broken. Verdicts are therefore still derived from the process exit code, not from "we saw findings in the JSON."

### Rule licences and provenance

Before writing any rules we checked [`semgrep/semgrep-rules`](https://github.com/semgrep/semgrep-rules): its LICENSE is the **Semgrep Rules License v1.0** (GitHub SPDX: `NOASSERTION` / "Other"), which is **not** a permissive open-source licence and would constrain how Sentinel can be distributed if we vendored those rules.

Sentinel keeps **one** authored rule in `rules/core/` (`command-injection`).
Seven more sit staged (not loaded) under `rules/stack/` for future packs.
Stack packs under `packs/` load only when detected (dependency or path signals) —
see `packs/README.md`. The Supabase pack is the first: RLS coverage across
migrations plus a service-role client-exposure rule. Detected packs join
`requiredChecks` dynamically; undetected packs contribute nothing.
The default scanner loads core + the pinned GitLab SAST corpus under
`rules/vendor/gitlab/`; findings are namespaced (`sentinel.*` / `gitlab.*` /
`pack.*`) and carry `ruleSource: "core" | "vendor" | "pack"`. Rules whose
languages do not intersect the scan root are not loaded.

The GitLab repository is **not uniformly MIT**. At pinned commit
`d580dedc604363a7606bc0a7192f4edf3e675cae`, Sentinel vendors 244 files with
explicit GitLab MIT headers and preserves the upstream `LICENSE` verbatim.
Excluded: `doc/` (CC BY-SA 4.0), `rules/gitlab/` (GitLab EE), `rules/lgpl/`
(LGPL v3), `rules/lgpl-cc/` (LGPL v2.1 + Commons Clause), 62 GPL-2.0 rules,
and 26 Apache-2.0 rules. Full details are in `ATTRIBUTION.md` and
`rules/vendor/gitlab/VENDORED.json`. Re-vendor audibly with:

```bash
npm run update-rules -- <40-character-commit-sha>
```

### Active core rule

| Rule | Severity | Languages | Focus |
|------|----------|-----------|-------|
| `command-injection` | critical | Python | `os.system` / `os.popen` / `subprocess(..., shell=True)` |

Kept because it is narrower than GitLab's Python exec family (which also flags
generic `shell=True`, `exec`, and path wildcards) and had a lower clean-corpus
FP rate. Staged rules and the drop list live in `rules/stack/README.md`.

**Coverage is not “all rules for every language.”** Call `sentinel_coverage`
(also shown in `sentinel_status`) for the generated matrix. Gaps are stated as
plainly as coverage. FP budgets are value-scaled by CVE detection
(HIT→3.0/10k, PARTIAL→1.5, nothing→0.5); over-budget and quality rules land in
`rules/disabled.json`. Shipping baseline
(`benchmark/reports/2026-07-26-baseline.md`): **2.39 FP/10k**, HIT/PARTIAL/MISS
1/5/9, 79 active rules after language filter + disables.

### Runner capability check

At startup (and in `sentinel_status`), Sentinel checks whether the configured runner can actually execute each `requiredChecks` tool. Docker with no pinned opengrep image is reported plainly — scans still return `ERROR`, but the message names the cause and the fix. **Sentinel never auto-switches runners.**

### Benchmark

Third-party validation lives under `benchmark/` and is **not** part of `npm test`:

```bash
npm run benchmark          # shipping baseline → reports/YYYY-MM-DD-baseline.md
npm run benchmark:fetch    # shallow-clone pinned SHAs into benchmark/.cache/
npm run benchmark:packs    # Supabase pack vs packs-corpus.json (not mixed into FP/10k)
npm run benchmark:perf     # combined rules, 8-file incremental + ~50k LOC full
```

- **False-positive rate** — scan a clean corpus of pinned libraries; triage every finding into `triage/known-fp.json`. Budgets are value-scaled by CVE detection tier (HIT→3.0/10k, PARTIAL→1.5, nothing→0.5).
- **Catch rate** — for each CVE, check out `vulnerableSha` and ask whether a finding landed in a file the fix commit modified. HIT / PARTIAL / MISS are reported separately.
- **Disable by data** — over-budget and quality rules go into `rules/disabled.json` with measured rate, budget, and detection record.

Committed reports under `benchmark/reports/` are the honest answer to “does this actually work.”

### Incremental scanning

- **Advisory** + `changedFiles` supplied → `scanScope: "incremental"` (only those existing source files).
- **Blocking** / deploy → always `scanScope: "full"`, even if `changedFiles` is present.
- Incremental results are ledgered but **rejected** by `ship_readiness` (`INCREMENTAL` check state).

### Performance budget

| Scenario | Budget | Measured (Windows, opengrep 1.26.0, native) |
|----------|--------|-----------------------------------------------|
| Incremental, ≤10 changed files | < 10s | **7.10s** (8 files, combined) |
| Full scan, ~50k LOC | < 120s | **12.60s** (~50,014 LOC, combined) |

Re-measure with `npm run benchmark:perf`.

### Toolchain note

Opengrep does not publish a `checksums.txt`. `scripts/update-toolchain.ts` downloads each self-contained binary and records its SHA-256. Cosign `.sig`/`.cert` artifacts exist upstream; checksum verification against the lock file is the hard requirement. There is **no win32-arm64** asset upstream as of v1.26.0 — that platform is omitted rather than invented.

## Regenerating `toolchain.lock.json`

```bash
npm run update-toolchain                         # latest gitleaks + opengrep
npm run update-toolchain -- 8.30.1 1.26.0        # pin specific versions
```

Checksums are never invented by hand. If the network is unreachable the script writes the literal string `PENDING` and exits non-zero; `toolchain.ts` refuses to install any `PENDING` pin.

## Conventions

**Test seams are parameters, never exported mutable state.** Scanners may accept an internal options bag (e.g. `GitleaksInternals`, `OpengrepInternals`) as a second function argument for tests. Defaults always mean "full verification enabled." That bag is never part of an MCP tool schema, never a module-level `let`, and never something another module can flip for the process lifetime. A switch that disables verification must not exist in the shipped MCP surface — the same rule that governs `ship_readiness`.

## Scope

Two scanners: **gitleaks** (secrets) and **opengrep** (code). Full plumbing: tree fingerprint, ledger (with scan scope), cache, policy, native + Docker runners, toolchain install, four MCP tools. Trivy / Checkov / stack-specific checks are out of scope until a later slice.
