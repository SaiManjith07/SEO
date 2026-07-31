export interface IntelligenceSettings {
  thinContentThreshold: number;
  duplicateSimilarity: number;
  cannibalizationSimilarity: number;
  orphanExclusions: string[];
  requiredEeatPages: string[];
}

export interface HtmlSettings {
  maxTitleLength: number;
  minMetaDescriptionLength: number;
  maxMetaDescriptionLength: number;
}

export interface SandboxSettings {
  cpuTimeoutMs: number;
}

export interface SeoKitSettings {
  intelligence: IntelligenceSettings;
  html: HtmlSettings;
  sandbox: SandboxSettings;
}

export const DEFAULT_SETTINGS: SeoKitSettings = {
  intelligence: {
    thinContentThreshold: 200,
    duplicateSimilarity: 0.85,
    cannibalizationSimilarity: 0.85,
    orphanExclusions: [],
    requiredEeatPages: ['about', 'contact', 'privacy', 'terms']
  },
  html: {
    maxTitleLength: 60,
    minMetaDescriptionLength: 120,
    maxMetaDescriptionLength: 160
  },
  sandbox: {
    cpuTimeoutMs: 50
  }
};
