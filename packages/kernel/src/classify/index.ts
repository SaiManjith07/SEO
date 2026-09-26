import { registry } from '../index.js';

export interface ClassifiedTask {
  goal: string;
  capabilities: string[];
  params: Record<string, unknown>;
  rawInput: string;
  confidence: 'high' | 'medium' | 'low';
}

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

  const lowerInput = input.toLowerCase();
  
  let bestCap = '';
  let bestScore = 0;

  for (const cap of availableCapabilities) {
    const triggers = STATIC_MAPPING[cap] || [cap];
    let score = 0;
    for (const trigger of triggers) {
      if (lowerInput.includes(trigger.toLowerCase())) {
        score += trigger.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestCap = cap;
    }
  }

  const params: Record<string, unknown> = {};
  
  const urlMatch = input.match(/https?:\/\/[^\s]+/i);
  if (urlMatch) {
    params.url = urlMatch[0];
  } else {
    const domainMatch = input.match(/\b[a-z0-9-]+\.[a-z]{2,}\b/i);
    if (domainMatch) {
      params.url = domainMatch[0];
    }
  }

  const daysMatch = input.match(/\b(\d+)\s*days?\b/i);
  if (daysMatch) {
    params.days = parseInt(daysMatch[1], 10);
  }

  if (bestScore > 0) {
    return {
      goal: input,
      capabilities: [bestCap],
      params,
      rawInput: input,
      confidence: bestScore > 10 ? 'high' : 'medium'
    };
  }

  return { goal: 'unknown', capabilities: [], params: {}, rawInput: input, confidence: 'low' };
}
