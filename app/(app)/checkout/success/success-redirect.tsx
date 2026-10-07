"use client";

import { useEffect } from "react";
import { Caret } from "@/components/ui/caret";
import { LinkButton } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function SuccessRedirect({ to }: { to: string }) {
  const toast = useToast();
  useEffect(() => {
    toast("Payment confirmed", "passed");
    const id = window.setTimeout(() => window.location.assign(to), 1200);
    return () => window.clearTimeout(id);
  }, [to, toast]);
  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center px-5 text-center">
      <Caret size={48} />
      <h1 className="mt-6 t-h2 text-text-1">You&apos;re in</h1>
      <p className="mt-3 t-body text-text-2">Your receipt is on its way to your inbox. Taking you back to where you were.</p>
      <LinkButton href={to} className="mt-6">
        Continue
      </LinkButton>
    </main>
  );
}
