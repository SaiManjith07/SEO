import { EvidenceStore, EvidenceRecord } from './store.js';

export type ReportFormat = 'json' | 'sarif' | 'html' | 'markdown' | 'md';

export class ReportEngine {
  private evidenceStore: EvidenceStore;

  constructor(evidenceStore: EvidenceStore) {
    this.evidenceStore = evidenceStore;
  }

  public async generateReport(taskId: string, format: ReportFormat): Promise<string> {
    const evidence = this.evidenceStore.listEvidenceForTask(taskId);
    
    switch (format.toLowerCase()) {
      case 'json':
        return this.generateJsonReport(evidence);
      case 'sarif':
        return this.generateSarifReport(evidence);
      case 'html':
        return this.generateHtmlReport(evidence);
      case 'markdown':
      case 'md':
        return this.generateMarkdownReport(evidence);
      default:
        throw new Error(`Unsupported report format: ${format}`);
    }
  }

  private generateJsonReport(evidence: EvidenceRecord[]): string {
    return JSON.stringify({
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      summary: this.calculateSummary(evidence),
      evidence
    }, null, 2);
  }

  private generateMarkdownReport(evidence: EvidenceRecord[]): string {
    const summary = this.calculateSummary(evidence);
    
    let md = `# SEOKit Verification Report\n\n`;
    md += `Generated at: \`${new Date().toISOString()}\`\n\n`;
    
    md += `## Summary Dashboard\n\n`;
    md += `| Metric | Value |\n`;
    md += `| :--- | :--- |\n`;
    md += `| **Total Rules Checked** | ${summary.total} |\n`;
    md += `| **Passed** | ${summary.passed} ✅ |\n`;
    md += `| **Failed** | ${summary.failed} ❌ |\n`;
    md += `| **Success Rate** | ${summary.successRate}% |\n\n`;
    
    md += `## Detailed Findings\n\n`;
    md += `| Rule ID | Capability | Status | Output |\n`;
    md += `| :--- | :--- | :--- | :--- |\n`;
    
    for (const record of evidence) {
      const status = record.passed ? '✅ PASS' : '❌ FAIL';
      md += `| \`${record.ruleId}\` | ${record.capabilityId} | ${status} | ${record.output} |\n`;
    }
    
    const failingWithFixes = evidence.filter(e => !e.passed && e.fixPlan);
    if (failingWithFixes.length > 0) {
      md += `\n## Recommended Fixes\n\n`;
      for (const record of failingWithFixes) {
        const fix = record.fixPlan!;
        md += `### 🛠️ Fix for Rule: \`${record.ruleId}\`\n`;
        md += `*   **Description**: ${fix.description}\n`;
        md += `*   **Target File**: \`${fix.targetFile || 'Unknown'}\`\n`;
        md += `*   **Suggested Action**: ${fix.suggestedFix}\n\n`;
      }
    }
    
    return md;
  }

  private generateSarifReport(evidence: EvidenceRecord[]): string {
    return JSON.stringify({
      $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
      version: '2.1.0',
      runs: [
        {
          tool: {
            driver: {
              name: 'SEOKit Platform',
              version: '1.0.0',
              informationUri: 'https://github.com/google-deepmind/seokit',
              rules: Array.from(new Set(evidence.map(e => e.ruleId))).map(ruleId => ({
                id: ruleId,
                shortDescription: {
                  text: `SEOKit validator rule check for ${ruleId}`
                }
              }))
            }
          },
          results: evidence.filter(e => !e.passed).map(e => ({
            ruleId: e.ruleId,
            level: 'error',
            message: {
              text: e.output
            },
            locations: [
              {
                physicalLocation: {
                  artifactLocation: {
                    uri: e.fixPlan?.targetFile || 'index.html'
                  }
                }
              }
            ]
          }))
        }
      ]
    }, null, 2);
  }

  private generateHtmlReport(evidence: EvidenceRecord[]): string {
    const summary = this.calculateSummary(evidence);
    
    const evidenceRows = evidence.map(e => {
      const statusBadge = e.passed
        ? `<span style="background-color: #d1fae5; color: #065f46; padding: 4px 8px; border-radius: 9999px; font-weight: 600; font-size: 0.75rem;">PASS</span>`
        : `<span style="background-color: #fee2e2; color: #991b1b; padding: 4px 8px; border-radius: 9999px; font-weight: 600; font-size: 0.75rem;">FAIL</span>`;
      
      const fixHtml = e.fixPlan
        ? `<div style="margin-top: 8px; padding: 12px; background-color: #f9fafb; border-left: 4px solid #ef4444; border-radius: 4px;">
             <strong>Fix Action:</strong> ${e.fixPlan.suggestedFix}
             ${e.fixPlan.targetFile ? `<br><small style="color: #6b7280;">Target: ${e.fixPlan.targetFile}</small>` : ''}
           </div>`
        : '';
        
      return `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 16px; font-family: monospace; font-size: 0.875rem; color: #374151;">${e.ruleId}</td>
          <td style="padding: 12px 16px; color: #4b5563; font-size: 0.875rem;">${e.capabilityId}</td>
          <td style="padding: 12px 16px;">${statusBadge}</td>
          <td style="padding: 12px 16px; color: #1f2937; font-size: 0.875rem;">
            ${e.output}
            ${fixHtml}
          </td>
        </tr>
      `;
    }).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SEOKit Verification Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f3f4f6;
      color: #111827;
      margin: 0;
      padding: 40px 20px;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
    }
    .header {
      margin-bottom: 32px;
    }
    .header h1 {
      margin: 0 0 8px 0;
      font-size: 2.25rem;
      font-weight: 800;
      letter-spacing: -0.025em;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }
    .stat-card {
      background-color: #ffffff;
      padding: 24px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .stat-label {
      color: #6b7280;
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: 4px;
    }
    .stat-value {
      font-size: 1.875rem;
      font-weight: 700;
    }
    .table-container {
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    th {
      background-color: #f9fafb;
      padding: 12px 16px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #374151;
      border-bottom: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SEOKit Verification Report</h1>
      <p style="color: #6b7280; margin: 0;">Generated on ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Audited</div>
        <div class="stat-value">${summary.total}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label" style="color: #047857;">Passed</div>
        <div class="stat-value" style="color: #047857;">${summary.passed}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label" style="color: #b91c1c;">Failed</div>
        <div class="stat-value" style="color: #b91c1c;">${summary.failed}</div>
      </div>
      <div class="stat-card" style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: #ffffff;">
        <div class="stat-label" style="color: #93c5fd;">Success Rate</div>
        <div class="stat-value">${summary.successRate}%</div>
      </div>
    </div>
    
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Rule</th>
            <th>Capability</th>
            <th>Status</th>
            <th>Details & Fix Suggestions</th>
          </tr>
        </thead>
        <tbody>
          ${evidenceRows}
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>`;
  }

  private calculateSummary(evidence: EvidenceRecord[]) {
    const total = evidence.length;
    const passed = evidence.filter(e => e.passed).length;
    const failed = total - passed;
    const successRate = total > 0 ? Math.round((passed / total) * 100) : 100;
    return { total, passed, failed, successRate };
  }
}
