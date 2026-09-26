import { KernelValidator, ValidationContext } from '../engine.js';

export const exitCodeSafe: KernelValidator = {
  id: 'exitCode.safe',
  gates: ['tool.afterRun'],
  severity: 'error',
  onFail: 'block',
  run: (input: any, ctx: ValidationContext) => {
    if (!input) return { ok: true };
    const code = input.exitCode;
    
    if (code === null && !input.error) {
      return { ok: false, message: `Process exited with code null but no error was thrown` };
    }
    
    if (typeof code === 'number' || typeof code === 'string') {
      const codeStr = String(code);
      if (/^-107\d+$/.test(codeStr) || /^0xC0000/i.test(codeStr)) {
        return { ok: false, message: `Process crashed with unsafe exit code: ${codeStr}` };
      }
    }
    
    return { ok: true };
  }
};
