import { DataSource } from '../../kernel/src/index.js';
import { builtinSources } from './catalog.js';

export function suggest(goals: string[]): {
  recommended: DataSource[];
  optional: DataSource[];
  free: DataSource[];
} {
  const recommended = new Set<DataSource>();
  const optional = new Set<DataSource>();
  const free = new Set<DataSource>();

  for (const source of builtinSources) {
    if (source.cost === 'free' && source.requires.credentials.length === 0) {
      free.add(source);
    }
    
    if (goals.some(g => source.suggestFor.includes(g))) {
      recommended.add(source);
    } else {
      optional.add(source);
    }
  }

  // A source shouldn't be in both recommended and optional
  for (const r of recommended) {
    optional.delete(r);
  }

  return {
    recommended: Array.from(recommended),
    optional: Array.from(optional),
    free: Array.from(free)
  };
}
