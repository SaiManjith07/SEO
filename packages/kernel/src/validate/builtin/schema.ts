import { KernelValidator, ValidationContext } from '../engine.js';
import { z } from 'zod';

function createSchemaValidator(id: string, gates: any[], target: 'inputSchema' | 'outputSchema', type: 'agent' | 'tool'): KernelValidator {
  return {
    id,
    gates,
    severity: 'error',
    onFail: 'block',
    run: (input: any, ctx: ValidationContext) => {
      const obj = type === 'agent' ? ctx.agent : ctx.tool;
      if (!obj || !obj[target]) return { ok: true };
      
      const schema = obj[target] as z.ZodType<any>;
      const parsed = schema.safeParse(input);
      
      if (!parsed.success) {
        return { 
          ok: false, 
          message: `${target} validation failed: ${parsed.error.issues.map((i: any) => i.path.join('.') + ' ' + i.message).join(', ')}`,
          agentId: type === 'agent' ? obj.id : undefined,
          toolId: type === 'tool' ? obj.id : undefined,
        };
      }
      return { ok: true };
    }
  };
}

export const agentInputSchema = createSchemaValidator('agent.inputSchema', ['agent.beforeRun'], 'inputSchema', 'agent');
export const agentOutputSchema = createSchemaValidator('agent.outputSchema', ['agent.afterRun'], 'outputSchema', 'agent');
export const toolInputSchema = createSchemaValidator('tool.inputSchema', ['tool.beforeRun'], 'inputSchema', 'tool');
export const toolOutputSchema = createSchemaValidator('tool.outputSchema', ['tool.afterRun'], 'outputSchema', 'tool');
