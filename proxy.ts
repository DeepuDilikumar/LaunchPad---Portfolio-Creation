import { NextResponse, type NextRequest } from "next/server";

/**
 * Runs before matching requests:
 * - Copies the hosting provider's geo header into a `bp_cc` cookie so static pages can
 *   pick INR or USD on the client.
 */
export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const country =
    request.headers.get("x-vercel-ip-country") ?? request.headers.get("cf-ipcountry") ?? process.env.DEV_COUNTRY ?? "";
  if (country && request.cookies.get("bp_cc")?.value !== country) {
    response.cookies.set("bp_cc", country.toUpperCase().slice(0, 2), {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
    });
  }
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|media|icon.svg|favicon.ico|robots.txt|sitemap.xml).*)"],
};
