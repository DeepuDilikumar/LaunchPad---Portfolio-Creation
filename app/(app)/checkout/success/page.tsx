import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { safeReturnTo } from "@/lib/http";
import { SuccessRedirect } from "./success-redirect";

export const metadata: Metadata = { title: "You're in", robots: { index: false } };

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  await requireUser("/dashboard");
  const { returnTo } = await searchParams;
  const dest = safeReturnTo(returnTo, "/dashboard");
  return <SuccessRedirect to={dest} />;
}
