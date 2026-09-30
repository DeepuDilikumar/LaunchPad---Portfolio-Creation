import { redirect } from "next/navigation"

/** Old link from Phase 1; everything account-related now lives in Settings. */
export default function AccountRedirect() {
  redirect("/settings")
}
