#!/usr/bin/env node
/**
 * @seokit/mcp — the primary adapter.
 *
 * Exposes the rule engine as MCP tools so an IDE agent can apply SEO while
 * code is being written, rather than auditing it after deploy.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  runRules,
  getRules,
  getRule,
  extract,
  fetchPage,
  fetchRobotsTxt,
  crawlSite,
  extractabilityScore,
  parseRobots,
  RETRIEVAL_BOTS,
  TRAINING_BOTS,
  USER_AGENTS,
  detectFramework,
  initProject,
  saveProject,
  loadProject,
  saveDecision,
  loadDecisions,
  saveFixOutcome,
  loadFixOutcomes,
  extractChunks,
  scoreChunk,
  calculateEntityDensity,
  type Finding,
  type PageContext,
  type SiteContext,
  type AeoChunk,
  type ChunkScore,
} from '@seokit/core';

const server = new McpServer({ name: 'seokit', version: '0.1.0' });

// ---------------------------------------------------------------------------
// Formatting — agents act on text, so make findings unambiguous and terse.
// ---------------------------------------------------------------------------

const ICON = { error: 'ERROR', warning: 'WARN ', info: 'INFO ' } as const;

function formatFindings(findings: Finding[], header: string): string {
  if (findings.length === 0) return `${header}\n\nNo issues found.`;

  const order = { error: 0, warning: 1, info: 2 } as const;
  const sorted = [...findings].sort(
    (a, b) => order[a.severity] - order[b.severity],
  );

  const lines = sorted.map((f) => {
    const loc = f.location?.file ?? f.location?.url ?? '';
    const parts = [`[${ICON[f.severity]}] ${f.ruleId}${loc ? `  (${loc})` : ''}`];
    parts.push(`  ${f.message}`);
    if (f.fix) parts.push(`  FIX: ${f.fix}`);
    return parts.join('\n');
  });

  const counts = {
    error: findings.filter((f) => f.severity === 'error').length,
    warning: findings.filter((f) => f.severity === 'warning').length,
    info: findings.filter((f) => f.severity === 'info').length,
  };

  return [
    header,
    `${counts.error} errors, ${counts.warning} warnings, ${counts.info} info`,
    '',
    ...lines,
  ].join('\n');
}

const text = (s: string) => ({ content: [{ type: 'text' as const, text: s }] });

/** Render the AEO score, or say plainly why it could not be computed. */
function aeoLabel(findings: Finding[], html: string): string {
  const r = extractabilityScore(findings, extract(html).wordCount);
  return r.applicable
    ? `AEO extractability ${r.score}/100`
    : `AEO extractability n/a (${r.reason})`;
}

// ---------------------------------------------------------------------------
// seo_audit_url — analyse one live page
// ---------------------------------------------------------------------------

server.registerTool(
  'seo_audit_url',
  {
    title: 'Audit a live URL',
    description:
      'Fetch a URL and run all page-level SEO, schema and AEO rules against it. ' +
      'Set render=true to also execute JavaScript and detect content that AI ' +
      'crawlers cannot see. Use this to check a page after deploying it.',
    inputSchema: {
      url: z.string().url().describe('Absolute URL to audit'),
      render: z
        .boolean()
        .default(false)
        .describe('Run headless Chromium to compare served vs rendered HTML'),
      userAgent: z
        .enum(['browser', 'googlebot', 'gptbot', 'oai-searchbot', 'claudebot', 'perplexitybot'])
        .default('browser')
        .describe('Which crawler to identify as'),
    },
  },
  async ({ url, render, userAgent }) => {
    const ctx = await fetchPage(url, {
      render,
      userAgent: USER_AGENTS[userAgent],
    });

    if (ctx.status >= 400) {
      return text(`Request failed: HTTP ${ctx.status} for ${url}`);
    }

    const { findings, stats } = runRules(ctx);

    return text(
      formatFindings(
        findings,
        `SEO audit — ${ctx.url}\nHTTP ${ctx.status} · ${stats.rulesRun} rules · ` +
          aeoLabel(findings, ctx.rawHtml),
      ),
    );
  },
);

// ---------------------------------------------------------------------------
// seo_check_ai_access — the differentiator
// ---------------------------------------------------------------------------

server.registerTool(
  'seo_check_ai_access',
  {
    title: 'Check AI crawler access',
    description:
      'Determine whether AI search engines can actually read a page. Fetches as ' +
      'each major AI bot, checks robots.txt, and diffs server-rendered against ' +
      'JavaScript-rendered HTML. Run this before assuming a page is visible to ' +
      'ChatGPT, Claude or Perplexity — none of them execute JavaScript.',
    inputSchema: {
      url: z.string().url().describe('Absolute URL to test'),
    },
  },
  async ({ url }) => {
    const origin = new URL(url).origin;
    const robotsTxt = await fetchRobotsTxt(origin);
    const lines: string[] = [`AI crawler access report — ${url}`, ''];

    // 1. robots.txt analysis
    lines.push('## robots.txt');
    if (!robotsTxt) {
      lines.push('  No robots.txt found (or unreachable). All crawlers allowed by default.');
    } else {
      const groups = parseRobots(robotsTxt);
      const blockedFully = (bot: string): boolean => {
        const rules = groups.get(bot.toLowerCase()) ?? groups.get('*');
        return !!rules?.some((r) => r.type === 'disallow' && r.path === '/');
      };
      for (const bot of RETRIEVAL_BOTS) {
        lines.push(
          `  ${blockedFully(bot) ? 'BLOCKED' : 'allowed'}  ${bot}  (retrieval — blocking removes you from AI answers)`,
        );
      }
      for (const bot of TRAINING_BOTS) {
        lines.push(
          `  ${blockedFully(bot) ? 'BLOCKED' : 'allowed'}  ${bot}  (training — blocking is a valid business choice)`,
        );
      }
    }

    // 2. Live fetch as each bot
    lines.push('', '## Live fetch (status per user agent)');
    const bots = ['gptbot', 'oai-searchbot', 'claudebot', 'perplexitybot', 'googlebot'];
    for (const bot of bots) {
      try {
        const r = await fetchPage(url, { userAgent: USER_AGENTS[bot] });
        const words = r.rawHtml.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
        const flag = r.status >= 400 ? '  <-- BLOCKED AT EDGE (check CDN/WAF)' : '';
        lines.push(`  HTTP ${r.status}  ${bot}  (${words} words returned)${flag}`);
      } catch (err) {
        lines.push(
          `  FAILED  ${bot}  ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    // 3. Rendering diff
    lines.push('', '## JavaScript dependency');
    const withRender = await fetchPage(url, { render: true });
    if (!withRender.renderedHtml) {
      lines.push('  Playwright not installed — skipped. Run: pnpm add -D playwright && npx playwright install chromium');
    } else {
      const { findings } = runRules(withRender);
      const csr = findings.filter((f) => f.ruleId.startsWith('ai-access/'));
      if (csr.length === 0) {
        lines.push('  OK — server response contains the page content. AI crawlers can read this page.');
      } else {
        for (const f of csr) {
          lines.push(`  ${ICON[f.severity]} ${f.message}`);
          if (f.fix) lines.push(`     FIX: ${f.fix}`);
        }
      }
    }

    // 4. Site-level rules
    if (robotsTxt) {
      const siteCtx: SiteContext = {
        kind: 'site',
        origin,
        pages: [],
        robotsTxt,
        sitemapUrls: [],
        linkGraph: new Map(),
      };
      const { findings } = runRules(siteCtx);
      if (findings.length > 0) {
        lines.push('', '## Site-level findings');
        for (const f of findings) {
          lines.push(`  ${ICON[f.severity]} ${f.message}`);
          if (f.fix) lines.push(`     FIX: ${f.fix}`);
        }
      }
    }

    return text(lines.join('\n'));
  },
);

// ---------------------------------------------------------------------------
// seo_check_html — lint HTML the agent just wrote, before it ships
// ---------------------------------------------------------------------------

server.registerTool(
  'seo_check_html',
  {
    title: 'Check an HTML string',
    description:
      'Run SEO/AEO rules against an HTML string without any network request. ' +
      'Call this immediately after generating or editing a page template, so ' +
      'problems are fixed before the code is committed. Fast — no I/O.',
    inputSchema: {
      html: z.string().describe('Full HTML document or fragment'),
      url: z
        .string()
        .default('https://example.com/')
        .describe('URL this HTML represents, used for relative-link checks'),
    },
  },
  async ({ html, url }) => {
    const ctx: PageContext = {
      kind: 'page',
      url,
      status: 200,
      headers: {},
      rawHtml: html,
    };
    const { findings, stats } = runRules(ctx);
    return text(
      formatFindings(
        findings,
        `HTML check · ${stats.rulesRun} rules · ${aeoLabel(findings, html)}`,
      ),
    );
  },
);

// ---------------------------------------------------------------------------
// seo_extractability — AEO score with breakdown
// ---------------------------------------------------------------------------

server.registerTool(
  'seo_extractability',
  {
    title: 'Score content extractability for AI citation',
    description:
      'Score how likely a page is to be cited by AI answer engines, based on ' +
      'the Princeton GEO findings: answer-first structure, question headings, ' +
      'statistics, citations, chunk size and entity clarity. Use before publishing.',
    inputSchema: {
      html: z.string().optional().describe('HTML to score'),
      url: z.string().url().optional().describe('URL to fetch and score'),
    },
  },
  async ({ html, url }) => {
    if (!html && !url) return text('Provide either html or url.');

    const ctx: PageContext = html
      ? { kind: 'page', url: url ?? 'https://example.com/', status: 200, headers: {}, rawHtml: html }
      : await fetchPage(url!);

    const { findings } = runRules(ctx);
    const wordCount = extract(ctx.rawHtml).wordCount;
    const { score, applicable, reason, breakdown } = extractabilityScore(
      findings,
      wordCount,
    );

    const pageText = extract(ctx.rawHtml).text;
    const entityAnalysis = calculateEntityDensity(pageText);

    const chunks = extractChunks(ctx.rawHtml);
    const chunkScores = chunks.map((c: AeoChunk) => ({
      chunk: c,
      score: scoreChunk(c),
    }));

    const lines = [
      applicable
        ? `AEO extractability: ${score}/100`
        : `AEO extractability: not scored — ${reason}`,
      '',
      '### Guidelines Checklist',
      ...Object.entries(breakdown).map(
        ([id, ok]) => `  ${ok ? 'PASS' : 'FAIL'}  ${id}`,
      ),
      '',
      '### Entity Density Audit',
      `  - Unique Noun Mentions: ${entityAnalysis.nouns.length}`,
      `  - Pronoun Mentions:      ${entityAnalysis.pronouns.length}`,
      `  - Noun-to-Pronoun Ratio: ${entityAnalysis.ratio} (Target: > 1.5)`,
      `  - Entity Clarity Grade:  ${entityAnalysis.densityScore}/100`,
      `  - Identified Entities:   ${entityAnalysis.nouns.slice(0, 15).join(', ')}${entityAnalysis.nouns.length > 15 ? '...' : ''}`,
      '',
      '### Chunk-Level RAG Suitability Table',
      '| Heading | Words | Question Head | BLUFF Pass | Pronouns | Evidence | Suitability |',
      '|---|---|---|---|---|---|---|',
      ...chunkScores.map((cs: { chunk: AeoChunk; score: ChunkScore }) => {
        const h = cs.chunk.heading.length > 30 ? cs.chunk.heading.substring(0, 27) + '...' : cs.chunk.heading;
        return `| ${h} | ${cs.score.wordCount} | ${cs.score.questionHead ? 'Yes' : 'No'} | ${cs.score.bluffScore === 100 ? 'Yes' : 'No'} | ${cs.score.pronounDensity}% | ${cs.score.evidenceCount} | **${cs.score.suitabilityScore}/100** |`;
      }),
    ];

    const aeoFindings = findings.filter((f) => f.ruleId.startsWith('aeo/'));
    if (aeoFindings.length > 0) {
      lines.push('', '## How to improve');
      for (const f of aeoFindings) {
        lines.push(`  ${f.message}`);
        if (f.fix) lines.push(`     FIX: ${f.fix}`);
      }
    }

    return text(lines.join('\n'));
  },
);

// ---------------------------------------------------------------------------
// seo_generate_schema — emit valid JSON-LD
// ---------------------------------------------------------------------------

server.registerTool(
  'seo_generate_schema',
  {
    title: 'Generate JSON-LD structured data',
    description:
      'Produce a valid JSON-LD block for a schema.org type. Use when adding ' +
      'structured data to a page. Returns a ready-to-paste <script> tag.',
    inputSchema: {
      type: z
        .enum([
          'Organization',
          'Article',
          'BlogPosting',
          'Product',
          'FAQPage',
          'HowTo',
          'LocalBusiness',
          'BreadcrumbList',
          'Person',
          'WebSite',
        ])
        .describe('schema.org type'),
      data: z
        .record(z.string(), z.unknown())
        .describe('Properties, e.g. { name, url, logo, sameAs: [...] }'),
    },
  },
  async ({ type, data }) => {
    const doc = { '@context': 'https://schema.org', '@type': type, ...data };
    const json = JSON.stringify(doc, null, 2);

    const warnings: string[] = [];
    const required: Record<string, string[]> = {
      Organization: ['name', 'url'],
      Article: ['headline', 'author', 'datePublished'],
      BlogPosting: ['headline', 'author', 'datePublished'],
      Product: ['name'],
      FAQPage: ['mainEntity'],
      HowTo: ['name', 'step'],
      LocalBusiness: ['name', 'address'],
      BreadcrumbList: ['itemListElement'],
      Person: ['name'],
      WebSite: ['name', 'url'],
    };
    for (const key of required[type] ?? []) {
      if (!(key in data)) warnings.push(`Missing recommended property: ${key}`);
    }
    if (type === 'Organization' && !('sameAs' in data)) {
      warnings.push(
        'No sameAs array. Add your LinkedIn, X, YouTube, GitHub and Wikidata URLs — ' +
          'this is the entity-disambiguation signal AI systems rely on.',
      );
    }

    return text(
      [
        `<script type="application/ld+json">\n${json}\n</script>`,
        '',
        warnings.length
          ? `Warnings:\n${warnings.map((w) => `  - ${w}`).join('\n')}`
          : 'No warnings.',
        '',
        'Reminder: every property here must correspond to content visible on the ' +
          'rendered page. Marking up invisible content violates Google\'s spammy ' +
          'structured data policy.',
      ].join('\n'),
    );
  },
);

// ---------------------------------------------------------------------------
// seo_explain — let the agent justify a fix
// ---------------------------------------------------------------------------

server.registerTool(
  'seo_explain',
  {
    title: 'Explain a rule',
    description:
      'Return the rationale and documentation for a rule id. Use when you need ' +
      'to justify a change, or to look up what a rule checks.',
    inputSchema: {
      ruleId: z.string().describe('e.g. ai-access/client-side-only-content'),
    },
  },
  async ({ ruleId }) => {
    const rule = getRule(ruleId);
    if (!rule) {
      return text(
        `Unknown rule: ${ruleId}\n\nAvailable:\n${getRules()
          .map((r) => `  ${r.id}`)
          .join('\n')}`,
      );
    }
    return text(
      [
        `${rule.id}`,
        `Category:  ${rule.category}`,
        `Severity:  ${rule.severity}`,
        `Applies to: ${rule.needs} context`,
        '',
        rule.description,
        rule.docs ? `\nDocs: ${rule.docs}` : '',
      ].join('\n'),
    );
  },
);

// ---------------------------------------------------------------------------
// seo_list_rules
// ---------------------------------------------------------------------------

server.registerTool(
  'seo_list_rules',
  {
    title: 'List all rules',
    description: 'List every available rule, optionally filtered by category.',
    inputSchema: {
      category: z
        .enum(['technical', 'content', 'schema', 'performance', 'ai-access', 'aeo'])
        .optional(),
    },
  },
  async ({ category }) => {
    const rules = getRules().filter((r) => !category || r.category === category);
    return text(
      [
        `${rules.length} rules`,
        '',
        ...rules.map(
          (r) => `  ${r.severity.padEnd(7)} ${r.id.padEnd(42)} ${r.description}`,
        ),
      ].join('\n'),
    );
  },
);

// ---------------------------------------------------------------------------
// seo_crawl_site — recursive site crawl and audit
// ---------------------------------------------------------------------------

server.registerTool(
  'seo_crawl_site',
  {
    title: 'Crawl and audit a full site',
    description:
      'Recursively crawl a website starting at a seed URL, mapping internal links ' +
      'and executing both page-level and site-level standards checks.',
    inputSchema: {
      url: z.string().url().describe('Seed URL (origin) of website to crawl'),
      maxPages: z
        .number()
        .min(1)
        .max(100)
        .default(10)
        .describe('Maximum number of internal pages to fetch'),
      render: z
        .boolean()
        .default(false)
        .describe('Run headless Chromium for page rendering'),
    },
  },
  async ({ url, maxPages, render }) => {
    const siteCtx = await crawlSite(url, maxPages, render);
    const lines: string[] = [
      `Crawl audit report — Seed: ${url}`,
      `Crawled ${siteCtx.pages.length} pages. Found sitemaps: ${siteCtx.sitemapUrls.join(', ') || 'None'}`,
      '',
    ];

    // Run rules on SiteContext
    const { findings: siteFindings } = runRules(siteCtx);
    if (siteFindings.length > 0) {
      lines.push(formatFindings(siteFindings, '## Site-level findings'));
      lines.push('');
    }

    // Run rules on each individual PageContext crawled
    lines.push('## Page-level findings');
    for (const page of siteCtx.pages) {
      const { findings: pageFindings } = runRules(page);
      if (pageFindings.length > 0) {
        lines.push(formatFindings(pageFindings, `### ${page.url} (Status ${page.status})`));
        lines.push('');
      } else {
        lines.push(`### ${page.url} (Status ${page.status}) — Clean`);
        lines.push('');
      }
    }

    return text(lines.join('\n'));
  },
);

// ---------------------------------------------------------------------------
// seo_find_opportunities — strike-distance analysis from GSC logs
// ---------------------------------------------------------------------------

server.registerTool(
  'seo_find_opportunities',
  {
    title: 'Find striking-distance opportunities',
    description:
      'Analyze Google Search Console query logs to locate "sleeper" pages in positions ' +
      '5–15 that have high impressions but low CTR. Ranks them by priority value ' +
      '(impressions × expectedRewardGain) for content optimization roadmaps.',
    inputSchema: {
      gscData: z
        .string()
        .describe(
          'JSON array of GSC query performance logs. Example: [{"page": "https://example.com/page", "query": "buy widgets", "impressions": 1000, "clicks": 10, "position": 8.5}]'
        ),
    },
  },
  async ({ gscData }) => {
    let records: Array<{
      page: string;
      query: string;
      impressions: number;
      clicks: number;
      position: number;
    }> = [];

    try {
      records = JSON.parse(gscData);
    } catch {
      return text('Invalid JSON data format. Ensure payload parses as a valid GSC records array.');
    }

    if (records.length === 0) {
      return text('No records found in GSC data array.');
    }

    // Group by page to summarize performance
    const pageStats = new Map<string, { impressions: number; clicks: number; sumPos: number; count: number }>();
    for (const r of records) {
      const stats = pageStats.get(r.page) || { impressions: 0, clicks: 0, sumPos: 0, count: 0 };
      stats.impressions += r.impressions;
      stats.clicks += r.clicks;
      stats.sumPos += r.position * r.impressions; // Weight position by impressions
      stats.count += r.impressions;
      pageStats.set(r.page, stats);
    }

    interface Opportunity {
      page: string;
      impressions: number;
      clicks: number;
      ctr: number;
      avgPosition: number;
      expectedRewardGain: number;
      potentialValue: number;
    }

    const opportunities: Opportunity[] = [];

    for (const [page, stats] of pageStats.entries()) {
      const avgPos = stats.count > 0 ? stats.sumPos / stats.count : 0;
      const ctr = stats.impressions > 0 ? stats.clicks / stats.impressions : 0;
      
      // Filter to striking-distance window: position 5.0 to 15.0
      if (avgPos >= 4.0 && avgPos <= 15.0) {
        // Approximate expectedRewardGain based on proximity to top 3 positions
        // Closer to position 5 yields a higher multiplier
        const expectedRewardGain = Math.max(0.05, (15.0 - avgPos) / 20.0);
        const potentialValue = Math.round(stats.impressions * expectedRewardGain);

        opportunities.push({
          page,
          impressions: stats.impressions,
          clicks: stats.clicks,
          ctr: parseFloat((ctr * 100).toFixed(2)),
          avgPosition: parseFloat(avgPos.toFixed(1)),
          expectedRewardGain: parseFloat(expectedRewardGain.toFixed(2)),
          potentialValue,
        });
      }
    }

    // Sort opportunities by potential value descending
    opportunities.sort((a, b) => b.potentialValue - a.potentialValue);

    const lines: string[] = [
      '# Prioritized Content Restructuring Roadmap',
      'Ranked by potential traffic yield: `Impressions × Expected Gain`',
      '',
      '| Priority | Page URL | Avg Position | Current CTR | Impressions | Expected Gain | Est Value Lift |',
      '|---|---|---|---|---|---|---|',
    ];

    opportunities.forEach((o, index) => {
      lines.push(
        `| #${index + 1} | [${o.page}](${o.page}) | ${o.avgPosition} | ${o.ctr}% | ${o.impressions} | +${o.expectedRewardGain} | **+${o.potentialValue}** |`
      );
    });

    if (opportunities.length === 0) {
      lines.push('No striking-distance pages found in positions 4–15. Check your filter logs.');
    }

    return text(lines.join('\n'));
  },
);

// ---------------------------------------------------------------------------
// seo_init — scaffold files and detect framework
// ---------------------------------------------------------------------------

server.registerTool(
  'seo_init',
  {
    title: 'Initialize project SEO configuration',
    description:
      'Detect the web framework of the project, initialize the `.seokit/` config folder, ' +
      'and scaffold necessary robots.txt, llms.txt, guidelines, and CI GitHub Action pipelines.',
    inputSchema: {
      root: z.string().describe('Absolute folder path of project root directory'),
      framework: z
        .enum(['next', 'nuxt', 'astro', 'sveltekit', 'remix', 'static', 'unknown'])
        .optional()
        .describe('Explicitly force web framework scaffolding conventions'),
    },
  },
  async ({ root, framework }) => {
    try {
      const res = await initProject(root, framework);
      return text(
        JSON.stringify(
          {
            success: true,
            detectedFramework: res.framework,
            filesScaffolded: res.filesScaffolded,
            message: `Successfully initialized project at ${root}. Scaffolded files: ${res.filesScaffolded.join(', ') || 'None (already initialized)'}`,
          },
          null,
          2
        )
      );
    } catch (err: any) {
      return text(JSON.stringify({ success: false, error: err.message }, null, 2));
    }
  },
);

// ---------------------------------------------------------------------------
// memory_load — fetch saved decisions and outcome metrics
// ---------------------------------------------------------------------------

server.registerTool(
  'memory_load',
  {
    title: 'Load project conventions and decisions',
    description:
      'Load saved human decisions (overruled guidelines) and historic optimization ' +
      'outcome logs for the project. Restricts agent from suggesting previously rejected options.',
    inputSchema: {
      projectId: z.string().describe('The absolute path/identifier of the project root directory'),
      key: z.enum(['decisions', 'outcomes']).optional().describe('Filter by specific memory key'),
    },
  },
  async ({ projectId, key }) => {
    try {
      let project = loadProject(projectId);
      if (!project) {
        const id = saveProject(projectId);
        project = { id, root: projectId, updatedAt: new Date().toISOString() };
      }

      const response: Record<string, any> = {
        projectId: project.id,
        root: project.root,
      };

      if (!key || key === 'decisions') {
        response.decisions = loadDecisions(project.root, project.id);
      }
      if (!key || key === 'outcomes') {
        response.outcomes = loadFixOutcomes(project.root, project.id);
      }

      return text(JSON.stringify(response, null, 2));
    } catch (err: any) {
      return text(JSON.stringify({ success: false, error: err.message }, null, 2));
    }
  },
);

// ---------------------------------------------------------------------------
// memory_save_decision — record override decisions
// ---------------------------------------------------------------------------

server.registerTool(
  'memory_save_decision',
  {
    title: 'Record a human override decision',
    description:
      'Save when a human reviewer ignores or overrules a rule warning with a specific ' +
      'rationale, preventing future sessions from attempting the same check.',
    inputSchema: {
      projectId: z.string().describe('The absolute path/identifier of the project root directory'),
      ruleId: z.string().describe('The specific Standard ID or rule name being overruled (e.g. STD-09)'),
      decision: z.string().describe('The override actions decided (e.g. ignore standard check)'),
      rationale: z.string().describe('User explained justification rationale for override'),
    },
  },
  async ({ projectId, ruleId, decision, rationale }) => {
    try {
      let project = loadProject(projectId);
      if (!project) {
        const id = saveProject(projectId);
        project = { id, root: projectId, updatedAt: new Date().toISOString() };
      }

      const decisionId = saveDecision(project.root, project.id, ruleId, decision, rationale);
      return text(
        JSON.stringify(
          {
            success: true,
            decisionId,
            message: `Override decision for rule ${ruleId} recorded successfully.`,
          },
          null,
          2
        )
      );
    } catch (err: any) {
      return text(JSON.stringify({ success: false, error: err.message }, null, 2));
    }
  },
);

// ---------------------------------------------------------------------------
// memory_save_outcome — record fix metrics
// ---------------------------------------------------------------------------

server.registerTool(
  'memory_save_outcome',
  {
    title: 'Record an optimization fix outcome',
    description:
      'Log when a fix is applied to record the before/after rewards and predicted gains. ' +
      'Enables calibration accuracy calculations.',
    inputSchema: {
      projectId: z.string().describe('The absolute path/identifier of the project root directory'),
      url: z.string().url().describe('The URL of the optimized page'),
      ruleId: z.string().describe('The specific standard ID resolved (e.g. STD-06)'),
      fixSummary: z.string().describe('Brief description of changes made'),
      rewardBefore: z.number().describe('Evaluator score before optimizations'),
      rewardAfter: z.number().describe('Evaluator score after optimizations'),
      predictedGain: z.number().describe('The expected rating delta predicted by critic'),
      worked: z.boolean().describe('Did this fix improve actual traffic/ranking signals'),
    },
  },
  async ({ projectId, url, ruleId, fixSummary, rewardBefore, rewardAfter, predictedGain, worked }) => {
    try {
      let project = loadProject(projectId);
      if (!project) {
        const id = saveProject(projectId);
        project = { id, root: projectId, updatedAt: new Date().toISOString() };
      }

      const outcomeId = saveFixOutcome(
        project.root,
        project.id,
        url,
        ruleId,
        fixSummary,
        rewardBefore,
        rewardAfter,
        predictedGain,
        worked ? 1 : 0
      );
      return text(
        JSON.stringify(
          {
            success: true,
            outcomeId,
            message: `Fix outcome for standard ${ruleId} logged successfully.`,
          },
          null,
          2
        )
      );
    } catch (err: any) {
      return text(JSON.stringify({ success: false, error: err.message }, null, 2));
    }
  },
);

// ---------------------------------------------------------------------------
// Resource: the rules the agent should follow from turn one
// ---------------------------------------------------------------------------

server.registerResource(
  'guidelines',
  'seokit://guidelines',
  {
    title: 'SEO guidelines for this project',
    description:
      'The rules to follow when creating or editing any page. Read this before ' +
      'writing routes, templates or content.',
    mimeType: 'text/markdown',
  },
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: 'text/markdown',
        text: GUIDELINES,
      },
    ],
  }),
);

const GUIDELINES = `# SEO rules for this project

Apply these while writing code, not afterwards.

## Non-negotiable (errors)

1. **Server-render all content.** GPTBot, ClaudeBot and PerplexityBot do not
   execute JavaScript. Content fetched in useEffect is invisible to every AI
   search engine. Use Server Components / SSG / SSR.
2. **One <h1> per page**, as a real heading tag, never a styled div.
3. **Unique <title>** under 60 characters on every route.
4. **No stray noindex** — check both meta robots and X-Robots-Tag.
5. **Valid JSON-LD.** A syntax error makes the whole block ignored.
6. **Schema must match visible content.** Marking up content a user cannot see
   is a policy violation.

## Structure every page for retrieval

- Lead with a 40–60 word direct answer. No preamble. The first 100 words are
  the primary citation target.
- Question-shaped H2s that match real query phrasing.
- Paragraphs of 2–4 lines, one idea each, each self-contained.
- Proper nouns over pronouns — retrieval strips surrounding context.
- Tables for comparisons; they extract cleanly.
- Include concrete statistics and cite sources inline. These measured +25.9%
  and +24.9% visibility respectively in the Princeton GEO benchmark.

## Always include

- Self-referencing canonical
- lang attribute on <html>
- alt text on meaningful images; width/height on all images (CLS)
- Organization schema site-wide with a complete sameAs array
- Article/Product schema on content and product pages

## Workflow

After creating or editing any page component, call \`seo_check_html\` with the
rendered output. Fix every error before moving on. Call \`seo_check_ai_access\`
against a deployed URL before considering a page done.
`;

// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('seokit MCP server running on stdio');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
