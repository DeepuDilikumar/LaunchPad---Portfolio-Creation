"use client"

import { Dialog } from "@base-ui/react/dialog"
import { X } from "lucide-react"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

/**
 * One component, two shapes: a bottom sheet on phones, a centred dialog from 768px.
 * Esc, the close button and the backdrop all dismiss it; focus is trapped while open.
 */
export function ResponsiveSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  wide = false,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-(--z-sheet) bg-overlay transition-opacity duration-(--dur-base) data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup
          className={cn(
            "fixed z-(--z-sheet) flex max-h-[90dvh] flex-col bg-popover text-popover-foreground shadow-e3 outline-none transition duration-(--dur-slow) ease-out-expo data-ending-style:duration-(--dur-base)",
            "inset-x-0 bottom-0 rounded-t-[28px] data-ending-style:translate-y-8 data-ending-style:opacity-0 data-starting-style:translate-y-8 data-starting-style:opacity-0",
            "md:inset-x-auto md:top-1/2 md:bottom-auto md:left-1/2 md:w-[calc(100%-2rem)] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[28px] md:data-ending-style:translate-y-[-48%] md:data-starting-style:translate-y-[-48%]",
            wide ? "md:max-w-3xl" : "md:max-w-lg"
          )}
        >
          <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-border md:hidden" aria-hidden />
          <div className="flex items-start justify-between gap-4 px-5 pt-4 md:px-6 md:pt-6">
            <div className="min-w-0">
              <Dialog.Title className="text-h3 font-medium">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-1 text-sm text-muted-foreground">{description}</Dialog.Description>
              ) : null}
            </div>
            <Dialog.Close
              className="-mt-1 -mr-2 flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Close"
            >
              <X className="size-5" aria-hidden />
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 md:px-6">{children}</div>
          {footer ? <div className="border-t border-border px-5 pt-3 pb-safe md:px-6 md:pb-5">{footer}</div> : null}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
