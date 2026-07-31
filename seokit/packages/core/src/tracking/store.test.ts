import { describe, it, expect, beforeEach } from 'vitest';
import { LocalSnapshotStore } from './store';
import { SERPSnapshot } from './types';

describe('LocalSnapshotStore', () => {
  let store: LocalSnapshotStore;
  
  const mockSnapshot1: SERPSnapshot = {
    id: '1',
    keyword: 'test keyword',
    url: 'https://example.com',
    date: '2026-07-30',
    position: 5,
    impressions: 1000,
    ctr: 0.05,
    clicks: 50,
    searchEngine: 'google',
    country: 'us',
    language: 'en',
    device: 'desktop',
    location: 'NY',
    featureType: 'organic',
    crawlSource: 'mock'
  };

  const mockSnapshot2: SERPSnapshot = {
    id: '2',
    keyword: 'test keyword',
    url: 'https://example.com',
    date: '2026-07-31',
    position: 3,
    impressions: 1200,
    ctr: 0.06,
    clicks: 72,
    searchEngine: 'google',
    country: 'us',
    language: 'en',
    device: 'desktop',
    location: 'NY',
    featureType: 'organic',
    crawlSource: 'mock'
  };

  beforeEach(() => {
    store = new LocalSnapshotStore();
  });

  it('should save and retrieve a snapshot', async () => {
    await store.saveSnapshot(mockSnapshot1);
    
    const retrieved = await store.getSnapshot('test keyword', '2026-07-30');
    expect(retrieved).toEqual(mockSnapshot1);
  });

  it('should save multiple snapshots', async () => {
    await store.saveSnapshots([mockSnapshot1, mockSnapshot2]);
    
    const retrieved1 = await store.getSnapshot('test keyword', '2026-07-30');
    const retrieved2 = await store.getSnapshot('test keyword', '2026-07-31');
    
    expect(retrieved1).toEqual(mockSnapshot1);
    expect(retrieved2).toEqual(mockSnapshot2);
  });

  it('should get snapshots for a keyword within a date range', async () => {
    await store.saveSnapshots([mockSnapshot1, mockSnapshot2]);
    
    const results = await store.getSnapshotsForKeyword('test keyword', '2026-07-30', '2026-08-01');
    expect(results).toHaveLength(2);
    expect(results[0].date).toBe('2026-07-30');
    expect(results[1].date).toBe('2026-07-31');
  });

  it('should get all snapshots for a specific date', async () => {
    await store.saveSnapshots([mockSnapshot1, mockSnapshot2]);
    
    const results = await store.getAllSnapshotsForDate('2026-07-31');
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(mockSnapshot2);
  });
});
