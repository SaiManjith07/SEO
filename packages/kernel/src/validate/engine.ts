import { GateName } from './gates.js';
import { validators } from '../registry/index.js';

export interface ValidationContext {
  requiredCredentials?: string[];
  [key: string]: any;
}

export interface ValidationFailure {
  validatorId: string;
  agentId?: string;
  toolId?: string;
  message: string;
  raw?: any;
}

export interface ValidationGateResult {
  gate: GateName;
  passed: boolean;
  failures: ValidationFailure[];
  warnings: string[];
  durationMs: number;
}

export type ValidatorResult = { ok: true; warnings?: string[] } | { ok: false; message: string; agentId?: string; toolId?: string; raw?: any };

export interface KernelValidator {
  id: string;
  gates: GateName[];
  severity: 'error' | 'warn';
  onFail: 'block' | 'log';
  run: (input: any, ctx: ValidationContext) => Promise<ValidatorResult> | ValidatorResult;
}

export async function validate(
  gate: GateName,
  input: unknown,
  ctx: ValidationContext
): Promise<ValidationGateResult> {
  const start = Date.now();
  const failures: ValidationFailure[] = [];
  const warnings: string[] = [];
  let passed = true;

  const allValidators = validators.list() as KernelValidator[];
  
  for (const v of allValidators) {
    if (!v.gates.includes(gate)) continue;

    try {
      const res = await v.run(input, ctx);
      if (!res.ok) {
        if (v.severity === 'error' && v.onFail === 'block') {
          passed = false;
          failures.push({
            validatorId: v.id,
            agentId: res.agentId,
            toolId: res.toolId,
            message: res.message,
            raw: res.raw
          });
        } else {
          warnings.push(`[${v.id}] ${res.message}`);
        }
      } else if (res.warnings) {
        for (const w of res.warnings) {
          warnings.push(`[${v.id}] ${w}`);
        }
      }
    } catch (err: any) {
      if (v.severity === 'error' && v.onFail === 'block') {
        passed = false;
        failures.push({
          validatorId: v.id,
          message: `Validator threw an error: ${err.message}`,
          raw: err
        });
      } else {
        warnings.push(`[${v.id}] Validator threw an error: ${err.message}`);
      }
    }
  }

  return {
    gate,
    passed,
    failures,
    warnings,
    durationMs: Date.now() - start
  };
}
