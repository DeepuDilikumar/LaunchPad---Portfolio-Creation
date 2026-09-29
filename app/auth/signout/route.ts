import { NextResponse, type NextRequest } from "next/server"

import { createClient } from "@/lib/supabase/server"

/** POST only, so a link or prefetch can never sign someone out. */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  await supabase?.auth.signOut()
  // 303 turns the POST into a GET on the home page.
  return NextResponse.redirect(new URL("/", request.nextUrl.origin), { status: 303 })
}
