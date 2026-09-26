export type RunMode = 'dev' | 'prod';

export interface ModeContext {
  explicit?: RunMode;         // from CLI flag
  env?: string;               // process.env.NODE_ENV
  targetIsLocal?: boolean;    // checking local files
  targetIsLiveUrl?: boolean;  // checking a live URL
}

export function resolveMode(ctx: ModeContext): RunMode {
  if (ctx.explicit) return ctx.explicit;
  if (ctx.targetIsLocal) return 'dev';
  if (ctx.env === 'production' && ctx.targetIsLiveUrl) return 'prod';
  if (ctx.env === 'production') return 'prod';
  return 'dev';
}
