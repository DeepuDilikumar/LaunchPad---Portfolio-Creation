import { NextResponse } from "next/server";
import { site } from "@/config/site";
import { DRILL_COOKIE, sessionCookieValue } from "@/lib/drill";
import { verifyToken } from "@/lib/ids";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!site.features.drill) return new NextResponse("Not found", { status: 404 });
  const t = new URL(req.url).searchParams.get("t");
  const payload = t ? verifyToken<{ e: string; p: string }>(t) : null;
  if (payload?.p !== "drill-login")
    return NextResponse.redirect(new URL("/drill?error=link", req.url));
  const res = NextResponse.redirect(new URL("/drill", req.url));
  res.cookies.set(DRILL_COOKIE, sessionCookieValue(payload.e), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 86400,
  });
  return res;
}
