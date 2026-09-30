import "server-only"

/**
 * Small in-memory sliding-window limiter for AI endpoints that anonymous visitors can call.
 * Per server instance only; good enough to stop accidental loops and casual abuse.
 */
const hits = new Map<string, number[]>()

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
  if (recent.length >= limit) {
    hits.set(key, recent)
    return { ok: false, retryAfter: Math.ceil((windowMs - (now - recent[0])) / 1000) }
  }
  recent.push(now)
  hits.set(key, recent)
  if (hits.size > 5000) hits.clear()
  return { ok: true, retryAfter: 0 }
}

export function clientKey(request: Request, userId?: string | null) {
  if (userId) return `u:${userId}`
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  return `ip:${forwarded || request.headers.get("x-real-ip") || "unknown"}`
}
