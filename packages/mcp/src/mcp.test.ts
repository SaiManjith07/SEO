import { describe, it, expect } from 'vitest';
import { MCPToolRegistry, MCPResourceStreamer, validateMcpAuth } from './registry.js';
import { AgentSDK } from './sdk.js';

describe('SEOKit v3 MCP Platform & Agent SDK Tests', () => {
  it('should register and retrieve tools dynamically in MCPToolRegistry', () => {
    const registry = new MCPToolRegistry();
    const mockTool = {
      name: 'verify_workspace',
      description: 'Run verification tests',
      inputSchema: {},
      execute: async () => 'verified'
    };

    registry.register(mockTool);
    expect(registry.listTools().length).toBe(1);
    const retrieved = registry.getTool('verify_workspace');
    expect(retrieved).toBeDefined();
    expect(retrieved?.description).toBe('Run verification tests');
  });

  it('should validate connection authentication tokens successfully', () => {
    expect(validateMcpAuth('seokit_secret')).toBe(true);
    expect(() => validateMcpAuth('invalid_token')).toThrow('Unauthorized');
    expect(() => validateMcpAuth(undefined)).toThrow('Unauthorized');
  });

  it('should execute tools and streams events via AgentSDK client sessions', async () => {
    const registry = new MCPToolRegistry();
    const streamer = new MCPResourceStreamer();

    const mockTool = {
      name: 'verify_page',
      description: 'Verify page',
      inputSchema: {},
      execute: async (args: any) => `page:${args.page}`
    };
    registry.register(mockTool);

    const sdk = new AgentSDK(registry, streamer, 'seokit_secret');

    // Invoke tool successfully
    const output = await sdk.invokeTool('verify_page', { page: 'index.html' });
    expect(output).toBe('page:index.html');

    // Reject on invalid auth tokens
    const badSdk = new AgentSDK(registry, streamer, 'bad_secret');
    await expect(badSdk.invokeTool('verify_page', { page: 'index.html' })).rejects.toThrow('Unauthorized');

    // Stream events subscription checks
    let receivedPayload: any = null;
    sdk.subscribeToResource('mcp://stream/progress', (ev) => {
      receivedPayload = ev.payload;
    });

    streamer.emit('mcp://stream/progress', { type: 'PROGRESS', payload: { percent: 50 } });
    expect(receivedPayload).toBeDefined();
    expect(receivedPayload.percent).toBe(50);
  });
});
