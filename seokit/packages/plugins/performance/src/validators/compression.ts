import { ExecutionPlan, VerificationEvidence, ValidatorPlugin } from '@seokit/core';

export const compressionValidator: ValidatorPlugin = {
  id: 'compression-validator',
  version: '1.0.0',
  async execute(plan: ExecutionPlan, context: any): Promise<VerificationEvidence> {
    const headers = context.headers || {};
    const contentEncoding = headers['content-encoding'] ?? '';
    const cacheControl = headers['cache-control'] ?? '';

    const issues: string[] = [];
    const isCompressed = contentEncoding.includes('gzip') || contentEncoding.includes('br') || context.mockCompressed;
    const isCached = cacheControl.includes('max-age') || context.mockCached;

    if (!isCompressed) issues.push('Compression (Gzip/Brotli) not enabled');
    if (!isCached) issues.push('Caching (Cache-Control headers) not defined');

    return {
      passed: issues.length === 0,
      confidence: 1.0,
      output: issues.length === 0
        ? 'Asset caching and payload compression are correctly configured.'
        : `Caching/compression recommendations: ${issues.join('; ')}`,
      source: 'compression-validator'
    };
  }
};
