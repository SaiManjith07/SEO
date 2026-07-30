import { CapabilityRegistry } from './capabilities.js';
import { ValidatorRegistry } from './validators.js';
import { RuleRegistry } from './rules.js';
import { PluginLoader, PlatformPlugin } from './plugins.js';
import { VerificationEngine } from './verification.js';

export function bootstrapVerificationEngine(plugins: PlatformPlugin[]): VerificationEngine {
  const capRegistry = new CapabilityRegistry();
  const valRegistry = new ValidatorRegistry();
  const ruleRegistry = new RuleRegistry();
  const loader = new PluginLoader(capRegistry, valRegistry, {} as any, ruleRegistry);

  for (const plugin of plugins) {
    loader.loadPlugin(plugin);
  }

  return new VerificationEngine(capRegistry, valRegistry, ruleRegistry);
}
