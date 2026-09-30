"use client"

import { useSearchParams } from "next/navigation"
import { useEffect } from "react"

import { toast } from "@/components/ui/toaster"

/** Confirms account deletion after the redirect from Settings. */
export function DeletedNotice() {
  const params = useSearchParams()
  const deleted = params.get("deleted") === "1"
  useEffect(() => {
    if (!deleted) return
    toast("Your account and data have been deleted.")
    window.history.replaceState(null, "", "/")
  }, [deleted])
  return null
}
