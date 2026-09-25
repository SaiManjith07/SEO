import { trace, context, Span, Tracer as OTTracer } from '@opentelemetry/api';

/**
 * Singleton tracer instance to track execution spans.
 */
let globalTracer: OTTracer | null = null;

/**
 * Initialize the tracer (e.g. at process startup).
 */
export function initTracer(name = 'seokit') {
  globalTracer = trace.getTracer(name);
}

/**
 * Starts a new span. Useful for tracing critical paths in the rule engine.
 */
export function startSpan(name: string): Span {
  if (!globalTracer) {
    // If not initialized, fallback to a global default or a noop tracer.
    // The OT API defaults to a NoopTracer if no provider is registered.
    globalTracer = trace.getTracer('seokit');
  }
  return globalTracer.startSpan(name);
}

/**
 * Runs a callback within an active span context.
 */
export async function withSpan<T>(name: string, fn: (span: Span) => Promise<T>): Promise<T> {
  const span = startSpan(name);
  return context.with(trace.setSpan(context.active(), span), async () => {
    try {
      return await fn(span);
    } catch (err: any) {
      span.recordException(err);
      span.setStatus({ code: 2, message: err?.message || 'Error' }); // Error code
      throw err;
    } finally {
      span.end();
    }
  });
}
