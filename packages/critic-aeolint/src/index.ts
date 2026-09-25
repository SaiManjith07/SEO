import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export interface Finding {
  ruleId: string;
  passed: boolean;
  severity: 'error' | 'warning' | 'info';
  output: string;
  source: string;
  filePath?: string;
}

export class AeolintCritic {
  public async evaluate(workspacePath: string): Promise<Finding[]> {
    try {
      // Execute aeolint using npx and save to a temporary json file
      const reportPath = path.join(process.cwd(), 'aeolint-report.json');
      try {
        execSync(`npx @didrod2539/aeolint scan "${workspacePath}" --json "${reportPath}"`, {
          encoding: 'utf-8',
          cwd: process.cwd()
        });
      } catch (err) {
        // it may exit with non-zero if issues found
      }
      if (fs.existsSync(reportPath)) {
        const output = fs.readFileSync(reportPath, 'utf-8');
        fs.unlinkSync(reportPath); // cleanup
        return this.parseAeolintOutput(output);
      }
      return [];
    } catch (error: any) {
      // aeolint might exit with non-zero if it finds errors, which is normal.
      if (error.stdout) {
        return this.parseAeolintOutput(error.stdout);
      }
      throw new Error(`Failed to run aeolint: ${error.message}`);
    }
  }

  private parseAeolintOutput(jsonOutput: string): Finding[] {
    try {
      const report = JSON.parse(jsonOutput);
      const findings: Finding[] = [];
      
      // Assuming aeolint outputs a list of results or issues
      // Map to SEOKit Finding schema
      const pages = report.pages || [];
      for (const page of pages) {
        const results = page.findings || [];
        for (const res of results) {
          findings.push({
            ruleId: res.id || 'aeolint-rule',
            passed: res.severity === 'pass' || res.severity === 'info',
            severity: res.severity === 'pass' ? 'info' : res.severity,
            output: res.message || 'Aeolint check failed',
            source: 'aeolint',
            filePath: page.source,
            fix: res.fix || 'No explicit fix provided'
          } as any);
        }
      }
      return findings;
    } catch (e) {
      console.error('Failed to parse aeolint output:', e);
      return [];
    }
  }
}
