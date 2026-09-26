import { DataSource } from '../../kernel/src/index.js';

export const builtinSources: DataSource[] = [
  {
    id: 'crux',
    name: 'Chrome UX Report',
    description: 'Field performance data from real Chrome users',
    provides: ['performance'],
    modes: ['prod'],
    requires: { credentials: ['CRUX_API_KEY'], network: true },
    cost: 'free',
    suggestFor: ['traditional-seo', 'performance']
  },
  {
    id: 'gsc',
    name: 'Google Search Console',
    description: 'Search performance and index coverage',
    provides: ['rank', 'indexing'],
    modes: ['prod'],
    requires: { credentials: ['GSC_SERVICE_ACCOUNT_PATH', 'GSC_PROPERTY_URL'], network: true },
    cost: 'free',
    suggestFor: ['traditional-seo', 'rank-tracking']
  },
  {
    id: 'bing',
    name: 'Bing Webmaster Tools',
    description: 'Bing search performance and index coverage',
    provides: ['rank', 'indexing'],
    modes: ['prod'],
    requires: { credentials: ['BING_API_KEY', 'BING_SITE_URL'], network: true },
    cost: 'free',
    suggestFor: ['traditional-seo']
  },
  {
    id: 'ga4',
    name: 'Google Analytics 4',
    description: 'Traffic and engagement metrics',
    provides: ['traffic'],
    modes: ['prod'],
    requires: { credentials: ['GA4_SERVICE_ACCOUNT_PATH', 'GA4_PROPERTY_ID'], network: true },
    cost: 'free',
    suggestFor: ['traditional-seo', 'traffic-analysis']
  },
  {
    id: 'elmo',
    name: 'Elmo (Self-hosted)',
    description: 'AI Visibility tracking',
    provides: ['aeo'],
    modes: ['prod'],
    requires: { credentials: ['ELMO_API_URL'], network: true },
    cost: 'free',
    suggestFor: ['ai-visibility']
  },
  {
    id: 'wikidata',
    name: 'Wikidata',
    description: 'Knowledge graph entity extraction',
    provides: ['entities'],
    modes: ['dev', 'prod'],
    requires: { credentials: [], network: true },
    cost: 'free',
    suggestFor: ['traditional-seo', 'entities']
  },
  {
    id: 'public-sitemaps',
    name: 'Public Sitemaps',
    description: 'Sitemap parsing and diffing',
    provides: ['sitemaps'],
    modes: ['dev', 'prod'],
    requires: { credentials: [], network: true },
    cost: 'free',
    suggestFor: ['traditional-seo', 'technical']
  },
  {
    id: 'common-crawl',
    name: 'Common Crawl',
    description: 'Large-scale web crawl data for backlinks',
    provides: ['backlinks'],
    modes: ['prod'],
    requires: { credentials: ['GCP_PROJECT'], network: true },
    cost: 'free-tier',
    suggestFor: ['off-site', 'backlinks']
  },
  {
    id: 'apify-reddit',
    name: 'Apify Reddit Scraper',
    description: 'Reddit mentions and discussions',
    provides: ['social'],
    modes: ['prod'],
    requires: { credentials: ['APIFY_API_TOKEN'], network: true },
    cost: 'free-tier',
    suggestFor: ['off-site', 'social']
  }
];
