import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GSCPlugin, GSCCredentialsMissingError } from './index.js';
import fs from 'fs';
import path from 'path';

describe('GSCPlugin Configuration', () => {
  beforeEach(() => {
    delete process.env.GSC_PROPERTY_URL;
    delete process.env.GSC_SERVICE_ACCOUNT_PATH;
  });

  it('throws GSCCredentialsMissingError when property url is missing', () => {
    process.env.GSC_SERVICE_ACCOUNT_PATH = 'some-path.json';
    expect(() => new GSCPlugin()).toThrow(GSCCredentialsMissingError);
    expect(() => new GSCPlugin()).toThrow('GSC_PROPERTY_URL is not set');
  });

  it('throws GSCCredentialsMissingError when path is missing', () => {
    process.env.GSC_PROPERTY_URL = 'https://example.com';
    expect(() => new GSCPlugin()).toThrow(GSCCredentialsMissingError);
    expect(() => new GSCPlugin()).toThrow('GSC_SERVICE_ACCOUNT_PATH is not set');
  });

  it('throws GSCCredentialsMissingError when file does not exist', () => {
    process.env.GSC_PROPERTY_URL = 'https://example.com';
    process.env.GSC_SERVICE_ACCOUNT_PATH = 'does-not-exist.json';
    expect(() => new GSCPlugin()).toThrow(GSCCredentialsMissingError);
  });
});

describe('GSCPlugin Integration', () => {
  const hasCreds = !!process.env.GSC_SERVICE_ACCOUNT_PATH && !!process.env.GSC_PROPERTY_URL;

  // We only run this if the user has provided actual credentials in .env
  it.skipIf(!hasCreds)('fetches live data from Google Search Console', async () => {
    const plugin = new GSCPlugin();
    const data = await plugin.topQueries(7, 5);
    
    // We expect it to be an array since it fetches real data
    expect(Array.isArray(data)).toBe(true);
    
    if (data.length > 0) {
      expect(data[0].query).toBeDefined();
      expect(data[0].clicks).toBeDefined();
    }
  });
});
