export interface SourceLocation {
  line: number;
  columnStart: number;
  columnEnd: number;
  snippet?: string;
}

export interface MetadataField<T> {
  value: T;
  location?: SourceLocation;
}

export interface PageMetadata {
  title?: MetadataField<string>;
  description?: MetadataField<string>;
  canonicalUrl?: MetadataField<string>;
  lang?: MetadataField<string>;
  headings: {
    h1: MetadataField<string>[];
    h2: MetadataField<string>[];
    h3: MetadataField<string>[];
  };
  outboundLinks: MetadataField<string>[];
  metaTags: Record<string, MetadataField<string>>;
}

export interface PerformanceData {
  lcpMs?: number;
  cls?: number;
  inpMs?: number;
  gzipEnabled: boolean;
  cacheControl?: string;
}

export interface FrameworkMetadata {
  name: string;
  version?: string;
  isHydrated: boolean;
}

export interface Page {
  route: string;
  sourcePath: string;
  rawHtml: string;
  headers: Record<string, string>;
  metadata: PageMetadata;
  structuredData: Record<string, any>[];
  performanceData?: PerformanceData;
}

export interface Asset {
  url: string;
  mimeType: string;
  sizeBytes: number;
  headers: Record<string, string>;
}

export interface Website {
  origin: string;
  pages: Record<string, Page>;
  assets: Record<string, Asset>;
  sitemapXml?: string;
  robotsTxt?: string;
  frameworkMetadata?: FrameworkMetadata;
}

export interface VerificationEvidence {
  ruleId: string;
  passed: boolean;
  output: string;
  standard?: string;
  errorDetail?: string;
  location?: SourceLocation;
  fixPlan?: {
    suggestedFix: string;
    targetSnippet?: string;
    replacementText?: string;
  };
}

export interface Diagnostic {
  uri: string;
  severity: 'error' | 'warning' | 'info' | 'hint';
  message: string;
  range: {
    start: { line: number; character: number };
    end: { line: number; character: number };
  };
  source: 'SEOKit Platform';
  code: string;
  actions?: CodeAction[];
}

export interface CodeAction {
  title: string;
  kind: 'quickfix';
  edit: {
    changes: Record<string, TextEdit[]>;
  };
}

export interface TextEdit {
  range: Diagnostic['range'];
  newText: string;
}
