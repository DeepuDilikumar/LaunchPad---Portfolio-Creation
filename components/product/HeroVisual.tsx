import type { LoadedQuestion } from "@/lib/content/load";

const tagFor: Record<string, string> = { measurement: "measure" };

/** A real guide page (compact) plus a phone showing the phone edition. Built from the content. */
export function HeroVisual({
  q,
  phoneFollowUp,
  guideTitle,
  version,
}: {
  q: LoadedQuestion;
  phoneFollowUp: number;
  guideTitle: string;
  version: string;
}) {
  const f = q.follow_ups[phoneFollowUp] ?? q.follow_ups[0];
  return (
    <div
      className="relative min-w-0 flex-[1_1_440px] md:min-h-[520px]"
      aria-label={`Sample page: ${q.title}`}
    >
      <div className="paper-sheet flex w-full max-w-[440px] -rotate-[1.5deg] flex-col gap-3 px-6 pt-6 pb-4 md:absolute md:top-0 md:left-0 md:w-[min(86%,440px)]">
        <div className="text-faint flex justify-between gap-2 font-mono text-[10px] tracking-[0.06em]">
          <span>
            {guideTitle.split(" ")[0].toUpperCase()} · MODULE{" "}
            {String(q.moduleNumber).padStart(2, "0")}
          </span>
          <span>{q.label}</span>
        </div>
        <span className="font-head text-[20px] leading-tight font-bold tracking-tight">
          {q.title}
        </span>
        <div className="bg-blue-wash rounded-md px-2.5 py-2 text-[12.5px] leading-snug">
          <span className="text-blue font-mono text-[10px] font-semibold">TESTS · </span>
          {q.intent}
        </div>
        {q.flow ? (
          <div className="relative flex flex-wrap items-center gap-1.5 pt-4">
            {q.flow.nodes.map((n, i) => (
              <span key={n.label} className="flex items-center gap-1.5">
                <span
                  className={`rounded-md border-[1.5px] px-2 py-1 text-[11.5px] font-semibold ${n.bad ? "border-red bg-red-wash" : "border-ink bg-card"}`}
                >
                  {n.label}
                </span>
                {i < q.flow!.nodes.length - 1 ? (
                  <span className="text-muted font-mono text-xs">→</span>
                ) : null}
              </span>
            ))}
            {q.flow.note ? (
              <span className="hand text-red absolute -top-2 right-1 -rotate-3 text-[18px]">
                {q.flow.note}
              </span>
            ) : null}
          </div>
        ) : null}
        <div className="flex flex-wrap items-baseline gap-1.5 text-[12.5px] leading-snug">
          <span className="text-faint font-mono text-[10px] font-semibold">USUAL ANSWER</span>
          <span className="decoration-red line-through decoration-2">“{q.weak_answer}”</span>
          {q.red_note ? <span className="hand text-red text-[18px]">{q.red_note}</span> : null}
        </div>
        <div className="flex flex-col gap-1.5 text-xs leading-snug">
          {q.follow_ups.slice(0, 3).map((x) => (
            <div key={x.question} className="flex items-baseline gap-2">
              <span className={`tag tag-${x.type}`}>{tagFor[x.type] ?? x.type}</span>
              <span>{x.question}</span>
            </div>
          ))}
        </div>
        <div className="border-green bg-green-wash rounded-md border-[1.5px] px-2.5 py-2 text-xs leading-snug">
          <span className="text-green-dark font-mono text-[10px] font-semibold">STRONG · </span>
          {q.answer_framework[q.answer_framework.length - 1]}
        </div>
        <span className="text-faint font-mono text-[9px]">
          stamped for you@email.com · v{version}
        </span>
      </div>

      <div
        aria-hidden="true"
        className="bg-ink absolute right-0 bottom-0 h-[404px] w-[200px] rotate-3 rounded-[32px] p-2 shadow-[0_20px_40px_rgba(28,26,22,0.3)] max-md:hidden"
      >
        <div className="bg-card flex h-full flex-col gap-2.5 rounded-[25px] px-3.5 pt-6 pb-3.5">
          <div className="text-faint flex justify-between font-mono text-[9px]">
            <span>{q.label}</span>
            <span>
              follow-up {phoneFollowUp + 1}/{q.follow_ups.length}
            </span>
          </div>
          <div className="flex gap-[3px]">
            {q.follow_ups.map((x, i) => (
              <span
                key={x.question}
                className={`h-1 flex-1 rounded-sm ${i <= phoneFollowUp ? "bg-blue" : "bg-rule-2"}`}
              />
            ))}
          </div>
          <span className="text-blue font-mono text-[9px] font-semibold uppercase">
            {tagFor[f.type] ?? f.type}
          </span>
          <span className="font-head text-[15px] leading-tight font-bold">{f.question}</span>
          <span className="text-muted text-[11px] leading-snug">
            Say your answer out loud, then reveal the strong one.
          </span>
          <span className="bg-ink text-card mt-auto flex h-9 items-center justify-center rounded-[9px] text-xs font-semibold">
            Reveal strong answer
          </span>
        </div>
      </div>
      <span className="hand text-blue absolute right-[214px] bottom-6 -rotate-[5deg] text-right text-[22px] leading-tight max-md:hidden">
        phone edition:
        <br />
        one question a screen
      </span>
    </div>
  );
}
