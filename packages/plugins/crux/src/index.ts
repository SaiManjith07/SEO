import { createQueryRecord } from 'crux-api';

export class CruxCredentialsMissingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CruxCredentialsMissingError';
  }
}

// Minimal polyfill because crux-api reads window.fetch directly, which crashes in Node.
if (typeof window === 'undefined') {
  (global as any).window = { fetch: globalThis.fetch };
}

export class CruxPlugin {
  private query: any;

  constructor() {
    const key = process.env.CRUX_API_KEY;
    if (!key) {
      throw new CruxCredentialsMissingError('CRUX_API_KEY is not set');
    }
    this.query = createQueryRecord({ key });
  }

  async fetchRecord(urlOrOrigin: string, isOrigin: boolean = false) {

    try {
      const response = await this.query({
        [isOrigin ? 'origin' : 'url']: urlOrOrigin,
      });

      if (!response || !response.record || !response.record.metrics) {
        return [];
      }

      return [response.record];
    } catch (err: any) {
      if (err.message?.includes('API_KEY_INVALID')) {
        throw new Error('CRUX_API_KEY is invalid');
      }
      if (err.message?.includes('quota')) {
        throw new Error('CrUX API rate limit exceeded');
      }
      if (err.message?.includes('not found') || err.message?.includes('no data')) {
        return []; // no_data returns empty array
      }
      throw new Error(`CrUX network error: ${err.message}`);
    }
  }
}

export const cruxPlugin = (() => {
  try {
    return new CruxPlugin();
  } catch(e) {
    return {
      fetchRecord: async () => { throw e; }
    } as any;
  }
})();
