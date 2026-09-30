import type { Metadata } from "next"
import { Suspense } from "react"

import { ProfileStep } from "@/components/flow/profile-step"

export const metadata: Metadata = {
  title: "Your details",
  robots: { index: false },
}

export default function ProfilePage() {
  return (
    <Suspense>
      <ProfileStep />
    </Suspense>
  )
}
