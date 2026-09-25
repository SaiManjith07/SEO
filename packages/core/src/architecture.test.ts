import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Architectural Invariants', () => {
  it('critic does not import core', () => {
    // vitest runs with cwd = packages/core
    const pkgPath = path.resolve(process.cwd(), '../critic/package.json');
    if (!fs.existsSync(pkgPath)) {
      console.warn('Critic package.json not found, skipping.');
      return;
    }
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(allDeps).not.toHaveProperty('@seokit/core');
  });

  it('core does not import plugins', () => {
    const pkgPath = path.resolve(process.cwd(), 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const allDeps = { ...pkg.dependencies };
    const hasPlugin = Object.keys(allDeps).some(dep => dep.startsWith('@seokit/plugin-'));
    expect(hasPlugin).toBe(false);
  });
});
