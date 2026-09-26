import { KernelValidator, ValidationContext } from '../engine.js';
import { AgentResult } from '../../types.js';

export const mergeNoConflict: KernelValidator = {
  id: 'merge.noConflict',
  gates: ['merge.before'],
  severity: 'error',
  onFail: 'block',
  run: (input: any, ctx: ValidationContext) => {
    const results = input as AgentResult[];
    if (!Array.isArray(results)) return { ok: true };

    const fixMap = new Map<string, string>();
    for (const res of results) {
      for (const f of res.findings || []) {
        if (f.fix && typeof f.fix === 'string') {
          if (fixMap.has(f.id) && fixMap.get(f.id) !== f.fix) {
            return { 
              ok: false, 
              message: `Conflict on finding ${f.id}: "${fixMap.get(f.id)}" vs "${f.fix}"` 
            };
          }
          fixMap.set(f.id, f.fix);
        }
      }
    }
    return { ok: true };
  }
};

export const mergeCoverage: KernelValidator = {
  id: 'merge.coverage',
  gates: ['merge.after'],
  severity: 'warn',
  onFail: 'log',
  run: (input: any, ctx: ValidationContext) => {
    // input is OrchestrationReport or a metrics object
    if (input && input.metrics && typeof input.metrics.coverage === 'number') {
      if (input.metrics.coverage < 0.5) {
        return { ok: false, message: `Coverage is below 50% (${(input.metrics.coverage * 100).toFixed(1)}%)` };
      }
    }
    return { ok: true };
  }
};
