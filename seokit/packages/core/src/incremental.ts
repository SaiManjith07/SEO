import * as crypto from 'crypto';
import type { Finding } from './types.js';

export interface IncrementalCacheEntry {
  fileHash: string;
  findings: Finding[];
  timestamp: number;
}

export class IncrementalAnalyzer {
  private cache: Map<string, IncrementalCacheEntry> = new Map();

  /** Compute hash for a string of content */
  computeHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /** Get cached findings if the content hash has not changed */
  getCachedFindings(filePath: string, currentContent: string): Finding[] | null {
    const entry = this.cache.get(filePath);
    if (!entry) return null;
    const currentHash = this.computeHash(currentContent);
    if (entry.fileHash === currentHash) {
      return entry.findings;
    }
    return null;
  }

  /** Cache findings for a given file path and content */
  setCache(filePath: string, content: string, findings: Finding[]): void {
    const fileHash = this.computeHash(content);
    this.cache.set(filePath, {
      fileHash,
      findings,
      timestamp: Date.now()
    });
  }

  /** Invalidate cache for a specific file */
  invalidate(filePath: string): void {
    this.cache.delete(filePath);
  }

  /** Clear the complete caching register */
  clear(): void {
    this.cache.clear();
  }
}
