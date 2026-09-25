import { describe, it, expect } from 'vitest';
import { PluginRegistry } from './plugins.js';

describe('PluginRegistry validation and lifecycle triggers', () => {
  it('should successfully register a valid plugin manifest', () => {
    PluginRegistry.clear();
    const plugin = {
      id: 'valid-test-plugin',
      version: '1.0.0',
      capabilities: []
    };

    expect(() => PluginRegistry.register(plugin)).not.toThrow();
    expect(PluginRegistry.getAll().length).toBe(1);
  });

  it('should reject plugin manifests missing required fields', () => {
    PluginRegistry.clear();
    const noId = {
      version: '1.0.0'
    } as any;
    const noVersion = {
      id: 'no-version-plugin'
    } as any;

    expect(() => PluginRegistry.register(noId)).toThrow('Invalid plugin manifest: "id" must be a non-empty string.');
    expect(() => PluginRegistry.register(noVersion)).toThrow('Invalid plugin manifest for "no-version-plugin": "version" must be a non-empty string.');
  });

  it('should validate and reject plugins with incompatible engines seokit versions', () => {
    PluginRegistry.clear();
    const incompatible = {
      id: 'old-plugin',
      version: '1.0.0',
      engines: {
        seokit: '^0.0.1' // Incompatible with v1.x or v2.x
      }
    };

    expect(() => PluginRegistry.register(incompatible)).toThrow('Incompatible plugin "old-plugin"');
  });

  it('should invoke the initialize lifecycle hook during registration', () => {
    PluginRegistry.clear();
    let initCalled = false;
    const plugin = {
      id: 'lifecycle-plugin',
      version: '1.0.0',
      initialize: async () => {
        initCalled = true;
      }
    };

    expect(() => PluginRegistry.register(plugin)).not.toThrow();
    expect(initCalled).toBe(true);
  });
});
