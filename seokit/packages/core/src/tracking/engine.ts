import { SnapshotStore, TrackingProvider, AlertRule, AlertEvent, SERPSnapshot, TrackingFetchOptions, TrackingMetrics } from './types';
import { VerificationEventBus } from '../events';
import { ConfigurationProvider } from '../config/provider';
import { TrackingAnalyzer } from './analyzer';
import { TrackingProviderManager } from './provider-manager';

export class AlertEngine {
  private rules: AlertRule[] = [];
  private eventBus: VerificationEventBus;
  private configProvider: ConfigurationProvider;

  constructor(eventBus: VerificationEventBus, configProvider: ConfigurationProvider, rules: AlertRule[] = []) {
    this.eventBus = eventBus;
    this.configProvider = configProvider;
    this.rules = rules;
  }

  addRule(rule: AlertRule) {
    this.rules.push(rule);
  }

  evaluate(previousSnapshot: SERPSnapshot | null, newSnapshot: SERPSnapshot, metrics: TrackingMetrics | null) {
    for (const rule of this.rules) {
      if (rule.keywordPattern && !new RegExp(rule.keywordPattern).test(newSnapshot.keyword)) {
        continue;
      }

      let isTriggered = false;
      let message = '';
      let oldValue = 0;
      let newValue = 0;
      const settings = this.configProvider.getSettings().tracking;

      switch (rule.type) {
        case 'POSITION_DROP':
          if (!previousSnapshot) continue;
          oldValue = previousSnapshot.position;
          newValue = newSnapshot.position;
          if (newValue - oldValue >= settings.alertPositionDropThreshold) {
            isTriggered = true;
            message = `Position dropped by ${newValue - oldValue} for keyword "${newSnapshot.keyword}".`;
          }
          break;
        case 'POSITION_IMPROVE':
          if (!previousSnapshot) continue;
          oldValue = previousSnapshot.position;
          newValue = newSnapshot.position;
          if (oldValue - newValue >= settings.alertPositionImproveThreshold) {
            isTriggered = true;
            message = `Position improved by ${oldValue - newValue} for keyword "${newSnapshot.keyword}".`;
          }
          break;
        case 'CTR_DROP':
          if (!previousSnapshot) continue;
          oldValue = previousSnapshot.ctr;
          newValue = newSnapshot.ctr;
          if (oldValue - newValue >= settings.alertCtrDropThreshold) {
            isTriggered = true;
            message = `CTR dropped by ${(oldValue - newValue) * 100}% for keyword "${newSnapshot.keyword}".`;
          }
          break;
        case 'VOLATILITY':
          if (metrics && metrics.volatility > 5) { // Hardcoded 5 for simplicity if not in config
            isTriggered = true;
            message = `High volatility (${metrics.volatility.toFixed(2)}) detected for keyword "${newSnapshot.keyword}".`;
            newValue = metrics.volatility;
          }
          break;
        case 'SUSTAINED_DECLINE':
          if (metrics && metrics.trendDirection === 'DOWN') {
            isTriggered = true;
            message = `Sustained decline trend detected for keyword "${newSnapshot.keyword}".`;
          }
          break;
        case 'SUSTAINED_IMPROVEMENT':
          if (metrics && metrics.trendDirection === 'UP') {
            isTriggered = true;
            message = `Sustained improvement trend detected for keyword "${newSnapshot.keyword}".`;
          }
          break;
      }

      if (isTriggered) {
        const event: AlertEvent = {
          ruleId: rule.id,
          ruleName: rule.name,
          keyword: newSnapshot.keyword,
          url: newSnapshot.url,
          oldValue,
          newValue,
          date: newSnapshot.date,
          message
        };
        this.eventBus.publish('TrackingAlertTriggered', { alert: event });
      }
    }
  }
}

export class TrackingEngine {
  private store: SnapshotStore;
  private providerManager: TrackingProviderManager;
  private alertEngine: AlertEngine;
  private analyzer: TrackingAnalyzer;
  private eventBus: VerificationEventBus;

  constructor(
    store: SnapshotStore, 
    providerManager: TrackingProviderManager, 
    alertEngine: AlertEngine,
    analyzer: TrackingAnalyzer,
    eventBus: VerificationEventBus
  ) {
    this.store = store;
    this.providerManager = providerManager;
    this.alertEngine = alertEngine;
    this.analyzer = analyzer;
    this.eventBus = eventBus;
  }

  async processDailySnapshot(keyword: string, url: string, date: string, options: TrackingFetchOptions): Promise<void> {
    this.eventBus.publish('TrackingStarted', { keyword, date, providerName: this.providerManager.name });
    
    try {
      const newSnapshot = await this.providerManager.fetchSnapshot(keyword, url, date, options);
      if (!newSnapshot) {
        this.eventBus.publish('TrackingFailed', { keyword, date, providerName: this.providerManager.name, error: 'No snapshot returned' });
        return;
      }

      // Save the new snapshot
      await this.store.saveSnapshot(newSnapshot);
      this.eventBus.publish('SnapshotStored', { snapshotId: newSnapshot.id, keyword: newSnapshot.keyword });

      // Generate Metrics
      // Assuming a 30-day window for analysis
      const previousDate = this.getPreviousDate(date, 30);
      const history = await this.store.getSnapshotsForKeyword(keyword, previousDate, date);
      const metrics = this.analyzer.analyze(history);

      // Get immediate previous for simple alerts
      const yesterday = this.getPreviousDate(date, 1);
      const previousSnapshot = await this.store.getSnapshot(keyword, yesterday);

      // Evaluate alerts
      this.alertEngine.evaluate(previousSnapshot, newSnapshot, metrics);

      this.eventBus.publish('TrackingCompleted', { keyword, date, providerName: this.providerManager.name });
    } catch (err) {
      this.eventBus.publish('TrackingFailed', { keyword, date, providerName: this.providerManager.name, error: err instanceof Error ? err.message : String(err) });
    }
  }

  async processBulkSnapshots(keywords: string[], url: string, date: string, options: TrackingFetchOptions): Promise<void> {
    const newSnapshots = await this.providerManager.fetchBulkSnapshots(keywords, url, date, options);
    
    for (const newSnapshot of newSnapshots) {
      const yesterday = this.getPreviousDate(date, 1);
      const previousSnapshot = await this.store.getSnapshot(newSnapshot.keyword, yesterday);
      
      const previous30Days = this.getPreviousDate(date, 30);
      const history = await this.store.getSnapshotsForKeyword(newSnapshot.keyword, previous30Days, date);
      const metrics = this.analyzer.analyze([...history, newSnapshot]); // Include the new one for analysis

      this.alertEngine.evaluate(previousSnapshot, newSnapshot, metrics);
    }

    await this.store.saveSnapshots(newSnapshots);
  }

  private getPreviousDate(dateString: string, days: number): string {
    const date = new Date(dateString);
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }
}
