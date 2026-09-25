import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
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

  it('should manage OAuth credential flows and refresh expired tokens', async () => {
    const { OAuthManager } = await import('./oauth.js');
    const tempRoot = path.resolve('tmp_oauth_test');
    
    if (!fs.existsSync(tempRoot)) {
      fs.mkdirSync(tempRoot, { recursive: true });
    }

    const oauth = new OAuthManager(tempRoot);
    const mockCreds = {
      accessToken: 'initial_token',
      refreshToken: 'refresh_token',
      expiryTime: Date.now() - 1000 // expired
    };

    oauth.saveCredentials('google', mockCreds);

    const creds = oauth.getCredentials('google');
    expect(creds).toBeDefined();
    expect(creds?.refreshToken).toBe('refresh_token');

    // Token refresh flow should fire on expired tokens
    const validToken = await oauth.getValidAccessToken('google', 'secret');
    expect(validToken).toContain('refreshed_access_token_google');

    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  it('should query live analytics performance metrics from Google and Bing connectors', async () => {
    const { OAuthManager } = await import('./oauth.js');
    const { GoogleIntelligenceConnector } = await import('./google.js');
    const { BingWebmasterConnector } = await import('./bing.ts');
    
    const tempRoot = path.resolve('tmp_analytics_test');
    if (!fs.existsSync(tempRoot)) {
      fs.mkdirSync(tempRoot, { recursive: true });
    }

    const oauth = new OAuthManager(tempRoot);
    const googleConnector = new GoogleIntelligenceConnector(oauth);
    const bingConnector = new BingWebmasterConnector(oauth);

    const googleData = await googleConnector.fetchAnalytics('https://example.com', 'google_token');
    expect(googleData.searchPerformance.clicks).toBe(12450);
    expect(googleData.pageSpeed.speedScore).toBe(92);
    expect(googleData.businessProfile.reviewsAverageRating).toBe(4.8);
    expect(googleData.businessProfile.reviewsCount).toBe(148);
    expect(googleData.crawlStats.totalCrawlRequests).toBe(84000);
    expect(googleData.sitemaps[0].status).toBe('Success');
    expect(googleData.robotsTxt.status).toBe('Allowed');
    expect(googleData.urlInspection[0].indexingState).toBe('Indexed');
    expect(googleData.pageExperience.httpsStatus).toBe('Secure');

    const bingData = await bingConnector.fetchWebmasterData('https://example.com', 'bing_token');
    expect(bingData.clicks).toBe(3420);
    expect(bingData.indexedPagesCount).toBe(1105);

    fs.rmSync(tempRoot, { recursive: true, force: true });
  });
});
