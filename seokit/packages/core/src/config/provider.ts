import { DEFAULT_SETTINGS, type SeoKitSettings } from './defaults.js';
import type { SeoKitConfig } from '../types.js';

export class ConfigurationProvider {
  private settings: SeoKitSettings;

  constructor(userConfig?: SeoKitConfig) {
    this.settings = this.resolveSettings(userConfig);
  }

  private resolveSettings(userConfig?: SeoKitConfig): SeoKitSettings {
    const merged = JSON.parse(JSON.stringify(DEFAULT_SETTINGS)) as SeoKitSettings;
    if (!userConfig) return merged;

    // Merge intelligence settings
    if (userConfig.intelligence) {
      if (typeof userConfig.intelligence.thinContentThreshold === 'number') {
        merged.intelligence.thinContentThreshold = userConfig.intelligence.thinContentThreshold;
      }
      if (typeof userConfig.intelligence.duplicateSimilarity === 'number') {
        merged.intelligence.duplicateSimilarity = userConfig.intelligence.duplicateSimilarity;
      }
      if (typeof userConfig.intelligence.cannibalizationSimilarity === 'number') {
        merged.intelligence.cannibalizationSimilarity = userConfig.intelligence.cannibalizationSimilarity;
      }
      if (Array.isArray(userConfig.intelligence.orphanExclusions)) {
        merged.intelligence.orphanExclusions = userConfig.intelligence.orphanExclusions;
      }
      if (Array.isArray(userConfig.intelligence.requiredEeatPages)) {
        merged.intelligence.requiredEeatPages = userConfig.intelligence.requiredEeatPages;
      }
    }

    // Merge html settings from rules config if overrides exist
    if (userConfig.rules) {
      for (const [ruleId, ruleConf] of Object.entries(userConfig.rules)) {
        if (Array.isArray(ruleConf) && ruleConf[1] && typeof ruleConf[1] === 'object') {
          const opts = ruleConf[1] as Record<string, any>;
          if (ruleId === 'html/title-length' && typeof opts.maxTitleLength === 'number') {
            merged.html.maxTitleLength = opts.maxTitleLength;
          }
          if (ruleId === 'html/missing-meta-description') {
            if (typeof opts.minMetaDescriptionLength === 'number') {
              merged.html.minMetaDescriptionLength = opts.minMetaDescriptionLength;
            }
            if (typeof opts.maxMetaDescriptionLength === 'number') {
              merged.html.maxMetaDescriptionLength = opts.maxMetaDescriptionLength;
            }
          }
        }
      }
    }

    return merged;
  }

  getSettings(): SeoKitSettings {
    return this.settings;
  }
}
export type { SeoKitSettings };
