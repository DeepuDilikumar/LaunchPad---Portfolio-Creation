import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { safeReturnTo } from "@/lib/http";
import { Onboarding } from "./onboarding";

export const metadata: Metadata = { title: "Welcome", robots: { index: false } };

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const dest = safeReturnTo(next, "/learn/foundations/setup-agents");
  await requireUser(`/onboarding?next=${encodeURIComponent(dest)}`);
  return <Onboarding next={dest} />;
}
