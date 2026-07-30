import { PlatformPlugin } from './plugins.js';

export interface CertificationResult {
  passed: boolean;
  errors: string[];
}

export class CertificationSuite {
  public certifyPlugin(plugin: PlatformPlugin): CertificationResult {
    const errors: string[] = [];

    if (!plugin) {
      errors.push("Plugin object is null or undefined.");
      return { passed: false, errors };
    }

    // 1. Identity validation
    if (!plugin.id || typeof plugin.id !== 'string' || plugin.id.trim() === '') {
      errors.push("Plugin is missing a valid 'id' string.");
    }
    if (!plugin.version || typeof plugin.version !== 'string' || plugin.version.trim() === '') {
      errors.push("Plugin is missing a valid 'version' string.");
    }

    // 2. Engines/compatibility validation
    if (plugin.engines) {
      if (plugin.engines.seokit && typeof plugin.engines.seokit !== 'string') {
        errors.push("Plugin 'engines.seokit' must be a string.");
      }
    }

    // 3. Validators validation
    const registeredValidators = new Map<string, any>();
    if (plugin.validators) {
      if (!Array.isArray(plugin.validators)) {
        errors.push("Plugin 'validators' must be an array.");
      } else {
        for (const val of plugin.validators) {
          if (!val || typeof val !== 'object') {
            errors.push("Plugin contains an invalid validator object.");
            continue;
          }
          if (!val.id || typeof val.id !== 'string') {
            errors.push("A validator is missing a valid 'id' string.");
          }
          if (!val.version || typeof val.version !== 'string') {
            errors.push(`Validator '${val.id || 'unknown'}' is missing a valid 'version' string.`);
          }
          if (typeof val.execute !== 'function') {
            errors.push(`Validator '${val.id || 'unknown'}' is missing the 'execute' method function.`);
          }
          if (val.id) {
            registeredValidators.set(val.id, val);
          }
        }
      }
    }

    // 4. Rules validation
    const registeredRules = new Map<string, any>();
    if (plugin.rules) {
      if (!Array.isArray(plugin.rules)) {
        errors.push("Plugin 'rules' must be an array.");
      } else {
        const allowedSeverities = ['error', 'warning', 'info'];
        for (const rule of plugin.rules) {
          if (!rule || typeof rule !== 'object') {
            errors.push("Plugin contains an invalid rule object.");
            continue;
          }
          if (!rule.id || typeof rule.id !== 'string') {
            errors.push("A rule is missing a valid 'id' string.");
          }
          if (!rule.name || typeof rule.name !== 'string') {
            errors.push(`Rule '${rule.id || 'unknown'}' is missing a valid 'name' string.`);
          }
          if (!rule.capabilityId || typeof rule.capabilityId !== 'string') {
            errors.push(`Rule '${rule.id || 'unknown'}' is missing a 'capabilityId' string.`);
          }
          if (!rule.severity || !allowedSeverities.includes(rule.severity)) {
            errors.push(`Rule '${rule.id || 'unknown'}' has an invalid severity: '${rule.severity}'. Allowed: ${allowedSeverities.join(', ')}.`);
          }
          if (!rule.validatorName || typeof rule.validatorName !== 'string') {
            errors.push(`Rule '${rule.id || 'unknown'}' is missing a 'validatorName' string.`);
          }
          if (!rule.version || typeof rule.version !== 'string') {
            errors.push(`Rule '${rule.id || 'unknown'}' is missing a valid 'version' string.`);
          }
          if (rule.id) {
            registeredRules.set(rule.id, rule);
          }
        }
      }
    }

    // 5. Capabilities validation
    if (plugin.capabilities) {
      if (!Array.isArray(plugin.capabilities)) {
        errors.push("Plugin 'capabilities' must be an array.");
      } else {
        for (const cap of plugin.capabilities) {
          if (!cap || typeof cap !== 'object') {
            errors.push("Plugin contains an invalid capability object.");
            continue;
          }
          if (!cap.id || typeof cap.id !== 'string') {
            errors.push("A capability is missing a valid 'id' string.");
          }
          if (!cap.version || typeof cap.version !== 'string') {
            errors.push(`Capability '${cap.id || 'unknown'}' is missing a valid 'version' string.`);
          }

          // Rule references check
          if (cap.rules) {
            if (!Array.isArray(cap.rules)) {
              errors.push(`Capability '${cap.id || 'unknown'}' rules list must be an array.`);
            } else {
              for (const ruleId of cap.rules) {
                if (!registeredRules.has(ruleId)) {
                  errors.push(`Capability '${cap.id || 'unknown'}' references rule '${ruleId}' which is not provided by the plugin.`);
                }
              }
            }
          }

          // Validator references check
          if (cap.validators) {
            if (!Array.isArray(cap.validators)) {
              errors.push(`Capability '${cap.id || 'unknown'}' validators list must be an array.`);
            } else {
              for (const valId of cap.validators) {
                if (!registeredValidators.has(valId)) {
                  errors.push(`Capability '${cap.id || 'unknown'}' references validator '${valId}' which is not provided by the plugin.`);
                }
              }
            }
          }
        }
      }
    }

    return {
      passed: errors.length === 0,
      errors
    };
  }
}
