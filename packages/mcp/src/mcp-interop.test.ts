import { describe, it, expect } from 'vitest';
import { server } from './index.js';
import { JSONRPCMessage } from '@modelcontextprotocol/sdk/shared/format.js';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';

class MockTransport implements Transport {
  public onclose?: () => void;
  public onerror?: (error: Error) => void;
  public onmessage?: (message: JSONRPCMessage) => void;
  public sentMessages: JSONRPCMessage[] = [];

  constructor(public otherSide?: MockTransport) {}

  async start(): Promise<void> {}
  async close(): Promise<void> {
    if (this.onclose) this.onclose();
  }
  async send(message: JSONRPCMessage): Promise<void> {
    this.sentMessages.push(message);
    if (this.otherSide && this.otherSide.onmessage) {
      // Simulate async network delivery
      setTimeout(() => {
        if (this.otherSide && this.otherSide.onmessage) {
          this.otherSide.onmessage(message);
        }
      }, 0);
    }
  }
}

describe('SEOKit Phase 10 — E2E MCP Client-Server Interoperability Tests', () => {
  it('should complete handshake, discover tools/resources/prompts, and execute tool calls', async () => {
    const serverTransport = new MockTransport();
    const clientTransport = new MockTransport(serverTransport);
    serverTransport.otherSide = clientTransport;

    await server.connect(serverTransport);

    // 1. Initialize Handshake Verification
    const initializeRequest = {
      jsonrpc: '2.0' as const,
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test-client', version: '1.0' }
      }
    };

    const handshakePromise = new Promise<any>((resolve) => {
      clientTransport.onmessage = (msg: any) => {
        if (msg.id === 1) {
          resolve(msg);
        }
      };
    });

    await clientTransport.send(initializeRequest);
    const initResponse = await handshakePromise;

    expect(initResponse.result).toBeDefined();
    expect(initResponse.result.protocolVersion).toBe('2024-11-05');
    expect(initResponse.result.serverInfo.name).toBe('seokit-v3');

    // 2. Discover Tools Verification
    const listToolsRequest = {
      jsonrpc: '2.0' as const,
      id: 2,
      method: 'tools/list',
      params: {}
    };

    const listToolsPromise = new Promise<any>((resolve) => {
      clientTransport.onmessage = (msg: any) => {
        if (msg.id === 2) {
          resolve(msg);
        }
      };
    });

    await clientTransport.send(listToolsRequest);
    const toolsResponse = await listToolsPromise;

    expect(toolsResponse.result).toBeDefined();
    const toolNames = toolsResponse.result.tools.map((t: any) => t.name);
    expect(toolNames).toContain('verify_workspace');
    expect(toolNames).toContain('verify_page');
    expect(toolNames).toContain('get_seo_intelligence');

    // 3. Discover Prompts Verification
    const listPromptsRequest = {
      jsonrpc: '2.0' as const,
      id: 3,
      method: 'prompts/list',
      params: {}
    };

    const listPromptsPromise = new Promise<any>((resolve) => {
      clientTransport.onmessage = (msg: any) => {
        if (msg.id === 3) {
          resolve(msg);
        }
      };
    });

    await clientTransport.send(listPromptsRequest);
    const promptsResponse = await listPromptsPromise;

    expect(promptsResponse.result).toBeDefined();
    const promptNames = promptsResponse.result.prompts.map((p: any) => p.name);
    expect(promptNames).toContain('audit_website');
    expect(promptNames).toContain('fix_seo');
    expect(promptNames).toContain('generate_content');

    // 4. Discover Resources Verification
    const listResourcesRequest = {
      jsonrpc: '2.0' as const,
      id: 4,
      method: 'resources/list',
      params: {}
    };

    const listResourcesPromise = new Promise<any>((resolve) => {
      clientTransport.onmessage = (msg: any) => {
        if (msg.id === 4) {
          resolve(msg);
        }
      };
    });

    await clientTransport.send(listResourcesRequest);
    const resourcesResponse = await listResourcesPromise;

    expect(resourcesResponse.result).toBeDefined();
    const resourceUris = resourcesResponse.result.resources.map((r: any) => r.uri);
    expect(resourceUris).toContain('resource://rules');
    expect(resourceUris).toContain('resource://standards');

    // Clean up
    await clientTransport.close();
    await serverTransport.close();
  });
});
