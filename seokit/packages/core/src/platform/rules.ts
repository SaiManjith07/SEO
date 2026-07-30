import { Severity } from '../types.js';

export interface ExecutableRule {
  id: string;
  name: string;
  capabilityId: string;
  severity: Severity;
  description: string;
  validatorName: string; // The ID of the validator to run
  validatorParams?: Record<string, any>; // Configuration for the validator
  autoFix: boolean;
  version: string;
  standard?: string; // The governing standard code, e.g. 'STD-01'
}

export class RuleRegistry {
  private rules: Map<string, ExecutableRule> = new Map();

  public registerRule(rule: ExecutableRule): void {
    this.rules.set(rule.id, rule);
  }

  public getRule(id: string): ExecutableRule | undefined {
    return this.rules.get(id);
  }

  public unregisterRule(id: string): void {
    this.rules.delete(id);
  }

  public getRulesForCapability(capabilityId: string): ExecutableRule[] {
    return Array.from(this.rules.values()).filter(r => r.capabilityId === capabilityId);
  }

  public getAllRules(): ExecutableRule[] {
    return Array.from(this.rules.values());
  }
}

export class RuleCompiler {
  private registry: RuleRegistry;

  constructor(registry: RuleRegistry) {
    this.registry = registry;
  }

  public compileFromMarkdown(markdownContent: string, capabilityId: string): ExecutableRule[] {
    // Stub: This will parse documentation (e.g. Google Docs) into ExecutableRule objects.
    // For now, it just returns an empty array.
    const compiledRules: ExecutableRule[] = [];
    
    // Auto-register compiled rules
    for (const rule of compiledRules) {
      this.registry.registerRule(rule);
    }
    
    return compiledRules;
  }
}
