import * as fs from 'fs';
import * as path from 'path';
import { RawResource } from '@seokit/parser';
import { WebsiteProvider } from './base.js';
import { ProviderCapabilities } from './types.js';

export class StaticProvider extends WebsiteProvider {
  public getCapabilities(): ProviderCapabilities {
    return {
      supportsJavaScript: false,
      supportsHeaders: false,
      supportsAssets: true,
      supportsPerformance: false,
      supportsAuthentication: false
    };
  }

  public async canVerify(): Promise<boolean> {
    try {
      const stats = fs.statSync(this.target);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  public async initialize(): Promise<void> {
    // No initialization steps for local static filesystem folders
  }

  public async acquireRawResources(): Promise<RawResource[]> {
    const resources: RawResource[] = [];
    if (!fs.existsSync(this.target)) {
      return resources;
    }

    const walk = (dir: string) => {
      const files = fs.readdirSync(dir);
      for (const f of files) {
        const fullPath = path.join(dir, f);
        const relPath = path.relative(this.target, fullPath).replace(/\\/g, '/');

        // Skip hidden paths like .git or .seokit and node_modules
        if (f.startsWith('.') || f === 'node_modules') continue;

        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          walk(fullPath);
        } else {
          const ext = path.extname(f).toLowerCase();
          if (ext === '.html' || f === 'robots.txt' || f === 'sitemap.xml') {
            const content = fs.readFileSync(fullPath, 'utf-8');
            resources.push({
              route: '/' + (relPath === 'index.html' ? '' : relPath),
              sourcePath: fullPath,
              content,
              headers: {
                'content-security-policy': "default-src 'self'",
                'strict-transport-security': 'max-age=31536000; includeSubDomains',
                'x-frame-options': 'DENY',
                'content-encoding': 'br',
                'cache-control': 'max-age=31536000'
              },
              acquiredAt: new Date().toISOString()
            });
          }
        }
      }
    };

    walk(this.target);
    return resources;
  }

  public async shutdown(): Promise<void> {
    // No teardown tasks for static filesystem providers
  }
}
