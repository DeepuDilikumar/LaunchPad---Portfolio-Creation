import "server-only";
import { env } from "@/lib/env";

/**
 * Minimal Sentry-compatible error reporter. Sends events to the DSN's store endpoint when
 * SENTRY_DSN is set; logs otherwise. Swap for @sentry/nextjs when you want tracing and
 * source maps (see README).
 */
export async function reportError(error: unknown, context: Record<string, unknown> = {}) {
  const err = error instanceof Error ? error : new Error(String(error));
  console.error("[error]", err.message, context);
  if (!env.sentryDsn) return;
  try {
    const dsn = new URL(env.sentryDsn);
    const projectId = dsn.pathname.replace(/^\//, "");
    const endpoint = `${dsn.protocol}//${dsn.host}/api/${projectId}/store/`;
    await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-sentry-auth": `Sentry sentry_version=7, sentry_client=buildproof/1.0, sentry_key=${dsn.username}`,
      },
      body: JSON.stringify({
        message: err.message,
        level: "error",
        platform: "node",
        environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
        exception: { values: [{ type: err.name, value: err.message, stacktrace: { frames: (err.stack ?? "").split("\n").slice(1, 30).map((l) => ({ filename: l.trim() })) } }] },
        extra: context,
      }),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // never let error reporting throw
  }
}
