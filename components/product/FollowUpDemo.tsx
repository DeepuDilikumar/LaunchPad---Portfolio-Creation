"use client";

import { useState } from "react";
import { track } from "@/lib/track";

export interface DemoProps {
  label: string;
  question: string;
  options: { text: string; grade: "weak" | "okay" | "strong"; verdict: string }[];
  followUp: { question: string; what_it_tests: string; strong_points: string[] };
  rejectionSignal: string;
  ctaHref: string;
  ctaLabel: string;
}

const gradeColor = { weak: "#E8B93C", okay: "#9DB3FF", strong: "#8FD19E" };

/** Terminal-style demo: pick how you'd start, then see the follow-up and what it tests. A PDF can't do this. */
export function FollowUpDemo({
  label,
  question,
  options,
  followUp,
  rejectionSignal,
  ctaHref,
  ctaLabel,
}: DemoProps) {
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const chosen = picked === null ? null : options[picked];

  return (
    <div className="border-ink bg-term flex flex-col gap-4 rounded-2xl border-[1.5px] p-5 font-mono text-sm leading-relaxed text-[#EDE7D6] shadow-[8px_8px_0_var(--ink)] sm:p-6">
      <div className="flex items-center gap-1.5" aria-hidden="true">
        <span className="h-2.5 w-2.5 rounded-full bg-[#E2604A]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#E8B93C]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#5BAA6E]" />
        <span className="ml-2 text-xs text-[#A39A88]">~/interview/backend-round · {label}</span>
      </div>
      <p className="m-0">
        <span className="text-[#9DB3FF]">interviewer &gt;</span> {question}
      </p>

      {chosen === null ? (
        <div className="flex flex-col gap-2.5">
          <span className="text-[13px] text-[#A39A88]">how would you start? pick one</span>
          {options.map((o, i) => (
            <button
              key={o.text}
              type="button"
              onClick={() => {
                setPicked(i);
                track("demo_pick", { grade: o.grade });
              }}
              className="min-h-11 cursor-pointer rounded-[10px] border border-[#3A362D] bg-[#1E1C17] px-3.5 py-3 text-left font-mono text-sm leading-normal text-[#EDE7D6] hover:border-[#9DB3FF]"
            >
              <span className="text-[#E8B93C]">{String.fromCharCode(97 + i)})</span> {o.text}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4" aria-live="polite">
          <p className="m-0">
            <span className="text-[#8FD19E]">you &gt;</span> {chosen.text}
          </p>
          <p className="m-0 text-[13px]" style={{ color: gradeColor[chosen.grade] }}>
            {chosen.verdict}
          </p>
          <p className="m-0">
            <span className="text-[#9DB3FF]">interviewer &gt;</span> {followUp.question}
          </p>
          <div className="flex flex-col gap-1.5 border-t border-dashed border-[#3A362D] pt-3 text-[13px] text-[#A39A88]">
            <span>tests: {followUp.what_it_tests}</span>
            <span>rejection signal: {rejectionSignal}</span>
          </div>
          {revealed ? (
            <div className="flex flex-col gap-1.5 rounded-[10px] border border-[#3A362D] bg-[#1E1C17] p-3.5 text-[13px]">
              <span className="text-[#8FD19E]">strong answers mention</span>
              {followUp.strong_points.map((p) => (
                <span key={p}>· {p}</span>
              ))}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="min-h-11 self-start rounded-[10px] border border-[#5C5648] bg-transparent px-4 font-sans text-[15px] font-semibold text-[#EDE7D6]"
            >
              Say it out loud, then reveal the strong answer
            </button>
          )}
          <div className="flex flex-wrap gap-3 font-sans">
            <button
              type="button"
              onClick={() => {
                setPicked(null);
                setRevealed(false);
              }}
              className="min-h-11 rounded-[10px] border border-[#5C5648] bg-transparent px-4 text-[15px] font-semibold text-[#EDE7D6]"
            >
              Try another answer
            </button>
            <a
              href={ctaHref}
              className="bg-marker text-ink hover:text-ink inline-flex min-h-11 items-center rounded-[10px] px-4 text-[15px] font-bold no-underline"
            >
              {ctaLabel}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
