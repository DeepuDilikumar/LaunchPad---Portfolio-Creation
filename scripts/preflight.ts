/**
 * Launch preflight: fails while any decision or business detail is still PENDING, required
 * production env vars are missing, or the site would sell a guide with no reviewed questions.
 *   pnpm preflight
 */
import { products, site } from "../config/site";
import { readStatsFile } from "../lib/content/stats";
import { loadEnv } from "./lib/env";

loadEnv();
const problems: string[] = [];

function walk(obj: unknown, path: string) {
  if (typeof obj === "string" && obj.startsWith("PENDING"))
    problems.push(`config/site.ts ${path}: ${obj}`);
  else if (obj && typeof obj === "object")
    for (const [k, v] of Object.entries(obj)) walk(v, path ? `${path}.${k}` : k);
}
walk(site, "site");

const required = [
  "NEXT_PUBLIC_SITE_URL",
  "APP_SECRET",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "RAZORPAY_WEBHOOK_SECRET",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "OWNER_EMAIL",
  "CRON_SECRET",
  "NEXT_PUBLIC_GA4_ID",
  "NEXT_PUBLIC_META_PIXEL_ID",
  "META_CAPI_TOKEN",
];
for (const k of required) if (!process.env[k]) problems.push(`env ${k} is not set`);
if (process.env.RAZORPAY_KEY_ID?.startsWith("rzp_test_"))
  problems.push("RAZORPAY_KEY_ID is a test key");
if (process.env.NEXT_PUBLIC_CONTENT_PREVIEW === "1")
  problems.push("NEXT_PUBLIC_CONTENT_PREVIEW=1 would show drafts in production");

const stats = readStatsFile();
for (const p of products.filter((x) => x.status === "available")) {
  for (const g of p.guides) {
    const s = stats.guides[g];
    if (!s || s.reviewed.questions === 0)
      problems.push(`${p.name} is available but guide "${g}" has no reviewed questions`);
    else if (!s.reviewed.pages)
      problems.push(`guide "${g}" has no PDF page counts; run pnpm build:pdf`);
  }
}
if (new Date(site.launch.endsAt) <= new Date(site.launch.startsAt))
  problems.push("launch.endsAt must be after launch.startsAt");

if (problems.length) {
  console.error("Not ready to launch:\n" + problems.map((p) => `  ✗ ${p}`).join("\n"));
  process.exit(1);
}
console.log("Preflight passed.");
