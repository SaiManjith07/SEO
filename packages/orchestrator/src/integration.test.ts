import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { WorkspaceManager } from '@seokit/workspace';
import { EventBus, PlatformEvent } from '@seokit/events';
import { VerificationOrchestrator } from './orchestrator.js';
import { PluginRegistry } from '@seokit/core';
import { seoPlugin } from '@seokit/plugin-seo';
import { performancePlugin } from '@seokit/plugin-performance';
import { accessibilityPlugin } from '@seokit/plugin-accessibility';
import { aeoPlugin } from '@seokit/plugin-aeo';
import { geoPlugin } from '@seokit/plugin-geo';
import { nextjsPlugin, reactPlugin, vuePlugin, angularPlugin, astroPlugin, sveltePlugin } from '@seokit/plugin-framework';

describe('Verification Orchestrator Integration with Legacy Engine', () => {
  const tempDir = path.resolve('temp_v2_integration_test_dir');

  beforeAll(() => {
    PluginRegistry.clear();
    PluginRegistry.register(seoPlugin);
    PluginRegistry.register(performancePlugin);
    PluginRegistry.register(accessibilityPlugin);
    PluginRegistry.register(aeoPlugin);
    PluginRegistry.register(geoPlugin);
    PluginRegistry.register(nextjsPlugin);
    PluginRegistry.register(reactPlugin);
    PluginRegistry.register(vuePlugin);
    PluginRegistry.register(angularPlugin);
    PluginRegistry.register(astroPlugin);
    PluginRegistry.register(sveltePlugin);

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    fs.writeFileSync(
      path.join(tempDir, 'index.html'),
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Integrations Test Page</title>
  <meta name="description" content="Verifying the connected platform.">
  <link rel="canonical" href="https://example.com/integration">
</head>
<body>
  <h1>Integration Title</h1>
</body>
</html>`
    );
    fs.writeFileSync(path.join(tempDir, 'robots.txt'), 'User-agent: *\nDisallow: /private');
  });

  afterAll(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should run a complete verification workflow cleanly, resolving files, parsing DOM and verifying legacy engine rules', async () => {
    const wsManager = new WorkspaceManager();
    const eventBus = new EventBus();
    const orchestrator = new VerificationOrchestrator(wsManager, eventBus);

    const receivedEvents: PlatformEvent[] = [];
    eventBus.subscribe('WorkspaceOpened', (ev) => receivedEvents.push(ev));
    eventBus.subscribe('VerificationStarted', (ev) => receivedEvents.push(ev));
    eventBus.subscribe('PageParsed', (ev) => receivedEvents.push(ev));
    eventBus.subscribe('RuleCompleted', (ev) => receivedEvents.push(ev));
    eventBus.subscribe('VerificationFinished', (ev) => receivedEvents.push(ev));

    const session = await orchestrator.createSession({
      workspaceRoot: tempDir,
      plugins: ['seo'],
      options: {}
    });

    expect(session).toBeDefined();
    expect(receivedEvents.some(e => e.type === 'WorkspaceOpened')).toBe(true);

    const evidences = await orchestrator.runVerification(session.id);

    expect(evidences).toBeDefined();
    expect(evidences.length).toBeGreaterThan(0);

    // Verify events list
    expect(receivedEvents.some(e => e.type === 'VerificationStarted')).toBe(true);
    expect(receivedEvents.some(e => e.type === 'PageParsed')).toBe(true);
    expect(receivedEvents.some(e => e.type === 'RuleCompleted')).toBe(true);
    expect(receivedEvents.some(e => e.type === 'VerificationFinished')).toBe(true);

    // Verify a specific legacy validator passed
    const metadataValidatorEvidence = evidences.find(e => e.source === 'metadata-validator');
    expect(metadataValidatorEvidence).toBeDefined();
    expect(metadataValidatorEvidence?.passed).toBe(true);

    // Close session
    await orchestrator.closeSession(session.id);
  });

  it('should detect framework intelligence and execute conditional rules accordingly', async () => {
    const wsManager = new WorkspaceManager();
    const eventBus = new EventBus();
    const orchestrator = new VerificationOrchestrator(wsManager, eventBus);

    const receivedEvents: PlatformEvent[] = [];
    eventBus.subscribe('FrameworkDetected', (ev) => receivedEvents.push(ev));

    const session = await orchestrator.createSession({
      workspaceRoot: tempDir,
      plugins: ['nextjs'],
      options: {}
    });

    const evidences = await orchestrator.runVerification(session.id);

    // Assert that the FrameworkDetected event fired with Static HTML
    const frameworkEvent = receivedEvents.find(e => e.type === 'FrameworkDetected');
    expect(frameworkEvent).toBeDefined();
    expect(frameworkEvent?.payload?.framework).toBe('Static HTML');

    // Next.js plugin validator should return passed: true as Next.js was skipped
    const nextjsEvidence = evidences.find(e => e.source === 'nextjs-validator');
    expect(nextjsEvidence).toBeDefined();
    expect(nextjsEvidence?.passed).toBe(true);
    expect(nextjsEvidence?.output).toContain('Skipped');

    await orchestrator.closeSession(session.id);
  });
});
