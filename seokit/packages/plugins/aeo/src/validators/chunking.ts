import { ExecutionPlan, VerificationEvidence, ValidatorPlugin, FixPlan, extractChunks, scoreChunk } from '@seokit/core';

export const aeoChunkingValidator: ValidatorPlugin = {
  id: 'aeo-chunking-validator',
  version: '1.0.0',
  async execute(plan: ExecutionPlan, context: any): Promise<VerificationEvidence> {
    const html = context.rawHtml || context.pageHtml || '';
    if (!html) {
      return { passed: true, confidence: 1.0, output: 'No HTML available.', source: 'aeo-chunking-validator' };
    }

    const chunks = extractChunks(html);
    let lowScoreChunksCount = 0;

    for (const chunk of chunks) {
      const score = scoreChunk(chunk);
      if (score.suitabilityScore < 50) {
        lowScoreChunksCount++;
      }
    }

    if (lowScoreChunksCount > 0) {
      const fix: FixPlan = {
        ruleId: 'aeo.chunking.suitability',
        description: 'Text contains poor standalone answers (low BLUFF score or high pronoun density).',
        suggestedFix: 'Optimize sections under subheadings to lead with a direct 40-60 word answer.',
        targetFile: context.filePath
      };

      return {
        passed: false,
        confidence: 1.0,
        output: `AEO chunking check: ${lowScoreChunksCount} of ${chunks.length} chunks are not suitable as standalone answers.`,
        source: 'aeo-chunking-validator',
        fixPlan: fix
      };
    }

    return {
      passed: true,
      confidence: 1.0,
      output: `All ${chunks.length} page text chunks are optimized for retrieval as standalone answers.`,
      source: 'aeo-chunking-validator'
    };
  }
};
