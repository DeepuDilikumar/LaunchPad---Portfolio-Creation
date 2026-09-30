"use client"

import { Check, FlaskConical, RotateCcw, ShieldCheck } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { ResponsiveSheet } from "@/components/ui/responsive-sheet"
import { toast } from "@/components/ui/toaster"
import { PAYMENT_NOTE, REFUND_LINE, bundleSavingsPaise, formatPrice, getPlan, type ProductKey } from "@/config/pricing"
import { track } from "@/lib/analytics/client"
import { cn } from "@/lib/utils"

type Entitlements = { report: boolean; program: boolean }
type RazorpayOrder = {
  mode: "razorpay"
  keyId: string
  orderId: string
  amount: number
  currency: string
  name: string
  description: string
  prefill: { name: string; email: string }
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void; on: (event: string, cb: (r: { error?: { description?: string } }) => void) => void }
  }
}

function loadRazorpay(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true)
  return new Promise((resolve) => {
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

async function waitForUnlock(target: "report" | "program"): Promise<Entitlements | null> {
  for (let i = 0; i < 12; i++) {
    const r = await fetch("/api/entitlements", { cache: "no-store" }).catch(() => null)
    const ent = (await r?.json().catch(() => null)) as Entitlements | null
    if (ent?.[target]) return ent
    await new Promise((res) => setTimeout(res, 1000))
  }
  return null
}

export function CheckoutSheet({
  open,
  onOpenChange,
  options,
  defaultProduct,
  demo,
  onPaid,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  options: ProductKey[]
  defaultProduct: ProductKey
  demo: boolean
  onPaid: (ent: Entitlements) => void
}) {
  const [product, setProduct] = useState<ProductKey>(defaultProduct)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const plan = getPlan(product)
  const target: "report" | "program" = plan.entitlements.includes("report") && product !== "program" ? "report" : "program"

  async function pay() {
    setBusy(true)
    setError(null)
    track("checkout_started", { product })
    try {
      if (demo) {
        const r = await fetch("/api/payments/demo", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ product }),
        })
        const data = await r.json()
        if (!r.ok) throw new Error(data?.error?.message ?? "Test payment failed.")
        track("paid", { product, demo: true })
        onPaid(data.entitlements)
        return
      }

      const r = await fetch("/api/payments/order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ product }),
      })
      const order = (await r.json()) as RazorpayOrder & { error?: { message: string } }
      if (!r.ok) throw new Error(order.error?.message ?? "We couldn't start the payment. You haven't been charged.")
      if (!(await loadRazorpay()) || !window.Razorpay) {
        throw new Error("Couldn't load the payment window. Check your connection and try again. You haven't been charged.")
      }

      await new Promise<void>((resolve) => {
        const checkout = new window.Razorpay!({
          key: order.keyId,
          order_id: order.orderId,
          amount: order.amount,
          currency: order.currency,
          name: order.name,
          description: order.description,
          prefill: order.prefill,
          theme: { color: "#1a73e8" },
          modal: {
            ondismiss: () => {
              toast("Payment cancelled. You haven't been charged.")
              resolve()
            },
          },
          handler: async (response: Record<string, string>) => {
            // Verify on our server; the webhook will also confirm independently.
            await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(response),
            }).catch(() => null)
            const ent = await waitForUnlock(target)
            if (ent) {
              track("paid", { product, amountRupees: plan.amountPaise / 100 })
              onPaid(ent)
            } else {
              setError("We received your payment and are confirming it. This page will update in a minute; you won't be charged twice.")
            }
            resolve()
          },
        })
        checkout.on("payment.failed", (resp) => {
          setError(`Payment didn't go through${resp.error?.description ? `: ${resp.error.description}` : ""}. You haven't been charged. Try again or use another UPI app.`)
        })
        checkout.open()
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. You haven't been charged.")
    } finally {
      setBusy(false)
    }
  }

  const savings = bundleSavingsPaise()

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title={target === "report" ? "Unlock your full report" : "Join the 14-Day Build Program"}
      description="One-time payment. No subscription."
      footer={
        <div className="flex flex-col gap-2">
          <Button size="lg" className="w-full" loading={busy} onClick={() => void pay()}>
            {demo ? `Complete test payment · ${formatPrice(plan.amountPaise)}` : `Pay ${formatPrice(plan.amountPaise)}`}
          </Button>
          {demo ? (
            <p className="flex items-center justify-center gap-1.5 text-center text-caption text-muted-foreground">
              <FlaskConical className="size-3.5" aria-hidden />
              Demo mode: no real money is charged.
            </p>
          ) : null}
        </div>
      }
    >
      {options.length > 1 ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only">Choose what to buy</legend>
          {options.map((key) => {
            const p = getPlan(key)
            const active = product === key
            return (
              <label
                key={key}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-3 rounded-2xl border p-4 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring",
                  active ? "border-2 border-primary bg-tonal" : "border-border"
                )}
              >
                <input type="radio" name="product" className="sr-only" checked={active} onChange={() => setProduct(key)} />
                <span className="min-w-0">
                  <span className={cn("block font-medium", active && "text-tonal-foreground")}>{p.name}</span>
                  <span className="block text-caption text-muted-foreground">
                    {key === "bundle" && savings > 0 ? `Everything · save ${formatPrice(savings)}` : p.tagline}
                  </span>
                </span>
                <span className="tabular shrink-0 font-mono text-lg">{formatPrice(p.amountPaise)}</span>
              </label>
            )
          })}
        </fieldset>
      ) : null}

      <div className={cn(options.length > 1 && "mt-5")}>
        <p className="text-sm font-medium">What you get</p>
        <ul className="mt-2 flex flex-col gap-2">
          {plan.features.map((f) => (
            <li key={f} className="flex gap-2 text-sm">
              <Check className="mt-0.5 size-4 shrink-0 text-accent-text" aria-hidden />
              {f}
            </li>
          ))}
        </ul>
      </div>

      <ul className="mt-5 flex flex-col gap-1.5 rounded-2xl bg-surface p-4 text-sm text-muted-foreground">
        <li className="flex items-center gap-2">
          <ShieldCheck className="size-4 shrink-0 text-accent-text" aria-hidden />
          {PAYMENT_NOTE}. Secured by Razorpay.
        </li>
        <li className="flex items-center gap-2">
          <RotateCcw className="size-4 shrink-0 text-accent-text" aria-hidden />
          {REFUND_LINE}
        </li>
      </ul>

      {error ? (
        <p role="alert" className="mt-4 rounded-2xl bg-danger-bg p-4 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </ResponsiveSheet>
  )
}
