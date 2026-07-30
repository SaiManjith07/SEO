import { WorkspaceManager } from '@seokit/workspace';
import * as fs from 'fs';
import { EventBus } from '@seokit/events';
import { ParserPipeline } from '@seokit/parser';
import { OAuthManager, GoogleIntelligenceConnector, BingWebmasterConnector } from '@seokit/providers';
import { bootstrapVerificationEngine, PluginRegistry, ConfigLoader, matchesGlob, VerificationCache, computeHash, LocalTaskExecutor, TaskQueue, AIIntelligenceEngine, SEOFixerEngine, FixDiff } from '@seokit/core';
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
  private cache = new VerificationCache();

  constructor(workspaceManager: WorkspaceManager, eventBus: EventBus) {
    this.workspaceManager = workspaceManager;
    this.eventBus = eventBus;
  }

  public async createSession(config: SessionConfig): Promise<VerificationSession> {
    const wsSession = await this.workspaceManager.openWorkspace(config.workspaceRoot, config.options);
    const id = `session_${Math.random().toString(36).substring(2, 11)}`;
    const session = new VerificationSession(id, wsSession, config);
    this.activeSessions.set(id, session);

    // Call dynamic discovery of first-party and third-party plugins in workspace context
    await PluginRegistry.discoverAndRegister();

    try {
      session.loadedConfig = ConfigLoader.load(config.workspaceRoot);
    } catch {
      // Fallback
    }

    // Dynamically load any custom external plugins requested in the session configurations
    if (config.plugins) {
      for (const pName of config.plugins) {
        const isLoaded = PluginRegistry.getAll().some(p => p.id === pName || `@seokit/plugin-${p.id}` === pName);
        if (!isLoaded) {
          try {
            await import(pName);
          } catch {
            try {
              await import(`@seokit/plugin-${pName}`);
            } catch {
              // Unloadable paths or shorthands are skipped/ignored
            }
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
    
    const configObj = session.loadedConfig || {};
    const cacheCtx = {
      engineVersion: '3.0.0',
      configHash: computeHash(JSON.stringify(configObj)),
      pluginsHash: computeHash(JSON.stringify(plugins.map(p => p.manifest?.id || p.id)))
    };

    const pages = Object.values(website.pages).filter(page => {
      if (configObj.ignore) {
        for (const pattern of configObj.ignore) {
          if (matchesGlob(page.route, pattern)) {
            return false;
          }
        }
      }
      return true;
    });

    const executor = new LocalTaskExecutor();
    const queue = new TaskQueue(executor, 4);

    for (const page of pages) {
      queue.enqueue({
        id: page.route,
        payload: page,
        execute: async (p: any) => {
          if (signal.aborted) {
            return [];
          }

          const currentHash = computeHash(p.rawHtml || '');
          const cached = this.cache.get(p.route, currentHash, cacheCtx);
          if (cached) {
            // Trigger completed logs for cached rules
            for (const ev of cached) {
              this.eventBus.publish('RuleCompleted', {
                sessionId,
                page: p.route,
                ruleId: ev.ruleId,
                passed: ev.passed
              });
            }
            return cached;
          }

          const context = {
            ...buildLegacyContext(p, website),
            framework: frameworkMeta
          };
          const pageEvidences = await engine.verifyProject(context);

          const configuredEvidences = pageEvidences.map((ev: any) => {
            if (!ev.ruleId) return ev;
            const ruleConfig = configObj.rules?.[ev.ruleId];
            if (ruleConfig) {
              if (ruleConfig.enabled === false) {
                return null;
              }
              if (ruleConfig.severity) {
                ev.severity = ruleConfig.severity;
              }
            }
            return ev;
          }).filter((ev: any): ev is any => ev !== null);

          this.cache.set(p.route, currentHash, configuredEvidences, cacheCtx);

          for (const ev of configuredEvidences) {
            this.eventBus.publish('RuleCompleted', {
              sessionId,
              page: p.route,
              ruleId: ev.ruleId,
              passed: ev.passed
            });
          }

          return configuredEvidences;
        },
        options: {
          retries: 2,
          timeoutMs: 15000
        }
      });
    }

    const allResults = await queue.process();

    for (const res of allResults) {
      allEvidences.push(...res);
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

  public async fetchSEOIntelligence(sessionId: string): Promise<any> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const oauth = new OAuthManager(session.workspaceSession.workspacePath);
    // Write mock credentials
    if (!oauth.getCredentials('google')) {
      oauth.saveCredentials('google', {
        accessToken: 'mock_google_token',
        refreshToken: 'mock_google_refresh',
        expiryTime: Date.now() + 3600000
      });
    }
    if (!oauth.getCredentials('bing')) {
      oauth.saveCredentials('bing', {
        accessToken: 'mock_bing_token',
        refreshToken: 'mock_bing_refresh',
        expiryTime: Date.now() + 3600000
      });
    }

    const googleToken = await oauth.getValidAccessToken('google', 'secret');
    const bingToken = await oauth.getValidAccessToken('bing', 'secret');

    const googleConnector = new GoogleIntelligenceConnector(oauth);
    const bingConnector = new BingWebmasterConnector(oauth);

    const googleData = await googleConnector.fetchAnalytics('https://example.com', googleToken);
    const bingData = await bingConnector.fetchWebmasterData('https://example.com', bingToken);

    return {
      google: googleData,
      bing: bingData
    };
  }

  public async fetchAIReport(sessionId: string): Promise<any> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const mockKeywords = [
      { term: 'seo software tools', volume: 8100 },
      { term: 'seo visibility audit', volume: 1600 },
      { term: 'aeo optimize strategies', volume: 880 }
    ];

    const mockCompetitorKws = [
      'seo software tools',
      'competitor search gap analysis',
      'backlink authority opportunities'
    ];

    const mockBacklinks = [
      { url: 'https://highauthorityblog.com/resource', domainAuthority: 68 },
      { url: 'https://toxicspamlink.xyz/spam', domainAuthority: 4 }
    ];

    const clusters = AIIntelligenceEngine.clusterKeywords(mockKeywords);
    const gaps = AIIntelligenceEngine.analyzeCompetitorGaps(mockKeywords.map(k => k.term), mockCompetitorKws);
    const backlinks = AIIntelligenceEngine.auditBacklinks(mockBacklinks);

    // Mock verification evidences to seed recommendations
    const mockEvidences = [
      { ruleId: 'seo.canonical.exists', passed: false },
      { ruleId: 'performance.images.alt', passed: false }
    ];
    const recs = AIIntelligenceEngine.generateRecommendations(mockEvidences);

    return {
      recommendations: recs,
      clusters,
      gaps,
      backlinkOpportunities: backlinks.opportunities,
      toxicLinks: backlinks.toxic
    };
  }

  public generateAIDraft(sessionId: string, topic: string, keywords: string[]): string {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    return AIIntelligenceEngine.generateContentDraft(topic, keywords);
  }

  public proposeFix(sessionId: string, filePath: string, fixType: string, options: any = {}): FixDiff {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (!fs.existsSync(filePath)) {
      throw new Error(`Target file to fix does not exist: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    SEOFixerEngine.validateFixSafety(content, fixType, options);
    let modified = content;

    if (fixType === 'canonical') {
      modified = SEOFixerEngine.insertCanonical(content, options.href || 'https://example.com/url');
    } else if (fixType === 'breadcrumbs') {
      modified = SEOFixerEngine.insertBreadcrumb(content);
    } else if (fixType === 'schema') {
      modified = SEOFixerEngine.insertSchema(content, options.schema || '{}');
    } else if (fixType === 'title') {
      modified = SEOFixerEngine.optimizeMetaTitle(content, options.title || 'SEO Title');
    } else if (fixType === 'description') {
      modified = SEOFixerEngine.optimizeMetaDescription(content, options.description || 'SEO Meta Description');
    } else if (fixType === 'alt') {
      modified = SEOFixerEngine.generateImageAlt(content);
    } else if (fixType === 'headings') {
      modified = SEOFixerEngine.restructureHeadings(content);
    } else if (fixType === 'internal-link') {
      modified = SEOFixerEngine.insertInternalLink(content, options.anchor || 'Read more', options.href || '#');
    } else if (fixType === 'robots') {
      modified = SEOFixerEngine.fixRobotsTxt(content);
    }

    const diffText = SEOFixerEngine.generateDiff(content, modified);

    return {
      filePath,
      original: content,
      modified,
      diffText
    };
  }

  public applyAndBackupFix(sessionId: string, filePath: string, fixType: string, options: any = {}): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const workspaceRoot = session.workspaceSession.workspacePath;
    SEOFixerEngine.saveBackupSnapshot(workspaceRoot, filePath);

    const diff = this.proposeFix(sessionId, filePath, fixType, options);
    fs.writeFileSync(filePath, diff.modified, 'utf-8');
  }

  public restoreRollback(sessionId: string, filePath: string): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const workspaceRoot = session.workspaceSession.workspacePath;
    SEOFixerEngine.rollbackBackup(workspaceRoot, filePath);
  }

  public applyTransactionalRemediation(sessionId: string, fixes: { filePath: string; fixType: string; options: any }[]): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const workspaceRoot = session.workspaceSession.workspacePath;
    SEOFixerEngine.applyTransactionalFixes(workspaceRoot, fixes, (fPath, fType, opts) => {
      const diff = this.proposeFix(sessionId, fPath, fType, opts);
      return diff.modified;
    });
  }
}
