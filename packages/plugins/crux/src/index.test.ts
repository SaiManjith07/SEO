import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CruxPlugin } from './index.js';

describe('CruxPlugin', () => {
  let plugin: any;
  let originalFetch: any;
  
  beforeEach(() => {
    process.env.CRUX_API_KEY = 'test_key';
    plugin = new CruxPlugin();
    originalFetch = global.fetch;
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('throws on missing CRUX_API_KEY', () => {
    delete process.env.CRUX_API_KEY;
    expect(() => new CruxPlugin()).toThrow('CRUX_API_KEY is not set');
  });

  it('returns empty array when no data (404)', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({})
    });
    const result = await plugin.fetchRecord('https://example.com');
    expect(result).toEqual([]);
  });

  it('returns empty array when record is missing', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({})
    });
    const result = await plugin.fetchRecord('https://example.com');
    expect(result).toEqual([]);
  });

  it('returns record on success', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        record: { metrics: { first_contentful_paint: {} } }
      })
    });
    const result = await plugin.fetchRecord('https://example.com');
    expect(result.length).toBe(1);
    expect(result[0].metrics).toBeDefined();
  });

  it('throws on invalid key (API Error with message)', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ error: { message: 'API_KEY_INVALID' } })
    });
    await expect(plugin.fetchRecord('https://example.com')).rejects.toThrow('CrUX API Error: API_KEY_INVALID');
  });

  it('throws on API error without message', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({})
    });
    await expect(plugin.fetchRecord('https://example.com')).rejects.toThrow('CrUX network error: CrUX API Error HTTP 500');
  });

  it('throws on network error', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('ECONNRESET'));
    await expect(plugin.fetchRecord('https://example.com')).rejects.toThrow('CrUX network error: ECONNRESET');
  });
});
