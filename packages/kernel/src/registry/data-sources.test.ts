import { describe, it, expect, beforeEach } from 'vitest';
import { DataSource } from './data-sources.js';
import { dataSources } from './index.js';

describe('dataSources registry', () => {
  beforeEach(() => {
    dataSources.clear();
  });

  const dummySource: DataSource = {
    id: 'test-source',
    name: 'Test Source',
    description: 'A test source',
    provides: ['test-data'],
    modes: ['dev'],
    backends: { dev: 'fixture', prod: 'live' },
    requires: { credentials: [], network: false },
    cost: 'free',
    suggestFor: ['testing']
  };

  it('can register a source', () => {
    dataSources.register(dummySource);
    expect(dataSources.list().length).toBe(1);
  });

  it('can get a source by id', () => {
    dataSources.register(dummySource);
    const retrieved = dataSources.get('test-source');
    expect(retrieved).toEqual(dummySource);
  });

  it('can list multiple sources', () => {
    dataSources.register(dummySource);
    dataSources.register({ ...dummySource, id: 'test-source-2' });
    expect(dataSources.list().length).toBe(2);
  });

  it('warns on duplicate registration', () => {
    dataSources.register(dummySource);
    dataSources.register(dummySource);
    expect(dataSources.list().length).toBe(1);
  });
});
