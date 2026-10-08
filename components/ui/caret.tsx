"use client";

import { useEffect, useRef, useState } from "react";
import { useReduced } from "@/lib/hooks/use-in-view-loop";

/**
 * Caret, the mascot: a soft vertical block like a text cursor, with two square pixel eyes.
 *
 * - `size`: rendered height in px (width is ~0.42 × height).
 * - `track`: eyes follow the pointer on fine-pointer devices; idle glance on touch.
 * - `blink`: eyes blink every 4–7s.
 * - `intro`: starts as a plain blinking text caret (two blinks), then opens its eyes.
 */
export function Caret({
  size = 64,
  track = false,
  blink = true,
  intro = false,
  className,
  title,
}: {
  size?: number;
  track?: boolean;
  blink?: boolean;
  intro?: boolean;
  className?: string;
  title?: string;
}) {
  const reduced = useReduced();
  const ref = useRef<SVGSVGElement>(null);
  const [phase, setPhase] = useState<"caret" | "awake">(intro ? "caret" : "awake");
  const [caretVisible, setCaretVisible] = useState(true);
  const [closed, setClosed] = useState(false);
  const [look, setLook] = useState({ x: 0, y: 0 });

  // Intro: blink like a text caret twice, then open the eyes (skipped for reduced motion).
  useEffect(() => {
    if (phase !== "caret") return;
    if (reduced) {
      const id = window.setTimeout(() => setPhase("awake"), 0);
      return () => clearTimeout(id);
    }
    const steps = [false, true, false, true];
    const timers = steps.map((v, i) => window.setTimeout(() => setCaretVisible(v), 450 * (i + 1)));
    const done = window.setTimeout(() => setPhase("awake"), 450 * (steps.length + 1));
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(done);
    };
  }, [phase, reduced]);

  // Random blinks every 4–7s.
  useEffect(() => {
    if (!blink || reduced || phase !== "awake") return;
    let t: number;
    const schedule = () => {
      t = window.setTimeout(() => {
        setClosed(true);
        window.setTimeout(() => setClosed(false), 140);
        schedule();
      }, 4000 + Math.random() * 3000);
    };
    schedule();
    return () => clearTimeout(t);
  }, [blink, reduced, phase]);

  // Pointer tracking (fine pointers) or idle glances (touch).
  useEffect(() => {
    if (!track || phase !== "awake") return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (fine && !reduced) {
      let raf = 0;
      const onMove = (e: PointerEvent) => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const el = ref.current;
          if (!el) return;
          const r = el.getBoundingClientRect();
          const dx = e.clientX - (r.left + r.width / 2);
          const dy = e.clientY - (r.top + r.height * 0.3);
          const d = Math.hypot(dx, dy) || 1;
          const k = Math.min(1, d / 400);
          setLook({ x: (dx / d) * k, y: (dy / d) * k });
        });
      };
      window.addEventListener("pointermove", onMove, { passive: true });
      return () => {
        window.removeEventListener("pointermove", onMove);
        cancelAnimationFrame(raf);
      };
    }
    if (reduced) return;
    const glances = [
      { x: 0.8, y: 0.1 },
      { x: 0, y: 0 },
      { x: -0.7, y: 0.2 },
      { x: 0, y: 0 },
    ];
    // A few idle glances, then rest: nothing keeps moving for more than ~5 seconds (WCAG 2.2.2).
    let i = 0;
    const id = window.setInterval(() => {
      const g = glances[i++];
      if (g) setLook(g);
      if (i >= glances.length) window.clearInterval(id);
    }, 1250);
    return () => clearInterval(id);
  }, [track, reduced, phase]);

  const w = 40;
  const h = 96;
  const eye = 7;
  const ex = look.x * 4;
  const ey = look.y * 3;
  const awake = phase === "awake";

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${w} ${h}`}
      width={(size * w) / h}
      height={size}
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      style={{ overflow: "visible" }}
    >
      <rect
        x="0"
        y="0"
        width={w}
        height={h}
        rx="11"
        fill="var(--text-1)"
        style={{ opacity: awake || caretVisible ? 1 : 0, transition: "opacity 60ms linear" }}
      />
      <g
        style={{
          transform: `translate(${ex}px, ${ey}px) scaleY(${awake && !closed ? 1 : 0.08})`,
          transformOrigin: `${w / 2}px 26px`,
          transformBox: "view-box",
          transition: "transform 160ms cubic-bezier(0.22, 1, 0.36, 1)",
          opacity: awake ? 1 : 0,
        }}
      >
        <rect x={w / 2 - 4 - eye} y={22} width={eye} height={eye} rx="1" fill="#0A0A0A" />
        <rect x={w / 2 + 4} y={22} width={eye} height={eye} rx="1" fill="#0A0A0A" />
      </g>
    </svg>
  );
}
