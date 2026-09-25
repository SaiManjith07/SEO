import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CruxPlugin } from './index.js';

vi.mock('crux-api', () => {
  return {
    createQueryRecord: vi.fn().mockImplementation(() => {
      return vi.fn();
    }),
  };
});

describe('CruxPlugin', () => {
  let plugin: any;
  
  beforeEach(() => {
    process.env.CRUX_API_KEY = 'test_key';
    plugin = new CruxPlugin();
  });

  it('throws on missing CRUX_API_KEY', () => {
    delete process.env.CRUX_API_KEY;
    expect(() => new CruxPlugin()).toThrow('CRUX_API_KEY is not set');
  });

  it('returns empty array when no data', async () => {
    plugin.query.mockRejectedValueOnce(new Error('no data found'));
    const result = await plugin.fetchRecord('https://example.com');
    expect(result).toEqual([]);
  });

  it('returns record on success', async () => {
    plugin.query.mockResolvedValueOnce({
      record: { metrics: { first_contentful_paint: {} } }
    });
    const result = await plugin.fetchRecord('https://example.com');
    expect(result.length).toBe(1);
    expect(result[0].metrics).toBeDefined();
  });

  it('throws on invalid key', async () => {
    plugin.query.mockRejectedValueOnce(new Error('API_KEY_INVALID'));
    await expect(plugin.fetchRecord('https://example.com')).rejects.toThrow('CRUX_API_KEY is invalid');
  });

  it('throws on rate limit', async () => {
    plugin.query.mockRejectedValueOnce(new Error('quota exceeded'));
    await expect(plugin.fetchRecord('https://example.com')).rejects.toThrow('CrUX API rate limit exceeded');
  });

  it('throws on network error', async () => {
    plugin.query.mockRejectedValueOnce(new Error('ECONNRESET'));
    await expect(plugin.fetchRecord('https://example.com')).rejects.toThrow('CrUX network error: ECONNRESET');
  });
});
