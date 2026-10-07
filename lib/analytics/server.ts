import "server-only";
import { getDb, schema } from "@/lib/db";
import type { AnalyticsEvent } from "./events";

/** Server-side, cookie-less funnel count. Never throws. */
export async function recordEvent(event: AnalyticsEvent, userId: string | null, props: Record<string, unknown> = {}) {
  try {
    const db = await getDb();
    await db.insert(schema.analyticsEvents).values({ event, userId, props });
  } catch (e) {
    console.error("[analytics] failed to record", event, e);
  }
}
