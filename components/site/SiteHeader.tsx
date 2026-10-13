import Link from "next/link";
import { currentPrice, formatInr, getProduct, site } from "@/config/site";
import { productOnSale } from "@/lib/catalog";

export function Logo() {
  return (
    <Link
      href="/"
      className="text-ink hover:text-ink flex min-h-11 items-center gap-2.5 no-underline"
    >
      <span className="bg-ink text-marker flex h-8 w-8 items-center justify-center rounded-lg font-mono text-[13px] font-semibold">
        {site.logoMark}
      </span>
      <span className="font-head text-xl font-bold tracking-tight">{site.name}</span>
    </Link>
  );
}

export function SiteHeader({ active }: { active?: "guides" | "check" | "learn" | "about" }) {
  const flagship = getProduct("backend")!;
  const onSale = productOnSale("backend");
  const link = (key: typeof active, href: string, label: string) => (
    <Link
      href={href}
      className={`text-ink hover:text-ink no-underline ${active === key ? "underline decoration-2 underline-offset-[6px]" : ""}`}
    >
      {label}
    </Link>
  );
  return (
    <header className="border-ink bg-paper border-b-[1.5px]">
      <div className="mx-auto flex max-w-[1160px] flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Logo />
        <nav
          aria-label="Main"
          className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[15px] font-medium"
        >
          {link("guides", "/guides", "Guides")}
          {link("check", "/check", "Free check")}
          {link("learn", "/learn", "Learn")}
          {link("about", "/about", "About")}
          {onSale ? (
            <Link
              href="/guides/backend#buy"
              className="keycap !min-h-11 !px-4 !py-2.5 !text-[15px] max-sm:hidden"
            >
              Get the guide · {formatInr(currentPrice(flagship))}
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
