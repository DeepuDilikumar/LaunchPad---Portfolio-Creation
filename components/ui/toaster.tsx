"use client"

import { Toaster as Sonner } from "sonner"

/** Toasts: bottom-centre on phones (above the action bar), 4s, announced politely. */
export function Toaster() {
  return (
    <Sonner
      position="bottom-center"
      duration={4000}
      offset={{ bottom: 96 }}
      mobileOffset={{ bottom: 96 }}
      toastOptions={{
        classNames: {
          toast:
            "!rounded-2xl !border-0 !bg-foreground !text-background !shadow-e3 !font-sans !text-sm",
          actionButton: "!rounded-full !bg-transparent !text-tonal !font-medium",
          description: "!text-background/80",
        },
      }}
    />
  )
}

export { toast } from "sonner"
