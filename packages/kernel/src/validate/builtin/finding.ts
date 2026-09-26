import { KernelValidator, ValidationContext } from '../engine.js';

function getFindings(input: any): any[] {
  if (Array.isArray(input?.findings)) return input.findings;
  if (Array.isArray(input)) return input;
  return [];
}

export const findingHasFix: KernelValidator = {
  id: 'finding.hasFix',
  gates: ['agent.afterRun', 'report.beforeEmit'],
  severity: 'error',
  onFail: 'block',
  run: (input: any, ctx: ValidationContext) => {
    const findings = getFindings(input);
    for (const f of findings) {
      if (!f.fix || typeof f.fix !== 'string' || f.fix.length < 10) {
        return { ok: false, message: `Finding ${f.id} fix is too short or missing` };
      }
      if (/^(review|check|look|verify|investigate)\b/i.test(f.fix)) {
        return { ok: false, message: `Finding ${f.id} fix is a prompt to do work` };
      }
      if (/<\.\.\.>|TBD|TODO|\.\.\.$/.test(f.fix)) {
        return { ok: false, message: `Finding ${f.id} fix contains placeholders` };
      }
    }
    return { ok: true };
  }
};

export const findingHasEvidence: KernelValidator = {
  id: 'finding.hasEvidence',
  gates: ['agent.afterRun', 'report.beforeEmit'],
  severity: 'error',
  onFail: 'block',
  run: (input: any, ctx: ValidationContext) => {
    const findings = getFindings(input);
    const raw = input?.raw;
    const isRootRawEmpty = raw == null || (typeof raw === 'object' && Object.keys(raw).length === 0);

    let independentEvidenceCount = 0;

    for (const f of findings) {
      const hasIndependent = !!(f.raw || f.source);
      if (hasIndependent) {
        independentEvidenceCount++;
      } else {
        if (isRootRawEmpty) {
          return { ok: false, message: `Finding ${f.id} lacks evidence (no independent raw/source and root raw is empty)` };
        }
        // Implicitly passes here, we will warn later if needed
      }
    }

    if (findings.length > 0 && independentEvidenceCount < findings.length / 2 && !isRootRawEmpty) {
      return { ok: true, warnings: [`fewer than half of findings have independent evidence`] }; 
    }
    return { ok: true };
  }
};

export const findingNoFabrication: KernelValidator = {
  id: 'finding.noFabrication',
  gates: ['agent.afterRun', 'report.beforeEmit'],
  severity: 'error',
  onFail: 'block',
  run: (input: any, ctx: ValidationContext) => {
    const findings = getFindings(input);
    
    for (const f of findings) {
      const p = f.provenance || input?.provenance;
      
      if (!p) {
        return { ok: false, message: `finding ${f.id} has no provenance declared` };
      }

      const c = f.confidence || input?.confidence;
      const r = f.raw || input?.raw;
      const rEmpty = r == null || (typeof r === 'object' && Object.keys(r).length === 0);
      
      if (p === 'live' && rEmpty) {
        return { ok: false, message: `Finding ${f.id} claims live provenance but lacks raw data` };
      }
      
      if (rEmpty && c === 'high') {
        return { ok: false, message: `Finding ${f.id} claims high confidence but lacks raw data` };
      }
    }

    // Fails if findings[] is empty AND ctx.requiredCredentials were all present
    if (findings.length === 0) {
      if (ctx.requiredCredentials && ctx.requiredCredentials.length > 0) {
        const allCredsPresent = ctx.requiredCredentials.every((c: string) => !!process.env[c]);
        if (allCredsPresent) {
          return { ok: false, message: `Empty findings array but all required credentials were present` };
        }
      }
    }
    
    return { ok: true };
  }
};
