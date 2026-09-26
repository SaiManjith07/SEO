import { KernelValidator, ValidationContext } from '../engine.js';

export const provenanceLive: KernelValidator = {
  id: 'provenance.live',
  gates: ['tool.afterRun'],
  severity: process.env.NODE_ENV === 'production' ? 'error' : 'warn',
  onFail: process.env.NODE_ENV === 'production' ? 'block' : 'log',
  run: (input: any, ctx: ValidationContext) => {
    if (input && input.provenance === 'mock') {
      return { ok: false, message: `Tool returned mocked data in provenance` };
    }
    return { ok: true };
  }
};
