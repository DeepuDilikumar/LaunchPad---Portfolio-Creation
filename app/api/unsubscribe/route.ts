import { NextResponse } from "next/server";
import { getStore } from "@/lib/db";
import { verifyToken } from "@/lib/ids";

export const dynamic = "force-dynamic";

/**
 * POST only, so link scanners that prefetch email links can't unsubscribe anyone.
 * Handles RFC 8058 one-click requests from mail clients and the form on /unsubscribe.
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  let token = url.searchParams.get("t");
  const isForm = req.headers.get("content-type")?.includes("application/x-www-form-urlencoded");
  if (!token && isForm) token = String((await req.formData()).get("t") ?? "");
  const payload = token ? verifyToken<{ l: string }>(token) : null;
  if (payload?.l) await getStore().unsubscribeLead(payload.l);
  if (isForm && !url.searchParams.get("t")) {
    return NextResponse.redirect(
      new URL(`/unsubscribe?${payload?.l ? "done=1" : "error=1"}`, req.url),
      303,
    );
  }
  return new NextResponse(null, { status: payload?.l ? 200 : 400 });
}
