#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { server } from './index.js';

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('coder-mcp server running on stdio');
}

main().catch((err) => {
  console.error('Fatal coder-mcp:', err);
  process.exit(1);
});
