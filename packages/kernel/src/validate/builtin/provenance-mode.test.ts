import { describe, it, expect } from 'vitest';
import { provenanceModeCompatible } from './provenance-mode.js';

describe('provenance.mode-compatible', () => {
  it('prod mode with cache provenance fails', async () => {
    const res = await provenanceModeCompatible.run!({ provenance: 'cache' }, { mode: 'prod', fixtureExists: false });
    expect(res.ok).toBe(false);
  });

  it('prod mode with fixture provenance fails', async () => {
    const res = await provenanceModeCompatible.run!({ provenance: 'fixture' }, { mode: 'prod', fixtureExists: false });
    expect(res.ok).toBe(false);
  });

  it('prod mode with live provenance passes', async () => {
    const res = await provenanceModeCompatible.run!({ provenance: 'live' }, { mode: 'prod', fixtureExists: false });
    expect(res.ok).toBe(true);
  });

  it('dev mode with live provenance and fixture exists warns (returns ok:true with message)', async () => {
    const res = await provenanceModeCompatible.run!({ provenance: 'live' }, { mode: 'dev', fixtureExists: true });
    expect(res.ok).toBe(true);
    expect(res.message).toBe('suggest using the fixture for reproducibility');
  });

  it('dev mode with fixture provenance passes', async () => {
    const res = await provenanceModeCompatible.run!({ provenance: 'fixture' }, { mode: 'dev', fixtureExists: true });
    expect(res.ok).toBe(true);
  });
});
