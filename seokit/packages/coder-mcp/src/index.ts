#!/usr/bin/env node
/**
 * @seokit/coder-mcp — General-purpose, coding-first MCP server adapter.
 *
 * Exposes files, execution runners, and local SQLite memory storage to IDE agents.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { listFiles, readFile, searchCode, applyPatch } from './tools/fileOps.js';
import { runTests, runLint, runBuild, gitDiff } from './tools/execOps.js';
import { saveMemory, loadMemory } from './tools/memoryOps.js';

const server = new McpServer({
  name: 'coder-mcp-server',
  version: '0.1.0',
});

const text = (s: string) => ({ content: [{ type: 'text' as const, text: s }] });

// ---------------------------------------------------------------------------
// Coding Core Files & Search Tools
// ---------------------------------------------------------------------------

server.registerTool(
  'list_files',
  {
    title: 'List files',
    description: 'List all files recursively in a directory, applying ignore filters.',
    inputSchema: {
      rootPath: z.string().describe('Base directory path to search'),
      filters: z.array(z.string()).optional().describe('Ignore patterns or file paths'),
    }
  },
  async ({ rootPath, filters }) => {
    try {
      const files = await listFiles(rootPath, filters || []);
      return text(JSON.stringify(files, null, 2));
    } catch (err: any) {
      return text(`Failed to list files: ${err.message}`);
    }
  }
);

server.registerTool(
  'read_file',
  {
    title: 'Read file',
    description: 'Read the contents and metadata of a file.',
    inputSchema: {
      path: z.string().describe('File path to read content from'),
    }
  },
  async ({ path: filePath }) => {
    try {
      const result = await readFile(filePath);
      return text(JSON.stringify(result, null, 2));
    } catch (err: any) {
      return text(`Failed to read file: ${err.message}`);
    }
  }
);

server.registerTool(
  'search_code',
  {
    title: 'Search code',
    description: 'Find matching lines for a regex/string query across the codebase.',
    inputSchema: {
      query: z.string().describe('Search term or regex pattern to search in code files'),
      rootPath: z.string().describe('Base path of workspace repository'),
      paths: z.array(z.string()).optional().describe('Limit search to specific subdirectories'),
    }
  },
  async ({ query, rootPath, paths }) => {
    try {
      const matches = await searchCode(query, rootPath, paths || []);
      return text(JSON.stringify(matches, null, 2));
    } catch (err: any) {
      return text(`Search failed: ${err.message}`);
    }
  }
);

server.registerTool(
  'apply_patch',
  {
    title: 'Apply unified patch',
    description: 'Apply a diff patch to the filesystem, optionally creating a git commit.',
    inputSchema: {
      patch: z.string().describe('Unified diff patch content'),
      commitMessage: z.string().optional().describe('If specified, commits the patch changes using git'),
    }
  },
  async ({ patch, commitMessage }) => {
    try {
      const result = await applyPatch(patch, commitMessage);
      return text(JSON.stringify(result, null, 2));
    } catch (err: any) {
      return text(`Patch execution failed: ${err.message}`);
    }
  }
);

// ---------------------------------------------------------------------------
// Coding Shell Check Executions
// ---------------------------------------------------------------------------

server.registerTool(
  'run_tests',
  {
    title: 'Run tests',
    description: 'Execute unit test scripts in the current project environment.',
    inputSchema: {
      testScope: z.string().optional().describe('Scope of test run (e.g. file path, describe match)'),
      env: z.record(z.string(), z.string()).optional().describe('Custom environment variables'),
    }
  },
  async ({ testScope, env }) => {
    try {
      const result = await runTests(testScope, env || {});
      return text(JSON.stringify(result, null, 2));
    } catch (err: any) {
      return text(`Test execution runner failed: ${err.message}`);
    }
  }
);

server.registerTool(
  'run_lint',
  {
    title: 'Run linter',
    description: 'Execute project rules check / linter checks.',
    inputSchema: {
      scope: z.string().optional().describe('Directory path or file scope'),
      rules: z.string().optional().describe('Custom rules configuration override'),
    }
  },
  async ({ scope, rules }) => {
    try {
      const result = await runLint(scope, rules);
      return text(JSON.stringify(result, null, 2));
    } catch (err: any) {
      return text(`Lint runner execution failed: ${err.message}`);
    }
  }
);

server.registerTool(
  'run_build',
  {
    title: 'Run build',
    description: 'Compile and build target workspace target.',
    inputSchema: {
      target: z.string().optional().describe('Build target scope'),
      env: z.record(z.string(), z.string()).optional().describe('Build environment variable overrides'),
    }
  },
  async ({ target, env }) => {
    try {
      const result = await runBuild(target, env || {});
      return text(JSON.stringify(result, null, 2));
    } catch (err: any) {
      return text(`Build runner execution failed: ${err.message}`);
    }
  }
);

server.registerTool(
  'git_diff',
  {
    title: 'Git diff',
    description: 'Retrieve current modified unstaged or base changes.',
    inputSchema: {
      baseRef: z.string().optional().describe('Git reference (e.g., origin/main) to diff against'),
    }
  },
  async ({ baseRef }) => {
    try {
      const result = await gitDiff(baseRef);
      return text(JSON.stringify(result, null, 2));
    } catch (err: any) {
      return text(`Git diff failed: ${err.message}`);
    }
  }
);

// ---------------------------------------------------------------------------
// SQLite Project Local Memory
// ---------------------------------------------------------------------------

server.registerTool(
  'save_memory',
  {
    title: 'Save project memory',
    description: 'Save structured conventions or history logs for a project.',
    inputSchema: {
      projectId: z.string().describe('Unique identifier for this project codebase'),
      key: z.string().describe('Key index name of the memory data'),
      value: z.string().describe('Structured string value or configuration text to save'),
      metadata: z.string().optional().describe('Metadata notes associated with memory record'),
    }
  },
  async ({ projectId, key, value, metadata }) => {
    try {
      const memoryId = saveMemory(projectId, key, value, metadata);
      return text(JSON.stringify({ success: true, memoryId }, null, 2));
    } catch (err: any) {
      return text(`Save memory failed: ${err.message}`);
    }
  }
);

server.registerTool(
  'load_memory',
  {
    title: 'Load project memory',
    description: 'Fetch saved memory logs or conventions for a project.',
    inputSchema: {
      projectId: z.string().describe('Unique project identification string'),
      key: z.string().optional().describe('Optional key index to fetch a single memory record'),
    }
  },
  async ({ projectId, key }) => {
    try {
      const entries = loadMemory(projectId, key);
      return text(JSON.stringify(entries, null, 2));
    } catch (err: any) {
      return text(`Load memory failed: ${err.message}`);
    }
  }
);

// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('coder-mcp server running on stdio');
}

main().catch((err) => {
  console.error('Fatal coder-mcp:', err);
  process.exit(1);
});

export * from './tools/fileOps.js';
export * from './tools/execOps.js';
export * from './tools/memoryOps.js';
