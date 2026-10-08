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
  // CSRF defence in depth: state-changing API calls must come from our own origin.
  // Webhooks and cron are excluded (server-to-server, authenticated by signature / secret).
  const path = request.nextUrl.pathname;
  if (path.startsWith("/api/") && !["GET", "HEAD", "OPTIONS"].includes(request.method) && !path.startsWith("/api/webhooks/") && !path.startsWith("/api/cron/")) {
    const origin = request.headers.get("origin");
    const site = process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL).origin : null;
    if (origin && origin !== request.nextUrl.origin && origin !== site) {
      return NextResponse.json({ error: "Cross-site request blocked." }, { status: 403 });
    }
  }
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

  // Real geo headers win; the local DEV_COUNTRY override only fills an empty cookie.
  const geo = request.headers.get("x-vercel-ip-country") ?? request.headers.get("cf-ipcountry");
  const current = request.cookies.get("bp_cc")?.value;
  const country = geo ?? (current ? "" : (process.env.DEV_COUNTRY ?? ""));
  if (country && current !== country) {
    response.cookies.set("bp_cc", country.toUpperCase().slice(0, 2), { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|media|icon.svg|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|svg|webp|avif)$).*)"],
};
