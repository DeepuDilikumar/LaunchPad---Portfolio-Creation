import * as Sentry from "@sentry/nextjs";

/** Server-side error reporting. Off unless SENTRY_DSN is set. */
export async function register() {
  if (process.env.SENTRY_DSN && process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0,
      environment: process.env.VERCEL_ENV ?? "development",
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
