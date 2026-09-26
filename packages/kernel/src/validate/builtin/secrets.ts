import { KernelValidator, ValidationContext } from '../engine.js';

export const reportNoSecrets: KernelValidator = {
  id: 'report.noSecrets',
  gates: ['report.beforeEmit'],
  severity: 'error',
  onFail: 'block',
  run: (input: any, ctx: ValidationContext) => {
    const reportStr = typeof input === 'string' ? input : JSON.stringify(input);

    const patterns = [
      /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
      /sk-[a-zA-Z0-9]{20,}/,
      /AIza[a-zA-Z0-9_-]{35}/,
      /xox[baprs]-[a-zA-Z0-9-]+/
    ];

    for (const pat of patterns) {
      if (pat.test(reportStr)) {
        return { ok: false, message: `Report contains a secret matching pattern ${pat.source}` };
      }
    }

    // Check env vars ending in _KEY, _TOKEN, _SECRET, _PATH
    for (const [key, val] of Object.entries(process.env)) {
      if (key.match(/_(KEY|TOKEN|SECRET|PATH)$/) && val && val.length >= 8 && val.length < 500) {
        if (reportStr.includes(val)) {
          return { ok: false, message: `Report leaked env variable: ${key}` };
        }
      }
    }

    return { ok: true };
  }
};
