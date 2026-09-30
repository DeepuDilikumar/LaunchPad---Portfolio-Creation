import type { Metadata } from "next"

import { TemplateStep } from "@/components/flow/template-step"

export const metadata: Metadata = {
  title: "Pick a look",
  robots: { index: false },
}

export default function TemplatePage() {
  return <TemplateStep />
}
