import * as fs from 'fs';
import * as path from 'path';

export interface RuleOverrideConfig {
  severity?: 'error' | 'warning' | 'info';
  enabled?: boolean;
}

export interface SEOKitConfig {
  schemaVersion?: string;
  extends?: string;
  profile?: 'basic' | 'advanced' | 'marketing' | 'all';
  plugins?: string[];
  rules?: Record<string, RuleOverrideConfig>;
  ignore?: string[];
  environments?: Record<string, Omit<SEOKitConfig, 'environments'>>;
}

export function matchesGlob(filePath: string, glob: string): boolean {
  const normalizedPath = filePath.replace(/\\/g, '/').toLowerCase();
  const normalizedGlob = glob.replace(/\\/g, '/').toLowerCase();

  if (normalizedGlob === '**') return true;

  let regexStr = '';
  let i = 0;
  while (i < normalizedGlob.length) {
    if (normalizedGlob.substring(i, i + 3) === '**/') {
      regexStr += '(.*/)?';
      i += 3;
    } else if (normalizedGlob.substring(i, i + 2) === '**') {
      regexStr += '.*';
      i += 2;
    } else if (normalizedGlob[i] === '*') {
      regexStr += '[^/]*';
      i++;
    } else if (normalizedGlob[i] === '?') {
      regexStr += '[^/]';
      i++;
    } else {
      const char = normalizedGlob[i];
      if ('[\\^$.|?*+()'.includes(char)) {
        regexStr += '\\' + char;
      } else {
        regexStr += char;
      }
      i++;
    }
  }

  const regex = new RegExp(`^${escapedRegexStr(regexStr)}$`);
  return regex.test(normalizedPath);
}

function escapedRegexStr(s: string): string {
  // Return the string directly since the loop already escapes regex special chars.
  return s;
}

export function mergeConfigs(base: SEOKitConfig, override: SEOKitConfig): SEOKitConfig {
  const merged: SEOKitConfig = { ...base, ...override };

  if (base.plugins && override.plugins) {
    merged.plugins = Array.from(new Set([...base.plugins, ...override.plugins]));
  }

  if (base.rules && override.rules) {
    merged.rules = { ...base.rules, ...override.rules };
  }

  if (base.ignore && override.ignore) {
    merged.ignore = Array.from(new Set([...base.ignore, ...override.ignore]));
  }

  return merged;
}

export class ConfigLoader {
  public static validate(config: any): void {
    if (!config) return;

    // Strict schema check
    const allowedKeys = new Set(['schemaVersion', 'extends', 'profile', 'plugins', 'rules', 'ignore', 'environments']);
    for (const key of Object.keys(config)) {
      if (!allowedKeys.has(key)) {
        throw new Error(`Invalid configuration: Unknown property "${key}".`);
      }
    }

    if (config.schemaVersion && typeof config.schemaVersion !== 'string') {
      throw new Error('schemaVersion must be a valid string.');
    }
    if (config.profile && !['basic', 'advanced', 'marketing', 'all'].includes(config.profile)) {
      throw new Error(`Invalid profile: "${config.profile}". Must be basic, advanced, marketing, or all.`);
    }
    if (config.plugins && !Array.isArray(config.plugins)) {
      throw new Error('Plugins configuration must be an array of strings.');
    }
    if (config.ignore && !Array.isArray(config.ignore)) {
      throw new Error('Ignore configuration must be an array of glob patterns.');
    }
  }

  public static load(workspaceRoot: string, env: string = 'development'): SEOKitConfig {
    return this.loadWithTracker(workspaceRoot, env, new Set());
  }

  private static loadWithTracker(workspaceRoot: string, env: string, visited: Set<string>): SEOKitConfig {
    let config: SEOKitConfig = {};
    let matchedPath = '';

    const possibleNames = ['seokit.config.json', 'seokit.config.js', 'seokit.config.ts'];
    for (const name of possibleNames) {
      const fullPath = path.join(workspaceRoot, name);
      if (fs.existsSync(fullPath)) {
        matchedPath = fullPath;
        if (visited.has(fullPath)) {
          throw new Error(`Circular inheritance detected in configuration extends chain: ${Array.from(visited).join(' -> ')} -> ${fullPath}`);
        }
        visited.add(fullPath);

        try {
          if (name.endsWith('.json')) {
            const raw = fs.readFileSync(fullPath, 'utf-8');
            config = JSON.parse(raw);
          } else {
            const raw = fs.readFileSync(fullPath, 'utf-8');
            if (raw.includes('{')) {
              config = eval(`(${raw.substring(raw.indexOf('{'), raw.lastIndexOf('}') + 1)})`);
            }
          }
          break;
        } catch (err: any) {
          throw new Error(`Failed to parse configuration file at "${name}": ${err.message}`);
        }
      }
    }

    if (!matchedPath) {
      return config;
    }

    this.validate(config);

    if (config.extends) {
      const extendsPath = path.resolve(path.dirname(matchedPath), config.extends);
      if (fs.existsSync(extendsPath)) {
        if (visited.has(extendsPath)) {
          throw new Error(`Circular inheritance detected in configuration extends chain: ${Array.from(visited).join(' -> ')} -> ${extendsPath}`);
        }
        const extendsDir = path.dirname(extendsPath);
        const extendsName = path.basename(extendsPath);

        // Load extends configuration with cyclic trackers
        const nextVisited = new Set(visited);
        nextVisited.add(extendsPath);

        let baseConfig: SEOKitConfig = {};
        try {
          const raw = fs.readFileSync(extendsPath, 'utf-8');
          if (extendsName.endsWith('.json')) {
            baseConfig = JSON.parse(raw);
          } else if (raw.includes('{')) {
            baseConfig = eval(`(${raw.substring(raw.indexOf('{'), raw.lastIndexOf('}') + 1)})`);
          }
          this.validate(baseConfig);
        } catch (err: any) {
          if (err.message.includes('Circular inheritance')) {
            throw err;
          }
          // Continue silently on extends load IO error
        }

        config = mergeConfigs(baseConfig, config);
      }
    }

    if (config.environments && config.environments[env]) {
      config = mergeConfigs(config, config.environments[env]);
    }

    return config;
  }
}
