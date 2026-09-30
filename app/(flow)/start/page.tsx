import type { Metadata } from "next"

import { UploadStep } from "@/components/flow/upload-step"

export const metadata: Metadata = {
  title: "Upload your resume",
  robots: { index: false },
}

export default function StartPage() {
  return <UploadStep />
}
