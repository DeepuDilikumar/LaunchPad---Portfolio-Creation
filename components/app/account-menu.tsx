"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function AccountMenu({ handle, name, isAdmin }: { handle: string; name: string; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex size-8 items-center justify-center rounded-full bg-surface-3 t-badge text-text-1"
        aria-label="Account menu"
      >
        {name.slice(0, 1).toUpperCase()}
      </button>
      {open ? (
        <div role="menu" className="absolute right-0 top-10 w-56 rounded-[16px] border border-line bg-surface-1 p-1.5 shadow-2xl">
          <p className="px-3 py-2 t-small text-text-2 truncate">@{handle}</p>
          {[
            { href: `/u/${handle}`, label: "Public profile" },
            { href: "/settings", label: "Settings" },
            ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
          ].map((l) => (
            <Link key={l.href} role="menuitem" href={l.href} onClick={() => setOpen(false)} className="block rounded-[10px] px-3 py-2 t-small text-text-1 hover:bg-surface-2">
              {l.label}
            </Link>
          ))}
          <form action="/api/auth/signout" method="post">
            <button role="menuitem" type="submit" className="block w-full rounded-[10px] px-3 py-2 text-left t-small text-text-1 hover:bg-surface-2">
              Sign out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
