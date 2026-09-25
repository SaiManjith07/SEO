import { describe, it, expect, beforeAll } from 'vitest';
import { PluginRegistry, PluginLoader, PlatformPlugin } from './plugins.js';
import { CapabilityRegistry } from './capabilities.js';
import { ValidatorRegistry } from './validators.js';
import { RuleRegistry } from './rules.js';

describe('SEOKit v3 Plugin Marketplace & Lifecycle Subsystem', () => {
  beforeAll(() => {
    PluginRegistry.clear();
  });

  it('should successfully register a plugin with a valid manifest', () => {
    const plugin: PlatformPlugin = {
      manifest: {
        id: 'valid-plugin',
        version: '1.0.0',
        author: 'SEOTeam',
        description: 'A validated SEOKit v3 plugin.'
      }
    };

    expect(() => PluginRegistry.register(plugin)).not.toThrow();
  });

  it('should reject registration of a plugin with an invalid manifest', () => {
    const invalidPlugin: PlatformPlugin = {
      manifest: {
        id: '', // Empty ID is invalid
        version: '1.0.0'
      }
    };

    expect(() => PluginRegistry.register(invalidPlugin)).toThrow('Invalid plugin manifest: "id" must be a non-empty string.');
  });

  it('should enforce plugin engine compatibility matches', () => {
    const incompatiblePlugin: PlatformPlugin = {
      manifest: {
        id: 'future-plugin',
        version: '1.0.0',
        engines: {
          seokit: '^10.0.0' // Core runs v2.x/v3.x
        }
      }
    };

    expect(() => PluginRegistry.register(incompatiblePlugin)).toThrow('Incompatible plugin "future-plugin"');
  });

  it('should validate and enforce plugin dependency requirements', () => {
    const dependentPlugin: PlatformPlugin = {
      manifest: {
        id: 'dependent-plugin',
        version: '1.0.0',
        dependencies: {
          'missing-dependency': '^1.0.0'
        }
      }
    };

    expect(() => PluginRegistry.register(dependentPlugin)).toThrow("missing required dependency: 'missing-dependency'");
  });

  it('should trigger lifecycle hooks during load and unload sequences', async () => {
    let initialized = false;
    let registered = false;
    let disposed = false;

    const lifecyclePlugin: PlatformPlugin = {
      manifest: {
        id: 'lifecycle-plugin',
        version: '1.0.0'
      },
      async initialize() {
        initialized = true;
      },
      async register() {
        registered = true;
      },
      async dispose() {
        disposed = true;
      }
    };

    const capReg = new CapabilityRegistry();
    const valReg = new ValidatorRegistry();
    const ruleReg = new RuleRegistry();
    const loader = new PluginLoader(capReg, valReg, {} as any, ruleReg);

    await loader.loadPlugin(lifecyclePlugin);
    expect(initialized).toBe(true);
    expect(registered).toBe(true);

    await loader.unloadPlugin('lifecycle-plugin');
    expect(disposed).toBe(true);
  });
});
