"use client";

import { useEffect, useState } from "react";
import { formatPrice, products } from "@/config/pricing";
import { LinkButton, Button } from "@/components/ui/button";
import { Input } from "@/components/ui/inputs";
import { IconLock } from "@/components/ui/icons";
import { useCurrency } from "@/components/marketing/pricing-cards";
import { track } from "@/lib/analytics/client";
import { useSignedIn } from "@/lib/auth/signed-in-flag";

export function UpgradeCard({
  project,
  projectName,
  module,
  moduleTitle,
  releasingSoon = false,
}: {
  project: string;
  projectName: string;
  module: string;
  moduleTitle: string;
  releasingSoon?: boolean;
}) {
  const [currency] = useCurrency();
  const signedIn = useSignedIn();
  const returnTo = `/learn/${project}/${module}`;
  useEffect(() => {
    track("paywall_viewed", { project, module });
  }, [project, module]);
  const checkout = (product: "pro-project" | "pro-all") => {
    const q = new URLSearchParams({ product, currency, returnTo });
    if (product === "pro-project") q.set("project", project);
    const href = `/checkout?${q}`;
    return signedIn ? href : `/login?next=${encodeURIComponent(href)}`;
  };
  return (
    <div className="relative" data-paywall>
      <div aria-hidden className="pointer-events-none -mt-28 h-28 bg-gradient-to-b from-transparent to-bg" />
      <div className="rounded-[24px] border border-line-strong bg-surface-1 p-5 md:p-8">
        <span className="inline-flex size-9 items-center justify-center rounded-full bg-surface-2 text-text-1">
          <IconLock size={16} />
        </span>
        <h2 className="mt-4 t-h3 text-text-1">Unlock {moduleTitle}</h2>
        <p className="mt-2 t-body text-text-2">
          This module is part of {projectName}. Get the project to keep going: every prompt in Claude Code and Codex versions, checkpoints, the tutor, and a proof page when you finish.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <LinkButton href={checkout("pro-project")} onClick={() => track("checkout_started", { product: "pro-project", project, from: "paywall" })}>
            Get {projectName} · {formatPrice(products["pro-project"].price[currency], currency)}
          </LinkButton>
          <LinkButton href={checkout("pro-all")} variant="secondary" onClick={() => track("checkout_started", { product: "pro-all", from: "paywall" })}>
            All six · {formatPrice(products["pro-all"].price[currency], currency)}
          </LinkButton>
        </div>
        {releasingSoon ? (
          <p className="mt-4 t-small text-text-2">This module is still being written and tested. Your purchase includes it and every other module in the project as each one ships.</p>
        ) : null}
        <p className="mt-2 t-small text-text-2">One-time payment. Lifetime access. Have a code? You can enter it at checkout.</p>
      </div>
    </div>
  );
}

export function NotifyMe({ moduleSlug, signedIn }: { moduleSlug: string; signedIn: boolean }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const submit = async () => {
    setState("sending");
    const res = await fetch("/api/notify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ moduleSlug, email: signedIn ? undefined : email }),
    }).catch(() => null);
    setState(res?.ok ? "done" : "error");
  };
  if (state === "done") return <p className="t-small text-text-1" role="status">We&apos;ll email you when it&apos;s out.</p>;
  return (
    <form
      className="flex flex-col gap-2 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      {!signedIn ? (
        <>
          <label htmlFor="notify-email" className="sr-only">
            Email
          </label>
          <Input id="notify-email" type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="sm:max-w-[280px]" />
        </>
      ) : null}
      <Button type="submit" disabled={state === "sending"}>
        Notify me
      </Button>
      {state === "error" ? (
        <p role="alert" className="t-small text-failed">
          That didn&apos;t go through. Check the email and try again.
        </p>
      ) : null}
    </form>
  );
}
