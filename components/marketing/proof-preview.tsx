"use client";

import { LaptopFrame } from "@/components/ui/card";
import { AccentAvatar, StatusChip } from "@/components/ui/pill";
import { CopyButton } from "@/components/ui/copy-button";
import { accents } from "@/lib/accents";

const bullets = `Built Pulse, a real-time messenger (WebSockets, Redis pub/sub, Postgres), load-tested to 3,000 concurrent sockets.
Cut group read-receipt writes to one per read by replacing per-message receipts with a per-member read cursor.`;

/** Landing S5: a clearly fictional sample profile. */
export function ProofPreview() {
  return (
    <LaptopFrame>
      <div className="h-full overflow-hidden bg-bg p-4 text-left sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-10 items-center justify-center rounded-full bg-surface-3 text-[14px] text-text-1">S</span>
            <div>
              <p className="text-[14px] font-medium text-text-1">Sample learner</p>
              <p className="text-[11.5px] text-text-2">Backend engineer · fictional profile for illustration</p>
            </div>
          </div>
          <CopyButton text={bullets} label="Copy resume bullets" className="hidden sm:inline-flex" data-copy="resume-bullets" />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            { name: "Pulse", color: accents.pulse, m: [["p95", "84 ms"], ["sockets", "3,000"], ["tests", "112"]] },
            { name: "Ledger", color: accents.ledger, m: [["p95", "41 ms"], ["drift", "₹0.00"], ["tests", "148"]] },
          ].map((p) => (
            <div key={p.name} className="rounded-[14px] border border-line bg-surface-1 p-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AccentAvatar color={p.color} size={22} label={p.name} />
                  <span className="text-[13px] font-medium text-text-1">{p.name}</span>
                </div>
                <StatusChip status="passed">Verified build</StatusChip>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {p.m.map(([k, v]) => (
                  <div key={k}>
                    <p className="text-[10px] text-text-3">{k}</p>
                    <p className="font-mono text-[12px] text-text-1">{v}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-3 text-[11px] text-text-2">
                <span className="underline decoration-line-strong underline-offset-2">Live demo</span>
                <span className="underline decoration-line-strong underline-offset-2">Repo</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 hidden rounded-[14px] border border-line bg-surface-1 p-3.5 sm:block">
          <p className="text-[10.5px] text-text-3">Featured decision · Pulse, module 3</p>
          <p className="mt-1 text-[12px] leading-[18px] text-text-1">
            The agent proposed a receipts row per message. I switched to a per-conversation read cursor, so group reads are one write.
          </p>
        </div>
        <div className="mt-3 sm:hidden">
          <CopyButton text={bullets} label="Copy resume bullets" data-copy="resume-bullets" />
        </div>
      </div>
    </LaptopFrame>
  );
}
