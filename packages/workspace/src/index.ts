import { resolveProvider, WebsiteProvider } from '@seokit/providers';

export interface WorkspaceSession {
  id: string;
  workspacePath: string;
  provider: WebsiteProvider;
}

export class WorkspaceManager {
  private activeWorkspaces: Map<string, WorkspaceSession> = new Map();

  /**
   * Opens or retrieves a workspace session, instantiating the correct provider subclasses.
   */
  public async openWorkspace(workspacePath: string, options: Record<string, any> = {}): Promise<WorkspaceSession> {
    const existing = this.activeWorkspaces.get(workspacePath);
    if (existing) {
      return existing;
    }

    const provider = await resolveProvider(workspacePath, options);
    await provider.initialize();

    const session: WorkspaceSession = {
      id: `ws_${Math.random().toString(36).substring(2, 11)}`,
      workspacePath,
      provider
    };

    this.activeWorkspaces.set(workspacePath, session);
    return session;
  }

  public getSessionForPath(workspacePath: string): WorkspaceSession | undefined {
    return this.activeWorkspaces.get(workspacePath);
  }

  public async closeWorkspace(workspacePath: string): Promise<void> {
    const session = this.activeWorkspaces.get(workspacePath);
    if (session) {
      await session.provider.shutdown();
      this.activeWorkspaces.delete(workspacePath);
    }
  }
}
