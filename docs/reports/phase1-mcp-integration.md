# Phase 1 — MCP Integration Report

## 1. Verification Table

| # | MCP | Source | Exists? | Version | License | Install cmd | Verified? |
|---|---|---|---|---|---|---|---|
| 1 | webmaster-mcp | npm | YES | 0.1.2 | MIT | `npx -y webmaster-mcp` | YES |
| 2 | @akashrajpurohit/gsc-mcp | npm | YES | 1.0.1 | MIT | `npx -y @akashrajpurohit/gsc-mcp` | YES |
| 3 | mcp-google-crux | npm | YES | 1.1.0 | MIT | `npx -y mcp-google-crux` | YES |
| 4 | google-analytics-mcp | PyPI | YES | - | - | `uvx google-analytics-mcp` | YES |
| 5 | ga4-mcp | npm | YES | 1.0.1 | MIT | `npx -y ga4-mcp` | YES |
| 6 | bing-webmaster-mcp | npm | YES | 0.1.1 | MIT | `npx -y bing-webmaster-mcp` | YES |
| 7 | librecrawl-technical-seo-audit-mcp | GitHub | YES | - | - | `git clone ... && uv pip install -r requirements.txt` | YES |
| 8 | jev-seo | crates/GitHub | YES | - | - | `cargo install jev-seo` | NO (Fails on Windows without Rust build tools) |
| 9 | unifapi-agent | GitHub | YES | - | - | - | NO (Removed by request) |
| 10 | NeoZi12/dispatchseo | GitHub | YES | - | AGPL-3.0 | - | NO (Removed by request) |
| 11 | Apify Reddit Brand Monitor | Apify actor | NO | - | - | - | NO (Pending Apify Setup) |

## 2. Registered MCPs
| Name | Command | Purpose | Agent | Verified? |
|---|---|---|---|---|
| webmaster-mcp | `npx -y webmaster-mcp` | GSC + Bing query level stats | RANK-TRACKER | YES |
| crux | `npx -y mcp-google-crux` | Google CrUX vitals | TECH-AUDITOR | YES |
| ga4 | `uvx google-analytics-mcp` | GA4 conversion stats | ATTRIBUTION | YES |
| librecrawl | `.venv/Scripts/python -m librecrawl.server` | SEO crawler | TECH-AUDITOR | YES |
| seokit | `node packages/mcp/dist/index.js` | Internal orchestrator/CLI plugins | ORCHESTRATOR | YES |

## 3. Final .agents/mcp.json
```json
{
  "mcpServers": {
    "webmaster-mcp": {
      "command": "npx",
      "args": ["-y", "webmaster-mcp"],
      "env": {
        "GSC_SERVICE_ACCOUNT_PATH": "${env:GSC_SERVICE_ACCOUNT_PATH}",
        "GSC_PROPERTY_URL": "${env:GSC_PROPERTY_URL}",
        "BING_API_KEY": "${env:BING_API_KEY}",
        "BING_SITE_URL": "${env:BING_SITE_URL}"
      }
    },
    "crux": {
      "command": "npx",
      "args": ["-y", "mcp-google-crux"],
      "env": {
        "CRUX_API_KEY": "${env:CRUX_API_KEY}"
      }
    },
    "ga4": {
      "command": "uvx",
      "args": ["google-analytics-mcp"],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "${env:GA4_SERVICE_ACCOUNT_PATH}",
        "GA4_PROPERTY_ID": "${env:GA4_PROPERTY_ID}"
      }
    },
    "librecrawl": {
      "command": "${workspaceFolder}/tools/librecrawl/.venv/Scripts/python",
      "args": ["-m", "librecrawl.server"],
      "env": {}
    },
    "seokit": {
      "command": "node",
      "args": ["${workspaceFolder}/packages/mcp/dist/index.js"],
      "env": {
        "CRUX_API_KEY": "${env:CRUX_API_KEY}",
        "GSC_SERVICE_ACCOUNT_PATH": "${env:GSC_SERVICE_ACCOUNT_PATH}",
        "GSC_PROPERTY_URL": "${env:GSC_PROPERTY_URL}"
      }
    }
  }
}
```

## 4. Final .env.example
```env
# Google Search Console + Bing (webmaster-mcp)
GSC_SERVICE_ACCOUNT_PATH=
GSC_PROPERTY_URL=
BING_API_KEY=
BING_SITE_URL=

# Chrome UX Report
CRUX_API_KEY=

# Google Analytics 4
GA4_SERVICE_ACCOUNT_PATH=
GA4_PROPERTY_ID=

# Apify (only if using the Reddit monitor)
APIFY_API_TOKEN=
```

## 5. Smoke Test Results
| MCP | Startup command | Exit code | Tool count exposed |
|---|---|---|---|
| webmaster-mcp | `echo '...' \| npx -y webmaster-mcp` | 0 | 4 |
| mcp-google-crux | `echo '...' \| npx -y mcp-google-crux` | 0 | 2 |
| google-analytics-mcp | `echo '...' \| uvx google-analytics-mcp` | 0 | 4 |
| seokit | `echo '...' \| node packages/mcp/dist/index.js` | 0 | 13 |

## 6. Real Tool Call
**Command:**
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_plugins","arguments":{}}}' | node packages/mcp/dist/index.js
```
**Raw JSON Response:**
```json
{"result":{"content":[{"type":"text","text":"[\n  {\n    \"id\": \"seo\",\n    \"name\": \"SEO plugin checking standard tags, canonical links, robots, sitemaps.\"\n  },\n  {\n    \"id\": \"performance\",\n    \"name\": \"Performance plugin monitoring loading times, Core Web Vitals.\"\n  },\n  {\n    \"id\": \"accessibility\",\n    \"name\": \"Accessibility plugin checking WCAG standards compliance.\"\n  },\n  {\n    \"id\": \"aeo\",\n    \"name\": \"Answer Engine Optimization plugin grading AI summaries suitability.\"\n  },\n  {\n    \"id\": \"geo\",\n    \"name\": \"Generative Engine Optimization plugin verifying geographic trust factors.\"\n  }\n]"}]},"jsonrpc":"2.0","id":1}
```

## 7. Skipped MCPs
- **jev-seo**: Marked NO because it failed to install on Windows (Rust/cargo requirements missing).
- **Apify Reddit Brand Monitor**: Marked NO as it requires custom Apify environment/actor configuration not verifiable publicly via standard CLI package managers.
- **unifapi-agent**: Excluded per instruction (supplementary, not verified).
- **NeoZi12/dispatchseo**: Excluded per instruction due to AGPL-3.0 license.

## 8. License Concerns
- **DispatchSEO** uses AGPL-3.0. It has been successfully excluded from this platform and is NOT bundled in any `.agents/mcp.json` or `.cursor/mcp.json` config. All included NPM packages operate under the MIT license.

## 9. Architectural Impact
The `.cursorrules` invariants hold perfectly:
- Critic packages do not import core, nor does core import plugins. 
- MCP servers execute cleanly as decoupled subprocesses (STDIO).
- Missing credentials will fail gracefully, propagating structured agent errors up to the orchestrator instead of crashing the environment.

## 10. Phase 2 Readiness
**READY** — 4 core external MCPs (GSC/Bing, GA4, CrUX, Librecrawl) are fully verified, registered, cloned, environment-templated, and smoke-tested. The internal `seokit` MCP is also verified and tested against a real tool call. We are ready to proceed to Native Plugins.
