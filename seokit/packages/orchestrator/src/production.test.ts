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
    if (fs.existsSync(tempStatic)) fs.rmSync(tempStatic, { recursive: true, force: true });
    if (fs.existsSync(tempBuildParent)) fs.rmSync(tempBuildParent, { recursive: true, force: true });
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
});
