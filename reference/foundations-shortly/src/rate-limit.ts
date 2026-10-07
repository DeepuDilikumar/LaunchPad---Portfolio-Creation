export interface RateLimiterOptions {
  limit: number;
  windowMs: number;
  now?: () => number;
}

/** Token bucket: `limit` tokens, refilled evenly over `windowMs`. */
export function createRateLimiter({ limit, windowMs, now = Date.now }: RateLimiterOptions) {
  const buckets = new Map<string, { tokens: number; updatedAt: number }>();
  const refillPerMs = limit / windowMs;

  return {
    take(key: string): boolean {
      const t = now();
      const b = buckets.get(key) ?? { tokens: limit, updatedAt: t };
      b.tokens = Math.min(limit, b.tokens + (t - b.updatedAt) * refillPerMs);
      b.updatedAt = t;
      const allowed = b.tokens >= 1;
      if (allowed) b.tokens -= 1;
      buckets.set(key, b);
      return allowed;
    },
  };
}
