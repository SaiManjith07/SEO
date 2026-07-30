import { Diagnostic } from '@seokit/website';

export class DiagnosticMapper {
  /**
   * Translates a single platform-neutral evidence record to an IDE-friendly diagnostic.
   */
  public static mapEvidenceToDiagnostic(evidence: any, uri: string): Diagnostic {
    const severityMap: Record<string, Diagnostic['severity']> = {
      error: 'error',
      warning: 'warning',
      info: 'info',
      hint: 'hint'
    };

    const ruleSeverity = evidence.severity || 'info';
    const mappedSeverity = severityMap[ruleSeverity] || 'info';

    // Translate 1-indexed source locations to 0-indexed editor ranges
    const line = evidence.location?.line || 1;
    const startChar = Math.max(0, (evidence.location?.columnStart || 1) - 1);
    const endChar = Math.max(startChar, (evidence.location?.columnEnd || 1) - 1);

    const diagnostic: Diagnostic = {
      uri,
      severity: mappedSeverity,
      message: `[${evidence.ruleId || 'generic'}] ${evidence.output}`,
      range: {
        start: { line: line - 1, character: startChar },
        end: { line: line - 1, character: endChar }
      },
      source: 'SEOKit Platform',
      code: evidence.ruleId || 'generic-check'
    };

    if (evidence.fixPlan) {
      diagnostic.actions = [
        {
          title: `Apply fix: ${evidence.fixPlan.suggestedFix}`,
          kind: 'quickfix',
          edit: {
            changes: {
              [uri]: [
                {
                  range: diagnostic.range,
                  newText: evidence.fixPlan.replacementText || ''
                }
              ]
            }
          }
        }
      ];
    }

    return diagnostic;
  }

  /**
   * Maps a collection of evidence records to editor diagnostics.
   */
  public static mapCollection(evidences: any[], uri: string): Diagnostic[] {
    return evidences.map(ev => this.mapEvidenceToDiagnostic(ev, uri));
  }
}
