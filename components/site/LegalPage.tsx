import type { ReactNode } from "react";
import { site } from "@/config/site";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export const LEGAL_UPDATED = "2026-10-13";

/** Trust and legal pages: each shows the business name, address and support response time. */
export function LegalPage({
  title,
  kicker,
  children,
}: {
  title: string;
  kicker: string;
  children: ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto flex max-w-[760px] flex-col gap-6 px-4 py-16 sm:px-6">
        <span className="label">// {kicker}</span>
        <h1 className="h-display m-0 text-[clamp(34px,5vw,50px)]">{title}</h1>
        <div className="prose-legal">{children}</div>
        <BusinessDetails />
        <p className="text-muted m-0 font-mono text-xs">Last updated {LEGAL_UPDATED}</p>
      </main>
      <SiteFooter />
    </>
  );
}

export function BusinessDetails() {
  return (
    <div className="card-ink flex flex-col gap-1.5 p-5 text-[15px] shadow-[4px_4px_0_var(--ink)]">
      <span className="text-muted font-mono text-[11px] font-semibold">WHO YOU’RE BUYING FROM</span>
      <span className="font-semibold">{site.business.legalName}</span>
      <span>{site.business.address}</span>
      {site.business.gstin ? <span>GSTIN {site.business.gstin}</span> : null}
      <span>
        Support: <a href={`mailto:${site.support.email}`}>{site.support.email}</a> ·{" "}
        {site.support.responseTime}
      </span>
      <span>Grievance officer: {site.business.grievanceOfficer}</span>
    </div>
  );
}
