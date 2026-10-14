import Link from "next/link";
import { site } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="bg-ink text-[#E9E3D3]">
      <div className="mx-auto flex max-w-[1160px] flex-wrap justify-between gap-6 px-4 pt-9 pb-24 text-sm sm:px-6 md:pb-10">
        <div className="flex flex-col gap-1.5">
          <span className="font-head text-card text-lg font-bold">{site.name}</span>
          <span>{site.business.legalName}</span>
          <span>{site.business.address}</span>
          <span>
            {site.support.email} · {site.support.responseTime}
          </span>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap items-start gap-x-5 gap-y-2">
          {[
            ["/faq", "FAQ"],
            ["/contact", "Contact"],
            ["/refund", "Refund policy"],
            ["/terms", "Terms"],
            ["/privacy", "Privacy"],
            ["/changelog", "Changelog"],
          ].map(([href, label]) => (
            <Link key={href} href={href} className="hover:text-card text-[#E9E3D3]">
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
