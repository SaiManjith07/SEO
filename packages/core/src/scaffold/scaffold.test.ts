import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { detectFramework } from './detector.js';
import { initProject } from './init.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('project scaffolding & framework detection tests', () => {
  let tempDir: string;

  beforeAll(() => {
    // Create a temp folder in OS temp directory
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'seokit-scaffold-test-'));
  });

  afterAll(() => {
    // Clean up temp folder recursively
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should detect static framework when index.html exists', () => {
    const staticRoot = path.join(tempDir, 'static-proj');
    fs.mkdirSync(staticRoot);
    fs.writeFileSync(path.join(staticRoot, 'index.html'), '<html></html>');

    const framework = detectFramework(staticRoot);
    expect(framework).toBe('static');
  });

  it('should detect next.js framework from package.json dependency', () => {
    const nextRoot = path.join(tempDir, 'next-proj');
    fs.mkdirSync(nextRoot);
    fs.writeFileSync(
      path.join(nextRoot, 'package.json'),
      JSON.stringify({ dependencies: { next: '^14.0.0' } })
    );

    const framework = detectFramework(nextRoot);
    expect(framework).toBe('next');
  });

  it('should initialize folders and write configuration files', async () => {
    const initRoot = path.join(tempDir, 'init-proj');
    fs.mkdirSync(initRoot);
    fs.writeFileSync(
      path.join(initRoot, 'package.json'),
      JSON.stringify({ dependencies: { next: '^14.0.0' } })
    );

    const res = await initProject(initRoot);

    expect(res.framework).toBe('next');
    expect(fs.existsSync(path.join(initRoot, '.seokit', 'guidelines.md'))).toBe(true);
    expect(fs.existsSync(path.join(initRoot, 'public', 'robots.txt'))).toBe(true);
    expect(fs.existsSync(path.join(initRoot, 'public', 'llms.txt'))).toBe(true);
    expect(fs.existsSync(path.join(initRoot, '.github', 'workflows', 'seokit.yml'))).toBe(true);
  });
});
