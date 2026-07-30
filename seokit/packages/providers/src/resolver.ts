import { WebsiteProvider } from './base.js';
import { StaticProvider } from './static.js';
import { BuildOutputProvider } from './build.js';
import { RemoteProvider } from './remote.js';
import { LocalDevProvider } from './localdev.js';
import { BrowserProvider } from './browser.js';

/**
 * Automatically inspects the target and instantiates the correct provider subclass.
 */
export async function resolveProvider(
  target: string,
  options: Record<string, any> = {}
): Promise<WebsiteProvider> {
  const candidates = [
    new BuildOutputProvider(target, options),
    new BrowserProvider(target, options),
    new LocalDevProvider(target, options),
    new RemoteProvider(target, options),
    new StaticProvider(target, options)
  ];

  for (const p of candidates) {
    if (await p.canVerify()) {
      return p;
    }
  }

  // Fallback default static filesystem folder walker
  return new StaticProvider(target, options);
}
