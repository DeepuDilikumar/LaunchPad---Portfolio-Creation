import type { Metadata } from "next";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { Faq } from "@/components/marketing/faq";
import { LinkButton } from "@/components/ui/button";
import { features } from "@/config/features";
import { RedeemCode } from "./redeem-code";
import { safeReturnTo } from "@/lib/http";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Foundations is free. Pro unlocks a project or all six, with the tutor and verified proof pages. One-time payment.",
  alternates: { canonical: "/pricing" },
};

export default async function PricingPage({ searchParams }: { searchParams: Promise<{ returnTo?: string; project?: string }> }) {
  const sp = await searchParams;
  const returnTo = sp.returnTo ? safeReturnTo(sp.returnTo) : undefined;
  return (
    <div className="container-bp pb-24 pt-32 md:pt-40">
      <div className="flex flex-col items-center gap-5 text-center">
        <h1 className="t-hero text-text-1">Pricing</h1>
        <p className="max-w-[560px] t-body text-text-2">Foundations and the first three Pulse modules are free. Pay once for a project or all six.</p>
        <LinkButton href="/contact" variant="secondary" size="sm">
          Team or college? Talk to us
        </LinkButton>
      </div>
      <h2 className="sr-only">Plans</h2>
      <div className="mt-12">
        <PricingCards returnTo={returnTo} project={sp.project} />
      </div>
      {features.coupons ? (
        <div className="mx-auto mt-12 max-w-[520px]">
          <RedeemCode />
        </div>
      ) : null}
      <div className="mx-auto mt-24 max-w-[860px]">
        <h2 className="text-center t-h2 text-text-1">Questions</h2>
        <div className="mt-10">
          <Faq />
        </div>
      </div>
    </div>
  );
}
