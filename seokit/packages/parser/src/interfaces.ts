import { Website } from '@seokit/website';

export interface RawResource {
  route: string;
  sourcePath: string;
  content: string | Buffer;
  headers: Record<string, string>;
  acquiredAt: string;
}

export interface ParserOptions {
  enableStructuredData?: boolean;
  enableLcpLookup?: boolean;
}

export interface IParserPipeline {
  /**
   * Process a list of raw resource buffers to construct the universal Website model
   */
  parse(resources: RawResource[], options?: ParserOptions): Promise<Website>;
}
