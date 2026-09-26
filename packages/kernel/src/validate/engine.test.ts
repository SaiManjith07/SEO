import { describe, it, expect, beforeEach } from 'vitest';
import { validate } from './engine.js';
import { validators } from '../registry/index.js';

describe('engine', () => {
  beforeEach(() => {
    validators.clear();
  });

  it('runs all validators registered for a gate in order', async () => {
    const order: number[] = [];
    validators.register({ id: 'v1', gates: ['task.intake'], severity: 'warn', onFail: 'log', run: () => { order.push(1); return { ok: true }; } });
    validators.register({ id: 'v2', gates: ['task.intake'], severity: 'warn', onFail: 'log', run: () => { order.push(2); return { ok: true }; } });
    await validate('task.intake', {}, {});
    expect(order).toEqual([1, 2]);
  });

  it('blocks the gate when any error-severity validator with onFail=block fails', async () => {
    validators.register({ id: 'v1', gates: ['task.intake'], severity: 'error', onFail: 'block', run: () => { return { ok: false, message: 'fail' }; } });
    const res = await validate('task.intake', {}, {});
    expect(res.passed).toBe(false);
  });

  it('does not block the gate when only warn-severity validators fail', async () => {
    validators.register({ id: 'v1', gates: ['task.intake'], severity: 'warn', onFail: 'log', run: () => { return { ok: false, message: 'warn' }; } });
    const res = await validate('task.intake', {}, {});
    expect(res.passed).toBe(true);
  });

  it('returns warnings separately from failures', async () => {
    validators.register({ id: 'v1', gates: ['task.intake'], severity: 'error', onFail: 'block', run: () => { return { ok: false, message: 'err' }; } });
    validators.register({ id: 'v2', gates: ['task.intake'], severity: 'warn', onFail: 'log', run: () => { return { ok: false, message: 'warn' }; } });
    const res = await validate('task.intake', {}, {});
    expect(res.failures.length).toBe(1);
    expect(res.warnings.length).toBe(1);
  });

  it('includes the specific validator id and message in failures', async () => {
    validators.register({ id: 'v-test', gates: ['task.intake'], severity: 'error', onFail: 'block', run: () => { return { ok: false, message: 'specific error' }; } });
    const res = await validate('task.intake', {}, {});
    expect(res.failures[0].validatorId).toBe('v-test');
    expect(res.failures[0].message).toBe('specific error');
  });

  it('returns passed=true when zero validators are registered for a gate', async () => {
    const res = await validate('task.intake', {}, {});
    expect(res.passed).toBe(true);
  });
});
