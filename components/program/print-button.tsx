"use client"

import { Printer } from "lucide-react"

import { Button } from "@/components/ui/button"

export function PrintButton({ label = "Save as PDF" }: { label?: string }) {
  return (
    <Button variant="secondary" size="lg" onClick={() => window.print()} className="w-full sm:w-auto">
      <Printer aria-hidden />
      {label}
    </Button>
  )
}
