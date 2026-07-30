import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { WorkspaceManager } from '@seokit/workspace';
import { EventBus } from '@seokit/events';
import { VerificationOrchestrator } from './orchestrator.js';

describe('SEOKit v3 CLI vs MCP Client Configuration Consistency Suite', () => {
  const tempConsistencyDir = path.resolve('temp_consistency_e2e_test');

  beforeAll(() => {
    if (!fs.existsSync(tempConsistencyDir)) {
      fs.mkdirSync(tempConsistencyDir, { recursive: true });
    }

    fs.writeFileSync(path.join(tempConsistencyDir, 'index.html'), '<html><head><title>Verify Page</title></head></html>');
    fs.writeFileSync(path.join(tempConsistencyDir, 'ignore-me.html'), '<html><head><title>Ignore Page</title></head></html>');

    const configPayload = {
      schemaVersion: '3.0.0',
      ignore: ['**/ignore-me.html'],
      rules: {
        'seo.canonical.exists': { severity: 'warning' }
      }
    };

    fs.writeFileSync(path.join(tempConsistencyDir, 'seokit.config.json'), JSON.stringify(configPayload, null, 2));
  });

  afterAll(() => {
    if (fs.existsSync(tempConsistencyDir)) {
      fs.rmSync(tempConsistencyDir, { recursive: true, force: true });
    }
  });

  it('should verify CLI and MCP resolve configurations identically', async () => {
    const wsManager = new WorkspaceManager();
    const eventBus = new EventBus();
    const orchestrator = new VerificationOrchestrator(wsManager, eventBus);

    // 1. Simulating CLI session config loading
    const cliSession = await orchestrator.createSession({
      workspaceRoot: tempConsistencyDir,
      plugins: ['seo'],
      options: {}
    });

    expect(cliSession.loadedConfig).toBeDefined();
    expect(cliSession.loadedConfig?.schemaVersion).toBe('3.0.0');

    const cliEvidences = await orchestrator.runVerification(cliSession.id);

    // 2. Simulating MCP session config loading
    const mcpSession = await orchestrator.createSession({
      workspaceRoot: tempConsistencyDir,
      plugins: ['seo'],
      options: {}
    });

    expect(mcpSession.loadedConfig).toBeDefined();
    expect(mcpSession.loadedConfig?.schemaVersion).toBe('3.0.0');

    const mcpEvidences = await orchestrator.runVerification(mcpSession.id);

    // 3. Assert identical output behavior across both clients
    expect(cliEvidences.length).toBe(mcpEvidences.length);

    // Assert that the page "ignore-me.html" was identically excluded in both
    const cliIgnored = cliEvidences.filter(e => e.sourcePath && e.sourcePath.includes('ignore-me.html'));
    const mcpIgnored = mcpEvidences.filter(e => e.sourcePath && e.sourcePath.includes('ignore-me.html'));
    expect(cliIgnored.length).toBe(0);
    expect(mcpIgnored.length).toBe(0);

    // Assert that rule overrides match identically on canonical checks
    const cliCanonical = cliEvidences.find(e => e.ruleId === 'seo.canonical.exists');
    const mcpCanonical = mcpEvidences.find(e => e.ruleId === 'seo.canonical.exists');
    expect(cliCanonical).toBeDefined();
    expect(mcpCanonical).toBeDefined();
    expect(cliCanonical!.severity).toBe('warning');
    expect(mcpCanonical!.severity).toBe('warning');

    await orchestrator.closeSession(cliSession.id);
    await orchestrator.closeSession(mcpSession.id);
  });
});
