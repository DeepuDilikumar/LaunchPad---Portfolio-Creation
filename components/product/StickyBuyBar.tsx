"use client";

import { useEffect, useState } from "react";

/** Mobile only. Appears once the hero (an element with id `hero`) scrolls out of view. */
export function StickyBuyBar({
  price,
  note,
  href = "#buy",
  label = "Get the guide",
}: {
  price: string;
  note?: string;
  href?: string;
  label?: string;
}) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const hero = document.getElementById("hero");
    if (!hero) return;
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting), { threshold: 0 });
    io.observe(hero);
    return () => io.disconnect();
  }, []);
  return (
    <div
      aria-hidden={!show}
      className={`border-ink bg-card fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t-[1.5px] px-4 py-2.5 transition-transform md:hidden ${show ? "translate-y-0" : "translate-y-full"}`}
    >
      <div className="flex flex-col">
        <span className="font-head text-[22px] font-extrabold tracking-tight">{price}</span>
        {note ? <span className="text-muted font-mono text-[11px]">{note}</span> : null}
      </div>
      <a href={href} tabIndex={show ? 0 : -1} className="keycap !min-h-12 !px-5 !py-3 !text-base">
        {label}
      </a>
    </div>
  );
}
