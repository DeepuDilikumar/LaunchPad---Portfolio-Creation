import { z } from "zod";
import { eq, or } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth/session";
import { error, json, parseBody } from "@/lib/http";
import { getDb, schema } from "@/lib/db";
import { grantEntitlement, revokeEntitlements, type Scope } from "@/lib/entitlements";

const body = z.object({
  action: z.enum(["grant", "revoke"]),
  who: z.string().trim().min(2).max(200),
  scope: z.string().regex(/^(all|review|project:[a-z]+)$/),
});

/** Admin: manual grant or revoke, by handle or email. */
export async function POST(req: Request) {
  const admin = await getSessionUser();
  if (!admin?.isAdmin) return error(404, "Not found");
  const [data, bad] = await parseBody(req, body);
  if (bad) return bad;
  const db = await getDb();
  const who = data.who.toLowerCase().replace(/^@/, "");
  const [target] = await db
    .select()
    .from(schema.profiles)
    .where(or(eq(schema.profiles.handle, who), eq(schema.profiles.email, who)))
    .limit(1);
  if (!target) return error(404, "No learner with that handle or email.");
  if (data.action === "grant") {
    await grantEntitlement(db, { userId: target.userId, scope: data.scope as Scope, source: "admin", sourceId: admin.id });
  } else {
    // Revoke every active grant of that scope, whatever its source.
    for (const source of ["admin", "purchase", "coupon"]) {
      const rows = await db.select().from(schema.entitlements).where(eq(schema.entitlements.userId, target.userId));
      for (const r of rows.filter((x) => x.scope === data.scope && x.source === source && !x.revokedAt)) {
        await revokeEntitlements(db, { userId: target.userId, source, sourceId: r.sourceId, scope: data.scope });
      }
    }
  }
  return json({ ok: true, handle: target.handle });
}
