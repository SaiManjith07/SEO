export class CruxCredentialsMissingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CruxCredentialsMissingError';
  }
}

export class CruxPlugin {
  private key: string;

  constructor() {
    const key = process.env.CRUX_API_KEY;
    if (!key) {
      throw new CruxCredentialsMissingError('CRUX_API_KEY is not set');
    }
    this.key = key;
  }

  async fetchRecord(urlOrOrigin: string, isOrigin: boolean = false) {
    const endpoint = `https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=${this.key}`;
    const payload: any = {
      [isOrigin ? 'origin' : 'url']: urlOrOrigin
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          return []; // no_data returns empty array
        }
        if (data.error && data.error.message) {
          throw new Error(`CrUX API Error: ${data.error.message}`);
        }
        throw new Error(`CrUX API Error HTTP ${response.status}`);
      }

      if (!data || !data.record || !data.record.metrics) {
        return [];
      }

      return [data.record];
    } catch (err: any) {
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
