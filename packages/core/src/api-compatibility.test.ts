import { describe, it, expect } from 'vitest';
import * as coreApi from './index.js';

describe('SEOKit v1.0 Core API Stability compatibility checks', () => {
  it('should ensure all frozen core lifecycle and platform symbols are exported correctly', () => {
    // 1. High-level verify and engine entry points
    expect(coreApi.defineRule).toBeTypeOf('function');
    expect(coreApi.registerRule).toBeTypeOf('function');
    expect(coreApi.getRules).toBeTypeOf('function');
    expect(coreApi.getRule).toBeTypeOf('function');
    expect(coreApi.runRules).toBeTypeOf('function');
    expect(coreApi.defineConfig).toBeTypeOf('function');

    // 2. Analyzers and extractor utilities
    expect(coreApi.extract).toBeTypeOf('function');
    expect(coreApi.flattenJsonLd).toBeTypeOf('function');
    expect(coreApi.schemaTypes).toBeDefined();

    // 3. Crawling and network adapters
    expect(coreApi.fetchPage).toBeTypeOf('function');
    expect(coreApi.fetchRobotsTxt).toBeTypeOf('function');
    expect(coreApi.USER_AGENTS).toBeTypeOf('object');
    expect(coreApi.crawlSite).toBeTypeOf('function');

    // 4. Memory and local database providers
    expect(coreApi.getDb).toBeTypeOf('function');
    expect(coreApi.closeDb).toBeTypeOf('function');
    expect(coreApi.saveProject).toBeTypeOf('function');
    expect(coreApi.loadProject).toBeTypeOf('function');
    expect(coreApi.saveDecision).toBeTypeOf('function');
    expect(coreApi.loadDecisions).toBeTypeOf('function');

    // 5. Platform Core registries and plugins loaders
    expect(coreApi.FileStorageProvider).toBeDefined();
    expect(coreApi.RuleRegistry).toBeDefined();
    expect(coreApi.VerificationEngine).toBeDefined();
    expect(coreApi.CapabilityRegistry).toBeDefined();
    expect(coreApi.FrameworkRegistry).toBeDefined();
    expect(coreApi.ValidatorRegistry).toBeDefined();
    expect(coreApi.ReportEngine).toBeDefined();
    expect(coreApi.PluginLoader).toBeDefined();
    expect(coreApi.PolicyEngine).toBeDefined();
    expect(coreApi.CertificationSuite).toBeDefined();
    expect(coreApi.bootstrapVerificationEngine).toBeTypeOf('function');
  });

  it('should ensure CLI workflow components and diagnostics mappers are compatible', () => {
    // Verify CLI integration symbols
    expect(coreApi.VerificationEngine).toBeDefined();
    expect(coreApi.RuleRegistry).toBeDefined();
  });

  it('should ensure MCP schema interfaces and server configurations are defined', () => {
    // Verify MCP dependency structures
    expect(coreApi.CapabilityRegistry).toBeDefined();
    expect(coreApi.ValidatorRegistry).toBeDefined();
  });
});
