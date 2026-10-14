import { NextResponse, type NextRequest } from "next/server";
import { REF_COOKIE, UTM_COOKIE, utmFromUrl } from "@/lib/utm";

/** First-touch UTM capture and referral codes, stored for 30 days and attached to orders and leads. */
export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const utm = utmFromUrl(req.nextUrl);
  const maxAge = 60 * 60 * 24 * 30;
  if (utm && !req.cookies.get(UTM_COOKIE)) {
    res.cookies.set(UTM_COOKIE, JSON.stringify(utm), { maxAge, sameSite: "lax", path: "/" });
  }
  const ref = req.nextUrl.searchParams.get("ref");
  if (ref && /^[A-Z0-9-]{4,20}$/i.test(ref)) {
    res.cookies.set(REF_COOKIE, ref.toUpperCase(), { maxAge, sameSite: "lax", path: "/" });
  }
  return res;
}

export const config = {
  matcher: [
    "/((?!api|_next|previews|favicon|icon|apple-icon|opengraph-image|robots.txt|sitemap.xml).*)",
  ],
};
