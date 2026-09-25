export interface SERPSnapshot {
  id: string;
  keyword: string;
  url: string;
  date: string; // ISO format date YYYY-MM-DD
  position: number;
  impressions: number;
  ctr: number;
  clicks: number;
  searchEngine: string;
  country: string;
  language: string;
  device: string;
  location: string;
  featureType: string;
  crawlSource: string;
}

export type AlertRuleType = 
  | 'POSITION_DROP' 
  | 'POSITION_IMPROVE' 
  | 'CTR_DROP'
  | 'VOLATILITY'
  | 'SUSTAINED_DECLINE'
  | 'SUSTAINED_IMPROVEMENT'
  | 'IMPRESSION_ANOMALY'
  | 'CLICK_ANOMALY'
  | 'NEW_KEYWORD'
  | 'LOST_KEYWORD'
  | 'FEATURE_CHANGE';

export interface AlertRule {
  id: string;
  name: string;
  type: AlertRuleType;
  keywordPattern?: string; // Optional regex pattern for keywords
}

export interface TrackingMetrics {
  keyword: string;
  averagePosition: number;
  bestPosition: number;
  worstPosition: number;
  averageImpressions: number;
  totalImpressions: number;
  movingAverage7Day?: number;
  movingAverage30Day?: number;
  volatility: number;
  trendDirection: 'UP' | 'DOWN' | 'FLAT';
  momentum: number;
}

export interface AlertEvent {
  ruleId: string;
  ruleName: string;
  keyword: string;
  url: string;
  oldValue: number;
  newValue: number;
  date: string;
  message: string;
}

export interface TrackingFetchOptions {
  searchEngine: string;
  country: string;
  language: string;
  device: string;
  location: string;
}

export interface TrackingProvider {
  name: string;
  fetchSnapshot(keyword: string, url: string, date: string, options: TrackingFetchOptions): Promise<SERPSnapshot | null>;
  fetchBulkSnapshots(keywords: string[], url: string, date: string, options: TrackingFetchOptions): Promise<SERPSnapshot[]>;
}

export interface TrackingStoreStatistics {
  totalSnapshots: number;
  uniqueKeywords: number;
  oldestSnapshotDate?: string;
  newestSnapshotDate?: string;
}

export interface SnapshotStore {
  saveSnapshot(snapshot: SERPSnapshot): Promise<void>;
  saveSnapshots(snapshots: SERPSnapshot[]): Promise<void>;
  getSnapshot(keyword: string, date: string): Promise<SERPSnapshot | null>;
  getSnapshotsForKeyword(keyword: string, startDate: string, endDate: string): Promise<SERPSnapshot[]>;
  getAllSnapshotsForDate(date: string, limit?: number, offset?: number): Promise<SERPSnapshot[]>;
  deleteExpiredSnapshots(retentionDate: string): Promise<number>;
  aggregateSnapshots(keyword: string, interval: 'weekly' | 'monthly'): Promise<SERPSnapshot[]>;
  bulkImport(snapshots: SERPSnapshot[]): Promise<number>;
  bulkExport(startDate: string, endDate: string): Promise<SERPSnapshot[]>;
  getStatistics(): Promise<TrackingStoreStatistics>;
}
