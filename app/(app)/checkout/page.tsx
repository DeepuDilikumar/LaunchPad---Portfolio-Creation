import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { safeReturnTo } from "@/lib/http";
import { projects } from "@/content/catalog";
import { mock } from "@/lib/env";
import { products, type ProductSlug } from "@/config/pricing";
import { AppHeader } from "@/components/app/app-header";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const qs = new URLSearchParams(Object.entries(sp).filter((e): e is [string, string] => typeof e[1] === "string")).toString();
  const user = await requireUser(`/checkout${qs ? `?${qs}` : ""}`);
  const product = (sp.product && sp.product in products ? sp.product : "pro-all") as ProductSlug;
  const currency = sp.currency === "INR" ? "INR" : sp.currency === "USD" ? "USD" : undefined;
  const project = projects.find((p) => p.slug === sp.project)?.slug ?? "pulse";
  return (
    <>
      <AppHeader user={user} />
      <main id="main" className="container-bp max-w-[560px] pb-24 pt-10 md:pt-14">
        <h1 className="t-h2 text-text-1">Checkout</h1>
        <CheckoutForm
          initialProduct={product}
          initialProject={project}
          initialCurrency={currency}
          returnTo={safeReturnTo(sp.returnTo, "")}
          mockPayments={mock.payments}
          projects={projects.map((p) => ({ slug: p.slug, name: p.name, title: p.title }))}
        />
      </main>
    </>
  );
}
