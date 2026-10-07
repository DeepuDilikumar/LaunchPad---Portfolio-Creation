import { z } from "zod";
import { randomBytes } from "node:crypto";
import { getSessionUser } from "@/lib/auth/session";
import { error, json, parseBody } from "@/lib/http";
import { getDb, schema } from "@/lib/db";

const body = z.object({
  kind: z.enum(["grant", "percent", "flat"]),
  value: z.number().int().min(0).max(10_000_000).default(0),
  scope: z.string().regex(/^(all|review|project:[a-z]+)$/).optional(),
  maxRedemptions: z.number().int().min(1).max(100_000).optional(),
  expiresAt: z.string().datetime().optional(),
  prefix: z.string().regex(/^[A-Z0-9-]{0,16}$/).default("BP"),
  count: z.number().int().min(1).max(500).default(1),
  note: z.string().max(200).optional(),
});

/** Admin: create one or many coupon codes (bulk codes for teams and colleges). */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user?.isAdmin) return error(404, "Not found");
  const [data, bad] = await parseBody(req, body);
  if (bad) return bad;
  if (data.kind === "grant" && !data.scope) return error(400, "Grant codes need a scope, like all or project:pulse.");
  if (data.kind === "percent" && (data.value < 1 || data.value > 100)) return error(400, "Percent codes need a value from 1 to 100.");
  const db = await getDb();
  const codes = Array.from({ length: data.count }, () => `${data.prefix ? `${data.prefix}-` : ""}${randomBytes(4).toString("hex").toUpperCase()}`);
  await db.insert(schema.coupons).values(
    codes.map((code) => ({
      code,
      kind: data.kind,
      value: data.value,
      scope: data.scope ?? null,
      maxRedemptions: data.maxRedemptions ?? null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      note: data.note ?? null,
    })),
  );
  return json({ codes });
}
