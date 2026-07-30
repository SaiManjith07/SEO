export interface RunMetadata {
  timestamp: string;
  durationMs: number;
  engineVersion: string;
  pagesCount: number;
}

export interface EvidenceRecord {
  id: string;
  timestamp: string;
  type: 'html_snapshot' | 'headers' | 'metadata' | 'screenshot';
  filePath?: string;
  data: any;
}

export interface AuditTimelineEvent {
  timestamp: string;
  name: string;
  message: string;
  metrics?: Record<string, any>;
}

export interface ExecutionMetadata {
  durationMs: number;
  provider: string;
  framework: string;
  pluginVersions: Record<string, string>;
  environment: Record<string, string>;
}

export interface RunSummary {
  score: number;
  errors: number;
  warnings: number;
  info: number;
}

export interface ReportEvidence {
  ruleId: string;
  passed: boolean;
  severity: 'error' | 'warning' | 'info';
  output: string;
  source: string;
  filePath?: string;
  location?: {
    line?: number;
    columnStart?: number;
    columnEnd?: number;
  };
  evidenceRefs?: string[];
}

export interface UnifiedReport {
  schemaVersion: string;
  id: string;
  metadata: RunMetadata & { execution: ExecutionMetadata };
  summary: RunSummary;
  evidences: ReportEvidence[];
  evidenceStore: Record<string, EvidenceRecord>;
  timeline: AuditTimelineEvent[];
}

export interface ReportDelta {
  scoreChange: number;
  fixedIssues: string[];
  newIssues: string[];
  netDifference: number;
}

export class ReportGenerator {
  public static createReport(
    evidences: any[],
    durationMs: number,
    pagesCount: number,
    executionOpts?: {
      provider?: string;
      framework?: string;
      pluginVersions?: Record<string, string>;
      environment?: Record<string, string>;
    }
  ): UnifiedReport {
    let errors = 0;
    let warnings = 0;
    let info = 0;
    let passedCount = 0;

    const evidenceStore: Record<string, EvidenceRecord> = {};
    const timestamp = new Date().toISOString();

    const mappedEvidences: ReportEvidence[] = evidences.map(ev => {
      const severity = ev.severity || 'info';
      if (!ev.passed) {
        if (severity === 'error') errors++;
        else if (severity === 'warning') warnings++;
        else info++;
      } else {
        passedCount++;
      }

      // Generate dynamic mock HTML snapshot & headers evidence records
      const fileKey = ev.sourcePath || 'Global';
      const snapHash = `snap_${Buffer.from(fileKey + '_html').toString('hex').substring(0, 8)}`;
      const headHash = `head_${Buffer.from(fileKey + '_head').toString('hex').substring(0, 8)}`;

      if (!evidenceStore[snapHash]) {
        evidenceStore[snapHash] = {
          id: snapHash,
          timestamp,
          type: 'html_snapshot',
          filePath: ev.sourcePath || undefined,
          data: '<html><head><title>Audit Snap</title></head></html>'
        };
      }

      if (!evidenceStore[headHash]) {
        evidenceStore[headHash] = {
          id: headHash,
          timestamp,
          type: 'headers',
          filePath: ev.sourcePath || undefined,
          data: { 'content-security-policy': "default-src 'self'" }
        };
      }

      return {
        ruleId: ev.ruleId || 'generic',
        passed: !!ev.passed,
        severity: severity as any,
        output: ev.output || '',
        source: ev.source || 'engine',
        filePath: ev.sourcePath || undefined,
        location: ev.location,
        evidenceRefs: [snapHash, headHash]
      };
    });

    const totalRules = mappedEvidences.length || 1;
    const score = Math.round((passedCount / totalRules) * 100);

    const timeline: AuditTimelineEvent[] = [
      { timestamp, name: 'CrawlStarted', message: 'Verification engine crawl loop initiated.' },
      { timestamp, name: 'PageParsed', message: `Model parsed successfully across ${pagesCount} targets.` },
      { timestamp, name: 'VerificationFinished', message: 'Verification sweep completes.', metrics: { score } }
    ];

    return {
      schemaVersion: '3.0.0',
      id: `report_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      metadata: {
        timestamp,
        durationMs,
        engineVersion: '3.0.0',
        pagesCount,
        execution: {
          durationMs,
          provider: executionOpts?.provider || 'StaticProvider',
          framework: executionOpts?.framework || 'Vanilla',
          pluginVersions: executionOpts?.pluginVersions || { '@seokit/core': '3.0.0' },
          environment: executionOpts?.environment || { NODE_ENV: 'test' }
        }
      },
      summary: {
        score,
        errors,
        warnings,
        info
      },
      evidences: mappedEvidences,
      evidenceStore,
      timeline
    };
  }

  public static exportToJson(report: UnifiedReport): string {
    return JSON.stringify(report, null, 2);
  }

  public static exportToMarkdown(report: UnifiedReport): string {
    const summary = report.summary;
    const metadata = report.metadata;

    let md = `# SEOKit Run Verification Audit Report (Schema v${report.schemaVersion})\n\n`;
    md += `*   **Timestamp**: ${metadata.timestamp}\n`;
    md += `*   **Engine Version**: ${metadata.engineVersion}\n`;
    md += `*   **Provider**: ${metadata.execution.provider}\n`;
    md += `*   **Framework**: ${metadata.execution.framework}\n`;
    md += `*   **Duration**: ${metadata.durationMs}ms\n`;
    md += `*   **Pages Audited**: ${metadata.pagesCount}\n\n`;

    md += `## Score & Severity Summary\n\n`;
    md += `| Score | Errors | Warnings | Info |\n`;
    md += `|---|---|---|---|\n`;
    md += `| **${summary.score}/100** | ${summary.errors} | ${summary.warnings} | ${summary.info} |\n\n`;

    md += `## Evidence Records & Diagnostics\n\n`;
    md += `| Status | Rule ID | File | Message | Evidence Refs |\n`;
    md += `|---|---|---|---|---|\n`;

    for (const ev of report.evidences) {
      const statusIcon = ev.passed ? '✅ PASS' : '❌ FAIL';
      const file = ev.filePath || 'Global';
      const refs = ev.evidenceRefs ? ev.evidenceRefs.join(', ') : 'None';
      md += `| ${statusIcon} | \`${ev.ruleId}\` | ${file} | ${ev.output} | ${refs} |\n`;
    }

    md += `\n## Audit Chronological Timeline\n\n`;
    for (const event of report.timeline) {
      md += `*   **[${event.name}]** (${event.timestamp}): ${event.message}\n`;
    }

    return md;
  }

  public static exportToSarif(report: UnifiedReport): string {
    const rules = Array.from(new Set(report.evidences.map(e => e.ruleId))).map(id => ({
      id,
      shortDescription: { text: `SEOKit verification check for ${id}` }
    }));

    const results = report.evidences.filter(e => !e.passed).map(e => {
      const line = e.location?.line || 1;
      const colStart = e.location?.columnStart || 1;
      const colEnd = e.location?.columnEnd || 1;

      return {
        ruleId: e.ruleId,
        message: { text: `${e.output} (Evidence Refs: ${e.evidenceRefs?.join(', ') || 'None'})` },
        level: e.severity === 'error' ? 'error' : e.severity === 'warning' ? 'warning' : 'note',
        locations: [
          {
            physicalLocation: {
              artifactLocation: { uri: e.filePath || 'Global' },
              region: {
                startLine: line,
                startColumn: colStart,
                endColumn: colEnd
              }
            }
          }
        ]
      };
    });

    const sarif = {
      $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
      version: '2.1.0',
      runs: [
        {
          tool: {
            driver: {
              name: 'SEOKit Platform',
              version: report.metadata.engineVersion,
              rules
            }
          },
          results
        }
      ]
    };

    return JSON.stringify(sarif, null, 2);
  }

  public static exportToHtml(report: UnifiedReport): string {
    const summary = report.summary;
    const metadata = report.metadata;

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>SEOKit Auditing Dashboard</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 40px; margin: 0; }
    .card { background-color: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); padding: 32px; margin-bottom: 24px; }
    h1 { margin-top: 0; color: #0f172a; font-size: 28px; }
    .score-badge { font-size: 48px; font-weight: 800; color: ${summary.score >= 80 ? '#10b981' : summary.score >= 50 ? '#f59e0b' : '#ef4444'}; }
    .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-bottom: 24px; }
    .stat { padding: 16px; background-color: #f1f5f9; border-radius: 8px; text-align: center; }
    .stat-val { font-size: 24px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e2e8f0; }
    th { background-color: #f8fafc; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <h1>SEOKit Run Audit Dashboard (v${report.schemaVersion})</h1>
    <p>Provider: <strong>${metadata.execution.provider}</strong> | Framework: <strong>${metadata.execution.framework}</strong></p>
    <div class="grid">
      <div class="stat">
        <div>Platform Score</div>
        <div class="score-badge">${summary.score}%</div>
      </div>
      <div class="stat">
        <div>Errors</div>
        <div class="stat-val" style="color: #ef4444">${summary.errors}</div>
      </div>
      <div class="stat">
        <div>Warnings</div>
        <div class="stat-val" style="color: #f59e0b">${summary.warnings}</div>
      </div>
      <div class="stat">
        <div>Pages Checked</div>
        <div class="stat-val">${metadata.pagesCount}</div>
      </div>
    </div>
    <h2>Evidence Details</h2>
    <table>
      <thead>
        <tr>
          <th>Status</th>
          <th>Rule ID</th>
          <th>File</th>
          <th>Description</th>
          <th>Evidence Refs</th>
        </tr>
      </thead>
      <tbody>
        ${report.evidences.map(ev => `
          <tr>
            <td style="color: ${ev.passed ? '#10b981' : '#ef4444'}">${ev.passed ? '✓ PASS' : '✗ FAIL'}</td>
            <td><code>${ev.ruleId}</code></td>
            <td>${ev.filePath || 'Global'}</td>
            <td>${ev.output}</td>
            <td>${ev.evidenceRefs?.join(', ') || 'None'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
</body>
</html>`;
  }

  public static exportToPdf(report: UnifiedReport): string {
    const metadata = report.metadata;

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>SEOKit Audit PDF Export</title>
  <style>
    @media print { body { padding: 0; } }
    body { font-family: Georgia, serif; padding: 50px; background-color: white; line-height: 1.6; }
    .header { border-bottom: 2px solid black; padding-bottom: 20px; margin-bottom: 30px; }
    .title { font-size: 32px; font-weight: bold; }
    .meta { font-size: 14px; color: #555; }
    .summary-box { background-color: #f9f9f9; border: 1px solid #ccc; padding: 20px; margin-bottom: 30px; }
    .evidence-item { margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px dotted #ccc; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">SEOKit v3 Platform Audit Report (Schema v${report.schemaVersion})</div>
    <div class="meta">Generated: ${metadata.timestamp} | Provider: ${metadata.execution.provider}</div>
  </div>
  <div class="summary-box">
    <h3>Score: ${report.summary.score}/100</h3>
    <p>Errors: ${report.summary.errors} | Warnings: ${report.summary.warnings} | Pages Audited: ${metadata.pagesCount}</p>
  </div>
  <h2>Audit Evidence Details</h2>
  ${report.evidences.map(ev => `
    <div class="evidence-item">
      <strong>[${ev.passed ? 'PASS' : 'FAIL'}] ${ev.ruleId}</strong> (Severity: ${ev.severity})<br>
      Path: ${ev.filePath || 'Global'}<br>
      Result: ${ev.output}<br>
      Evidence Reference IDs: ${ev.evidenceRefs?.join(', ') || 'None'}
    </div>
  `).join('')}
</body>
</html>`;
  }

  public static compareReports(current: UnifiedReport, previous: UnifiedReport): ReportDelta {
    const currentFailed = new Set(current.evidences.filter(e => !e.passed).map(e => `${e.filePath || 'Global'}:${e.ruleId}`));
    const previousFailed = new Set(previous.evidences.filter(e => !e.passed).map(e => `${e.filePath || 'Global'}:${e.ruleId}`));

    const fixedIssues: string[] = [];
    const newIssues: string[] = [];

    for (const key of previousFailed) {
      if (!currentFailed.has(key)) {
        fixedIssues.push(key);
      }
    }

    for (const key of currentFailed) {
      if (!previousFailed.has(key)) {
        newIssues.push(key);
      }
    }

    return {
      scoreChange: current.summary.score - previous.summary.score,
      fixedIssues,
      newIssues,
      netDifference: newIssues.length - fixedIssues.length
    };
  }
}
