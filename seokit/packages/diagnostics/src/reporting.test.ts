import { describe, it, expect } from 'vitest';
import { ReportGenerator, UnifiedReport } from './reporting.js';

describe('SEOKit v3 Reporting & Evidence Engine Tests', () => {
  const mockEvidences = [
    {
      ruleId: 'seo.canonical.exists',
      passed: true,
      severity: 'error',
      output: 'Canonical matches absolute link',
      source: 'canonical-validator',
      sourcePath: 'index.html'
    },
    {
      ruleId: 'seo.metadata.exists',
      passed: false,
      severity: 'error',
      output: 'Missing meta description tag',
      source: 'metadata-validator',
      sourcePath: 'about.html'
    }
  ];

  it('should generate a valid unified report model with execution metadata', () => {
    const report = ReportGenerator.createReport(mockEvidences, 120, 2, {
      provider: 'StaticProvider',
      framework: 'Next.js',
      pluginVersions: { '@seokit/core': '3.0.0' },
      environment: { NODE_ENV: 'test' }
    });

    expect(report.schemaVersion).toBe('3.0.0');
    expect(report.metadata.execution.provider).toBe('StaticProvider');
    expect(report.metadata.execution.framework).toBe('Next.js');
    expect(report.metadata.execution.environment.NODE_ENV).toBe('test');
    expect(report.summary.score).toBe(50);
  });

  it('should verify evidence storage mapping and findings reference ids', () => {
    const report = ReportGenerator.createReport(mockEvidences, 120, 2);
    expect(report.evidences[0].evidenceRefs).toBeDefined();
    expect(report.evidences[0].evidenceRefs!.length).toBe(2);

    const refId = report.evidences[0].evidenceRefs![0];
    const evidenceRecord = report.evidenceStore[refId];
    expect(evidenceRecord).toBeDefined();
    expect(evidenceRecord.type).toBe('html_snapshot');
    expect(evidenceRecord.data).toContain('<html');
  });

  it('should verify audit timeline events generation', () => {
    const report = ReportGenerator.createReport(mockEvidences, 120, 2);
    expect(report.timeline.length).toBe(3);
    expect(report.timeline[0].name).toBe('CrawlStarted');
    expect(report.timeline[2].name).toBe('VerificationFinished');
  });

  it('should export clean JSON representation with schema version', () => {
    const report = ReportGenerator.createReport(mockEvidences, 120, 2);
    const json = ReportGenerator.exportToJson(report);
    const parsed = JSON.parse(json);
    expect(parsed.schemaVersion).toBe('3.0.0');
    expect(parsed.evidenceStore).toBeDefined();
  });

  it('should export clean Markdown report with schema and timeline', () => {
    const report = ReportGenerator.createReport(mockEvidences, 120, 2);
    const md = ReportGenerator.exportToMarkdown(report);
    expect(md).toContain('Schema v3.0.0');
    expect(md).toContain('Audit Chronological Timeline');
  });

  it('should export clean SARIF static analysis format', () => {
    const report = ReportGenerator.createReport(mockEvidences, 120, 2);
    const sarif = ReportGenerator.exportToSarif(report);
    const parsed = JSON.parse(sarif);
    expect(parsed.version).toBe('2.1.0');
    expect(parsed.runs[0].results.length).toBe(1);
    expect(parsed.runs[0].results[0].ruleId).toBe('seo.metadata.exists');
  });

  it('should export clean styled HTML representation with evidence refs', () => {
    const report = ReportGenerator.createReport(mockEvidences, 120, 2);
    const html = ReportGenerator.exportToHtml(report);
    expect(html).toContain('SEOKit Run Audit Dashboard (v3.0.0)');
    expect(html).toContain('snap_');
  });

  it('should export clean styled PDF print layout with evidence references', () => {
    const report = ReportGenerator.createReport(mockEvidences, 120, 2);
    const pdf = ReportGenerator.exportToPdf(report);
    expect(pdf).toContain('SEOKit v3 Platform Audit Report (Schema v3.0.0)');
    expect(pdf).toContain('Evidence Reference IDs:');
  });
});
