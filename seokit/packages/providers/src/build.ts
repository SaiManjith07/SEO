import * as fs from 'fs';
import * as path from 'path';
import { RawResource } from '@seokit/parser';
import { WebsiteProvider } from './base.js';
import { ProviderCapabilities } from './types.js';

export class BuildOutputProvider extends WebsiteProvider {
  public getCapabilities(): ProviderCapabilities {
    return {
      supportsJavaScript: false,
      supportsHeaders: false,
      supportsAssets: true,
      supportsPerformance: true,
      supportsAuthentication: false
    };
  }

  public async canVerify(): Promise<boolean> {
    try {
      const stats = fs.statSync(this.target);
      if (!stats.isDirectory()) return false;

      // Inspect target directory base folder name for build markers
      const name = path.basename(this.target);
      return name === 'dist' || name === 'build' || name === 'out' || name === '.next';
    } catch {
      return false;
    }
  }

  public async initialize(): Promise<void> {
    // Setup details when parsing build output configuration logs
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

        if (f.startsWith('.')) continue;

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
              headers: {},
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
    // Teardown procedures
  }
}
