"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { track } from "@/lib/track";

interface CheckoutResponse {
  orderId: string;
  razorpayOrderId: string;
  amountPaise: number;
  keyId: string | null;
  productName: string;
  simulated: boolean;
  error?: string;
}

interface RazorpayHandlerResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => {
      open(): void;
      on(event: string, cb: (r: unknown) => void): void;
    };
  }
}

function loadRazorpay(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () =>
      reject(new Error("Couldn't load the payment window. Check your connection and try again."));
    document.body.appendChild(s);
  });
}

export function BuyButton({
  product,
  label,
  className = "keycap w-full",
  brand,
}: {
  product: string;
  label: string;
  className?: string;
  brand: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devOrder, setDevOrder] = useState<CheckoutResponse | null>(null);
  const [devEmail, setDevEmail] = useState("");

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product }),
      });
      const data = (await res.json()) as CheckoutResponse;
      if (!res.ok) throw new Error(data.error ?? "Couldn't start checkout.");
      track("begin_checkout", {
        value: data.amountPaise / 100,
        currency: "INR",
        items: [{ item_id: product }],
      });

      if (data.simulated) {
        setDevOrder(data);
        return;
      }
      await loadRazorpay();
      const rzp = new window.Razorpay!({
        key: data.keyId,
        order_id: data.razorpayOrderId,
        amount: data.amountPaise,
        currency: "INR",
        name: brand,
        description: data.productName,
        theme: { color: "#2340B0" },
        notes: { order_id: data.orderId },
        handler: async (r: RazorpayHandlerResponse) => {
          // The webhook delivers either way; this just gets the buyer to the right page fast.
          try {
            await fetch("/api/checkout/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(r),
            });
          } finally {
            router.push(`/thank-you?order=${encodeURIComponent(data.orderId)}`);
          }
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.on("payment.failed", () =>
        setError("The payment didn't go through. No money was taken; please try again."),
      );
      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  async function simulatePay() {
    if (!devOrder) return;
    setBusy(true);
    const res = await fetch("/api/dev/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: devOrder.orderId, email: devEmail || "buyer@example.com" }),
    });
    if (!res.ok) setError("Simulated payment failed. See the server log.");
    router.push(`/thank-you?order=${encodeURIComponent(devOrder.orderId)}`);
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <button type="button" className={className} onClick={start} disabled={busy} aria-busy={busy}>
        {busy && !devOrder ? "Opening checkout…" : label}
      </button>
      {error ? (
        <p role="alert" className="text-red-dark m-0 text-sm">
          {error}
        </p>
      ) : null}
      {devOrder ? (
        <div
          role="dialog"
          aria-label="Simulated payment"
          className="border-red bg-red-wash text-ink flex flex-col gap-2 rounded-xl border-[1.5px] border-dashed p-4"
        >
          <span className="text-red-dark font-mono text-xs font-semibold">
            DEV MODE · NO RAZORPAY KEYS SET
          </span>
          <span className="text-sm">
            Order {devOrder.orderId} for ₹{devOrder.amountPaise / 100}. This simulates the Razorpay
            webhook.
          </span>
          <label className="text-sm font-semibold" htmlFor="dev-email">
            Buyer email
          </label>
          <input
            id="dev-email"
            type="email"
            value={devEmail}
            onChange={(e) => setDevEmail(e.target.value)}
            placeholder="buyer@example.com"
            className="border-ink bg-card min-h-11 rounded-lg border-[1.5px] px-3"
          />
          <button
            type="button"
            className="keycap !min-h-11 !text-base"
            onClick={simulatePay}
            disabled={busy}
          >
            Simulate successful payment
          </button>
        </div>
      ) : null}
    </div>
  );
}
