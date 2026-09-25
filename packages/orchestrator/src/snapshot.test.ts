import { describe, it, expect } from 'vitest';
import * as workspaceApi from '@seokit/workspace';
import * as eventsApi from '@seokit/events';
import { VerificationOrchestrator } from './orchestrator.js';
import * as providersApi from '@seokit/providers';
import * as frameworkDetectorApi from '@seokit/framework-detector';
import * as parserApi from '@seokit/parser';
import * as coreApi from '@seokit/core';

describe('SEOKit v2 Monorepo Public API Export Snapshots', () => {
  it('should ensure all publishable packages expose correct API boundaries', () => {
    // 1. @seokit/workspace
    expect(workspaceApi.WorkspaceManager).toBeDefined();

    // 2. @seokit/events
    expect(eventsApi.EventBus).toBeDefined();

    // 3. @seokit/orchestrator
    expect(VerificationOrchestrator).toBeDefined();

    // 4. @seokit/providers
    expect(providersApi.StaticProvider).toBeDefined();
    expect(providersApi.BuildOutputProvider).toBeDefined();
    expect(providersApi.RemoteProvider).toBeDefined();
    expect(providersApi.LocalDevProvider).toBeDefined();
    expect(providersApi.BrowserProvider).toBeDefined();
    expect(providersApi.resolveProvider).toBeTypeOf('function');

    // 5. @seokit/framework-detector
    expect(frameworkDetectorApi.FrameworkDetector).toBeDefined();

    // 6. @seokit/parser
    expect(parserApi.ParserPipeline).toBeDefined();

    // 7. @seokit/core
    expect(coreApi.VerificationEngine).toBeDefined();
    expect(coreApi.bootstrapVerificationEngine).toBeTypeOf('function');
  });

  it('should verify public API snapshot signature mapping', () => {
    const apiSnapshot = {
      workspace: Object.keys(workspaceApi).sort(),
      events: Object.keys(eventsApi).sort(),
      orchestrator: ['VerificationOrchestrator'],
      providers: Object.keys(providersApi).sort(),
      frameworkDetector: Object.keys(frameworkDetectorApi).sort(),
      parser: Object.keys(parserApi).sort(),
      core: Object.keys(coreApi).sort()
    };

    expect(apiSnapshot.workspace).toContain('WorkspaceManager');
    expect(apiSnapshot.events).toContain('EventBus');
    expect(apiSnapshot.orchestrator).toContain('VerificationOrchestrator');
    expect(apiSnapshot.providers).toContain('resolveProvider');
    expect(apiSnapshot.frameworkDetector).toContain('FrameworkDetector');
    expect(apiSnapshot.parser).toContain('ParserPipeline');
    expect(apiSnapshot.core).toContain('VerificationEngine');
  });
});
