import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContentRefresher } from './refresher.js';
import { VerificationEventBus } from '../events.js';
import { AIProvider } from '../platform/ai.js';

describe('ContentRefresher', () => {
  let eventBus: VerificationEventBus;
  let aiProvider: AIProvider;
  let refresher: ContentRefresher;

  beforeEach(() => {
    eventBus = new VerificationEventBus();
    aiProvider = {
      name: 'MockAI',
      generate: vi.fn(),
      analyze: vi.fn(),
      fix: vi.fn()
    };
    refresher = new ContentRefresher(eventBus, aiProvider);
  });

  it('should generate a refresh draft and emit event on success', async () => {
    const emitSpy = vi.spyOn(eventBus, 'publish');
    vi.mocked(aiProvider.generate).mockResolvedValue('<p>Refreshed content with new data</p>');

    const result = await refresher.generateRefreshDraft('https://example.com/page', 'seo software', '<p>Old content</p>');

    expect(result.status).toBe('SUCCESS');
    expect(result.draftContent).toBe('<p>Refreshed content with new data</p>');
    expect(emitSpy).toHaveBeenCalledWith('RefreshDraftGenerated', {
      url: 'https://example.com/page',
      draftContent: '<p>Refreshed content with new data</p>'
    });
    
    // Check if prompt enforces the standard
    const prompt = vi.mocked(aiProvider.generate).mock.calls[0][0];
    expect(prompt).toContain('Add new data or statistics');
    expect(prompt).toContain('seo software');
  });

  it('should handle AI provider failure', async () => {
    const emitSpy = vi.spyOn(eventBus, 'publish');
    vi.mocked(aiProvider.generate).mockRejectedValue(new Error('AI API Error'));

    const result = await refresher.generateRefreshDraft('https://example.com/page', 'seo software', '<p>Old content</p>');

    expect(result.status).toBe('FAILED');
    expect(result.error).toBe('AI API Error');
    expect(result.draftContent).toBe('');
    expect(emitSpy).not.toHaveBeenCalled();
  });
});
