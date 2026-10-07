/**
 * The finished apps from each project, drawn in code with fake data for the landing
 * project switcher. Illustrative only: no real users or numbers.
 */
import { accents } from "@/lib/accents";
import { StatusChip } from "@/components/ui/pill";

const mono = "font-mono";

export function PulseScreen() {
  const c = accents.pulse;
  return (
    <div className="flex h-full flex-col bg-[#0e0e0e] text-text-1">
      <div className="flex items-center gap-2.5 border-b border-line px-4 pb-3 pt-12">
        <div className="relative">
          <span className="inline-flex size-8 items-center justify-center rounded-full bg-surface-3 text-[12px]">AK</span>
          <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-[#0e0e0e]" style={{ background: c }} />
        </div>
        <div>
          <p className="text-[13px] font-medium leading-4">Platform team</p>
          <p className="text-[11px] text-text-2">4 online</p>
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-end gap-2 p-3 text-[12.5px] leading-[18px]">
        <div className="max-w-[78%] rounded-[16px] rounded-bl-[4px] bg-surface-2 px-3 py-2">Deploy is green. Load test at 3k sockets next?</div>
        <div className="max-w-[78%] rounded-[16px] rounded-bl-[4px] bg-surface-2 px-3 py-2">I&apos;ll watch fan-out lag.</div>
        <div className="ml-auto max-w-[78%] rounded-[16px] rounded-br-[4px] px-3 py-2 text-black" style={{ background: c }}>
          Starting now. Sharing the dashboard.
        </div>
        <p className="ml-auto text-[10.5px] text-text-2">Read by 3</p>
        <div className="flex items-center gap-1.5 px-1 text-[11px] text-text-2">
          <span className="inline-flex gap-0.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className="size-1 rounded-full bg-text-2" style={{ animation: `dot-pulse 1.2s ${i * 0.15}s infinite` }} />
            ))}
          </span>
          Ravi is typing
        </div>
      </div>
      <div className="m-3 mt-0 flex h-9 items-center rounded-full bg-surface-2 px-3.5 text-[12px] text-text-3">Message</div>
    </div>
  );
}

export function ReelScreen() {
  return (
    <div className="relative h-full overflow-hidden bg-black">
      <div className="absolute inset-0" style={{ background: "radial-gradient(120% 70% at 30% 30%, #5a2a1f 0%, #1a0d0a 55%, #000 100%)" }} />
      <div className="absolute inset-x-0 top-12 flex justify-center gap-4 text-[12px]">
        <span className="text-text-2">Following</span>
        <span className="font-medium text-text-1">For you</span>
      </div>
      <div className="absolute bottom-24 right-3 flex flex-col items-center gap-4 text-[10.5px] text-text-1">
        {[
          ["♥", "12.4k"],
          ["✎", "318"],
          ["↗", "Share"],
        ].map(([i, n]) => (
          <div key={n} className="flex flex-col items-center gap-1">
            <span className="inline-flex size-9 items-center justify-center rounded-full bg-white/10 text-[14px]">{i}</span>
            {n}
          </div>
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 p-4 pb-6">
        <p className="text-[13px] font-medium">@sample.creator</p>
        <p className="mt-1 text-[12px] leading-[17px] text-text-1/90">Sunrise over the backwaters, shot on a phone</p>
        <div className="mt-3 flex items-center gap-2">
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-text-1">HLS · 1080p</span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-text-1">Start 0.4s</span>
        </div>
        <div className="mt-3 h-0.5 w-full rounded bg-white/15">
          <div className="h-full w-2/5 rounded" style={{ background: accents.reel }} />
        </div>
      </div>
    </div>
  );
}

export function DispatchScreen() {
  const c = accents.dispatch;
  return (
    <div className="relative h-full overflow-hidden bg-[#0c0c0c]">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 300 640" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <rect width="300" height="640" fill="#101010" />
        {[60, 140, 230, 330, 420, 520].map((y) => (
          <line key={`h${y}`} x1="0" y1={y} x2="300" y2={y + 20} stroke="#1f1f1f" strokeWidth="10" />
        ))}
        {[40, 120, 210, 270].map((x) => (
          <line key={`v${x}`} x1={x} y1="0" x2={x - 30} y2="640" stroke="#1f1f1f" strokeWidth="8" />
        ))}
        <path d="M70 470 L110 400 L180 330 L200 240" fill="none" stroke={c} strokeWidth="4" strokeLinecap="round" strokeDasharray="1 0" />
        <circle cx="200" cy="240" r="8" fill={c} />
        <circle cx="200" cy="240" r="18" fill={c} opacity="0.18" />
        <circle cx="70" cy="470" r="7" fill="#f5f5f5" />
        {[
          [60, 180],
          [250, 380],
          [150, 560],
          [240, 120],
        ].map(([x, y]) => (
          <rect key={`${x}${y}`} x={x} y={y} width="10" height="10" rx="3" fill="#6b6b6b" />
        ))}
      </svg>
      <div className="absolute inset-x-3 bottom-3 rounded-[20px] border border-line bg-surface-1 p-4">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-medium text-text-1">Driver arriving</p>
          <StatusChip status="working">4 min</StatusChip>
        </div>
        <p className="mt-1 text-[11.5px] text-text-2">Matched within 2 km · Trip state: arriving</p>
        <div className="mt-3 flex gap-1">
          {["Requested", "Accepted", "Arriving", "On trip"].map((s, i) => (
            <span key={s} className="h-1 flex-1 rounded-full" style={{ background: i <= 2 ? c : "var(--surface-3)" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function LedgerScreen() {
  const rows = [
    ["txn_8f2", "Transfer to wallet 0193", "−₹1,200.00", "posted"],
    ["txn_8f1", "Top-up via UPI", "+₹5,000.00", "posted"],
    ["txn_8e9", "Refund · order 4471", "+₹349.00", "posted"],
    ["txn_8e7", "Payout to bank", "−₹2,000.00", "pending"],
  ];
  return (
    <div className="flex h-full text-text-1">
      <div className="hidden w-[150px] shrink-0 border-r border-line p-3 sm:block">
        <p className="text-[12px] font-medium">Ledger</p>
        <div className="mt-3 space-y-1 text-[11px] text-text-2">
          {["Overview", "Transactions", "Webhooks", "Reconciliation", "Audit log"].map((s, i) => (
            <p key={s} className={`rounded-md px-2 py-1 ${i === 0 ? "bg-surface-2 text-text-1" : ""}`}>
              {s}
            </p>
          ))}
        </div>
      </div>
      <div className="min-w-0 flex-1 p-3 sm:p-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            ["Available", "₹18,452.00"],
            ["Pending", "₹2,000.00"],
            ["Drift", "₹0.00"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-[10px] border border-line bg-surface-2/50 p-2.5">
              <p className="text-[10px] text-text-2">{k}</p>
              <p className={`mt-0.5 text-[13px] font-medium ${mono}`}>{v}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 overflow-hidden rounded-[10px] border border-line">
          {rows.map(([id, d, a, s]) => (
            <div key={id} className="flex items-center gap-2 border-b border-line px-2.5 py-2 text-[11px] last:border-0">
              <span className={`w-12 shrink-0 text-text-3 ${mono}`}>{id}</span>
              <span className="min-w-0 flex-1 truncate">{d}</span>
              <span className={`${mono} ${a?.startsWith("+") ? "text-passed" : "text-text-1"}`}>{a}</span>
              <span className="hidden w-14 text-right text-text-2 md:inline">{s}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 text-[11px] text-text-2">
          <StatusChip status="passed">Webhook delivered</StatusChip>
          <span className="truncate">payment.captured · signature verified · attempt 1</span>
        </div>
      </div>
    </div>
  );
}

export function ScribeScreen() {
  const c = accents.scribe;
  return (
    <div className="flex h-full flex-col text-text-1">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <p className="text-[12px] font-medium">Design review: notifications</p>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1.5">
            {[c, accents.pulse, accents.dispatch].map((col) => (
              <span key={col} className="size-5 rounded-full ring-2 ring-surface-1" style={{ background: col }} />
            ))}
          </div>
          <span className="rounded-full bg-invert px-2.5 py-0.5 text-[10.5px] font-medium text-invert-text">Share</span>
        </div>
      </div>
      <div className="relative flex-1 px-6 py-4 text-[12px] leading-[20px] sm:px-10">
        <p className="text-[16px] font-medium leading-6">Notifications v2</p>
        <p className="mt-2 text-text-2">
          We batch notifications per user every 30 seconds so a busy thread doesn&apos;t send twenty pushes.
          <span className="relative">
            <span className="absolute -top-4 left-0 rounded px-1 text-[9px] text-black" style={{ background: c }}>Meera</span>
            <span className="inline-block h-4 w-0.5 translate-y-0.5" style={{ background: c }} />
          </span>
        </p>
        <p className="mt-2 text-text-2">
          <span className="rounded-sm" style={{ background: `${accents.pulse}33` }}>Digest emails are opt-in</span>, and quiet hours follow the user&apos;s timezone.
          <span className="relative">
            <span className="absolute -top-4 left-0 rounded px-1 text-[9px] text-black" style={{ background: accents.pulse }}>Dev</span>
            <span className="inline-block h-4 w-0.5 translate-y-0.5" style={{ background: accents.pulse }} />
          </span>
        </p>
        <div className="absolute right-3 top-16 hidden w-[150px] rounded-[10px] border border-line bg-surface-2 p-2.5 md:block">
          <p className="text-[10px] text-text-2">Comment · Dev</p>
          <p className="text-[11px] leading-4">Should quiet hours apply to mentions?</p>
        </div>
      </div>
      <div className="flex items-center gap-2 border-t border-line px-4 py-2 text-[10.5px] text-text-2">
        <span className="size-1.5 rounded-full bg-passed" /> Synced · offline edits merged · version 42
      </div>
    </div>
  );
}

export function AtlasScreen() {
  const c = accents.atlas;
  return (
    <div className="flex h-full flex-col p-4 text-text-1 sm:p-5">
      <div className="rounded-full border border-line bg-surface-2 px-4 py-2 text-[12px]">How does Postgres decide between an index scan and a sequential scan?</div>
      <div className="mt-4 flex-1 text-[12px] leading-[19px] text-text-2">
        <p>
          The planner estimates the cost of each plan from table statistics and picks the cheapest
          <sup className="mx-0.5 rounded px-1 text-[9px] text-black" style={{ background: c }}>1</sup>. When a query matches a large share of rows, a sequential scan is often cheaper than many random index reads
          <sup className="mx-0.5 rounded px-1 text-[9px] text-black" style={{ background: c }}>2</sup>.
        </p>
        <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
          {["Postgres docs · Planner statistics", "Postgres docs · Using EXPLAIN"].map((s, i) => (
            <div key={s} className="flex items-center gap-2 rounded-[8px] border border-line px-2 py-1.5 text-[10.5px]">
              <span className="rounded px-1 text-[9px] text-black" style={{ background: c }}>{i + 1}</span>
              <span className="truncate text-text-1">{s}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3 text-[10.5px] text-text-2">
        <StatusChip status="passed">Eval 0.91</StatusChip>
        <span>p95 2.1s</span>
        <span>·</span>
        <span>budget per answer respected</span>
      </div>
    </div>
  );
}

export function FoundationsScreen() {
  return (
    <div className="grid h-full grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-5">
      <div className="rounded-[12px] border border-line bg-surface-2/40 p-3.5">
        <p className="text-[12px] font-medium text-text-1">Shorten a link</p>
        <div className="mt-2.5 rounded-[8px] border border-line bg-black px-2.5 py-1.5 text-[11px] text-text-2 truncate">https://example.com/a/very/long/path</div>
        <div className="mt-2 flex items-center justify-between">
          <span className={`text-[12px] text-text-1 ${mono}`}>sho.rt/k3x9</span>
          <span className="text-[10.5px] text-text-2">9 of 10 left this minute</span>
        </div>
        <div className="mt-3 flex gap-1.5">
          <StatusChip status="passed">Live</StatusChip>
          <StatusChip status="passed">CI green</StatusChip>
        </div>
      </div>
      <div className="rounded-[12px] border border-line bg-black p-3.5">
        <pre className={`text-[11px] leading-[18px] ${mono}`}>
          <span className="text-text-3">$ </span>
          <span className="text-text-1">pnpm test</span>
          {"\n"}
          <span className="text-text-2"> shorten.test.ts (4)</span>
          {"\n"}
          <span className="text-text-2"> rate-limit.test.ts (5)</span>
          {"\n"}
          <span className="text-passed">✓ 9 passed</span>
          {"\n\n"}
          <span className="text-text-3">$ </span>
          <span className="text-text-1">curl -I sho.rt/k3x9</span>
          {"\n"}
          <span className="text-text-2">HTTP/2 301</span>
        </pre>
      </div>
    </div>
  );
}

export const projectScreens = {
  foundations: FoundationsScreen,
  pulse: PulseScreen,
  ledger: LedgerScreen,
  reel: ReelScreen,
  dispatch: DispatchScreen,
  scribe: ScribeScreen,
  atlas: AtlasScreen,
} as const;
