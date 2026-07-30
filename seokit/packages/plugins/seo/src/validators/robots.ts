import { ExecutionPlan, VerificationEvidence, ValidatorPlugin, FixPlan } from '@seokit/core';

export const robotsValidator: ValidatorPlugin = {
  id: 'robots-validator',
  version: '1.0.0',
  async execute(plan: ExecutionPlan, context: any): Promise<VerificationEvidence> {
    const robotsTxt = context.robotsTxt || '';
    if (!robotsTxt) {
      return {
        passed: false,
        confidence: 1.0,
        output: 'Missing robots.txt content',
        source: 'robots-validator',
        fixPlan: {
          ruleId: 'seo.robots.valid',
          description: 'No robots.txt content was found to analyze.',
          suggestedFix: 'Create a robots.txt file in the project public root.',
          targetFile: context.filePath
        }
      };
    }

    const hasUserAgent = robotsTxt.toLowerCase().includes('user-agent:');
    const hasSitemap = robotsTxt.toLowerCase().includes('sitemap:');

    const issues: string[] = [];
    if (!hasUserAgent) issues.push('Missing User-agent directives');
    if (!hasSitemap) issues.push('Missing Sitemap references');

    // STD-01: Verify access for core search and retrieval crawler bots
    const targetBots: string[] = context.config?.aiCrawlers || [
      'Googlebot',
      'Google-Extended',
      'OAI-SearchBot',
      'Claude-SearchBot',
      'PerplexityBot',
      'Bingbot'
    ];
    const lines = robotsTxt.split(/\r?\n/).map((l: string) => l.trim().toLowerCase()).filter((l: string) => l && !l.startsWith('#'));
    
    const botExplicitlyAllowed = new Set<string>();
    const botExplicitlyBlocked = new Set<string>();
    let isBlanketBlocked = false;
    let currentBlockAgents: string[] = [];

    for (const line of lines) {
      if (line.startsWith('user-agent:')) {
        const agent = line.replace('user-agent:', '').trim();
        // If preceding line was disallow/allow, we reset the block agents list
        const idx = lines.indexOf(line);
        if (idx > 0 && !lines[idx - 1].startsWith('user-agent:')) {
          currentBlockAgents = [];
        }
        currentBlockAgents.push(agent);
      } else if (line.startsWith('disallow:') || line.startsWith('allow:')) {
        const isDisallow = line.startsWith('disallow:');
        const path = line.split(':')[1]?.trim() ?? '';
        
        if (path === '/' || path === '/*') {
          for (const agent of currentBlockAgents) {
            if (agent === '*') {
              if (isDisallow) isBlanketBlocked = true;
            } else {
              const matchedBot = targetBots.find(tb => tb.toLowerCase() === agent);
              if (matchedBot) {
                if (isDisallow) {
                  botExplicitlyBlocked.add(matchedBot);
                } else {
                  botExplicitlyAllowed.add(matchedBot);
                }
              }
            }
          }
        }
      } else {
        currentBlockAgents = [];
      }
    }

    const actuallyBlocked: string[] = [];
    for (const bot of targetBots) {
      if (botExplicitlyBlocked.has(bot)) {
        actuallyBlocked.push(bot);
      } else if (isBlanketBlocked && !botExplicitlyAllowed.has(bot)) {
        actuallyBlocked.push(bot);
      }
    }

    if (actuallyBlocked.length > 0) {
      issues.push(`Access Blocked (STD-01): Target retrieval crawlers are blocked: ${actuallyBlocked.join(', ')}`);
    }

    if (issues.length > 0) {
      const fix: FixPlan = {
        ruleId: 'seo.robots.valid',
        description: 'Robots.txt contains formatting errors or blocks search/retrieval crawlers.',
        suggestedFix: 'Ensure your robots.txt allows OAI-SearchBot, PerplexityBot, Claude-SearchBot, Google-Extended, and Googlebot access using "Allow: /" patterns.',
        targetFile: context.filePath
      };

      return {
        passed: false,
        confidence: 1.0,
        output: `Robots.txt issues: ${issues.join('; ')}`,
        source: 'robots-validator',
        fixPlan: fix
      };
    }

    return {
      passed: true,
      confidence: 1.0,
      output: 'robots.txt features valid user-agent directives, sitemap references, and allows all target search crawlers.',
      source: 'robots-validator'
    };
  }
};
