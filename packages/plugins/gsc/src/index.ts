import fs from 'fs';
import { google, searchconsole_v1 } from 'googleapis';

export class GSCCredentialsMissingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GSCCredentialsMissingError';
  }
}

export class GSCPlugin {
  private gsc: searchconsole_v1.Searchconsole | null = null;
  private propertyUrl: string;

  constructor() {
    this.propertyUrl = process.env.GSC_PROPERTY_URL || '';
    if (!this.propertyUrl) {
      throw new GSCCredentialsMissingError('GSC_PROPERTY_URL is not set');
    }

    const keyPath = process.env.GSC_SERVICE_ACCOUNT_PATH;
    if (!keyPath) {
      throw new GSCCredentialsMissingError('GSC_SERVICE_ACCOUNT_PATH is not set');
    }

    if (!fs.existsSync(keyPath)) {
      throw new GSCCredentialsMissingError(`GSC_SERVICE_ACCOUNT_PATH file not found at ${keyPath}`);
    }

    try {
      JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    } catch (err: any) {
      throw new GSCCredentialsMissingError(`GSC_SERVICE_ACCOUNT_PATH JSON invalid: ${err.message}`);
    }

    try {
      const auth = new google.auth.GoogleAuth({
        keyFile: keyPath,
        scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
      });
      this.gsc = google.searchconsole({ version: 'v1', auth });
    } catch (err: any) {
      throw new Error(`Failed to initialize Google Auth: ${err.message}`);
    }
  }

  private getDateAgo(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  }

  async topQueries(days: number = 30, limit: number = 10) {
    if (!this.gsc) return [];
    try {
      const response = await this.gsc.searchanalytics.query({
        siteUrl: this.propertyUrl,
        requestBody: {
          startDate: this.getDateAgo(days),
          endDate: this.getDateAgo(1),
          dimensions: ['query'],
          rowLimit: limit,
        }
      });
      return (response.data.rows || []).map((row: any) => ({
        query: row.keys[0],
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      }));
    } catch (err: any) {
      throw new Error(`GSC API Error: ${err.message}`);
    }
  }

  async topPages(days: number = 30, limit: number = 10) {
    if (!this.gsc) return [];
    try {
      const response = await this.gsc.searchanalytics.query({
        siteUrl: this.propertyUrl,
        requestBody: {
          startDate: this.getDateAgo(days),
          endDate: this.getDateAgo(1),
          dimensions: ['page'],
          rowLimit: limit,
        }
      });
      return (response.data.rows || []).map((row: any) => ({
        page: row.keys[0],
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
      }));
    } catch (err: any) {
      throw new Error(`GSC API Error: ${err.message}`);
    }
  }

  async lowCtrHighImpressions(days: number = 30, impressionThreshold: number = 1000, ctrThreshold: number = 0.02) {
    if (!this.gsc) return [];
    try {
      const queries = await this.topQueries(days, 50);
      return queries.filter((q: any) => q.impressions >= impressionThreshold && q.ctr < ctrThreshold);
    } catch (err: any) {
      throw new Error(`GSC API Error: ${err.message}`);
    }
  }

  async indexingStatus(url: string) {
    if (!this.gsc) return 'unknown';
    try {
      const response = await this.gsc.urlInspection.index.inspect({
        requestBody: {
          inspectionUrl: url,
          siteUrl: this.propertyUrl,
        }
      });
      if (response.data.inspectionResult && response.data.inspectionResult.indexStatusResult) {
        return response.data.inspectionResult.indexStatusResult.coverageState || 'unknown';
      }
      return 'unknown';
    } catch (err: any) {
      throw new Error(`GSC API Error: ${err.message}`);
    }
  }
}

export const gscPlugin = (() => {
  try {
    return new GSCPlugin();
  } catch(e) {
    return {
      topQueries: async () => { throw e; },
      topPages: async () => { throw e; },
      lowCtrHighImpressions: async () => { throw e; },
      indexingStatus: async () => { throw e; }
    } as any;
  }
})();
