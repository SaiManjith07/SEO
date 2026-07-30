# Multi-Agent Orchestrator — Architecture & Phase-Wise Roadmap

This document outlines the design and implementation roadmap for the Multi-Agent Orchestration layer built on top of the `@seokit/mcp` and `@seokit/coder-mcp` servers.

---

## 1. High-Level Architecture Overview

The system divides domain logic from execution logic. Low-level capabilities (inspect files, write patches, execute tests, load memory, fetch pages) live in the MCP layer. The orchestrator package coordinates agent interactions, plans steps, maintains memory state, and implements loops.

```text
                  Planner Agent (Task Breakdown)
                                │
                                ▼
                       Orchestration Loop
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
 Knowledge Agent           Coding Agent            Critic Agent
 (KB Rules Lookup)      (Repo Modifications)    (Standard Review)
        │                       │                       │
        ▼                       ▼                       ▼
  Local Memory            Local Builders        Project Rules
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
                                ▼
                   External Verification Agent
                      (GSC / PSI / Crawler)
```

---

## 2. Phase-Wise Implementation Roadmap

We will implement this orchestration system in 5 distinct phases:

### Phase 1: Typings & Foundation Setup
*   Initialize package `@seokit/orchestrator` in `seokit/packages/orchestrator/`.
*   Define Core TypeScript schemas and types:
    *   `Task`: unique ID, type, goal, constraints, max loops.
    *   `TaskResult`: success status, findings, patch applied, exit code.
    *   `Message`: agent communication format.
    *   `Agent`: interface exposing `run(task: Task, context: Context): Promise<TaskResult>`.
*   Build the **Planner Agent** class, generating structured execution task queues from natural language prompts.

### Phase 2: Local Reasoning Loop (Core Agents)
*   **Knowledge Agent:** Retrieve rules, JSON-LD specifications, sitemap templates, and checklist instructions from the knowledge base directory.
*   **Coding Agent:** Executes code updates using `coder-mcp` tools, compiles code, runs linters, runs vitest tests, and validates local HTML output.
*   **Critic Agent:** Review patch diffs against style guides and constraints, determining code quality and standard compliance.

### Phase 3: External Agents Integration
*   **Research Agent:** Queries search engines and developer docs for updated Google/Bing search guidelines, formatting outputs into instructions.
*   **Verification Agent:** Connects to PageSpeed Insights, GSC mock wrappers, and crawlers to perform external indexability and Core Web Vitals checks.

### Phase 4: Feedback Loop State Machine
*   Implement the main orchestration runner loop.
*   Setup step-back logic (e.g. if the Critic or Verification agent fails, route the task back to the Coding agent with details of the failure).
*   Add loop-count monitoring to prevent infinite loops (default cap = 5 runs).
*   Persist run histories and project states to local memory db.

### Phase 5: CLI & Testing
*   Expose command-line utility `seokit-orchestrate` for developers.
*   Write unit and integration tests verifying task routing, agent communication, and recovery loops.
