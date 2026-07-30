#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { WorkspaceManager } from '@seokit/workspace';
import { EventBus } from '@seokit/events';
import { VerificationOrchestrator } from '@seokit/orchestrator';
import { DiagnosticMapper } from '@seokit/diagnostics';
import { PluginRegistry } from '@seokit/core';

// Import capability plugins to trigger self-registration
import '@seokit/plugin-seo';
import '@seokit/plugin-performance';
import '@seokit/plugin-accessibility';
import '@seokit/plugin-aeo';
import '@seokit/plugin-geo';

const server = new McpServer({
  name: 'seokit-v2',
  version: '2.0.0'
});

const wsManager = new WorkspaceManager();
const eventBus = new EventBus();
const orchestrator = new VerificationOrchestrator(wsManager, eventBus);

let lastReportJson: string = JSON.stringify({ message: 'No verification reports generated yet. Run a verify command first.' }, null, 2);

const text = (s: string) => ({ content: [{ type: 'text' as const, text: s }] });

// 1. verify_workspace tool
server.registerTool(
  'verify_workspace',
  {
    title: 'Verify Workspace',
    description: 'Runs workspace-wide verification checks using the platform orchestrator and maps them to editor diagnostics.',
    inputSchema: {
      workspacePath: z.string().describe('Absolute folder path of the workspace to verify.')
    }
  },
  async ({ workspacePath }: any) => {
    try {
      const session = await orchestrator.createSession({
        workspaceRoot: workspacePath,
        plugins: ['seo', 'performance', 'accessibility', 'aeo', 'geo'],
        options: {}
      });

      const evidences = await orchestrator.runVerification(session.id);
      await orchestrator.closeSession(session.id);

      const diagnostics = DiagnosticMapper.mapCollection(evidences, workspacePath);
      const report = { evidences, diagnostics };
      lastReportJson = JSON.stringify(report, null, 2);

      return text(JSON.stringify(report, null, 2));
    } catch (err: any) {
      return text(`ERROR: Workspace verification failed: ${err.message}`);
    }
  }
);

// 2. verify_page tool
server.registerTool(
  'verify_page',
  {
    title: 'Verify Page',
    description: 'Analyzes a specific page element inside the workspace, returning mapped diagnostics.',
    inputSchema: {
      workspacePath: z.string().describe('Absolute folder path of the workspace.'),
      filePath: z.string().describe('Relative path to the specific page element to verify.')
    }
  },
  async ({ workspacePath, filePath }: any) => {
    try {
      const session = await orchestrator.createSession({
        workspaceRoot: workspacePath,
        plugins: ['seo', 'performance', 'accessibility', 'aeo', 'geo'],
        options: { targetFile: filePath }
      });

      const evidences = await orchestrator.runVerification(session.id);
      await orchestrator.closeSession(session.id);

      const normalizedPath = filePath.replace(/\\/g, '/');
      const filtered = evidences.filter(e => {
        return !e.sourcePath || e.sourcePath.replace(/\\/g, '/').includes(normalizedPath);
      });

      const diagnostics = DiagnosticMapper.mapCollection(filtered, `${workspacePath}/${filePath}`);
      const report = { evidences: filtered, diagnostics };
      lastReportJson = JSON.stringify(report, null, 2);

      return text(JSON.stringify(report, null, 2));
    } catch (err: any) {
      return text(`ERROR: Page verification failed: ${err.message}`);
    }
  }
);

// 3. list_plugins tool
server.registerTool(
  'list_plugins',
  {
    title: 'List Plugins',
    description: 'Lists all capability check plugins loaded in the platform.',
    inputSchema: {}
  },
  async () => {
    const plugins = [
      { id: 'seo', name: 'SEO plugin checking standard tags, canonical links, robots, sitemaps.' },
      { id: 'performance', name: 'Performance plugin monitoring loading times, Core Web Vitals.' },
      { id: 'accessibility', name: 'Accessibility plugin checking WCAG standards compliance.' },
      { id: 'aeo', name: 'Answer Engine Optimization plugin grading AI summaries suitability.' },
      { id: 'geo', name: 'Generative Engine Optimization plugin verifying geographic trust factors.' }
    ];
    return text(JSON.stringify(plugins, null, 2));
  }
);

// 4. list_standards tool
server.registerTool(
  'list_standards',
  {
    title: 'List Standards',
    description: 'Lists governing standard codes and guidelines mappings.',
    inputSchema: {}
  },
  async () => {
    const standards = [
      { code: 'STD-04', description: 'Page Title and Meta Description markup.' },
      { code: 'STD-13', description: 'Core Web Vitals Cumulative Layout Shift.' },
      { code: 'STD-15', description: 'Geographic and Local Business address verification.' },
      { code: 'STD-21', description: 'AI Crawler extractability and answers layout structure.' }
    ];
    return text(JSON.stringify(standards, null, 2));
  }
);

// --- Expose MCP Resources ---

// A. resource://rules
server.registerResource(
  'rules',
  'resource://rules',
  {
    title: 'All Active Verification Rules',
    description: 'Markdown catalog detailing all active capability validation checks.',
    mimeType: 'text/markdown'
  },
  async (uri) => {
    const plugins = PluginRegistry.getAll();
    const rulesList: string[] = [];

    for (const plugin of plugins) {
      if (plugin.rules) {
        for (const rule of plugin.rules) {
          rulesList.push(`- **${rule.id}** (${rule.standard || 'General'}): ${rule.description}`);
        }
      }
    }

    const rulesMarkdown = [
      '# Active Verification Rules Catalog',
      '',
      ...rulesList
    ].join('\n');

    return {
      contents: [
        {
          uri: uri.href,
          mimeType: 'text/markdown',
          text: rulesMarkdown
        }
      ]
    };
  }
);

// B. resource://standards
server.registerResource(
  'standards',
  'resource://standards',
  {
    title: 'SEOKit Governing Guidelines Standards',
    description: 'Governance standards compliance rules mapping.',
    mimeType: 'text/markdown'
  },
  async (uri) => {
    const standardsMarkdown = `# SEOKit Governing Standards Guidelines

| Code | Title / Area | Description |
|---|---|---|
| STD-04 | Metadata | Page title, meta descriptions, open graph tags. |
| STD-13 | Web Vitals | LCP, FID, CLS, payloads, and rendering speeds. |
| STD-15 | Geo Trust | Citations, Local Business address, named quotes. |
| STD-21 | AI Engines | AI Crawler access rules, extractability scores. |
| STD-22 | Content Chunking | 40-60 words lead answer blocks, question subheadings. |
`;
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: 'text/markdown',
          text: standardsMarkdown
        }
      ]
    };
  }
);

// C. resource://reports
server.registerResource(
  'reports',
  'resource://reports',
  {
    title: 'Latest Verification Report',
    description: 'JSON results payload of the most recently executed run.',
    mimeType: 'application/json'
  },
  async (uri) => {
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: 'application/json',
          text: lastReportJson
        }
      ]
    };
  }
);

// --- Expose MCP Prompts ---

// I. Explain Issue Prompt
server.registerPrompt(
  'explain_issue',
  {
    title: 'Explain Verification Issue',
    description: 'Exposes an issue explanation request template.',
    argsSchema: {
      ruleId: z.string().describe('The verification rule ID that failed.'),
      details: z.string().describe('The specific failure check details.')
    }
  },
  async (args) => {
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Explain why rule "${args.ruleId}" failed with the following details: "${args.details}". Provide background context and step-by-step remediation advice.`
          }
        }
      ]
    };
  }
);

// II. Explain Rule Prompt
server.registerPrompt(
  'explain_rule',
  {
    title: 'Explain Standard Rule Intent',
    description: 'Explains standard rules background guidelines.',
    argsSchema: {
      ruleId: z.string().describe('The verification rule ID.')
    }
  },
  async (args) => {
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Explain the technical standard intent and search visibility impact of the verification rule "${args.ruleId}".`
          }
        }
      ]
    };
  }
);

// III. Suggest Fix Prompt
server.registerPrompt(
  'suggest_fix',
  {
    title: 'Suggest Code Remediation Fix',
    description: 'Queries code remediation suggestions based on rule details and code snippets.',
    argsSchema: {
      ruleId: z.string().describe('The rule ID.'),
      codeSnippet: z.string().describe('The offending HTML or source code snippet.')
    }
  },
  async (args) => {
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Suggest a code remediation fix for verification rule "${args.ruleId}" on the following code snippet:\n\`\`\`html\n${args.codeSnippet}\n\`\`\`\nProvide only clean replacement code suggestions.`
          }
        }
      ]
    };
  }
);

// Stdio initialization wrapper
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('SEOKit v2 MCP Server running on stdio');
}

run().catch((err) => {
  console.error('[MCP SERVER FATAL] Failed to start:', err);
  process.exit(1);
});
