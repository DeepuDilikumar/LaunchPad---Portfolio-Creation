import { z } from "zod";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth/session";
import { error, json, parseBody } from "@/lib/http";
import { getDb, schema } from "@/lib/db";
import { getProvider, revokePurchaseByPayment } from "@/lib/payments";

/** Admin: refund a purchase through the provider and revoke its access. */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user?.isAdmin) return error(404, "Not found");
  const [data, bad] = await parseBody(req, z.object({ purchaseId: z.string().uuid() }));
  if (bad) return bad;
  const db = await getDb();
  const [p] = await db.select().from(schema.purchases).where(eq(schema.purchases.id, data.purchaseId)).limit(1);
  if (!p) return error(404, "No such purchase.");
  if (p.status !== "paid" || !p.providerPaymentId) return error(400, `Only paid purchases can be refunded (this one is ${p.status}).`);
  if (p.provider !== "free") await getProvider(p.provider).refund(p.providerPaymentId);
  // Revoke now; the provider's refund webhook will arrive later and is idempotent.
  await revokePurchaseByPayment(p.providerPaymentId);
  return json({ ok: true });
}
