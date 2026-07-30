import { WorkspaceManager } from '@seokit/workspace';
import { EventBus } from '@seokit/events';
import { ParserPipeline } from '@seokit/parser';
import { bootstrapVerificationEngine, PluginRegistry } from '@seokit/core';
import { Page, Website } from '@seokit/website';
import { FrameworkDetector } from '@seokit/framework-detector';
import { VerificationSession, SessionConfig } from './session.js';

export interface VerificationContext {
  website: Website;
  currentPage?: Page;
}

export function buildLegacyContext(page: Page, website: Website): any {
  return {
    rawHtml: page.rawHtml,
    filePath: page.route,
    robotsTxt: website.robotsTxt,
    sitemapXml: website.sitemapXml,
    config: {
      aiCrawlers: [
        'Googlebot',
        'Google-Extended',
        'OAI-SearchBot',
        'Claude-SearchBot',
        'PerplexityBot',
        'Bingbot'
      ]
    }
  };
}

export class VerificationOrchestrator {
  private workspaceManager: WorkspaceManager;
  private eventBus: EventBus;
  private activeSessions: Map<string, VerificationSession> = new Map();
  private parserPipeline = new ParserPipeline();

  constructor(workspaceManager: WorkspaceManager, eventBus: EventBus) {
    this.workspaceManager = workspaceManager;
    this.eventBus = eventBus;
  }

  public async createSession(config: SessionConfig): Promise<VerificationSession> {
    const wsSession = await this.workspaceManager.openWorkspace(config.workspaceRoot, config.options);
    const id = `session_${Math.random().toString(36).substring(2, 11)}`;
    const session = new VerificationSession(id, wsSession, config);
    this.activeSessions.set(id, session);

    // Dynamically load any custom external plugins requested in the session configurations
    if (config.plugins) {
      for (const pName of config.plugins) {
        const isLoaded = PluginRegistry.getAll().some(p => p.id === pName);
        if (!isLoaded) {
          try {
            await import(pName);
          } catch {
            // Unloadable paths or shorthands are skipped/ignored
          }
        }
      }
    }

    this.eventBus.publish('WorkspaceOpened', {
      sessionId: id,
      workspacePath: config.workspaceRoot
    });

    return session;
  }

  public getSession(id: string): VerificationSession | undefined {
    return this.activeSessions.get(id);
  }

  public async runVerification(sessionId: string): Promise<any[]> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const signal = session.createAbortSignal();

    this.eventBus.publish('VerificationStarted', { sessionId });

    if (signal.aborted) {
      this.eventBus.publish('VerificationFinished', { sessionId, status: 'aborted' });
      return [];
    }

    this.eventBus.publish('ProgressEvent', {
      sessionId,
      message: 'Acquiring raw resources from provider...',
      percent: 20
    });

    const rawResources = await session.workspaceSession.provider.acquireRawResources();

    if (signal.aborted) {
      this.eventBus.publish('VerificationFinished', { sessionId, status: 'aborted' });
      return [];
    }

    this.eventBus.publish('ProgressEvent', {
      sessionId,
      message: `Acquired ${rawResources.length} resources. Parsing content model...`,
      percent: 40
    });

    const website = await this.parserPipeline.parse(rawResources);

    if (signal.aborted) {
      this.eventBus.publish('VerificationFinished', { sessionId, status: 'aborted' });
      return [];
    }

    this.eventBus.publish('PageParsed', {
      sessionId,
      pagesCount: Object.keys(website.pages).length
    });

    // Detect framework metadata
    const frameworkMeta = FrameworkDetector.detect(website, rawResources);
    session.frameworkMetadata = frameworkMeta;

    this.eventBus.publish('FrameworkDetected', {
      sessionId,
      framework: frameworkMeta.framework,
      version: frameworkMeta.version,
      renderingMode: frameworkMeta.renderingMode,
      confidence: frameworkMeta.confidence
    });

    // Load registered plugins dynamically from PluginRegistry
    const plugins = PluginRegistry.getAll();
    const engine = bootstrapVerificationEngine(plugins);
    const allEvidences: any[] = [];
    const pages = Object.values(website.pages);

    let progressIndex = 0;
    for (const page of pages) {
      if (signal.aborted) {
        this.eventBus.publish('VerificationFinished', { sessionId, status: 'aborted' });
        return allEvidences;
      }

      progressIndex++;
      const currentPercent = Math.min(95, 40 + Math.round((progressIndex / pages.length) * 50));

      this.eventBus.publish('ProgressEvent', {
        sessionId,
        message: `Verifying page: ${page.route}`,
        percent: currentPercent
      });

      const context = {
        ...buildLegacyContext(page, website),
        framework: frameworkMeta
      };
      const pageEvidences = await engine.verifyProject(context);

      for (const ev of pageEvidences) {
        allEvidences.push(ev);
        this.eventBus.publish('RuleCompleted', {
          sessionId,
          page: page.route,
          ruleId: ev.ruleId,
          passed: ev.passed
        });
      }
    }

    this.eventBus.publish('ProgressEvent', {
      sessionId,
      message: 'Verification sweep complete.',
      percent: 100
    });

    this.eventBus.publish('VerificationFinished', {
      sessionId,
      status: 'completed',
      evidencesCount: allEvidences.length
    });

    return allEvidences;
  }

  public async closeSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.cancelActiveTasks();
      await this.workspaceManager.closeWorkspace(session.workspaceSession.workspacePath);
      this.activeSessions.delete(sessionId);
    }
  }
}
