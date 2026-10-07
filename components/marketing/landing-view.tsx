"use client";

import { useEffect } from "react";
import { LinkButton } from "@/components/ui/button";
import { track } from "@/lib/analytics/client";
import { useSignedIn } from "@/lib/auth/signed-in-flag";

export function LandingView() {
  useEffect(() => {
    track("landing_view", { referrer: document.referrer || undefined });
  }, []);
  return null;
}

export function StartFreeButton() {
  const signedIn = useSignedIn();
  return <LinkButton href={signedIn ? "/dashboard" : "/login?next=/learn/foundations/setup-agents"}>Start free</LinkButton>;
}
