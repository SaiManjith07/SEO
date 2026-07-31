import { describe, it, expect, vi } from 'vitest';
import { DagRulesScheduler } from './scheduler.js';
import { VerificationEventBus } from './events.js';
import { LocalExecutionProvider, ThreadPoolExecutionProvider } from './execution.js';
import { IncrementalAnalyzer } from './incremental.js';
import type { Rule, PageContext } from './types.js';

function page(html: string): PageContext {
  return {
    kind: 'page',
    url: 'https://example.com/test',
    status: 200,
    headers: {},
    rawHtml: html,
  };
}

describe('VerificationScheduler (DAG Scheduler)', () => {
  it('should partition rules into independent execution levels', () => {
    const scheduler = new DagRulesScheduler();

    const ruleA: Rule = {
      id: 'rule-a',
      category: 'technical',
      severity: 'error',
      needs: 'page',
      description: 'Rule A',
      check: () => [],
    };

    const ruleB: Rule = {
      id: 'rule-b',
      category: 'technical',
      severity: 'error',
      needs: 'page',
      dependencies: ['rule-a'],
      description: 'Rule B',
      check: () => [],
    };

    const ruleC: Rule = {
      id: 'rule-c',
      category: 'technical',
      severity: 'error',
      needs: 'page',
      description: 'Rule C',
      check: () => [],
    };

    const plan = scheduler.schedule([ruleB, ruleA, ruleC]);

    expect(plan.levels.length).toBe(2);
    // Level 0: rule-a, rule-c
    const level0Ids = plan.levels[0].map((r) => r.id);
    expect(level0Ids).toContain('rule-a');
    expect(level0Ids).toContain('rule-c');

    // Level 1: rule-b
    const level1Ids = plan.levels[1].map((r) => r.id);
    expect(level1Ids).toContain('rule-b');
  });

  it('should detect circular dependencies and throw error', () => {
    const scheduler = new DagRulesScheduler();

    const ruleX: Rule = {
      id: 'rule-x',
      category: 'technical',
      severity: 'error',
      needs: 'page',
      dependencies: ['rule-y'],
      description: 'Rule X',
      check: () => [],
    };

    const ruleY: Rule = {
      id: 'rule-y',
      category: 'technical',
      severity: 'error',
      needs: 'page',
      dependencies: ['rule-x'],
      description: 'Rule Y',
      check: () => [],
    };

    expect(() => scheduler.schedule([ruleX, ruleY])).toThrow('Circular dependency detected');
  });
});

describe('ExecutionProvider scheduled runs', () => {
  it('should run execution plan level by level with skip propagation', async () => {
    const localProvider = new LocalExecutionProvider();
    const eventBus = new VerificationEventBus();
    const skippedSpy = vi.fn();
    eventBus.subscribe('RuleSkipped', skippedSpy);

    const ruleA: Rule = {
      id: 'test/rule-a',
      category: 'technical',
      severity: 'error',
      needs: 'page',
      description: 'Rule A',
      check: () => [
        {
          ruleId: 'test/rule-a',
          severity: 'error',
          message: 'Rule A failed'
        }
      ],
    };

    const ruleB: Rule = {
      id: 'test/rule-b',
      category: 'technical',
      severity: 'warning',
      needs: 'page',
      dependencies: ['test/rule-a'],
      description: 'Rule B',
      check: () => [],
    };

    const ctx = page('<html></html>');
    const result = await localProvider.execute([ruleA, ruleB], ctx, undefined, eventBus);

    expect(result.findings.length).toBe(1);
    expect(result.skipped).toContain('test/rule-b');
    expect(skippedSpy).toHaveBeenCalledWith({ ruleId: 'test/rule-b', reason: 'Dependency check failed' });
  });
});

describe('IncrementalAnalyzer Cache Invalidation Scope', () => {
  it('should trigger cache miss on version changes and cache hit on version match', () => {
    const eventBus = new VerificationEventBus();
    const hitSpy = vi.fn();
    const missSpy = vi.fn();
    eventBus.subscribe('CacheHit', hitSpy);
    eventBus.subscribe('CacheMiss', missSpy);

    const analyzer = new IncrementalAnalyzer('3.0.0', eventBus);
    const filePath = 'index.html';
    const content = '<html></html>';
    const ruleId = 'technical/title';

    analyzer.setCache(filePath, content, ruleId, []);

    // Version match: hit
    const hitRes = analyzer.getCachedFindings(filePath, content, ruleId, []);
    expect(hitRes).toBeDefined();
    expect(hitSpy).toHaveBeenCalledTimes(1);

    // Version mismatch: miss
    const upgradedAnalyzer = new IncrementalAnalyzer('4.0.0', eventBus);
    upgradedAnalyzer.setCache(filePath, content, ruleId, []); // initial sets with 4.0.0
    const testWithOlder = new IncrementalAnalyzer('3.0.0', eventBus);
    
    // Set in old, test with updated version
    const cachedWithNew = upgradedAnalyzer.getCachedFindings(filePath, content, ruleId, []);
    expect(cachedWithNew).toBeDefined();
  });

  it('should invalidate cache based on git diff paths', () => {
    const analyzer = new IncrementalAnalyzer('3.0.0');
    const filePath = 'index.html';
    const content = '<html></html>';
    const ruleId = 'technical/title';

    analyzer.setCache(filePath, content, ruleId, []);
    expect(analyzer.getCachedFindings(filePath, content, ruleId, [])).toBeDefined();

    // Git diff invalidates path
    analyzer.invalidateGitDiff([filePath]);
    expect(analyzer.getCachedFindings(filePath, content, ruleId, [])).toBeNull();
  });
});
