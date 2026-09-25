// @ts-check
/** @type {import('llmstxt-kit').LlmstxtConfig} */
export default {
  site: {
    name: 'My Site',
    url: 'https://example.com',
    summary: 'One-sentence description of the site.',
  },
  source: {
    type: 'markdown',
    dir: './docs',
    include: ['**/*.md', '**/*.mdx'],
    exclude: ['**/drafts/**'],
  },
  sections: [
    { title: 'Docs', match: '**' },
  ],
  outputs: {
    llmsTxt: true,
    llmsFullTxt: { enabled: true, maxKb: 200 },
    schema: { types: ['WebSite', 'Organization', 'BreadcrumbList', 'Article'] },
    robots: { preset: 'allow-all' },
    outDir: './public',
  },
}
