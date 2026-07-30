import { CapabilityRegistry, CapabilityManifest } from './capabilities.js';
import { ValidatorRegistry, ValidatorPlugin } from './validators.js';
import { FrameworkRegistry, FrameworkSDK } from './frameworks.js';
import { RuleRegistry, ExecutableRule } from './rules.js';

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

export interface PlatformPlugin {
  id: string;
  version: string;
  engines?: {
    seokit?: string;
  };
  capabilities?: CapabilityManifest[];
  validators?: ValidatorPlugin[];
  frameworks?: FrameworkSDK[];
  rules?: ExecutableRule[];
  initialize?: (context: any) => Promise<void>;
  unload?: () => Promise<void>;
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
    if (this.loadedPlugins.has(plugin.id)) {
      return; // Already loaded
    }

    // Version Compatibility check
    const coreVersion = '0.1.0';
    if (plugin.engines?.seokit) {
      if (!satisfiesSemver(coreVersion, plugin.engines.seokit)) {
        throw new Error(`Plugin '${plugin.id}' requires SEOKit version '${plugin.engines.seokit}', but core version is '${coreVersion}'.`);
      }
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

    this.loadedPlugins.set(plugin.id, plugin);
  }

  public async unloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.loadedPlugins.get(pluginId);
    if (!plugin) {
      return;
    }

    // Call lifecycle unload hook
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
