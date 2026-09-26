import { KernelValidator, ValidationContext } from '../engine.js';

export const credentialsPresent: KernelValidator = {
  id: 'credentials.present',
  gates: ['task.intake', 'agent.beforeRun'],
  severity: 'error',
  onFail: 'block',
  run: (input: any, ctx: ValidationContext) => {
    if (!ctx.requiredCredentials || ctx.requiredCredentials.length === 0) {
      return { ok: true };
    }
    for (const cred of ctx.requiredCredentials) {
      const val = process.env[cred];
      if (!val || val.trim() === '') {
        return { ok: false, message: `Missing required credential: ${cred}` };
      }
    }
    return { ok: true };
  }
};

export const credentialsValid: KernelValidator = {
  id: 'credentials.valid',
  gates: ['agent.beforeRun'],
  severity: 'error',
  onFail: 'block',
  run: (input: any, ctx: ValidationContext) => {
    if (!ctx.requiredCredentials || ctx.requiredCredentials.length === 0) {
      return { ok: true };
    }

    if (ctx.requiredCredentials.includes('CRUX_API_KEY')) {
      const val = process.env.CRUX_API_KEY;
      if (val && (val.length < 20 || !/^AIza[a-zA-Z0-9_-]+$/.test(val))) {
        return { ok: false, message: `Invalid CRUX_API_KEY format` };
      }
    }

    if (ctx.requiredCredentials.includes('BING_API_KEY')) {
      const val = process.env.BING_API_KEY;
      if (val && val.length < 20) {
        return { ok: false, message: `Invalid BING_API_KEY format` };
      }
    }

    const checkServiceAccount = (keyName: string): { ok: true } | { ok: false, message: string } => {
      const val = process.env[keyName];
      if (val) {
        try {
          const fs = require('fs');
          if (!fs.existsSync(val)) {
            return { ok: false, message: `File not found for ${keyName}` };
          }
          const data = JSON.parse(fs.readFileSync(val, 'utf8'));
          if (!data.client_email || !data.private_key) {
            return { ok: false, message: `Invalid service account JSON for ${keyName}` };
          }
        } catch (e: any) {
          return { ok: false, message: `Invalid service account JSON for ${keyName}: ${e.message}` };
        }
      }
      return { ok: true };
    };

    if (ctx.requiredCredentials.includes('GSC_SERVICE_ACCOUNT_PATH')) {
      const res = checkServiceAccount('GSC_SERVICE_ACCOUNT_PATH');
      if (!res.ok) return res;
    }

    if (ctx.requiredCredentials.includes('GA4_SERVICE_ACCOUNT_PATH')) {
      const res = checkServiceAccount('GA4_SERVICE_ACCOUNT_PATH');
      if (!res.ok) return res;
    }

    return { ok: true };
  }
};
