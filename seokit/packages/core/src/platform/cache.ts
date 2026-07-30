import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export function computeHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

export interface CacheContext {
  engineVersion: string;
  configHash: string;
  pluginsHash: string;
}

export interface CacheEntry {
  hash: string;
  evidences: any[];
  timestamp: string;
  context: CacheContext;
}

export class VerificationCache {
  private cacheStore: Record<string, CacheEntry> = {};

  public get(route: string, currentHash: string, context: CacheContext): any[] | null {
    const entry = this.cacheStore[route];
    if (entry && entry.hash === currentHash) {
      if (
        entry.context.engineVersion === context.engineVersion &&
        entry.context.configHash === context.configHash &&
        entry.context.pluginsHash === context.pluginsHash
      ) {
        return entry.evidences;
      }
    }
    return null;
  }

  public set(route: string, currentHash: string, evidences: any[], context: CacheContext): void {
    this.cacheStore[route] = {
      hash: currentHash,
      evidences,
      timestamp: new Date().toISOString(),
      context
    };
  }

  public invalidate(route: string): void {
    delete this.cacheStore[route];
  }

  public clear(): void {
    this.cacheStore = {};
  }
}

// ----------------------------------------------------
// Generic Task & Executor Abstractions (Fault Tolerant)
// ----------------------------------------------------
export interface TaskOptions {
  retries?: number;
  timeoutMs?: number;
}

export interface Task<T, R> {
  id: string;
  payload: T;
  execute: (payload: T) => Promise<R>;
  options?: TaskOptions;
}

export interface TaskExecutor {
  execute<T, R>(task: Task<T, R>): Promise<R>;
}

export class LocalTaskExecutor implements TaskExecutor {
  public async execute<T, R>(task: Task<T, R>): Promise<R> {
    const retries = task.options?.retries ?? 0;
    const timeoutMs = task.options?.timeoutMs;

    let attempt = 0;
    while (true) {
      try {
        if (timeoutMs) {
          return await this.withTimeout(task.execute(task.payload), timeoutMs);
        } else {
          return await task.execute(task.payload);
        }
      } catch (err) {
        attempt++;
        if (attempt > retries) {
          throw err;
        }
      }
    }
  }

  private withTimeout<R>(promise: Promise<R>, ms: number): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Task execution timed out after ${ms}ms`));
      }, ms);

      promise
        .then((res) => {
          clearTimeout(timer);
          resolve(res);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }
}

// ----------------------------------------------------
// Decoupled Task Queue Architecture
// ----------------------------------------------------
export class TaskQueue {
  private executor: TaskExecutor;
  private concurrency: number;
  private queue: Task<any, any>[] = [];

  constructor(executor: TaskExecutor, concurrency: number = 4) {
    this.executor = executor;
    this.concurrency = concurrency;
  }

  public enqueue<T, R>(task: Task<T, R>): void {
    this.queue.push(task);
  }

  public async process(): Promise<any[]> {
    const results: any[] = [];
    const executing: Promise<any>[] = [];
    const copyQueue = [...this.queue];
    this.queue = [];

    for (const task of copyQueue) {
      const p = this.executor.execute(task).then((res) => {
        results.push(res);
        executing.splice(executing.indexOf(p), 1);
      }).catch((err) => {
        // Suppress individual worker exceptions to prevent cascade crashes
        results.push([]);
        executing.splice(executing.indexOf(p), 1);
      });

      executing.push(p);

      if (executing.length >= this.concurrency) {
        await Promise.race(executing);
      }
    }

    await Promise.all(executing);
    return results;
  }
}

// Backward compatibility WorkerPool mapped to TaskQueue
export class WorkerPool {
  private concurrency: number;

  constructor(concurrency: number = 4) {
    this.concurrency = concurrency;
  }

  public async executeTasks<T, R>(tasks: Task<T, R>[]): Promise<R[]> {
    const executor = new LocalTaskExecutor();
    const queue = new TaskQueue(executor, this.concurrency);
    for (const t of tasks) {
      queue.enqueue(t);
    }
    return await queue.process();
  }
}

// ----------------------------------------------------
// Scheduler Abstractions
// ----------------------------------------------------
export interface VerificationScheduler {
  start(): void;
  stop(): void;
  onTrigger(callback: (event: string) => Promise<void>): void;
}

export class FSWatchScheduler implements VerificationScheduler {
  private watchPath: string;
  private watcher: fs.FSWatcher | null = null;
  private callback: ((event: string) => Promise<void>) | null = null;

  constructor(watchPath: string) {
    this.watchPath = watchPath;
  }

  public onTrigger(callback: (event: string) => Promise<void>): void {
    this.callback = callback;
  }

  public start(): void {
    if (this.watcher) return;
    if (!fs.existsSync(this.watchPath)) return;

    this.watcher = fs.watch(this.watchPath, { recursive: true }, async (event, filename) => {
      if (filename && (filename.endsWith('.html') || filename.endsWith('.json'))) {
        const fullPath = path.join(this.watchPath, filename);
        if (fs.existsSync(fullPath) && this.callback) {
          try {
            await this.callback(`FS_CHANGE:${filename}`);
          } catch {
            // Ignore runtime verifier callback errors
          }
        }
      }
    });
  }

  public stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }
}

export class IntervalScheduler implements VerificationScheduler {
  private intervalMs: number;
  private timer: NodeJS.Timeout | null = null;
  private callback: ((event: string) => Promise<void>) | null = null;

  constructor(intervalMs: number = 5000) {
    this.intervalMs = intervalMs;
  }

  public onTrigger(callback: (event: string) => Promise<void>): void {
    this.callback = callback;
  }

  public start(): void {
    if (this.timer) return;

    this.timer = setInterval(async () => {
      if (this.callback) {
        try {
          await this.callback('INTERVAL_TRIGGER');
        } catch {
          // Ignore interval trigger callback errors
        }
      }
    }, this.intervalMs);
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
