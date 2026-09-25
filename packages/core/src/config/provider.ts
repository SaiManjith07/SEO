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

    // 1. Merge intelligence settings
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

    // 2. Merge AEO settings
    if (userConfig.aeo) {
      const u = userConfig.aeo;
      const m = merged.aeo;
      if (typeof u.questionHeadingsRatio === 'number') m.questionHeadingsRatio = u.questionHeadingsRatio;
      if (typeof u.statisticsDensityMinWordCount === 'number') m.statisticsDensityMinWordCount = u.statisticsDensityMinWordCount;
      if (typeof u.statisticsDensityRatio === 'number') m.statisticsDensityRatio = u.statisticsDensityRatio;
      if (typeof u.outboundCitationsMinWordCount === 'number') m.outboundCitationsMinWordCount = u.outboundCitationsMinWordCount;
      if (typeof u.outboundCitationsMinCount === 'number') m.outboundCitationsMinCount = u.outboundCitationsMinCount;
      if (typeof u.pronounDensityMinWordCount === 'number') m.pronounDensityMinWordCount = u.pronounDensityMinWordCount;
      if (typeof u.pronounDensityMaxRatio === 'number') m.pronounDensityMaxRatio = u.pronounDensityMaxRatio;
      if (typeof u.longParagraphsMaxParagraphCount === 'number') m.longParagraphsMaxParagraphCount = u.longParagraphsMaxParagraphCount;
      if (typeof u.longParagraphsMaxWordCount === 'number') m.longParagraphsMaxWordCount = u.longParagraphsMaxWordCount;
      if (typeof u.longParagraphsRatio === 'number') m.longParagraphsRatio = u.longParagraphsRatio;
      if (typeof u.answerFirstOpeningMinWordCount === 'number') m.answerFirstOpeningMinWordCount = u.answerFirstOpeningMinWordCount;
      if (typeof u.answerFirstOpeningWordsRange === 'number') m.answerFirstOpeningWordsRange = u.answerFirstOpeningWordsRange;
      if (typeof u.minScorableWords === 'number') m.minScorableWords = u.minScorableWords;
      if (typeof u.chunkSuitabilityMinWords === 'number') m.chunkSuitabilityMinWords = u.chunkSuitabilityMinWords;
      if (typeof u.chunkSuitabilityMaxWords === 'number') m.chunkSuitabilityMaxWords = u.chunkSuitabilityMaxWords;
      if (typeof u.chunkSuitabilityPronounDensity === 'number') m.chunkSuitabilityPronounDensity = u.chunkSuitabilityPronounDensity;
      if (typeof u.entityDensityHighRatio === 'number') m.entityDensityHighRatio = u.entityDensityHighRatio;
      if (typeof u.entityDensityMedRatio === 'number') m.entityDensityMedRatio = u.entityDensityMedRatio;
    }

    // 3. Merge Schema settings
    if (userConfig.schema) {
      const u = userConfig.schema;
      const m = merged.schema;
      if (typeof u.minSameAsCount === 'number') m.minSameAsCount = u.minSameAsCount;
      if (typeof u.parityProbeSliceLength === 'number') m.parityProbeSliceLength = u.parityProbeSliceLength;
      if (typeof u.parityMinProbeLength === 'number') m.parityMinProbeLength = u.parityMinProbeLength;
    }

    // 4. Merge AI-Access settings
    if (userConfig.aiAccess) {
      const u = userConfig.aiAccess;
      const m = merged.aiAccess;
      if (typeof u.minServerTextRatio === 'number') m.minServerTextRatio = u.minServerTextRatio;
      if (typeof u.minServerWordCount === 'number') m.minServerWordCount = u.minServerWordCount;
    }

    // 5. Merge Sandbox settings
    if (userConfig.sandbox) {
      if (typeof userConfig.sandbox.cpuTimeoutMs === 'number') {
        merged.sandbox.cpuTimeoutMs = userConfig.sandbox.cpuTimeoutMs;
      }
    }

    // 6. Merge html settings from rules config if overrides exist
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

    // 7. Merge Tracking settings
    if (userConfig.tracking) {
      if (typeof userConfig.tracking.retentionDays === 'number') {
        merged.tracking.retentionDays = userConfig.tracking.retentionDays;
      }
      if (typeof userConfig.tracking.comparisonWindowDays === 'number') {
        merged.tracking.comparisonWindowDays = userConfig.tracking.comparisonWindowDays;
      }
      if (typeof userConfig.tracking.alertPositionDropThreshold === 'number') {
        merged.tracking.alertPositionDropThreshold = userConfig.tracking.alertPositionDropThreshold;
      }
      if (typeof userConfig.tracking.alertPositionImproveThreshold === 'number') {
        merged.tracking.alertPositionImproveThreshold = userConfig.tracking.alertPositionImproveThreshold;
      }
      if (typeof userConfig.tracking.alertCtrDropThreshold === 'number') {
        merged.tracking.alertCtrDropThreshold = userConfig.tracking.alertCtrDropThreshold;
      }
    }

    return merged;
  }

  getSettings(): SeoKitSettings {
    return this.settings;
  }
}
export type { SeoKitSettings };
