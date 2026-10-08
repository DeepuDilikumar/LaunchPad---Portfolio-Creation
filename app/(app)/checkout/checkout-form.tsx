"use client";

import { useState } from "react";
import { formatPrice, pricingConfig, products, type Currency, type ProductSlug } from "@/config/pricing";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/inputs";
import { SegmentedToggle } from "@/components/ui/segmented";
import { CurrencyToggle, useCurrency } from "@/components/marketing/pricing-cards";

type Order = { provider: string; orderId: string; amount: number; currency: Currency; publicKey: string; name: string; description: string; prefill: { email: string; name: string } };

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void; on: (e: string, cb: (r: unknown) => void) => void };
  }
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export function CheckoutForm({
  initialProduct,
  initialProject,
  initialCurrency,
  returnTo,
  mockPayments,
  projects,
}: {
  initialProduct: ProductSlug;
  initialProject: string;
  initialCurrency?: Currency;
  returnTo: string;
  mockPayments: boolean;
  projects: { slug: string; name: string; title: string }[];
}) {
  const [product, setProduct] = useState<ProductSlug>(initialProduct);
  const [project, setProject] = useState(initialProject);
  const [currency, setCurrency] = useCurrency(initialCurrency);
  const [code, setCode] = useState("");
  const [discounted, setDiscounted] = useState<{ code: string; amount: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [mockOrder, setMockOrder] = useState<Order | null>(null);

  const base = products[product].price[currency];
  const total = discounted ? discounted.amount : base;

  const verify = async (provider: string, payload: { orderId: string; paymentId: string; signature: string }) => {
    const res = await fetch("/api/checkout/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ provider, ...payload }) });
    const data = (await res.json().catch(() => ({}))) as { redirect?: string; error?: string };
    if (!res.ok || !data.redirect) {
      setErr(data.error ?? "We couldn't confirm the payment.");
      setBusy(false);
      return;
    }
    window.location.assign(data.redirect);
  };

  const applyCode = async () => {
    setErr(null);
    const res = await fetch(`/api/coupons/check?${new URLSearchParams({ code, product, currency })}`);
    const data = (await res.json().catch(() => ({}))) as { kind?: string; amount?: number; error?: string };
    if (!res.ok) return setErr(data.error ?? "That code didn't work.");
    if (data.kind === "grant") return setErr("That code unlocks access directly. Redeem it on the pricing page.");
    setDiscounted({ code, amount: data.amount ?? base });
  };

  const pay = async () => {
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ product, project: product === "pro-project" ? project : undefined, currency, coupon: discounted?.code, returnTo: returnTo || undefined }),
    });
    const data = (await res.json().catch(() => ({}))) as Order & { free?: boolean; redirect?: string; error?: string };
    if (!res.ok) {
      setErr(data.error ?? "Checkout didn't start. Try again.");
      setBusy(false);
      return;
    }
    if (data.free && data.redirect) return window.location.assign(data.redirect);
    if (data.provider === "mock") {
      setMockOrder(data);
      return;
    }
    if (!(await loadRazorpay()) || !window.Razorpay) {
      setErr("The payment window couldn't load. Check your connection or disable blockers for this page.");
      setBusy(false);
      return;
    }
    const rzp = new window.Razorpay({
      key: data.publicKey,
      order_id: data.orderId,
      amount: data.amount,
      currency: data.currency,
      name: data.name,
      description: data.description,
      prefill: data.prefill,
      theme: { color: "#000000" },
      handler: (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
        verify("razorpay", { orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature }),
      modal: { ondismiss: () => setBusy(false) },
    });
    rzp.on("payment.failed", () => {
      setErr("The payment didn't go through. You haven't been charged.");
      setBusy(false);
    });
    rzp.open();
  };

  const mockPay = async () => {
    if (!mockOrder) return;
    const res = await fetch("/api/checkout/mock-pay", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ orderId: mockOrder.orderId }) });
    const data = (await res.json()) as { orderId: string; paymentId: string; signature: string };
    await verify("mock", data);
  };

  return (
    <div className="mt-8 space-y-6 rounded-[24px] border border-line bg-surface-1 p-5 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedToggle
          label="Plan"
          value={product}
          onChange={(v) => {
            setProduct(v);
            setDiscounted(null);
          }}
          options={[
            { value: "pro-project", label: "One project" },
            { value: "pro-all", label: "All six" },
          ]}
        />
        <CurrencyToggle
          currency={currency}
          onChange={(c) => {
            setCurrency(c);
            setDiscounted(null);
          }}
        />
      </div>
      {product === "pro-project" ? (
        <Field label="Project" htmlFor="co-project">
          <Select id="co-project" value={project} onChange={(e) => setProject(e.target.value)}>
            {projects.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name} · {p.title}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Field label="Discount code" htmlFor="co-code">
            <Input id="co-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Optional" autoCapitalize="characters" />
          </Field>
        </div>
        <Button variant="secondary" onClick={() => void applyCode()} disabled={!code.trim()}>
          Apply
        </Button>
      </div>
      <div className="flex items-baseline justify-between border-t border-line pt-5">
        <span className="t-body text-text-2">{products[product].name}</span>
        <span className="text-right">
          {discounted ? (
            <del className="mr-2 t-small text-text-3">
              <span className="sr-only">was </span>
              {formatPrice(base, currency)}
            </del>
          ) : null}
          <span className="text-[28px] font-medium tracking-[-0.02em] text-text-1" data-total>
            {formatPrice(total, currency)}
          </span>
        </span>
      </div>
      <p role="status" className="sr-only">
        {discounted ? `Code applied. New total ${formatPrice(total, currency)}.` : ""}
      </p>
      <Button className="w-full" onClick={() => void pay()} disabled={busy} data-action="pay">
        {total === 0 ? "Unlock now" : `Pay ${formatPrice(total, currency)}`}
      </Button>
      {err ? (
        <p role="alert" className="t-small text-failed">
          {err}
        </p>
      ) : null}
      <p className="t-small text-text-2">{pricingConfig.note} One-time payment, lifetime access.</p>

      <Dialog open={!!mockOrder} onClose={() => { setMockOrder(null); setBusy(false); }} title="Mock payment" description="Payments are in local mock mode. No money moves; this simulates a successful card payment.">
        <div className="space-y-4">
          <p className="t-body text-text-1">
            {mockOrder ? formatPrice(mockOrder.amount, mockOrder.currency) : null} · {mockOrder?.description}
          </p>
          <Button className="w-full" onClick={() => void mockPay()} data-action="mock-pay">
            Pay (mock)
          </Button>
        </div>
      </Dialog>
      {mockPayments ? <p className="t-small text-text-3">Local mock mode: no real payment is taken.</p> : null}
    </div>
  );
}
