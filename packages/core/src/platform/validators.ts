import { ExecutableRule } from './rules.js';

export interface FixPlan {
  ruleId: string;
  description: string;
  suggestedFix: string;
  targetFile?: string;
  patch?: string;
}

export interface VerificationEvidence {
  passed: boolean;
  confidence: number;
  output: string;
  source: string;
  fixPlan?: FixPlan;
  capabilityId?: string;
  ruleId?: string;
  ruleVersion?: string;
  standard?: string;
}

export interface ExecutionPlan {
  capabilityId: string;
  validators: string[];
  context: any;
}

export interface ValidatorPlugin {
  id: string;
  version: string;
  execute(plan: ExecutionPlan, context: any): Promise<VerificationEvidence>;
}

export class ValidatorRegistry {
  private validators: Map<string, ValidatorPlugin> = new Map();

  public registerValidator(validator: ValidatorPlugin): void {
    this.validators.set(validator.id, validator);
  }

  public getValidator(id: string): ValidatorPlugin | undefined {
    return this.validators.get(id);
  }

  public unregisterValidator(id: string): void {
    this.validators.delete(id);
  }

  public getAllValidators(): ValidatorPlugin[] {
    return Array.from(this.validators.values());
  }
}
