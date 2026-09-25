import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { SEOFixerEngine } from './fixer.js';

describe('SEOKit Phase 8 — Automated SEO Fix Engine Tests', () => {
  it('should generate preview diff lines between strings', () => {
    const orig = 'line 1\nline 2';
    const mod = 'line 1\nline 2 optimized';
    const diff = SEOFixerEngine.generateDiff(orig, mod);
    expect(diff).toContain('- line 2');
    expect(diff).toContain('+ line 2 optimized');
  });

  it('should insert canonical links and structured schemas inside head tags', () => {
    const baseHtml = '<html><head></head><body></body></html>';
    const canonical = SEOFixerEngine.insertCanonical(baseHtml, 'https://test.com');
    expect(canonical).toContain('<link rel="canonical" href="https://test.com">');

    const schema = SEOFixerEngine.insertSchema(baseHtml, '{"@type": "WebSite"}');
    expect(schema).toContain('application/ld+json');
    expect(schema).toContain('WebSite');
  });

  it('should inject descriptive alternative tags to img tags missing them', () => {
    const origHtml = '<html><body><img src="foo.png"></body></html>';
    const modified = SEOFixerEngine.generateImageAlt(origHtml);
    expect(modified).toContain('<img alt="SEO Optimized Image" src="foo.png">');
  });

  it('should optimize meta title and meta descriptions tags', () => {
    const origHtml = '<html><head><title>Old</title></head></html>';
    const withTitle = SEOFixerEngine.optimizeMetaTitle(origHtml, 'New Title');
    expect(withTitle).toContain('<title>New Title</title>');

    const withDesc = SEOFixerEngine.optimizeMetaDescription(origHtml, 'Description Text');
    expect(withDesc).toContain('<meta name="description" content="Description Text">');
  });

  it('should save file backups and restore backups during rollback operations', () => {
    const tempRoot = path.resolve('tmp_fixer_test');
    if (!fs.existsSync(tempRoot)) {
      fs.mkdirSync(tempRoot, { recursive: true });
    }

    const testFile = path.join(tempRoot, 'index.html');
    fs.writeFileSync(testFile, 'original content', 'utf-8');

    // Save backup snapshot
    SEOFixerEngine.saveBackupSnapshot(tempRoot, testFile);

    // Apply modify operation
    fs.writeFileSync(testFile, 'modified content', 'utf-8');
    expect(fs.readFileSync(testFile, 'utf-8')).toBe('modified content');

    // Rollback backup state
    SEOFixerEngine.rollbackBackup(tempRoot, testFile);
    expect(fs.readFileSync(testFile, 'utf-8')).toBe('original content');

    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  it('should detect unsafe duplicate or missing values during validation steps', () => {
    const canonicalHtml = '<html><head><link rel="canonical" href="http://mysite.com"></head></html>';
    // Reject duplicate canonical tags
    expect(() => SEOFixerEngine.validateFixSafety(canonicalHtml, 'canonical', { href: 'http://test.com' }))
      .toThrow('already exists');

    // Reject missing options parameters
    expect(() => SEOFixerEngine.validateFixSafety('<html></html>', 'canonical', {}))
      .toThrow('Invalid or missing canonical href');
  });

  it('should rollback transaction changes across multiple files when a failure occurs', () => {
    const tempRoot = path.resolve('tmp_transactional_test');
    if (!fs.existsSync(tempRoot)) {
      fs.mkdirSync(tempRoot, { recursive: true });
    }

    const file1 = path.join(tempRoot, 'one.html');
    const file2 = path.join(tempRoot, 'two.html');

    fs.writeFileSync(file1, 'content one', 'utf-8');
    fs.writeFileSync(file2, 'content two', 'utf-8');

    const fixes = [
      { filePath: file1, fixType: 'title', options: { title: 'New Title' } },
      { filePath: file2, fixType: 'canonical', options: {} } // triggers validation throw
    ];

    expect(() => {
      SEOFixerEngine.applyTransactionalFixes(tempRoot, fixes, (fPath, fType, opts) => {
        return 'new content';
      });
    }).toThrow('Safety Check Failed');

    // Verify file1 was rolled back and is unchanged
    expect(fs.readFileSync(file1, 'utf-8')).toBe('content one');

    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  it('should generate formatted llms.txt contents correctly', () => {
    const pages = [
      { title: 'Doc 1', url: 'https://test.com/doc1', description: 'Primary reference' }
    ];
    const res = SEOFixerEngine.generateLlmsTxt('My Project', 'A cool test project.', pages);
    expect(res).toContain('# My Project');
    expect(res).toContain('> A cool test project.');
    expect(res).toContain('- [Doc 1](https://test.com/doc1): Primary reference');
  });
});
