# SEOKit Agent Architecture

## System Pattern: Orchestrator + Specialists
The system uses an **Orchestrator** (Router) agent that delegates tasks to specialized **Specialist** agents. Specialists own specific disciplines, never call each other directly, and always return findings in a standard envelope to the Orchestrator.

---

## 1. ORCHESTRATOR (Router)
- **Responsibility:** Parses user intent, selects and coordinates 1..N specialists, manages parallel/serial execution graphs, and merges raw outputs into a unified, prioritized report.
- **Inputs:** `Task` (e.g. "audit mysite.com", "why did we lose ChatGPT citations")
- **Outputs:** `OrchestrationReport` (prioritized list of the top 5 actions, merged findings, confidence scores)
- **Dependencies:** Calls Specialists.
- **Success Criteria:** Properly delegates to the right specialists, never fails silently, enforces dependencies (e.g. RANK-TRACKER must run before COMPETITIVE), and aggregates all `AgentResult` objects.

---

## 2. SPECIALISTS

### 2.1 TECH-AUDITOR
- **Responsibility:** Crawlability, indexability, CrUX vitals, structured data correctness, and technical rendering health.
- **Inputs:** `AuditRequest { domain: string, paths?: string[] }`
- **Outputs:** `AgentResult` with Findings related to technical blockers.
- **MCP Servers:** `librecrawl-technical-seo-audit-mcp` (primary crawler). `jev-seo` (PLANNED — not yet available).
- **Native Plugins:** `@seokit/plugins-crux`, `@seokit/plugins-structured-data`
- **Success Criteria:** Accurately reports LCP/CLS from CrUX, correctly validates JSON-LD/Microdata, and exposes 404/500 bottlenecks.

### 2.2 CONTENT-AUDITOR
- **Responsibility:** Validates AEO/GEO content readiness (statistics density, expert citations, BLUFF/inverted pyramid structure, self-contained paragraphs).
- **Inputs:** `ContentCheckRequest { path: string, content: string }`
- **Outputs:** `AgentResult` with A-F grading and specific structural repair advice.
- **Native Plugins:** `@seokit/critic-aeolint`, `@seokit/plugins-aeo`, `@seokit/plugins-geo`
- **Success Criteria:** Never hallucinates content; executes deterministic linguistic/structural checks (e.g., verifying if headings are question-styled).

### 2.3 RANK-TRACKER
- **Responsibility:** Pulls exact query ranks, impressions, CTR, and indexing status from search engines.
- **Inputs:** `RankRequest { domain: string, days: number }`
- **Outputs:** `AgentResult` containing query-level performance and drift.
- **MCP Servers:** `gsc-mcp` (or `webmaster-mcp`), `bing-webmaster-mcp`
- **Native Plugins:** `@seokit/plugins-gsc`
- **Success Criteria:** Only reports real Google/Bing data. Must throw loud errors if API credentials are missing rather than returning `[]`.

### 2.4 AI-VISIBILITY
- **Responsibility:** Measures the site's citation share-of-voice across LLMs (ChatGPT, Perplexity, Gemini, Copilot, AI Overviews).
- **Inputs:** `VisibilityRequest { promptSet: string, dateRange: DateRange }`
- **Outputs:** `AgentResult` with visibility score, competitor share, and specific prompt gaps.
- **External API:** `Elmo` (self-hosted REST API)
- **New MCP Tool:** `get_ai_visibility_report`
- **Success Criteria:** Outputs real citation rates; correctly identifies gaps where competitors are cited for a prompt but the user is not.

### 2.5 COMPETITIVE
- **Responsibility:** Analyzes sitemap discrepancies, validates entity authority (Wikidata/Wikipedia presence), and tracks competitor AI share-of-voice.
- **Inputs:** `CompetitiveRequest { mine: string, theirs: string[] }`
- **Outputs:** `AgentResult` with sitemap diffs, entity gap analysis, and content gap briefs.
- **Native Plugins:** `@seokit/plugins-competitive`
- **Success Criteria:** Sitemap diff successfully identifies missing pages without crashing. Entity lookups successfully query real SPARQL endpoints.

### 2.6 OFF-SITE
- **Responsibility:** Tracks off-site brand mentions, sentiment on Reddit/HN, and backlink signals/domain authority proxies.
- **Inputs:** `OffsiteRequest { brand: string, domain: string }`
- **Outputs:** `AgentResult` detailing inbound link graphs and brand sentiment.
- **MCP Servers:** Apify Reddit Brand Monitor (PLANNED — pending Apify setup)
- **Native Plugins:** `@seokit/plugins-backlinks` (Common Crawl on BigQuery)
- **Success Criteria:** Backlink discovery runs as a batch query against BigQuery without timeouts. Validates Reddit sentiment via APIs, never hallucinating mentions.

### 2.7 ATTRIBUTION
- **Responsibility:** Measures downstream conversions and traffic referred explicitly by AI engines (ChatGPT, Claude, Perplexity, etc.).
- **Inputs:** `AttributionRequest { propertyId: string, days: number }`
- **Outputs:** `AgentResult` with time-series traffic and conversion counts by AI source.
- **MCP Servers:** `ga4-mcp` (or `google-analytics-mcp`)
- **Native Plugins:** `@seokit/plugins-ga4`
- **Success Criteria:** Accurately maps referrer domains (e.g. `chatgpt.com`, `perplexity.ai`) to traffic numbers; throws cleanly if GA4 lacks permissions.

### 2.8 ORCHESTRATOR-SUMMARY
- **Responsibility:** The final pass agent that synthesizes the raw merged findings into the conclusive "Next 5 Actions" list.
- **Inputs:** `AgentResult[]` (from all other Specialists)
- **Outputs:** `FinalReport` (HTML/Markdown)
- **Success Criteria:** Does not invent new findings; solely prioritizes and formats the confirmed gaps and errors into actionable tasks.

---

## Agent Interfaces

All agents implement the standard interface:
```typescript
interface Agent {
  name: string;
  canHandle(task: Task): boolean;
  run(task: Task, context: Context): Promise<AgentResult>;
}
```

Returning strict evidence objects:
```typescript
interface AgentResult {
  findings: Finding[];
  raw: any;               // The raw API/Tool output for auditability
  dataSources: string[];  // Which endpoints/MCPs were called
  confidence: 'high' | 'medium' | 'low';
  errors: AgentError[];   // Loud failures, e.g., missing credentials
}
```
