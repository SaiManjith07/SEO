import * as fs from 'fs';
import * as path from 'path';

export interface SeoKitConfig {
  version: 1;
  goals: string[];
  sources: Record<string, { enabled: boolean; note?: string }>;
  modes: {
    dev: { blockOnFail: boolean };
    prod: { schedule: string; alertWebhook: string | null };
  };
}

export function loadConfig(repoRoot: string): SeoKitConfig {
  const configPath = path.join(repoRoot, '.seokit', 'config.json');
  
  if (!fs.existsSync(configPath)) {
    return {
      version: 1,
      goals: [],
      sources: {},
      modes: {
        dev: { blockOnFail: false },
        prod: { schedule: '0 0 * * *', alertWebhook: null }
      }
    };
  }

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(content) as SeoKitConfig;
  } catch (err: any) {
    throw new Error(`Failed to parse ${configPath}: ${err.message}`);
  }
}

export function saveConfig(repoRoot: string, config: SeoKitConfig): void {
  const dirPath = path.join(repoRoot, '.seokit');
  const configPath = path.join(dirPath, 'config.json');
  
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
}
