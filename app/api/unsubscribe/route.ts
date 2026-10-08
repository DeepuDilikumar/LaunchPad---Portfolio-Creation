import { eq } from "drizzle-orm";
import { timingSafeEqual } from "node:crypto";
import { getDb, schema } from "@/lib/db";
import { unsubscribeToken } from "@/lib/email";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const u = url.searchParams.get("u") ?? "";
  const t = url.searchParams.get("t") ?? "";
  const expected = /^[0-9a-f-]{36}$/.test(u) ? unsubscribeToken(u) : "";
  const ok = expected.length > 0 && t.length === expected.length && timingSafeEqual(Buffer.from(t), Buffer.from(expected));
  if (ok) {
    const db = await getDb();
    await db.update(schema.profiles).set({ marketingEmails: false }).where(eq(schema.profiles.userId, u));
  }
  const msg = ok ? "You're unsubscribed from progress emails. Receipts will still arrive." : "That unsubscribe link isn't valid. You can turn emails off in Settings.";
  return new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Email preferences</title><body style="background:#000;color:#f5f5f5;font-family:system-ui;display:grid;place-items:center;min-height:100vh;margin:0"><p style="max-width:420px;padding:24px">${msg}</p></body>`, {
    status: ok ? 200 : 400,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
