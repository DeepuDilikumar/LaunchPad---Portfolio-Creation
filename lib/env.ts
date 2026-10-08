/**
 * Decides which providers are real and which are mocked. A provider is mocked when its
 * keys are missing or MOCK_MODE=true. Mock auth and mock payments are refused in production.
 */
const e = process.env;

const forceMock = e.MOCK_MODE === "true";
/**
 * Fail closed: a production build is treated as production unless ALLOW_MOCK=1 is set
 * explicitly (local `pnpm start`, e2e tests). ALLOW_MOCK is ignored on Vercel production.
 */
export const allowMock = e.ALLOW_MOCK === "1" && e.VERCEL_ENV !== "production" && e.APP_ENV !== "production";
export const isProduction = e.NODE_ENV === "production" && !allowMock;

export const env = {
  siteUrl: e.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  authSecret: e.AUTH_SECRET || "dev-only-secret-change-me-in-production-0123456789",
  supabaseUrl: e.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: e.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseServiceKey: e.SUPABASE_SERVICE_ROLE_KEY ?? "",
  razorpayKeyId: e.RAZORPAY_KEY_ID ?? "",
  razorpayKeySecret: e.RAZORPAY_KEY_SECRET ?? "",
  razorpayWebhookSecret: e.RAZORPAY_WEBHOOK_SECRET ?? "",
  anthropicKey: e.ANTHROPIC_API_KEY ?? "",
  anthropicModel: e.ANTHROPIC_MODEL || "claude-opus-5-5",
  resendKey: e.RESEND_API_KEY ?? "",
  emailFrom: e.EMAIL_FROM || "Buildproof <hello@buildproof.dev>",
  upstashUrl: e.UPSTASH_REDIS_REST_URL ?? "",
  upstashToken: e.UPSTASH_REDIS_REST_TOKEN ?? "",
  githubToken: e.GITHUB_TOKEN ?? "",
  cronSecret: e.CRON_SECRET ?? "",
  sentryDsn: e.SENTRY_DSN ?? "",
};

export const mock = {
  auth: forceMock || !(env.supabaseUrl && env.supabaseAnonKey),
  db: !e.DATABASE_URL,
  payments: forceMock || !(env.razorpayKeyId && env.razorpayKeySecret),
  email: forceMock || !env.resendKey,
  ai: forceMock || !env.anthropicKey,
  rateLimit: !(env.upstashUrl && env.upstashToken),
};

export const anyMock = Object.values(mock).some(Boolean);

/** Mock-only endpoints (mock sign-in, mock pay, mock webhooks, mock deploy) answer only when this is true. */
export function mockEndpointsEnabled(kind: "auth" | "payments") {
  if (isProduction) return false;
  return kind === "auth" ? mock.auth : mock.payments;
}

export function assertProductionSafe() {
  // `next build` runs with NODE_ENV=production; the check applies when the server runs.
  if (!isProduction || e.NEXT_PHASE === "phase-production-build") return;
  const problems: string[] = [];
  if (mock.auth) problems.push("auth is mocked (set Supabase keys)");
  if (mock.payments) problems.push("payments are mocked (set Razorpay keys)");
  if (mock.db) problems.push("database is embedded PGlite (set DATABASE_URL)");
  if (mock.rateLimit) problems.push("rate limits are in-memory (set Upstash keys)");
  if (env.authSecret.startsWith("dev-only") || env.authSecret.length < 32) problems.push("AUTH_SECRET is missing, short or the dev default");
  if (!env.cronSecret) problems.push("CRON_SECRET is not set");
  if (problems.length) throw new Error(`Refusing to run in production: ${problems.join("; ")}`);
}
