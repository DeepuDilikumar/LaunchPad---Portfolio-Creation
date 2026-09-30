import type { Metadata } from "next"
import { Suspense } from "react"

import { PublishStep } from "@/components/flow/publish-step"
import { getCurrentUser } from "@/lib/auth/session"
import { siteUrl } from "@/lib/env"

export const metadata: Metadata = {
  title: "Publish your portfolio",
  robots: { index: false },
}

export default async function PublishPage() {
  const user = await getCurrentUser()
  const host = siteUrl().replace(/^https?:\/\//, "")
  return (
    <Suspense>
      <PublishStep signedIn={Boolean(user)} siteHost={host} />
    </Suspense>
  )
}
