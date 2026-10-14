/** "Not sure what these mean?" — points question-first visitors at the roadmap, in a new tab. */
export function BasicsNudge({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`border-blue bg-card flex flex-col gap-2 rounded-[14px] border-[1.5px] p-5 shadow-[5px_5px_0_var(--blue)] ${compact ? "" : "md:rotate-[0.4deg]"}`}
    >
      <span className="text-blue font-mono text-[11px] font-semibold">
        NOT SURE WHAT THESE MEAN?
      </span>
      <span className="font-head text-[20px] leading-tight font-bold">
        Brush up the basics first, then come back to the question.
      </span>
      <span className="text-muted text-sm">
        The free System Design roadmap: every topic in order, with why it comes next. Opens in a new
        tab, so you keep your place.
      </span>
      <a
        href="/roadmap/system-design"
        target="_blank"
        rel="noopener"
        className="keycap mt-1 !min-h-11 self-start !text-[15px]"
      >
        Open the System Design roadmap ↗
      </a>
    </div>
  );
}
