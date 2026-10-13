"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

export interface PreviewImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

/** Real pages exported from the build. Tap to open full screen; swipe or use arrow keys. */
export function SamplePages({ images }: { images: PreviewImage[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const touchX = useRef<number | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const step = useCallback(
    (d: number) => setOpen((i) => (i === null ? i : (i + d + images.length) % images.length)),
    [images.length],
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close, step]);

  return (
    <>
      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
        {images.map((img, i) => (
          <button
            key={img.src}
            type="button"
            onClick={() => setOpen(i)}
            className="paper-sheet w-[220px] shrink-0 cursor-zoom-in snap-start overflow-hidden p-0"
            aria-label={`Open page: ${img.alt}`}
          >
            <Image
              src={img.src}
              alt={img.alt}
              width={img.width}
              height={img.height}
              sizes="220px"
              className="block h-auto w-full"
            />
          </button>
        ))}
      </div>
      {open !== null ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={images[open].alt}
          className="bg-ink/95 fixed inset-0 z-50 flex flex-col"
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
            touchX.current = null;
          }}
        >
          <div className="flex items-center justify-between px-4 py-3 font-mono text-xs text-[#E9E3D3]">
            <span>
              {open + 1} / {images.length} · {images[open].alt}
            </span>
            <button
              type="button"
              onClick={close}
              className="text-card min-h-11 min-w-11 rounded-lg border border-[#5C5648] px-3"
              autoFocus
            >
              Close
            </button>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center gap-2 px-2 pb-4">
            <button
              type="button"
              onClick={() => step(-1)}
              className="text-card min-h-11 min-w-11 rounded-lg text-2xl max-sm:hidden"
              aria-label="Previous page"
            >
              ‹
            </button>
            <Image
              src={images[open].src}
              alt={images[open].alt}
              width={images[open].width}
              height={images[open].height}
              sizes="(max-width: 640px) 100vw, 700px"
              className="h-auto max-h-full w-auto max-w-full rounded object-contain"
            />
            <button
              type="button"
              onClick={() => step(1)}
              className="text-card min-h-11 min-w-11 rounded-lg text-2xl max-sm:hidden"
              aria-label="Next page"
            >
              ›
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
