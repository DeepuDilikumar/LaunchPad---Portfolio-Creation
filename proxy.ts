import type { NextRequest } from "next/server"

import { updateSession } from "@/lib/supabase/proxy"

export async function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  // Only routes that read or need auth. The landing page and public portfolios
  // stay static and skip this round-trip.
  matcher: [
    "/home/:path*",
    "/portfolio/:path*",
    "/report/:path*",
    "/program/:path*",
    "/settings/:path*",
    "/account/:path*",
    "/login",
    "/auth/:path*",
  ],
}
