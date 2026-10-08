import "server-only";
import { and, count, eq, gte } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { pricingConfig } from "@/config/pricing";
import { isPro } from "@/lib/entitlements";

export function startOfUtcDay(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function tutorQuota(userId: string, admin = false) {
  const db = await getDb();
  const since = startOfUtcDay();
  const [row] = await db
    .select({ n: count() })
    .from(schema.tutorMessages)
    .where(and(eq(schema.tutorMessages.userId, userId), eq(schema.tutorMessages.role, "user"), gte(schema.tutorMessages.createdAt, since)));
  const pro = admin || (await isPro(userId));
  const limit = pro ? pricingConfig.tutor.dailyLimit.pro : pricingConfig.tutor.dailyLimit.free;
  const used = Number(row?.n ?? 0);
  const resetAt = new Date(since.getTime() + 86_400_000);
  return { used, limit, remaining: Math.max(0, limit - used), resetAt, pro };
}

/** Deterministic, streamed stand-in for the model in mock mode. It echoes the context it received. */
export function cannedReply(input: { projectName: string; moduleTitle: string; cellLabel: string | null; tool: string; paste: string }) {
  const firstLine = input.paste.split("\n").find((l) => l.trim())?.trim().slice(0, 160) ?? "";
  return `(Mock tutor: no API key is configured, so this is a canned reply.)

You're in ${input.projectName}, ${input.moduleTitle}${input.cellLabel ? `, at "${input.cellLabel}"` : ""}. The error starts with: "${firstLine}". Before changing code, read the first line of the error and the file and line it points to, then check the step's Pitfall cell.

Give ${input.tool} this:

\`\`\`
Read the error below and the files it mentions. Explain the root cause in two sentences before changing anything. Then make the smallest fix, run the tests, and show me the output. Don't edit tests to make them pass.

${firstLine}
\`\`\``;
}
