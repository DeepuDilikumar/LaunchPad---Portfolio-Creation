"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { site } from "@/config/site";
import { cn } from "@/lib/cn";
import { LinkButton } from "@/components/ui/button";
import { Caret } from "@/components/ui/caret";
import { IconClose, IconMenu } from "@/components/ui/icons";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useSignedIn } from "@/lib/auth/signed-in-flag";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2 text-text-1", className)} aria-label={`${site.name} home`}>
      <Caret size={20} blink={false} />
      <span className="text-[15px] font-medium tracking-[-0.01em]">{site.name}</span>
    </Link>
  );
}

export function Header() {
  const signedIn = useSignedIn();
  const pathname = usePathname();
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const startHref = signedIn ? "/dashboard" : "/login?next=/learn/foundations/setup-agents";

  // Solid header once the hero CTAs leave the viewport (or after a little scroll on other pages).
  useEffect(() => {
    const ctas = document.getElementById("hero-ctas");
    if (ctas && typeof IntersectionObserver !== "undefined") {
      const io = new IntersectionObserver(([e]) => setSolid(!e?.isIntersecting), { rootMargin: "-56px 0px 0px 0px" });
      io.observe(ctas);
      return () => io.disconnect();
    }
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  // Close the menu on navigation.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  // On phones the menu covers the page: make the page behind it inert while it's open.
  useEffect(() => {
    if (!open || !window.matchMedia("(max-width: 767px)").matches) return;
    const els = [document.getElementById("main"), document.querySelector<HTMLElement>("footer")].filter((e): e is HTMLElement => !!e);
    els.forEach((e) => (e.inert = true));
    return () => els.forEach((e) => (e.inert = false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current && !panelRef.current.contains(t) && !btnRef.current?.contains(t)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    const firstLink = panelRef.current?.querySelector("a");
    firstLink?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-300",
        solid || open ? "bg-bg/80 backdrop-blur-md border-b border-line" : "bg-transparent border-b border-transparent",
      )}
    >
      <div className="container-bp flex h-14 items-center justify-between">
        <Logo />
        <div className="flex items-center gap-2">
          <AnimatePresence>
            {solid ? (
              <m.div
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                <LinkButton href={startHref} size="sm" data-cta="header-start">
                  {signedIn ? "Dashboard" : "Start free"}
                </LinkButton>
              </m.div>
            ) : null}
          </AnimatePresence>
          <ThemeToggle className="size-8" />
          <button
            ref={btnRef}
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen((o) => !o)}
            className="inline-flex size-8 items-center justify-center rounded-full bg-surface-2 text-text-1 hover:bg-surface-3 transition-colors"
          >
            {open ? <IconClose size={14} /> : <IconMenu size={14} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <m.div
            id="site-menu"
            ref={panelRef}
            role="navigation"
            aria-label="Site"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              // Mobile: full-screen overlay. Desktop: dropdown panel.
              "fixed inset-x-0 top-14 bottom-0 overflow-y-auto bg-bg px-5 pb-10 pt-6",
              "md:absolute md:inset-auto md:right-8 md:top-[60px] md:bottom-auto md:w-[560px] md:rounded-[20px] md:border md:border-line md:bg-surface-1 md:p-6",
            )}
          >
            <div className="grid gap-8 md:grid-cols-3 md:gap-6">
              {site.nav.map((g) => (
                <div key={g.group}>
                  <p className="t-small text-text-3">{g.group}</p>
                  <ul className="mt-3 space-y-1">
                    {g.links.map((l) => (
                      <li key={l.href + l.label}>
                        <Link
                          href={l.href}
                          className="-mx-2 block rounded-[10px] px-2 py-1.5 text-[17px] text-text-1 hover:bg-surface-2 md:text-[15px]"
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-8 flex gap-2 md:hidden">
              <LinkButton href={startHref} className="flex-1">
                {signedIn ? "Dashboard" : "Start free"}
              </LinkButton>
              <LinkButton href="/projects" variant="secondary" className="flex-1">
                See the projects
              </LinkButton>
            </div>
          </m.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
