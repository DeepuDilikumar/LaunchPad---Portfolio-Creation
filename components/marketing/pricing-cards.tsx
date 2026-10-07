"use client";

import { useState, useSyncExternalStore } from "react";
import { formatPrice, plans, pricingConfig, products, type Currency, type ProductSlug } from "@/config/pricing";
import { LinkButton } from "@/components/ui/button";
import { SegmentedToggle } from "@/components/ui/segmented";
import { IconCheck } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { track } from "@/lib/analytics/client";
import { useSignedIn } from "@/lib/auth/signed-in-flag";

const CURRENCY_COOKIE = "bp_currency";
const COUNTRY_COOKIE = "bp_cc";
const listeners = new Set<() => void>();

function readCookie(name: string) {
  if (typeof document === "undefined") return undefined;
  return document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))?.[1];
}

function getCurrency(): Currency {
  const manual = readCookie(CURRENCY_COOKIE);
  if (manual === "INR" || manual === "USD") return manual;
  const cc = readCookie(COUNTRY_COOKIE);
  return cc && (pricingConfig.inrCountries as readonly string[]).includes(cc) ? "INR" : pricingConfig.defaultCurrency;
}

export function useCurrency(initial?: Currency): [Currency, (c: Currency) => void] {
  const c = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getCurrency,
    () => initial ?? pricingConfig.defaultCurrency,
  );
  const set = (next: Currency) => {
    document.cookie = `${CURRENCY_COOKIE}=${next}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    listeners.forEach((l) => l());
  };
  return [c, set];
}

export function CurrencyToggle({ currency, onChange }: { currency: Currency; onChange: (c: Currency) => void }) {
  return (
    <SegmentedToggle
      label="Currency"
      size="sm"
      value={currency}
      onChange={onChange}
      options={[
        { value: "INR", label: "₹ INR" },
        { value: "USD", label: "$ USD" },
      ]}
    />
  );
}

export function PricingCards({
  initialCurrency,
  returnTo,
  project = "pulse",
}: {
  initialCurrency?: Currency;
  returnTo?: string;
  project?: string;
}) {
  const signedIn = useSignedIn();
  const [currency, setCurrency] = useCurrency(initialCurrency);
  const [proChoice, setProChoice] = useState<ProductSlug>("pro-all");

  const checkoutHref = (product: ProductSlug) => {
    const q = new URLSearchParams({ product, currency });
    if (product === "pro-project") q.set("project", project);
    if (returnTo) q.set("returnTo", returnTo);
    const target = `/checkout?${q.toString()}`;
    return signedIn ? target : `/login?next=${encodeURIComponent(target)}`;
  };

  return (
    <div>
      <div className="mb-6 flex justify-center">
        <CurrencyToggle currency={currency} onChange={setCurrency} />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const slug: ProductSlug | undefined = plan.id === "pro" ? proChoice : plan.products[0];
          const price = slug ? formatPrice(products[slug].price[currency], currency) : currency === "INR" ? "₹0" : "$0";
          const href =
            plan.id === "free"
              ? signedIn
                ? "/dashboard"
                : "/login?next=/learn/foundations/setup-agents"
              : plan.id === "review"
                ? "/contact?topic=review"
                : checkoutHref(slug!);
          return (
            <div
              key={plan.id}
              data-plan={plan.id}
              className={cn(
                "flex flex-col rounded-[24px] border border-line bg-surface-1 p-5 md:p-8",
                plan.id === "pro" && "border-line-strong",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="t-h3 text-text-1">{plan.name}</h3>
                {plan.id === "review" && pricingConfig.review.remainingSeats !== null ? (
                  <span className="t-small text-text-2">{pricingConfig.review.remainingSeats} seats left this month</span>
                ) : null}
              </div>
              {plan.toggleLabels ? (
                <SegmentedToggle
                  className="mt-5 self-start"
                  label="Pro plan size"
                  value={proChoice}
                  onChange={setProChoice}
                  options={plan.products.map((p, i) => ({ value: p, label: plan.toggleLabels![i]! }))}
                />
              ) : (
                <div className="mt-5 h-10" aria-hidden />
              )}
              <p className="mt-6 flex items-baseline gap-2">
                <span className="text-[40px] font-medium leading-[44px] tracking-[-0.02em] text-text-1" data-price>
                  {price}
                </span>
                <span className="t-small text-text-2">{plan.id === "free" ? "forever" : "one-time"}</span>
              </p>
              <LinkButton
                href={href}
                variant={plan.id === "pro" ? "primary" : "secondary"}
                className="mt-6 w-full"
                onClick={() => {
                  if (plan.id !== "free") track("checkout_started", { plan: plan.id, product: slug, currency, from: "pricing" });
                }}
              >
                {plan.cta}
              </LinkButton>
              <p className="mt-8 t-small text-text-1">Includes:</p>
              <ul className="mt-3 space-y-2.5">
                {plan.includes.map((i) => (
                  <li key={i} className="flex gap-2.5 t-small text-text-2">
                    <IconCheck size={14} className="mt-0.5 shrink-0 text-text-1" />
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <p className="mt-6 text-center t-small text-text-2">{pricingConfig.note}</p>
    </div>
  );
}
