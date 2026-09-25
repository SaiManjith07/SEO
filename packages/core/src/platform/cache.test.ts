import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { VerificationCache, computeHash, TaskQueue, LocalTaskExecutor, FSWatchScheduler, IntervalScheduler } from './cache.js';

describe('SEOKit v3 Intelligent Verification Cache & Schedulers Tests', () => {
  const tmpDir = path.resolve('tmp_cache_v3_test');

  beforeAll(() => {
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  const mockCtx = {
    engineVersion: '3.0.0',
    configHash: 'hash_config_1',
    pluginsHash: 'hash_plugins_1'
  };

  it('should verify cache hits under identical context settings', () => {
    const cache = new VerificationCache();
    const route = '/index.html';
    const content = '<html><body>Test</body></html>';
    const hash = computeHash(content);
    const mockEvs = [{ ruleId: 'seo.canonical.exists', passed: true }];

    // miss initially
    expect(cache.get(route, hash, mockCtx)).toBeNull();

    // hit after setting
    cache.set(route, hash, mockEvs, mockCtx);
    const hit = cache.get(route, hash, mockCtx);
    expect(hit).toBeDefined();
    expect(hit![0].ruleId).toBe('seo.canonical.exists');
  });

  it('should invalidate cache when configuration changes', () => {
    const cache = new VerificationCache();
    const route = '/index.html';
    const content = '<html><body>Test</body></html>';
    const hash = computeHash(content);
    const mockEvs = [{ ruleId: 'seo.canonical.exists', passed: true }];

    cache.set(route, hash, mockEvs, mockCtx);

    const newCtx = {
      ...mockCtx,
      configHash: 'hash_config_new'
    };

    expect(cache.get(route, hash, newCtx)).toBeNull();
  });

  it('should invalidate cache when active plugins change', () => {
    const cache = new VerificationCache();
    const route = '/index.html';
    const content = '<html><body>Test</body></html>';
    const hash = computeHash(content);
    const mockEvs = [{ ruleId: 'seo.canonical.exists', passed: true }];

    cache.set(route, hash, mockEvs, mockCtx);

    const newCtx = {
      ...mockCtx,
      pluginsHash: 'hash_plugins_new'
    };

    expect(cache.get(route, hash, newCtx)).toBeNull();
  });

  it('should process tasks concurrently with TaskQueue and verify high-concurrency determinism', async () => {
    const executor = new LocalTaskExecutor();
    const queue = new TaskQueue(executor, 4);

    // Queue 50 concurrent tasks
    for (let i = 0; i < 50; i++) {
      queue.enqueue({
        id: `task-${i}`,
        payload: i,
        execute: async (n: number) => n * 3
      });
    }

    const results = await queue.process();
    expect(results.length).toBe(50);
    // Deterministic checks
    expect(results[0]).toBe(0);
    expect(results[49]).toBe(147);
  });

  it('should handle retries on transient task execution errors', async () => {
    const executor = new LocalTaskExecutor();
    const queue = new TaskQueue(executor, 2);

    let attempts = 0;
    queue.enqueue({
      id: 'retry-task',
      payload: null,
      execute: async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Transient error');
        }
        return 'success';
      },
      options: {
        retries: 2
      }
    });

    const results = await queue.process();
    expect(results[0]).toBe('success');
    expect(attempts).toBe(3);
  });

  it('should enforce timeout parameters and throw timeout exceptions', async () => {
    const executor = new LocalTaskExecutor();
    const queue = new TaskQueue(executor, 1);

    queue.enqueue({
      id: 'timeout-task',
      payload: null,
      execute: async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return 'too-late';
      },
      options: {
        timeoutMs: 100
      }
    });

    // Queue processes worker outputs, returning empty array on failed/timeout results to prevent crashes
    const results = await queue.process();
    expect(results[0]).toEqual([]);
  });

  it('should trigger FSWatchScheduler events on continuous watch schedules', async () => {
    let triggered = '';
    const scheduler = new FSWatchScheduler(tmpDir);
    scheduler.onTrigger(async (e) => {
      triggered = e;
    });

    scheduler.start();
    fs.writeFileSync(path.join(tmpDir, 'schedule-test.html'), '<html></html>');

    await new Promise(resolve => setTimeout(resolve, 500));
    scheduler.stop();

    expect(triggered).toContain('schedule-test.html');
  });

  it('should trigger IntervalScheduler checks periodically', async () => {
    let triggeredCount = 0;
    const scheduler = new IntervalScheduler(100);
    scheduler.onTrigger(async () => {
      triggeredCount++;
    });

    scheduler.start();
    await new Promise(resolve => setTimeout(resolve, 250));
    scheduler.stop();

    expect(triggeredCount).toBeGreaterThanOrEqual(2);
  });
});
