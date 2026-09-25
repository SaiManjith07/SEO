import { TrackingProvider, SERPSnapshot, TrackingFetchOptions } from './types.js';
import { VerificationEventBus } from '../events.js';

export class TrackingProviderManager implements TrackingProvider {
  public name = 'ProviderManager';
  private providers: TrackingProvider[] = [];
  private eventBus: VerificationEventBus;

  constructor(eventBus: VerificationEventBus, providers: TrackingProvider[] = []) {
    this.eventBus = eventBus;
    this.providers = providers;
  }

  addProvider(provider: TrackingProvider) {
    this.providers.push(provider);
  }

  async fetchSnapshot(keyword: string, url: string, date: string, options: TrackingFetchOptions): Promise<SERPSnapshot | null> {
    for (const provider of this.providers) {
      try {
        const snapshot = await provider.fetchSnapshot(keyword, url, date, options);
        if (snapshot) {
          // If a subsequent provider succeeded after a failure, we could emit ProviderRecovered here
          // but for simplicity, we just return the first successful result.
          return snapshot;
        }
      } catch (err) {
        this.eventBus.publish('ProviderUnavailable', {
          providerName: provider.name,
          error: err instanceof Error ? err.message : String(err)
        });
      }
    }
    return null;
  }

  async fetchBulkSnapshots(keywords: string[], url: string, date: string, options: TrackingFetchOptions): Promise<SERPSnapshot[]> {
    for (const provider of this.providers) {
      try {
        const snapshots = await provider.fetchBulkSnapshots(keywords, url, date, options);
        if (snapshots && snapshots.length > 0) {
          return snapshots;
        }
      } catch (err) {
        this.eventBus.publish('ProviderUnavailable', {
          providerName: provider.name,
          error: err instanceof Error ? err.message : String(err)
        });
      }
    }
    return [];
  }
}
