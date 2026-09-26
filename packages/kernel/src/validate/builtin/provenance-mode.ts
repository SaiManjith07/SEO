import { KernelValidator } from '../engine.js';

export const provenanceModeCompatible: KernelValidator = {
  id: 'provenance.mode-compatible',
  gates: ['tool.afterRun'],
  severity: 'error',
  onFail: 'block',
  run: (target: any, ctx: any) => {
    const { mode, fixtureExists } = ctx;
    const { provenance } = target; // target is ToolResult

    if (mode === 'prod' && (provenance === 'cache' || provenance === 'fixture')) {
      return {
        ok: false,
        message: 'Production must use live data'
      };
    }

    if (mode === 'dev' && provenance === 'live' && fixtureExists) {
      // WARN - return warning (not failing the gate but adding a finding/warning? In seokit, if ok=false it throws.
      // The prompt says "WARN (suggest using the fixture for reproducibility)".
      // Currently our validators return { ok: boolean, message?: string }. 
      // If we return ok: false, it fails. For a warning, maybe we return ok: true but with a warning string?
      // I'll return { ok: true, message: 'WARN: suggest using the fixture for reproducibility' } and handle warning logging if supported, otherwise just ok: true.
      return {
        ok: true,
        message: 'suggest using the fixture for reproducibility'
      };
    }

    return { ok: true };
  }
};
