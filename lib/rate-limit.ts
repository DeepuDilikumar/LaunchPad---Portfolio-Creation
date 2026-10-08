import "server-only";
import { env, mock } from "@/lib/env";

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  /** Epoch ms when the window resets. */
  resetAt: number;
}

type Bucket = { count: number; resetAt: number };
const g = globalThis as unknown as { __bpRl?: Map<string, Bucket> };
const memory = (g.__bpRl ??= new Map());

/** Fixed-window limiter. Upstash Redis when configured, in-memory otherwise. */
export async function rateLimit(key: string, limit: number, windowSeconds: number, opts: { failClosed?: boolean } = {}): Promise<RateLimitResult> {
  const now = Date.now();
  if (mock.rateLimit) {
    const b = memory.get(key);
    if (!b || b.resetAt <= now) {
      const fresh = { count: 1, resetAt: now + windowSeconds * 1000 };
      memory.set(key, fresh);
      return { ok: true, remaining: limit - 1, resetAt: fresh.resetAt };
    }
    b.count++;
    return { ok: b.count <= limit, remaining: Math.max(0, limit - b.count), resetAt: b.resetAt };
  }
  const window = Math.floor(now / (windowSeconds * 1000));
  const redisKey = `rl:${key}:${window}`;
  try {
    const res = await fetch(`${env.upstashUrl}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.upstashToken}`, "content-type": "application/json" },
      body: JSON.stringify([
        ["INCR", redisKey],
        ["EXPIRE", redisKey, String(windowSeconds)],
      ]),
      cache: "no-store",
    });
    const data = (await res.json()) as { result: number }[];
    const count = Number(data[0]?.result ?? 0);
    const resetAt = (window + 1) * windowSeconds * 1000;
    return { ok: count <= limit, remaining: Math.max(0, limit - count), resetAt };
  } catch {
    // Limiter outage: fail closed for abuse-prone endpoints, open elsewhere (they still require auth).
    return { ok: !opts.failClosed, remaining: opts.failClosed ? 0 : limit, resetAt: now + windowSeconds * 1000 };
  }
}

/**
 * The client IP as set by the platform, not by the client. On Vercel, x-vercel-forwarded-for and
 * x-real-ip are written by the edge. Elsewhere, the last x-forwarded-for hop is the one our own proxy
 * appended; earlier entries are client-controlled.
 */
export function clientIp(req: Request) {
  const h = req.headers;
  const vercel = h.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  if (vercel) return vercel;
  const real = h.get("x-real-ip")?.trim();
  if (real) return real;
  const xff = h.get("x-forwarded-for")?.split(",").map((s) => s.trim()).filter(Boolean);
  return xff?.length ? xff[xff.length - 1]! : "local";
}
