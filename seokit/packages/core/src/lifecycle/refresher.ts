import { VerificationEventBus } from '../events';
import { AIProvider } from '../platform/ai';
import { RefreshResult } from './types';

export class ContentRefresher {
  private aiProvider: AIProvider;
  private eventBus: VerificationEventBus;

  constructor(eventBus: VerificationEventBus, aiProvider: AIProvider) {
    this.eventBus = eventBus;
    this.aiProvider = aiProvider;
  }

  public async generateRefreshDraft(
    url: string, 
    keyword: string, 
    currentContent: string, 
    decayReason: string,
    metricsContext: string
  ): Promise<RefreshResult> {
    const prompt = `
You are an expert SEO and content strategist.
The following content targeting the keyword "${keyword}" is experiencing content decay.
Context on why this needs refreshing:
${decayReason}
Performance Context:
${metricsContext}

Your task is to generate a substantive refresh draft. 
Do NOT just change timestamps or make superficial edits.
You MUST:
1. Add new data or statistics.
2. Update recommendations to reflect current best practices and address the performance drop.
3. Add a new section that expands on a missing subtopic related to "${keyword}".

Original Content:
${currentContent}

Generate the refreshed content in HTML or Markdown.
`;

    try {
      const draftContent = await this.aiProvider.generate(prompt);
      
      this.eventBus.publish('RefreshDraftGenerated', { url, draftContent });

      return {
        url,
        originalContent: currentContent,
        draftContent,
        status: 'SUCCESS'
      };
    } catch (err) {
      return {
        url,
        originalContent: currentContent,
        draftContent: '',
        status: 'FAILED',
        error: err instanceof Error ? err.message : String(err)
      };
    }
  }
}
