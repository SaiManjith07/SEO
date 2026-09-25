import { CapabilityRegistry, CapabilityManifest } from './capabilities.js';
import { ValidatorRegistry, ValidatorPlugin } from './validators.js';
import { FrameworkRegistry, FrameworkSDK } from './frameworks.js';
import { RuleRegistry, ExecutableRule } from './rules.js';
import { VERSION } from '../version.js';

export function satisfiesSemver(version: string, range: string): boolean {
  if (!range || range === '*' || range === 'latest') return true;
  
  const cleanRange = range.trim();
  const cleanVer = version.trim();
  
  if (cleanRange === cleanVer) return true;
  
  if (cleanRange.startsWith('^')) {
    const base = cleanRange.slice(1).split('.');
    const parts = cleanVer.split('.');
    return base[0] === parts[0] && (parseInt(parts[1] || '0') >= parseInt(base[1] || '0'));
  }
  
  if (cleanRange.startsWith('>=')) {
    const base = cleanRange.slice(2).split('.').map(Number);
    const parts = cleanVer.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
      const b = base[i] || 0;
      const p = parts[i] || 0;
      if (p > b) return true;
      if (p < b) return false;
    }
    return true;
  }
  
  return true; 
}

export interface PluginManifest {
  id: string;
  version: string;
  author?: string;
  description?: string;
  engines?: {
    seokit?: string;
  };
  dependencies?: Record<string, string>;
}

export interface PlatformPlugin {
  id?: string;
  version?: string;
  manifest?: PluginManifest;
  engines?: {
    seokit?: string;
  };
  capabilities?: CapabilityManifest[];
  validators?: ValidatorPlugin[];
  frameworks?: FrameworkSDK[];
  rules?: ExecutableRule[];
  initialize?: (context: any) => Promise<void>;
  register?: (context: any) => Promise<void>;
  dispose?: () => Promise<void>;
  unload?: () => Promise<void>;
}

export function validatePluginManifest(plugin: PlatformPlugin): void {
  const manifest = plugin.manifest || {
    id: plugin.id,
    version: plugin.version,
    engines: plugin.engines
  };

  if (!manifest.id || typeof manifest.id !== 'string') {
    throw new Error('Invalid plugin manifest: "id" must be a non-empty string.');
  }
  if (!manifest.version || typeof manifest.version !== 'string') {
    throw new Error(`Invalid plugin manifest for "${manifest.id}": "version" must be a non-empty string.`);
  }

  if (plugin.manifest) {
    if (plugin.manifest.author && typeof plugin.manifest.author !== 'string') {
      throw new Error(`Invalid plugin manifest for "${manifest.id}": "author" must be a string.`);
    }
  }

  // Version Compatibility checks against running core version
  const coreVersion = VERSION;
  const targetEngineRange = manifest.engines?.seokit;
  if (targetEngineRange) {
    if (!satisfiesSemver(coreVersion, targetEngineRange)) {
      throw new Error(`Incompatible plugin "${manifest.id}": requires SEOKit version range "${targetEngineRange}" but running core version "${coreVersion}".`);
    }
  }
}

export class PluginLoader {
  private capRegistry: CapabilityRegistry;
  private valRegistry: ValidatorRegistry;
  private frmRegistry: FrameworkRegistry;
  private rulRegistry: RuleRegistry;
  private loadedPlugins: Map<string, PlatformPlugin> = new Map();

  constructor(
    capRegistry: CapabilityRegistry,
    valRegistry: ValidatorRegistry,
    frmRegistry: FrameworkRegistry,
    rulRegistry: RuleRegistry
  ) {
    this.capRegistry = capRegistry;
    this.valRegistry = valRegistry;
    this.frmRegistry = frmRegistry;
    this.rulRegistry = rulRegistry;
  }

  public getLoadedPlugins(): PlatformPlugin[] {
    return Array.from(this.loadedPlugins.values());
  }

  public async loadPlugin(plugin: PlatformPlugin, context?: any): Promise<void> {
    validatePluginManifest(plugin);

    const pluginId = plugin.manifest?.id || plugin.id!;
    if (this.loadedPlugins.has(pluginId)) {
      return; // Already loaded
    }

    // Call lifecycle initialize hook
    if (plugin.initialize) {
      await plugin.initialize(context || {});
    }

    // Load capabilities
    if (plugin.capabilities) {
      for (const cap of plugin.capabilities) {
        this.capRegistry.registerCapability(cap);
      }
    }

    // Load validators
    if (plugin.validators) {
      for (const val of plugin.validators) {
        this.valRegistry.registerValidator(val);
      }
    }

    // Load frameworks
    if (plugin.frameworks) {
      for (const frm of plugin.frameworks) {
        this.frmRegistry.registerSDK(frm);
      }
    }

    // Load rules
    if (plugin.rules) {
      for (const rule of plugin.rules) {
        this.rulRegistry.registerRule(rule);
      }
    }

    // Call lifecycle register hook
    if (plugin.register) {
      await plugin.register(context || {});
    }

    this.loadedPlugins.set(pluginId, plugin);
  }

  public async unloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.loadedPlugins.get(pluginId);
    if (!plugin) {
      return;
    }

    // Call lifecycle dispose/unload hooks
    if (plugin.dispose) {
      await plugin.dispose();
    }
    if (plugin.unload) {
      await plugin.unload();
    }

    // Unload rules
    if (plugin.rules) {
      for (const rule of plugin.rules) {
        this.rulRegistry.unregisterRule(rule.id);
      }
    }

    // Unload validators
    if (plugin.validators) {
      for (const val of plugin.validators) {
        this.valRegistry.unregisterValidator(val.id);
      }
    }

    // Unload capabilities
    if (plugin.capabilities) {
      for (const cap of plugin.capabilities) {
        this.capRegistry.unregisterCapability(cap.id);
      }
    }

    // Unload frameworks
    if (plugin.frameworks) {
      for (const frm of plugin.frameworks) {
        this.frmRegistry.unregisterSDK(frm.id);
      }
    }

    this.loadedPlugins.delete(pluginId);
  }
}

export class PluginRegistry {
  private static plugins: PlatformPlugin[] = [];

  public static register(plugin: PlatformPlugin): void {
    // 1. Strict Manifest & Schema Validation
    validatePluginManifest(plugin);

    // 2. Dependency Audit
    this.validateDependencies(plugin);

    const pluginId = plugin.manifest?.id || plugin.id!;

    // 3. Lifecycle initialization triggers
    if (plugin.initialize) {
      try {
        plugin.initialize({});
      } catch (err: any) {
        console.error(`[PluginRegistry] initialize callback failed for plugin "${pluginId}":`, err.message);
      }
    }

    if (!this.plugins.some(p => (p.manifest?.id || p.id) === pluginId)) {
      this.plugins.push(plugin);
    }
  }

  public static validateDependencies(plugin: PlatformPlugin): void {
    const manifest = plugin.manifest || {
      id: plugin.id!,
      version: plugin.version!,
      dependencies: (plugin as any).dependencies
    };

    if (manifest.dependencies) {
      for (const [depId, depRange] of Object.entries(manifest.dependencies)) {
        const depPlugin = this.plugins.find(p => (p.manifest?.id || p.id) === depId);
        if (!depPlugin) {
          throw new Error(`Plugin '${manifest.id}' missing required dependency: '${depId}'.`);
        }
        const depVersion = depPlugin.manifest?.version || depPlugin.version!;
        if (!satisfiesSemver(depVersion, depRange as string)) {
          throw new Error(`Plugin '${manifest.id}' requires dependency '${depId}' to satisfy version '${depRange}' (found version '${depVersion}').`);
        }
      }
    }
  }

  public static async discoverAndRegister(): Promise<void> {
    const firstPartyPlugins = [
      '@seokit/plugin-seo',
      '@seokit/plugin-performance',
      '@seokit/plugin-accessibility',
      '@seokit/plugin-aeo',
      '@seokit/plugin-geo',
      '@seokit/plugin-security',
      '@seokit/plugin-structured-data'
    ];

    for (const pName of firstPartyPlugins) {
      if (!this.plugins.some(p => p.id === pName || `@seokit/plugin-${p.id}` === pName || p.manifest?.id === pName)) {
        try {
          await import(pName);
        } catch {
          // Ignore if not present in the current node_modules environment
        }
      }
    }
  }

  public static getAll(): PlatformPlugin[] {
    return this.plugins;
  }

  public static clear(): void {
    this.plugins = [];
  }
}
