import { SnapshotStore, SERPSnapshot } from './types.js';

export class LocalSnapshotStore implements SnapshotStore {
  private snapshots: Map<string, SERPSnapshot> = new Map();

  constructor(initialData: SERPSnapshot[] = []) {
    for (const snapshot of initialData) {
      this.snapshots.set(snapshot.id, snapshot);
    }
  }

  async saveSnapshot(snapshot: SERPSnapshot): Promise<void> {
    this.snapshots.set(snapshot.id, snapshot);
  }

  async saveSnapshots(snapshots: SERPSnapshot[]): Promise<void> {
    for (const snapshot of snapshots) {
      this.snapshots.set(snapshot.id, snapshot);
    }
  }

  async getSnapshot(keyword: string, date: string): Promise<SERPSnapshot | null> {
    for (const snapshot of this.snapshots.values()) {
      if (snapshot.keyword === keyword && snapshot.date === date) {
        return snapshot;
      }
    }
    return null;
  }

  async getSnapshotsForKeyword(keyword: string, startDate: string, endDate: string): Promise<SERPSnapshot[]> {
    const results: SERPSnapshot[] = [];
    for (const snapshot of this.snapshots.values()) {
      if (snapshot.keyword === keyword && snapshot.date >= startDate && snapshot.date <= endDate) {
        results.push(snapshot);
      }
    }
    // Sort by date ascending
    return results.sort((a, b) => a.date.localeCompare(b.date));
  }

  async getAllSnapshotsForDate(date: string, limit?: number, offset?: number): Promise<SERPSnapshot[]> {
    let results: SERPSnapshot[] = [];
    for (const snapshot of this.snapshots.values()) {
      if (snapshot.date === date) {
        results.push(snapshot);
      }
    }
    
    // Simple pagination
    if (offset !== undefined) {
      results = results.slice(offset);
    }
    if (limit !== undefined) {
      results = results.slice(0, limit);
    }
    
    return results;
  }

  async deleteExpiredSnapshots(retentionDate: string): Promise<number> {
    let deletedCount = 0;
    for (const [id, snapshot] of this.snapshots.entries()) {
      if (snapshot.date < retentionDate) {
        this.snapshots.delete(id);
        deletedCount++;
      }
    }
    return deletedCount;
  }

  async aggregateSnapshots(keyword: string, interval: 'weekly' | 'monthly'): Promise<SERPSnapshot[]> {
    // In a real DB, this would group by week/month and average positions.
    // For this mock local store, just return raw for now.
    return this.getSnapshotsForKeyword(keyword, '2000-01-01', '2100-01-01');
  }

  async bulkImport(snapshots: SERPSnapshot[]): Promise<number> {
    await this.saveSnapshots(snapshots);
    return snapshots.length;
  }

  async bulkExport(startDate: string, endDate: string): Promise<SERPSnapshot[]> {
    const results: SERPSnapshot[] = [];
    for (const snapshot of this.snapshots.values()) {
      if (snapshot.date >= startDate && snapshot.date <= endDate) {
        results.push(snapshot);
      }
    }
    return results;
  }

  async getStatistics(): Promise<import('./types.js').TrackingStoreStatistics> {
    const uniqueKeywords = new Set<string>();
    let oldest: string | undefined = undefined;
    let newest: string | undefined = undefined;

    for (const snapshot of this.snapshots.values()) {
      uniqueKeywords.add(snapshot.keyword);
      if (!oldest || snapshot.date < oldest) oldest = snapshot.date;
      if (!newest || snapshot.date > newest) newest = snapshot.date;
    }

    return {
      totalSnapshots: this.snapshots.size,
      uniqueKeywords: uniqueKeywords.size,
      oldestSnapshotDate: oldest,
      newestSnapshotDate: newest
    };
  }
}
