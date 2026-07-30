import { WorkspaceSession } from '@seokit/workspace';

export interface SessionConfig {
  workspaceRoot: string;
  plugins: string[];
  options: Record<string, any>;
}

export class VerificationSession {
  public id: string;
  public workspaceSession: WorkspaceSession;
  public plugins: string[];
  public options: Record<string, any>;
  public activeTasks: Set<AbortController> = new Set();
  public frameworkMetadata?: any;

  constructor(id: string, workspaceSession: WorkspaceSession, config: SessionConfig) {
    this.id = id;
    this.workspaceSession = workspaceSession;
    this.plugins = config.plugins;
    this.options = config.options;
  }

  public createAbortSignal(): AbortSignal {
    const controller = new AbortController();
    this.activeTasks.add(controller);

    controller.signal.addEventListener('abort', () => {
      this.activeTasks.delete(controller);
    });

    return controller.signal;
  }

  public cancelActiveTasks(): void {
    for (const controller of this.activeTasks) {
      controller.abort();
    }
    this.activeTasks.clear();
  }
}
