import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TrackingEngine, AlertEngine } from './engine';
import { LocalSnapshotStore } from './store';
import { AlertRule, TrackingProvider, SERPSnapshot, TrackingFetchOptions } from './types';
import { VerificationEventBus } from '../events';
import { ConfigurationProvider } from '../config/provider';
import { TrackingAnalyzer } from './analyzer';
import { TrackingProviderManager } from './provider-manager';

describe('AlertEngine', () => {
  let eventBus: VerificationEventBus;
  let configProvider: ConfigurationProvider;
  let alertEngine: AlertEngine;

  const mockPreviousSnapshot: SERPSnapshot = {
    id: '1',
    keyword: 'test',
    url: 'https://example.com',
    date: '2026-07-30',
    position: 5,
    impressions: 1000,
    ctr: 0.1,
    clicks: 100,
    searchEngine: 'google',
    country: 'us',
    language: 'en',
    device: 'desktop',
    location: 'NY',
    featureType: 'organic',
    crawlSource: 'mock'
  };

  const mockNewSnapshotPositionDrop: SERPSnapshot = {
    ...mockPreviousSnapshot,
    id: '2',
    date: '2026-07-31',
    position: 9 // Drop of 4
  };

  const mockNewSnapshotCtrDrop: SERPSnapshot = {
    ...mockPreviousSnapshot,
    id: '3',
    date: '2026-07-31',
    ctr: 0.05 // Drop of 0.05
  };

  beforeEach(() => {
    eventBus = new VerificationEventBus();
    configProvider = new ConfigurationProvider();
    alertEngine = new AlertEngine(eventBus, configProvider);
  });

  it('should trigger alert when position drops beyond configured threshold', () => {
    const emitSpy = vi.spyOn(eventBus, 'publish');
    
    alertEngine.addRule({
      id: 'rule1',
      name: 'Position Drop',
      type: 'POSITION_DROP'
    });

    alertEngine.evaluate(mockPreviousSnapshot, mockNewSnapshotPositionDrop, null);

    expect(emitSpy).toHaveBeenCalledTimes(1);
    expect(emitSpy).toHaveBeenCalledWith('TrackingAlertTriggered', { alert: expect.objectContaining({
      ruleId: 'rule1',
      keyword: 'test',
      oldValue: 5,
      newValue: 9
    })});
  });

  it('should not trigger alert when position drop is below configured threshold', () => {
    const customConfig = new ConfigurationProvider({
      tracking: {
        alertPositionDropThreshold: 5 // Custom threshold 5. Dropped by 4, so this shouldn't trigger
      }
    });
    alertEngine = new AlertEngine(eventBus, customConfig);

    const emitSpy = vi.spyOn(eventBus, 'publish');
    
    alertEngine.addRule({
      id: 'rule1',
      name: 'Position Drop',
      type: 'POSITION_DROP'
    });

    alertEngine.evaluate(mockPreviousSnapshot, mockNewSnapshotPositionDrop, null);

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('should trigger alert when CTR drops beyond configured threshold', () => {
    const customConfig = new ConfigurationProvider({
      tracking: {
        alertCtrDropThreshold: 0.04
      }
    });
    alertEngine = new AlertEngine(eventBus, customConfig);

    const emitSpy = vi.spyOn(eventBus, 'publish');
    
    alertEngine.addRule({
      id: 'rule2',
      name: 'CTR Drop',
      type: 'CTR_DROP'
    });

    alertEngine.evaluate(mockPreviousSnapshot, mockNewSnapshotCtrDrop, null);

    expect(emitSpy).toHaveBeenCalledTimes(1);
    expect(emitSpy).toHaveBeenCalledWith('TrackingAlertTriggered', { alert: expect.objectContaining({
      ruleId: 'rule2',
      keyword: 'test',
      oldValue: 0.1,
      newValue: 0.05
    })});
  });
});

describe('TrackingEngine', () => {
  let store: LocalSnapshotStore;
  let eventBus: VerificationEventBus;
  let configProvider: ConfigurationProvider;
  let alertEngine: AlertEngine;
  let analyzer: TrackingAnalyzer;
  let providerManager: TrackingProviderManager;
  let trackingEngine: TrackingEngine;
  
  const mockProvider: TrackingProvider = {
    name: 'MockProvider',
    fetchSnapshot: vi.fn(),
    fetchBulkSnapshots: vi.fn()
  };

  const mockOptions: TrackingFetchOptions = {
    searchEngine: 'google',
    country: 'us',
    language: 'en',
    device: 'desktop',
    location: 'NY'
  };

  beforeEach(() => {
    store = new LocalSnapshotStore();
    eventBus = new VerificationEventBus();
    configProvider = new ConfigurationProvider();
    alertEngine = new AlertEngine(eventBus, configProvider);
    analyzer = new TrackingAnalyzer();
    providerManager = new TrackingProviderManager(eventBus, [mockProvider]);
    trackingEngine = new TrackingEngine(store, providerManager, alertEngine, analyzer, eventBus);
  });

  it('should process daily snapshot and evaluate alerts', async () => {
    const mockDate = '2026-07-31';
    const previousDate = '2026-07-30';
    
    const previousSnapshot: SERPSnapshot = {
      id: '1', keyword: 'seo', url: 'https://test.com', date: previousDate, position: 2, impressions: 100, ctr: 0.1, clicks: 10,
      searchEngine: 'google', country: 'us', language: 'en', device: 'desktop', location: 'NY', featureType: 'organic', crawlSource: 'mock'
    };
    await store.saveSnapshot(previousSnapshot);

    const newSnapshot: SERPSnapshot = {
      id: '2', keyword: 'seo', url: 'https://test.com', date: mockDate, position: 6, impressions: 100, ctr: 0.1, clicks: 10,
      searchEngine: 'google', country: 'us', language: 'en', device: 'desktop', location: 'NY', featureType: 'organic', crawlSource: 'mock'
    };

    vi.mocked(mockProvider.fetchSnapshot).mockResolvedValue(newSnapshot);
    
    const emitSpy = vi.spyOn(eventBus, 'publish');
    alertEngine.addRule({ id: 'r1', name: 'Drop', type: 'POSITION_DROP' });

    await trackingEngine.processDailySnapshot('seo', 'https://test.com', mockDate, mockOptions);

    expect(emitSpy).toHaveBeenCalledWith('TrackingStarted', expect.any(Object));
    expect(emitSpy).toHaveBeenCalledWith('TrackingAlertTriggered', expect.any(Object));
    expect(emitSpy).toHaveBeenCalledWith('TrackingCompleted', expect.any(Object));
    
    const stored = await store.getSnapshot('seo', mockDate);
    expect(stored).toEqual(newSnapshot);
    expect(mockProvider.fetchSnapshot).toHaveBeenCalledWith('seo', 'https://test.com', mockDate, mockOptions);
  });
});
