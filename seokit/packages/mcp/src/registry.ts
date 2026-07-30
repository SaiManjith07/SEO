export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
  execute: (args: any, authToken?: string) => Promise<any>;
}

export class MCPToolRegistry {
  private tools = new Map<string, MCPTool>();

  public register(tool: MCPTool): void {
    this.tools.set(tool.name, tool);
  }

  public getTool(name: string): MCPTool | undefined {
    return this.tools.get(name);
  }

  public listTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  public clear(): void {
    this.tools.clear();
  }
}

export interface StreamEvent {
  type: string;
  payload: any;
}

export class MCPResourceStreamer {
  private activeStreams = new Map<string, (event: StreamEvent) => void>();

  public subscribe(resourceUri: string, callback: (event: StreamEvent) => void): void {
    this.activeStreams.set(resourceUri, callback);
  }

  public unsubscribe(resourceUri: string): void {
    this.activeStreams.delete(resourceUri);
  }

  public emit(resourceUri: string, event: StreamEvent): void {
    const callback = this.activeStreams.get(resourceUri);
    if (callback) {
      callback(event);
    }
  }
}

export function validateMcpAuth(authToken?: string, expectedToken: string = 'seokit_secret'): boolean {
  if (!authToken || authToken !== expectedToken) {
    throw new Error('Unauthorized remote MCP connection: Invalid token.');
  }
  return true;
}
