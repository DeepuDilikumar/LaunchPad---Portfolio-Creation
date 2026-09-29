import type { NextRequest } from "next/server"

import { updateSession } from "@/lib/supabase/proxy"

export async function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  // Only routes that read or need auth. The landing page and public portfolios
  // stay fully static and skip this round-trip.
  matcher: ["/account/:path*", "/login", "/auth/:path*"],
}
