import type { Rule, Finding, Context } from './types.js';

export interface PluginRuntimeOptions {
  memoryLimitMb?: number;
  cpuTimeoutMs?: number;
  allowedCategories?: string[];
  guidelineVersionCompatibility?: string;
}

export class PluginRuntime {
  constructor(private options: PluginRuntimeOptions = {}) {}

  /** Run a plugin rule within safety constraints and performance bounds */
  async runRuleIsolated(rule: Rule, ctx: Context): Promise<Finding[]> {
    // 1. Version compatibility check
    if (this.options.guidelineVersionCompatibility && rule.guidelineVersion) {
      if (rule.guidelineVersion !== this.options.guidelineVersionCompatibility) {
        throw new Error(
          `Plugin rule "${rule.id}" version "${rule.guidelineVersion}" is incompatible with runtime guideline version "${this.options.guidelineVersionCompatibility}".`
        );
      }
    }

    // 2. Permission / Category model check
    if (this.options.allowedCategories && !this.options.allowedCategories.includes(rule.category)) {
      throw new Error(
        `Permission Denied: Plugin rule category "${rule.category}" is not allowed in this runtime.`
      );
    }

    // 3. Isolated execution with CPU timeout control
    const timeoutMs = this.options.cpuTimeoutMs || 3000; // default 3 seconds
    
    return new Promise<Finding[]>((resolve, reject) => {
      let isSettled = false;

      const timer = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          reject(new Error(`CPU Timeout: Rule "${rule.id}" exceeded execution limit of ${timeoutMs}ms.`));
        }
      }, timeoutMs);

      // Execute rule check logic (crash isolation)
      Promise.resolve(rule.check(ctx))
        .then((findings) => {
          if (!isSettled) {
            isSettled = true;
            clearTimeout(timer);
            resolve(findings);
          }
        })
        .catch((err) => {
          if (!isSettled) {
            isSettled = true;
            clearTimeout(timer);
            reject(new Error(`Crash Isolation: Rule "${rule.id}" crashed: ${err.message}`));
          }
        });
    });
  }
}
