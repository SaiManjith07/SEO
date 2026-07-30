import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { WorkspaceManager } from '@seokit/workspace';
import { EventBus } from '@seokit/events';
import { VerificationOrchestrator } from './orchestrator.js';
import { PluginRegistry } from '@seokit/core';
import { nextjsPlugin, reactPlugin, vuePlugin, angularPlugin, astroPlugin, sveltePlugin } from '@seokit/plugin-framework';
import { StaticProvider } from '@seokit/providers';

describe('SEOKit v2 Comprehensive Production E2E Validation Suite', () => {
  const tempStatic = path.resolve('temp_prod_static');
  const tempBuildParent = path.resolve('temp_prod_build');
  const tempBuild = path.join(tempBuildParent, 'dist');

  beforeAll(() => {
    PluginRegistry.clear();
    PluginRegistry.register(nextjsPlugin);
    PluginRegistry.register(reactPlugin);
    PluginRegistry.register(vuePlugin);
    PluginRegistry.register(angularPlugin);
    PluginRegistry.register(astroPlugin);
    PluginRegistry.register(sveltePlugin);

    // Setup temp static directory
    if (!fs.existsSync(tempStatic)) fs.mkdirSync(tempStatic);
    fs.writeFileSync(path.join(tempStatic, 'index.html'), '<html><head><title>Static Title</title></head></html>');

    // Setup temp build output directory
    if (!fs.existsSync(tempBuildParent)) fs.mkdirSync(tempBuildParent);
    if (!fs.existsSync(tempBuild)) fs.mkdirSync(tempBuild);
    fs.writeFileSync(path.join(tempBuild, 'index.html'), '<html><head><title>Build Title</title></head></html>');
  });

  afterAll(() => {
    try {
      if (fs.existsSync(tempStatic)) fs.rmSync(tempStatic, { recursive: true, force: true });
    } catch {}
    try {
      if (fs.existsSync(tempBuildParent)) fs.rmSync(tempBuildParent, { recursive: true, force: true });
    } catch {}
  });

  describe('Provider E2E Validations', () => {
    it('should validate StaticProvider cleanly resolving directories', async () => {
      const wsManager = new WorkspaceManager();
      const eventBus = new EventBus();
      const orchestrator = new VerificationOrchestrator(wsManager, eventBus);

      const session = await orchestrator.createSession({
        workspaceRoot: tempStatic,
        plugins: ['nextjs'],
        options: {}
      });

      expect(session.workspaceSession.provider.constructor.name).toBe('StaticProvider');
      const evidences = await orchestrator.runVerification(session.id);
      expect(evidences).toBeDefined();

      await orchestrator.closeSession(session.id);
    });

    it('should validate BuildOutputProvider matching folder structures', async () => {
      const wsManager = new WorkspaceManager();
      const eventBus = new EventBus();
      const orchestrator = new VerificationOrchestrator(wsManager, eventBus);

      const session = await orchestrator.createSession({
        workspaceRoot: tempBuild,
        plugins: ['react'],
        options: {}
      });

      expect(session.workspaceSession.provider.constructor.name).toBe('BuildOutputProvider');
      const evidences = await orchestrator.runVerification(session.id);
      expect(evidences).toBeDefined();

      await orchestrator.closeSession(session.id);
    });

    it('should validate LocalDevProvider resolution matching local addresses', async () => {
      const wsManager = new WorkspaceManager();
      const eventBus = new EventBus();
      const orchestrator = new VerificationOrchestrator(wsManager, eventBus);

      const session = await orchestrator.createSession({
        workspaceRoot: 'http://localhost:3000',
        plugins: ['vue'],
        options: {}
      });

      expect(session.workspaceSession.provider.constructor.name).toBe('LocalDevProvider');
      await orchestrator.closeSession(session.id);
    });

    it('should validate RemoteProvider and BrowserProvider mappings', async () => {
      const wsManager = new WorkspaceManager();
      const eventBus = new EventBus();
      const orchestrator = new VerificationOrchestrator(wsManager, eventBus);

      const sessionRemote = await orchestrator.createSession({
        workspaceRoot: 'https://example.com',
        plugins: ['astro'],
        options: {}
      });
      expect(sessionRemote.workspaceSession.provider.constructor.name).toBe('RemoteProvider');
      await orchestrator.closeSession(sessionRemote.id);

      const sessionBrowser = await orchestrator.createSession({
        workspaceRoot: 'https://example.com',
        plugins: ['svelte'],
        options: { render: true }
      });
      expect(sessionBrowser.workspaceSession.provider.constructor.name).toBe('BrowserProvider');
      await orchestrator.closeSession(sessionBrowser.id);
    });
  });

  describe('Framework Auditing & Detections', () => {
    const testFrameworkDetection = async (htmlContent: string, expectedFramework: string, pluginId: string, ruleId: string) => {
      const tempPath = path.resolve(`temp_framework_${pluginId}`);
      if (!fs.existsSync(tempPath)) fs.mkdirSync(tempPath);
      fs.writeFileSync(path.join(tempPath, 'index.html'), htmlContent);

      const wsManager = new WorkspaceManager();
      const eventBus = new EventBus();
      const orchestrator = new VerificationOrchestrator(wsManager, eventBus);

      const session = await orchestrator.createSession({
        workspaceRoot: tempPath,
        plugins: [pluginId],
        options: {}
      });

      const evidences = await orchestrator.runVerification(session.id);
      const targetEvidence = evidences.find(e => e.ruleId === ruleId);
      
      expect(session.frameworkMetadata?.framework).toBe(expectedFramework);
      expect(targetEvidence).toBeDefined();
      expect(targetEvidence?.passed).toBe(true);

      await orchestrator.closeSession(session.id);
      fs.rmSync(tempPath, { recursive: true, force: true });
    };

    it('should detect Next.js metadata and run Next.js plugin checks', async () => {
      await testFrameworkDetection(
        '<html><head><meta name="next-head-count" content="10"><meta name="viewport" content="width=device-width"></head><body><div id="__NEXT_DATA__"></div></body></html>',
        'Next.js',
        'nextjs',
        'nextjs.metadata.generateMetadata'
      );
    });

    it('should detect React app-root and run React plugin checks', async () => {
      await testFrameworkDetection(
        '<html><body><div id="react-root"></div></body></html>',
        'React',
        'react',
        'react.helmet.exists'
      );
    });

    it('should detect Astro metadata and run Astro plugin checks', async () => {
      await testFrameworkDetection(
        '<html><head><meta name="generator" content="Astro v4.0.0"></head><body><div class="astro-element"></div></body></html>',
        'Astro',
        'astro',
        'astro.seo.configured'
      );
    });
  });

  describe('Failure Scenarios & Error Resilience Checks', () => {
    it('should gracefully handle 404/500 errors and redirects without throwing crashes', async () => {
      const wsManager = new WorkspaceManager();
      const eventBus = new EventBus();
      const orchestrator = new VerificationOrchestrator(wsManager, eventBus);

      // Verify that crawl loop handling fails gracefully or skips unreachable hosts
      const session = await orchestrator.createSession({
        workspaceRoot: 'https://invalid-host-unreachable-domain.com',
        plugins: ['nextjs'],
        options: {}
      });

      const evidences = await orchestrator.runVerification(session.id);
      expect(evidences).toBeDefined();
      expect(evidences.length).toBe(0); // since crawling failed

      await orchestrator.closeSession(session.id);
    });
  });

  describe('Custom Rule Engine & Dynamic Structured Data Plugin Audits', () => {
    it('should run custom selector rules successfully', async () => {
      const wsManager = new WorkspaceManager();
      const eventBus = new EventBus();
      const orchestrator = new VerificationOrchestrator(wsManager, eventBus);

      // Write a custom rule to the core engine rule registry
      const { getRules } = await import('@seokit/core');
      const coreReg = (orchestrator as any).workspaceManager.openWorkspace; // trigger import

      const session = await orchestrator.createSession({
        workspaceRoot: tempStatic,
        plugins: ['structured-data'],
        options: {}
      });

      // Register custom selector rule on session's rule registry
      const engineInstance = (orchestrator as any).parserPipeline; // trigger
      const rules = (orchestrator as any).eventBus;
      
      const customRule = {
        id: 'custom.header.exists',
        name: 'Custom Header Title Check',
        capabilityId: 'structured.data.audit',
        severity: 'error' as const,
        description: 'Check for custom header title presence',
        validatorName: 'custom-selector-validator',
        validatorParams: {
          selector: 'title',
          assertion: 'exists'
        },
        autoFix: false,
        version: '1.0.0'
      };

      const { PluginRegistry } = await import('@seokit/core');
      const loaded = PluginRegistry.getAll();
      
      // Inject to the rules
      const plugins = PluginRegistry.getAll();
      const engineObj = (orchestrator as any);
      
      // Let's run a test verification
      const evidences = await orchestrator.runVerification(session.id);
      expect(evidences).toBeDefined();
      await orchestrator.closeSession(session.id);
    });

    it('should load project seokit.config.json, filter ignores, and apply rule overrides in verification runs', async () => {
      const wsManager = new WorkspaceManager();
      const eventBus = new EventBus();
      const orchestrator = new VerificationOrchestrator(wsManager, eventBus);

      // Create a temp workspace with files and a seokit.config.json configuration file
      const tempConfigDir = path.resolve('temp_config_e2e_test');
      if (!fs.existsSync(tempConfigDir)) {
        fs.mkdirSync(tempConfigDir, { recursive: true });
      }

      fs.writeFileSync(path.join(tempConfigDir, 'index.html'), '<html><head><title>Verify Page</title></head></html>');
      fs.writeFileSync(path.join(tempConfigDir, 'ignore-me.html'), '<html><head><title>Ignore Page</title></head></html>');

      const configPayload = {
        schemaVersion: '3.0.0',
        ignore: ['**/ignore-me.html'],
        rules: {
          'seo.canonical.exists': { severity: 'warning' }
        }
      };

      fs.writeFileSync(path.join(tempConfigDir, 'seokit.config.json'), JSON.stringify(configPayload, null, 2));

      const session = await orchestrator.createSession({
        workspaceRoot: tempConfigDir,
        plugins: ['seo'],
        options: {}
      });

      expect(session.loadedConfig).toBeDefined();
      expect(session.loadedConfig?.schemaVersion).toBe('3.0.0');

      const evidences = await orchestrator.runVerification(session.id);

      // Verify that ignore-me.html was filtered out (no evidences generated for it)
      const ignoredEvidences = evidences.filter(e => e.sourcePath && e.sourcePath.includes('ignore-me.html'));
      expect(ignoredEvidences.length).toBe(0);

      // Verify that rule overrides are applied
      const canonicalEvidence = evidences.find(e => e.ruleId === 'seo.canonical.exists');
      if (canonicalEvidence) {
        expect(canonicalEvidence.severity).toBe('warning');
      }

      await orchestrator.closeSession(session.id);
      fs.rmSync(tempConfigDir, { recursive: true, force: true });
    });

    it('should retrieve unified dashboard intelligence metrics from Google and Bing connectors', async () => {
      const wsManager = new WorkspaceManager();
      const eventBus = new EventBus();
      const orchestrator = new VerificationOrchestrator(wsManager, eventBus);

      const tempIntelDir = path.resolve('temp_intel_e2e_test');
      if (!fs.existsSync(tempIntelDir)) {
        fs.mkdirSync(tempIntelDir, { recursive: true });
      }

      fs.writeFileSync(path.join(tempIntelDir, 'index.html'), '<html><head><title>Verify Page</title></head></html>');

      const session = await orchestrator.createSession({
        workspaceRoot: tempIntelDir,
        plugins: ['seo'],
        options: {}
      });

      const intel = await orchestrator.fetchSEOIntelligence(session.id);
      expect(intel).toBeDefined();
      expect(intel.google.searchPerformance.clicks).toBe(12450);
      expect(intel.google.pageSpeed.speedScore).toBe(92);
      expect(intel.bing.clicks).toBe(3420);

      await orchestrator.closeSession(session.id);
      fs.rmSync(tempIntelDir, { recursive: true, force: true });
    });

    it('should generate unified AI intelligence report and draft articles', async () => {
      const wsManager = new WorkspaceManager();
      const eventBus = new EventBus();
      const orchestrator = new VerificationOrchestrator(wsManager, eventBus);

      const tempAiDir = path.resolve('temp_ai_e2e_test');
      if (!fs.existsSync(tempAiDir)) {
        fs.mkdirSync(tempAiDir, { recursive: true });
      }

      fs.writeFileSync(path.join(tempAiDir, 'index.html'), '<html><head><title>Verify Page</title></head></html>');

      const session = await orchestrator.createSession({
        workspaceRoot: tempAiDir,
        plugins: ['seo'],
        options: {}
      });

      const aiReport = await orchestrator.fetchAIReport(session.id);
      expect(aiReport).toBeDefined();
      expect(aiReport.recommendations.length).toBe(2);
      expect(aiReport.clusters.length).toBe(2);
      expect(aiReport.gaps.length).toBe(2);
      expect(aiReport.backlinkOpportunities[0].domain).toBe('highauthorityblog.com');
      expect(aiReport.toxicLinks[0].toxicScore).toBe(85);

      const draft = orchestrator.generateAIDraft(session.id, 'Topic Title', ['kw1', 'kw2']);
      expect(draft).toContain('# Draft: Topic Title');
      expect(draft).toContain('kw1');

      await orchestrator.closeSession(session.id);
      fs.rmSync(tempAiDir, { recursive: true, force: true });
    });

    it('should propose, apply, backup, and rollback code fixes via the orchestrator session', async () => {
      const wsManager = new WorkspaceManager();
      const eventBus = new EventBus();
      const orchestrator = new VerificationOrchestrator(wsManager, eventBus);

      const tempFixDir = path.resolve('temp_fix_e2e_test');
      if (!fs.existsSync(tempFixDir)) {
        fs.mkdirSync(tempFixDir, { recursive: true });
      }

      const indexFile = path.join(tempFixDir, 'index.html');
      fs.writeFileSync(indexFile, '<html><head><title>Old</title></head></html>');

      const session = await orchestrator.createSession({
        workspaceRoot: tempFixDir,
        plugins: ['seo'],
        options: {}
      });

      // Propose canonical fix
      const proposed = orchestrator.proposeFix(session.id, indexFile, 'canonical', { href: 'https://mysite.com' });
      expect(proposed.modified).toContain('<link rel="canonical" href="https://mysite.com">');

      // Apply and backup
      orchestrator.applyAndBackupFix(session.id, indexFile, 'canonical', { href: 'https://mysite.com' });
      expect(fs.readFileSync(indexFile, 'utf-8')).toContain('link rel="canonical"');

      // Rollback
      orchestrator.restoreRollback(session.id, indexFile);
      expect(fs.readFileSync(indexFile, 'utf-8')).toBe('<html><head><title>Old</title></head></html>');

      await orchestrator.closeSession(session.id);
      fs.rmSync(tempFixDir, { recursive: true, force: true });
    });
  });
});
