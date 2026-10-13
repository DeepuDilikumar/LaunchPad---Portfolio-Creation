/** The signature pair of cards: what you rehearse vs what they ask next. */
export function RehearseVsAsk() {
  const rows: [string, string, string][] = [
    ["failure", "FAILURE", "Kafka was down for ten minutes. What happened to the orders?"],
    ["tradeoff", "TRADEOFF", "Why Redis there, and what did it cost you?"],
    ["ownership", "OWNERSHIP", "Which part of that design was your call?"],
    ["measurement", "MEASURE", "How did you know it was working?"],
  ];
  return (
    <div className="flex flex-wrap items-center gap-7">
      <div className="card-ink flex min-w-0 flex-[1_1_340px] -rotate-[0.6deg] flex-col gap-3.5 rounded-[14px] p-6">
        <span className="text-muted font-mono text-[11px] font-semibold tracking-[0.06em]">
          WHAT YOU REHEARSE
        </span>
        <span className="font-head text-2xl leading-tight font-bold">
          Tell me about a system you built.
        </span>
        <span className="text-muted text-[15px] leading-relaxed">
          “I built the order service with Spring Boot, Kafka and Redis. It handles checkout for…”
        </span>
        <span className="hand text-green text-2xl">you’ve got this one ✓</span>
      </div>
      <svg
        className="max-md:hidden"
        aria-hidden="true"
        width="72"
        height="48"
        viewBox="0 0 72 48"
        fill="none"
        stroke="#C2412D"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 30 C 20 6, 44 4, 64 22" />
        <path d="M54 20 L65 23 L62 12" />
      </svg>
      <div className="border-red bg-card flex min-w-0 flex-[1_1_380px] rotate-[0.6deg] flex-col gap-3.5 rounded-[14px] border-[1.5px] p-6 shadow-[6px_6px_0_var(--red)]">
        <span className="text-red-dark font-mono text-[11px] font-semibold tracking-[0.06em]">
          WHAT THEY ASK NEXT
        </span>
        {rows.map(([type, label, text]) => (
          <div key={label} className="flex items-baseline gap-2.5 text-[15.5px] leading-normal">
            <span className={`tag tag-${type}`}>{label}</span>
            <span>{text}</span>
          </div>
        ))}
        <span className="hand text-red text-2xl">this is where it goes quiet</span>
      </div>
    </div>
  );
}
