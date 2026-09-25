import { describe, it, expect, vi } from 'vitest';
import { server } from './index.js';
import { JSONRPCMessage } from '@modelcontextprotocol/sdk/shared/format.js';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';

vi.mock('@seokit/plugin-crux', () => {
  return {
    cruxPlugin: {
      fetchRecord: vi.fn().mockResolvedValue([])
    }
  };
});

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
      setTimeout(() => {
        if (this.otherSide && this.otherSide.onmessage) {
          this.otherSide.onmessage(message);
        }
      }, 0);
    }
  }
}

describe('MCP Server Endpoints', () => {
  it('returns empty findings array when crux data is empty', async () => {
    const serverTransport = new MockTransport();
    const clientTransport = new MockTransport(serverTransport);
    serverTransport.otherSide = clientTransport;

    await server.connect(serverTransport);

    const callToolRequest = {
      jsonrpc: '2.0' as const,
      id: 1,
      method: 'tools/call',
      params: {
        name: 'get_crux_report',
        arguments: {
          url: 'https://example.com',
          mode: 'url'
        }
      }
    };

    const callPromise = new Promise<any>((resolve) => {
      clientTransport.onmessage = (msg: any) => {
        if (msg.id === 1) {
          resolve(msg);
        }
      };
    });

    await clientTransport.send(callToolRequest);
    const response = await callPromise;

    expect(response.result).toBeDefined();
    const textContent = response.result.content[0].text;
    const parsed = JSON.parse(textContent);
    
    expect(parsed.status).toBe('no_data');
    expect(parsed.findings).toEqual([]);

    await clientTransport.close();
    await serverTransport.close();
  });
});
