import { NextResponse } from "next/server";
import { mock } from "@/lib/env";
import { signOut } from "@/lib/auth/sign-in";

export async function POST(req: Request) {
  if (!mock.auth) {
    const { createSupabaseServerClient } = await import("@/lib/auth/supabase");
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  await signOut();
  return NextResponse.redirect(new URL("/", req.url), 303);
}
