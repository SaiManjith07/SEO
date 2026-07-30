import { describe, it, expect } from 'vitest';
import { StaticProvider } from './static.js';
import { RemoteProvider } from './remote.js';
import { LocalDevProvider } from './localdev.js';
import { BrowserProvider } from './browser.js';
import { BuildOutputProvider } from './build.js';
import { resolveProvider } from './resolver.js';

describe('Website Providers Regression Checks', () => {
  it('should advertise correct capabilities across all provider types', () => {
    const staticProv = new StaticProvider('temp_dir');
    const buildProv = new BuildOutputProvider('dist');
    const remoteProv = new RemoteProvider('https://example.com');
    const devProv = new LocalDevProvider('http://localhost:3000');
    const browserProv = new BrowserProvider('https://example.com', { render: true });

    // Static Provider
    expect(staticProv.getCapabilities().supportsHeaders).toBe(false);
    expect(staticProv.getCapabilities().supportsJavaScript).toBe(false);

    // Build Output Provider
    expect(buildProv.getCapabilities().supportsHeaders).toBe(false);
    expect(buildProv.getCapabilities().supportsPerformance).toBe(true);

    // Remote Provider
    expect(remoteProv.getCapabilities().supportsHeaders).toBe(true);
    expect(remoteProv.getCapabilities().supportsJavaScript).toBe(false);

    // Local Dev Provider
    expect(devProv.getCapabilities().supportsHeaders).toBe(true);
    expect(devProv.getCapabilities().supportsPerformance).toBe(true);

    // Browser Provider
    expect(browserProv.getCapabilities().supportsJavaScript).toBe(true);
    expect(browserProv.getCapabilities().supportsHeaders).toBe(true);
  });

  it('should filter targets and resolve provider subclasses automatically', async () => {
    const staticProv = new StaticProvider('temp_dir');
    const remoteProv = new RemoteProvider('https://example.com');
    const devProv = new LocalDevProvider('http://localhost:3000');
    const browserProv = new BrowserProvider('https://example.com', { render: true });

    expect(await staticProv.canVerify()).toBe(false); // since directory doesn't exist
    expect(await remoteProv.canVerify()).toBe(true);
    expect(await devProv.canVerify()).toBe(true);
    expect(await browserProv.canVerify()).toBe(true);

    const resolvedRemote = await resolveProvider('https://example.com');
    const resolvedLocal = await resolveProvider('http://localhost:8080');
    const resolvedBrowser = await resolveProvider('https://example.com', { render: true });

    expect(resolvedRemote).toBeInstanceOf(RemoteProvider);
    expect(resolvedLocal).toBeInstanceOf(LocalDevProvider);
    expect(resolvedBrowser).toBeInstanceOf(BrowserProvider);
  });
});
