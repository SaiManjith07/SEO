import { registry } from '../index.js';
import { ClassifiedTask } from '../types.js';

const COMMON_TLDS = new Set([
  'com','org','net','io','dev','app','co','ai','tech','xyz',
  'uk','de','fr','jp','in','au','ca','us','edu','gov','info','biz'
]);

const STATIC_MAPPING: Record<string, string[]> = {
  'audit': ['audit', 'review site', 'check seo'],
  'performance': ['core web vitals', 'crux', 'lcp', 'cls', 'inp'],
  'rank': ['rank', 'position', 'queries', 'impressions'],
  'aeo': ['chatgpt', 'perplexity', 'ai overviews', 'answer engine']
};

export function classify(input: string): ClassifiedTask {
  if (!input || input.trim() === '') {
    return { goal: 'unknown', capabilities: [], params: {}, rawInput: input || '', confidence: 'low' };
  }

  const agents = registry.agents.list();
  const availableCapabilities = new Set<string>();
  for (const a of agents) {
    for (const c of a.capabilities || []) {
      availableCapabilities.add(c);
    }
  }
  
  // also inject any statically mapped capabilities in case agents aren't registered yet in tests
  for (const cap of Object.keys(STATIC_MAPPING)) {
    availableCapabilities.add(cap);
  }

  const lowerInput = input.toLowerCase();
  
  const matchedCapabilities: string[] = [];
  let maxScore = 0;

  for (const cap of availableCapabilities) {
    const triggers = STATIC_MAPPING[cap] || [cap];
    let score = 0;
    for (const trigger of triggers) {
      if (lowerInput.includes(trigger.toLowerCase())) {
        score += trigger.length;
      }
    }
    if (score >= 3) {
      matchedCapabilities.push(cap);
      if (score > maxScore) maxScore = score;
    }
  }

  const params: Record<string, unknown> = {};
  
  // 1. Explicit scheme
  const explicitMatch = input.match(/https?:\/\/[^\s]+/i);
  // 2. www prefix
  const wwwMatch = input.match(/\bwww\.[a-z0-9-]+(\.[a-z0-9-]+)+/i);
  // 3. Bare domain
  const bareMatch = input.match(/\b([a-z0-9]([a-z0-9-]*[a-z0-9])?\.){1,4}[a-z]{2,}\b/i);
  // 4. Explicit "for <domain>"
  const forMatch = input.match(/\bfor\s+([a-z0-9.-]+\.[a-z]{2,})\b/i);

  let urlConfidence: 'explicit' | 'inferred' | 'none' = 'none';

  if (explicitMatch) {
    params.url = explicitMatch[0];
    urlConfidence = 'explicit';
  } else if (wwwMatch) {
    params.url = wwwMatch[0];
    urlConfidence = 'explicit';
  } else if (forMatch) {
    const candidate = forMatch[1];
    const tld = candidate.split('.').pop()?.toLowerCase();
    if (tld && COMMON_TLDS.has(tld)) {
      params.url = candidate;
      urlConfidence = 'inferred';
    }
  } else if (bareMatch) {
    const candidate = bareMatch[0];
    const tld = candidate.split('.').pop()?.toLowerCase();
    
    // Skip single letter TLDs (e.g. e.g)
    if (tld && tld.length > 1 && COMMON_TLDS.has(tld)) {
      if (candidate.toLowerCase() !== 'example.com' || matchedCapabilities.includes('audit')) {
        params.url = candidate;
        urlConfidence = 'inferred';
      }
    }
  }
  
  if (urlConfidence !== 'none') {
    params.urlConfidence = urlConfidence;
  }

  const daysMatch = input.match(/\b(\d+)\s*days?\b/i);
  if (daysMatch) {
    params.days = parseInt(daysMatch[1], 10);
  }

  if (matchedCapabilities.length > 0) {
    return {
      goal: input,
      capabilities: matchedCapabilities,
      params,
      rawInput: input,
      confidence: maxScore > 10 ? 'high' : 'medium'
    };
  }

  return { goal: 'unknown', capabilities: [], params: {}, rawInput: input, confidence: 'low' };
}
