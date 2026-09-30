export const DEFAULT_AFTER_LOGIN = "/home"

/**
 * Only allow same-site relative paths as post-login destinations,
 * so `?next=` can't be used as an open redirect.
 */
export function safeNextPath(next: string | null | undefined): string {
  if (!next) return DEFAULT_AFTER_LOGIN
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return DEFAULT_AFTER_LOGIN
  }
  // Reject control characters and backslashes anywhere (some browsers normalise "\" to "/").
  if (/[\u0000-\u001f\\]/.test(next)) return DEFAULT_AFTER_LOGIN
  return next
}
