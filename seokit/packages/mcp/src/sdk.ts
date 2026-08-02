import { MCPToolRegistry, MCPResourceStreamer, validateMcpAuth } from './registry.js';

export class AgentSDK {
  private registry: MCPToolRegistry;
  private streamer: MCPResourceStreamer;
  private authToken: string;

  constructor(registry: MCPToolRegistry, streamer: MCPResourceStreamer, authToken?: string) {
    this.registry = registry;
    this.streamer = streamer;
    this.authToken = authToken || process.env.SEOKIT_SECRET || 'seokit_secret';
  }

  public async invokeTool(name: string, args: any): Promise<any> {
    const tool = this.registry.getTool(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }
    // Enforce authentication check prior to execution
    validateMcpAuth(this.authToken);
    return await tool.execute(args, this.authToken);
  }

  public subscribeToResource(resourceUri: string, callback: (event: any) => void): void {
    this.streamer.subscribe(resourceUri, callback);
  }

  public unsubscribeFromResource(resourceUri: string): void {
    this.streamer.unsubscribe(resourceUri);
  }
}
