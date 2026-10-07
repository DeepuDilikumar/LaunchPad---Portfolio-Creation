import Link from "next/link";
import { site } from "@/config/site";
import { Caret } from "@/components/ui/caret";
import { CookieSettingsLink } from "./cookie-card";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line">
      <div className="container-bp py-16 md:py-20">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-6">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2" aria-label={`${site.name} home`}>
              <Caret size={22} />
              <span className="font-medium">{site.name}</span>
            </Link>
          </div>
          {site.footer.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="t-small text-text-1 font-medium">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="t-small text-text-2 hover:text-text-1 transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-16 flex flex-col gap-3 border-t border-line pt-6 md:flex-row md:items-center md:justify-between">
          <p className="t-small text-text-3">
            © {year} {site.name}
          </p>
          <CookieSettingsLink />
        </div>
      </div>
    </footer>
  );
}
