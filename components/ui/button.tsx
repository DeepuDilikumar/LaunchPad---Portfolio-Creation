import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Google / Material 3 style buttons (design/DESIGN_SYSTEM.md §7):
 * - `default` (filled) is THE primary action — one per screen.
 * - `tonal` for a strong secondary, `outline` for neutral secondary, `ghost` / `link` for tertiary.
 * - Pill shaped; tap targets ≥ 44px (`lg` = 48px for the mobile primary action).
 * Use `buttonVariants()` on <Link> for navigational buttons.
 */
const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-transparent font-medium whitespace-nowrap select-none transition-[background-color,color,border-color,box-shadow,transform] duration-(--dur-fast) ease-out-expo active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[1.125rem]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover hover:shadow-e1",
        tonal: "bg-tonal text-tonal-foreground hover:shadow-e1",
        secondary: "border-border bg-card text-accent-text hover:bg-tonal/60",
        outline: "border-border bg-transparent text-foreground hover:bg-muted",
        ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
        destructive: "border-border bg-transparent text-danger hover:bg-danger-bg",
        "destructive-solid": "bg-danger text-white hover:shadow-e1 dark:text-background",
        link: "h-auto rounded-sm px-0 text-accent-text underline-offset-4 hover:underline active:scale-100",
      },
      size: {
        default: "h-11 px-5 text-sm",
        sm: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    /** Keeps the label, adds a spinner, disables the button and sets aria-busy. */
    loading?: boolean
  }

function Button({
  className,
  variant = "default",
  size = "default",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Loader2 className="animate-spin" aria-hidden /> : null}
      {children}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
