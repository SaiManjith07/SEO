import * as crypto from 'crypto';
import type { Finding } from './types.js';
import { VerificationEventBus } from './events.js';

export interface IncrementalCacheEntry {
  fileHash: string;
  findings: Finding[];
  timestamp: number;
  guidelineVersion: string;
  dependencies: string[];
  templateId?: string;
  assetIds?: string[];
}

export class IncrementalAnalyzer {
  private cache: Map<string, IncrementalCacheEntry> = new Map();

  constructor(
    private currentGuidelineVersion: string = '3.0.0',
    private eventBus?: VerificationEventBus
  ) {}

  /** Compute hash for a string of content */
  computeHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Get cached findings if the content hash, dependencies, and guideline version
   * match compatibility requirements.
   */
  getCachedFindings(
    filePath: string,
    currentContent: string,
    ruleId: string,
    dependencies: string[] = [],
    templateId?: string,
    assetIds?: string[]
  ): Finding[] | null {
    const entry = this.cache.get(`${filePath}::${ruleId}`);
    
    if (!entry) {
      if (this.eventBus) {
        this.eventBus.publish('CacheMiss', { filePath, ruleId }).catch(() => {});
      }
      return null;
    }

    // 1. Guideline Version Invalidation
    if (entry.guidelineVersion !== this.currentGuidelineVersion) {
      if (this.eventBus) {
        this.eventBus.publish('CacheMiss', { filePath, ruleId }).catch(() => {});
      }
      return null;
    }

    // 2. Hash Invalidation
    const currentHash = this.computeHash(currentContent);
    if (entry.fileHash !== currentHash) {
      if (this.eventBus) {
        this.eventBus.publish('CacheMiss', { filePath, ruleId }).catch(() => {});
      }
      return null;
    }

    // 3. Rule Dependency Graph Invalidation
    const depsMatch = JSON.stringify(entry.dependencies.sort()) === JSON.stringify(dependencies.sort());
    if (!depsMatch) {
      if (this.eventBus) {
        this.eventBus.publish('CacheMiss', { filePath, ruleId }).catch(() => {});
      }
      return null;
    }

    // 4. Template & Asset dependency mapping invalidation
    if (templateId && entry.templateId !== templateId) {
      if (this.eventBus) {
        this.eventBus.publish('CacheMiss', { filePath, ruleId }).catch(() => {});
      }
      return null;
    }

    if (assetIds && entry.assetIds) {
      const assetsMatch = JSON.stringify(entry.assetIds.sort()) === JSON.stringify(assetIds.sort());
      if (!assetsMatch) {
        if (this.eventBus) {
          this.eventBus.publish('CacheMiss', { filePath, ruleId }).catch(() => {});
        }
        return null;
      }
    }

    if (this.eventBus) {
      this.eventBus.publish('CacheHit', { filePath, ruleId }).catch(() => {});
    }

    return entry.findings;
  }

  /** Cache findings for a given file path, content, and dependencies */
  setCache(
    filePath: string,
    content: string,
    ruleId: string,
    findings: Finding[],
    dependencies: string[] = [],
    templateId?: string,
    assetIds?: string[]
  ): void {
    const fileHash = this.computeHash(content);
    this.cache.set(`${filePath}::${ruleId}`, {
      fileHash,
      findings,
      timestamp: Date.now(),
      guidelineVersion: this.currentGuidelineVersion,
      dependencies,
      templateId,
      assetIds
    });
  }

  /** Invalidate cache for a specific file/rule */
  invalidate(filePath: string, ruleId?: string): void {
    if (ruleId) {
      this.cache.delete(`${filePath}::${ruleId}`);
    } else {
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${filePath}::`)) {
          this.cache.delete(key);
        }
      }
    }
  }

  /** Invalidate cache based on git diff paths list */
  invalidateGitDiff(changedPaths: string[]): void {
    for (const changedPath of changedPaths) {
      this.invalidate(changedPath);
    }
  }

  /** Clear the complete caching register */
  clear(): void {
    this.cache.clear();
  }
}
