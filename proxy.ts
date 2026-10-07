import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const realAuth = process.env.MOCK_MODE !== "true" && !!supabaseUrl && !!supabaseKey;

/**
 * Runs before matching requests:
 * - Refreshes the Supabase session cookie when real auth is configured.
 * - Copies the hosting provider's geo header into a `bp_cc` cookie so static pages can
 *   pick INR or USD on the client.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (realAuth) {
    const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          for (const { name, value } of list) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of list) response.cookies.set(name, value, options);
        },
      },
    });
    const { data } = await supabase.auth.getUser();
    // Keep the non-sensitive signed-in flag in sync with the real session.
    if (!data.user && request.cookies.get("bp_auth")) response.cookies.delete("bp_auth");
  }

  const country =
    request.headers.get("x-vercel-ip-country") ?? request.headers.get("cf-ipcountry") ?? process.env.DEV_COUNTRY ?? "";
  if (country && request.cookies.get("bp_cc")?.value !== country) {
    response.cookies.set("bp_cc", country.toUpperCase().slice(0, 2), { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 });
  }
  return response;
}

export const config = {
  matcher: ["/((?!api/webhooks|_next/static|_next/image|media|icon.svg|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|svg|webp|avif)$).*)"],
};
