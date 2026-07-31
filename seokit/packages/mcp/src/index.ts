#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { WorkspaceManager } from '@seokit/workspace';
import { EventBus } from '@seokit/events';
import { VerificationOrchestrator } from '@seokit/orchestrator';
import { DiagnosticMapper, ReportGenerator } from '@seokit/diagnostics';
import { PluginRegistry } from '@seokit/core';

// Import capability plugins to trigger self-registration
import '@seokit/plugin-seo';
import '@seokit/plugin-performance';
import '@seokit/plugin-accessibility';
import '@seokit/plugin-aeo';
import '@seokit/plugin-geo';
import '@seokit/plugin-security';
import '@seokit/plugin-structured-data';

export const server = new McpServer({
  name: 'seokit-v3',
  version: '3.0.0'
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
        plugins: ['seo', 'performance', 'accessibility', 'aeo', 'geo', 'security', 'structured-data'],
        options: {}
      });

      const evidences = await orchestrator.runVerification(session.id);
      await orchestrator.closeSession(session.id);

      const diagnostics = DiagnosticMapper.mapCollection(evidences, workspacePath);

      // Generate reports in all 5 formats
      const durationMs = 1500;
      const pagesCount = new Set(evidences.map(e => e.sourcePath).filter(Boolean)).size || 1;
      const reportObj = ReportGenerator.createReport(evidences, durationMs, pagesCount);

      const seokitDir = path.resolve(workspacePath, '.seokit');
      const reportsDir = path.join(seokitDir, 'reports');
      const historyDir = path.join(seokitDir, 'history');

      fs.mkdirSync(reportsDir, { recursive: true });
      fs.mkdirSync(historyDir, { recursive: true });

      fs.writeFileSync(path.join(reportsDir, 'report.json'), ReportGenerator.exportToJson(reportObj));
      fs.writeFileSync(path.join(reportsDir, 'report.md'), ReportGenerator.exportToMarkdown(reportObj));
      fs.writeFileSync(path.join(reportsDir, 'report.html'), ReportGenerator.exportToHtml(reportObj));
      fs.writeFileSync(path.join(reportsDir, 'report.pdf'), ReportGenerator.exportToPdf(reportObj));
      fs.writeFileSync(path.join(reportsDir, 'report.sarif'), ReportGenerator.exportToSarif(reportObj));

      // Save to run history timeline logs
      const timestampStr = new Date().toISOString().replace(/:/g, '-');
      fs.writeFileSync(path.join(historyDir, `${timestampStr}.json`), ReportGenerator.exportToJson(reportObj));

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
        plugins: ['seo', 'performance', 'accessibility', 'aeo', 'geo', 'security', 'structured-data'],
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

// I. Audit Website Prompt
server.registerPrompt(
  'audit_website',
  {
    title: 'Audit Website SEO & Core Web Vitals',
    description: 'Runs workspace audits and reports violations.',
    argsSchema: {
      workspacePath: z.string().describe('Absolute folder path of the workspace.')
    }
  },
  async (args) => {
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Run an SEO verification audit on the workspace path: "${args.workspacePath}". List all errors and suggestions.`
          }
        }
      ]
    };
  }
);

// II. Fix SEO Prompt
server.registerPrompt(
  'fix_seo',
  {
    title: 'Fix SEO Violation',
    description: 'Apply code optimizations matching failed rules.',
    argsSchema: {
      filePath: z.string().describe('Absolute path to the target file.'),
      fixType: z.string().describe('Type of fix: title, description, canonical, or schema.')
    }
  },
  async (args) => {
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Optimize and apply a "${args.fixType}" fix on file "${args.filePath}".`
          }
        }
      ]
    };
  }
);

// III. Generate Content Prompt
server.registerPrompt(
  'generate_content',
  {
    title: 'Generate Content Draft',
    description: 'Generates SEO optimized text content draft.',
    argsSchema: {
      topic: z.string().describe('Topic theme.'),
      keywords: z.string().describe('Comma-separated list of target keywords.')
    }
  },
  async (args) => {
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Write a high-quality article draft on topic "${args.topic}" focusing on target keywords: "${args.keywords}".`
          }
        }
      ]
    };
  }
);

// IV. Analyze Competitor Prompt
server.registerPrompt(
  'analyze_competitor',
  {
    title: 'Analyze Competitor Search Gaps',
    description: 'Compares search presence against a competitor URL.',
    argsSchema: {
      competitorUrl: z.string().describe('The competitor web site address.')
    }
  },
  async (args) => {
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Identify content gaps and backlink opportunities comparing our site against competitor site: "${args.competitorUrl}".`
          }
        }
      ]
    };
  }
);

// V. Keyword Research Prompt
server.registerPrompt(
  'keyword_research',
  {
    title: 'Keyword Research & Clustering',
    description: 'Discover search terms and group them by semantic topic clusters.',
    argsSchema: {
      niche: z.string().describe('The industry niche or topic vertical.')
    }
  },
  async (args) => {
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Conduct search keyword research for the niche: "${args.niche}". Group related keywords into semantic clusters.`
          }
        }
      ]
    };
  }
);

// Explain Issue Prompt
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

// 6. get_seo_intelligence tool
server.registerTool(
  'get_seo_intelligence',
  {
    title: 'Get SEO Intelligence',
    description: 'Fetch and display Google Search Console, GA4, Bing Webmaster, and PageSpeed unified dashboard metrics.',
    inputSchema: {
      workspacePath: z.string().describe('Absolute folder path of the workspace.')
    }
  },
  async ({ workspacePath }: any) => {
    try {
      const session = await orchestrator.createSession({
        workspaceRoot: workspacePath,
        plugins: ['seo'],
        options: {}
      });

      const intel = await orchestrator.fetchSEOIntelligence(session.id);
      await orchestrator.closeSession(session.id);

      return text(JSON.stringify(intel, null, 2));
    } catch (err: any) {
      return text(`ERROR: Fetching SEO Intelligence failed: ${err.message}`);
    }
  }
);

// 7. get_ai_recommendations tool
server.registerTool(
  'get_ai_recommendations',
  {
    title: 'Get AI Recommendations',
    description: 'Fetch AI SEO recommendations, keyword clusters, and competitor search gaps.',
    inputSchema: {
      workspacePath: z.string().describe('Absolute folder path of the workspace.')
    }
  },
  async ({ workspacePath }: any) => {
    try {
      const session = await orchestrator.createSession({
        workspaceRoot: workspacePath,
        plugins: ['seo'],
        options: {}
      });

      const report = await orchestrator.fetchAIReport(session.id);
      await orchestrator.closeSession(session.id);

      return text(JSON.stringify(report, null, 2));
    } catch (err: any) {
      return text(`ERROR: Fetching AI recommendations failed: ${err.message}`);
    }
  }
);

// 8. generate_seo_content tool
server.registerTool(
  'generate_seo_content',
  {
    title: 'Generate SEO Content Draft',
    description: 'Generate an SEO-optimized content draft based on target topic and keywords.',
    inputSchema: {
      workspacePath: z.string().describe('Absolute folder path of the workspace.'),
      topic: z.string().describe('The primary article topic.'),
      keywords: z.array(z.string()).describe('Target search keywords.')
    }
  },
  async ({ workspacePath, topic, keywords }: any) => {
    try {
      const session = await orchestrator.createSession({
        workspaceRoot: workspacePath,
        plugins: ['seo'],
        options: {}
      });

      const draft = orchestrator.generateAIDraft(session.id, topic, keywords);
      await orchestrator.closeSession(session.id);

      return text(draft);
    } catch (err: any) {
      return text(`ERROR: Generating content draft failed: ${err.message}`);
    }
  }
);

// 9. apply_seo_fix tool
server.registerTool(
  'apply_seo_fix',
  {
    title: 'Apply SEO Fix',
    description: 'Apply an automated SEO code fix to a specific file with backup snapshotting.',
    inputSchema: {
      workspacePath: z.string().describe('Absolute folder path of the workspace.'),
      filePath: z.string().describe('Absolute path to the target file to modify.'),
      fixType: z.string().describe('Type of fix: canonical, breadcrumbs, schema, title, description, alt, headings, internal-link, robots.'),
      options: z.any().optional().describe('Extra options such as href, title, description, anchor, or schema json string.')
    }
  },
  async ({ workspacePath, filePath, fixType, options }: any) => {
    try {
      const session = await orchestrator.createSession({
        workspaceRoot: workspacePath,
        plugins: ['seo'],
        options: {}
      });

      const diff = orchestrator.proposeFix(session.id, filePath, fixType, options || {});
      orchestrator.applyAndBackupFix(session.id, filePath, fixType, options || {});
      await orchestrator.closeSession(session.id);

      return text(`SUCCESS: Applied fix "${fixType}" on file. Diff:\n\n${diff.diffText}`);
    } catch (err: any) {
      return text(`ERROR: Applying SEO fix failed: ${err.message}`);
    }
  }
);

// 10. rollback_seo_fix tool
server.registerTool(
  'rollback_seo_fix',
  {
    title: 'Rollback SEO Fix',
    description: 'Rollback a previously applied automated SEO fix using workspace backup snapshots.',
    inputSchema: {
      workspacePath: z.string().describe('Absolute folder path of the workspace.'),
      filePath: z.string().describe('Absolute path to the target file to rollback.')
    }
  },
  async ({ workspacePath, filePath }: any) => {
    try {
      const session = await orchestrator.createSession({
        workspaceRoot: workspacePath,
        plugins: ['seo'],
        options: {}
      });

      orchestrator.restoreRollback(session.id, filePath);
      await orchestrator.closeSession(session.id);

      return text(`SUCCESS: Rolled back changes for file: ${filePath}`);
    } catch (err: any) {
      return text(`ERROR: Rolling back SEO fix failed: ${err.message}`);
    }
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

import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express from 'express';

// Stdio initialization wrapper
async function run() {
  const args = process.argv.slice(2);
  const isSSE = args.includes('--sse');
  
  if (isSSE) {
    const app = express();
    let sseTransport: SSEServerTransport | null = null;
    
    app.get('/sse', async (req, res) => {
      sseTransport = new SSEServerTransport('/messages', res);
      await server.connect(sseTransport);
      console.log('Client connected to SSE transport.');
    });

    app.post('/messages', async (req, res) => {
      if (!sseTransport) {
        res.sendStatus(400);
        return;
      }
      await sseTransport.handlePostMessage(req, res);
    });

    const portIndex = args.indexOf('--port');
    const port = portIndex !== -1 ? parseInt(args[portIndex + 1], 10) : 3000;
    
    app.listen(port, '127.0.0.1', () => {
      console.log(`[SEOKit] MCP Server running on SSE at http://127.0.0.1:${port}/sse`);
    });
  } else {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('SEOKit v2 MCP Server running on stdio');
  }
}

if (process.env.NODE_ENV !== 'test') {
  run().catch((err) => {
    console.error('[MCP SERVER FATAL] Failed to start:', err);
    process.exit(1);
  });
}

export * from './registry.js';
export * from './sdk.js';
