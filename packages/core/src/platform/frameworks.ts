import { ExecutableRule } from './rules.js';
import { TaskRecord } from './store.js';

export interface ASTNode {
  type: string;
  [key: string]: any;
}

export interface FrameworkSDK {
  id: string; // e.g. 'nextjs', 'astro', 'remix'
  version: string;
  
  // Capability Exposure
  supportsCapabilities(): string[]; // e.g. ['metadata', 'canonical', 'sitemap']

  // Detection
  detect(projectRoot: string): boolean;
  
  // File Discovery & Routing
  discoverRoutes(projectRoot: string): string[];
  resolveComponentPath(routePath: string): string;

  // AST Parsing & Manipulation
  parseFile(filePath: string): Promise<ASTNode>;
  serializeAST(ast: ASTNode, filePath: string): Promise<void>;
  
  // Metadata APIs
  getMetadata(routePath: string): Promise<Record<string, any>>;
  setMetadata(routePath: string, metadata: Record<string, any>): Promise<void>;
  
  // Project Conventions (e.g. running builds, getting config)
  getProjectConfig(projectRoot: string): Promise<Record<string, any>>;

  // Fix Execution
  executeFix(rule: ExecutableRule, task: TaskRecord, context: any): Promise<boolean>;
}

export class FrameworkRegistry {
  private sdks: Map<string, FrameworkSDK> = new Map();

  public registerSDK(sdk: FrameworkSDK): void {
    this.sdks.set(sdk.id, sdk);
  }

  public detectFramework(projectRoot: string): FrameworkSDK | null {
    for (const sdk of this.sdks.values()) {
      if (sdk.detect(projectRoot)) {
        return sdk;
      }
    }
    return null;
  }
  
  public getSDK(id: string): FrameworkSDK | undefined {
    return this.sdks.get(id);
  }

  public unregisterSDK(id: string): void {
    this.sdks.delete(id);
  }
}
