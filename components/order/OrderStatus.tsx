"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/track";

interface Status {
  id: string;
  status: string;
  product: string;
  productSlug: string;
  amountInr: number;
  email: string | null;
  emailSent: boolean;
}

/** Polls the order until delivery, fires the browser purchase event once, and offers a fresh link. */
export function OrderStatus({
  orderId,
  expired,
  supportEmail,
}: {
  orderId: string;
  expired: boolean;
  supportEmail: string;
}) {
  const [s, setS] = useState<Status | null>(null);
  const [notFound, setNotFound] = useState(false);
  const fired = useRef(false);
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let stop = false;
    let tries = 0;
    async function poll() {
      const res = await fetch(`/api/orders/status?id=${encodeURIComponent(orderId)}`, {
        cache: "no-store",
      });
      if (res.status === 404) return setNotFound(true);
      const data = (await res.json()) as Status;
      if (stop) return;
      setS(data);
      if (!data.emailSent && tries++ < 40) setTimeout(poll, 3000);
    }
    poll();
    return () => {
      stop = true;
    };
  }, [orderId]);

  useEffect(() => {
    if (!s || fired.current || (s.status !== "paid" && s.status !== "fulfilled")) return;
    const key = `sq_purchase_${s.id}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
    } catch {
      /* storage blocked: still fire once per page view */
    }
    fired.current = true;
    // Same event id as the server-side Conversions API event, so Meta counts it once.
    track(
      "purchase",
      {
        transaction_id: s.id,
        value: s.amountInr,
        currency: "INR",
        items: [{ item_id: s.productSlug }],
      },
      { eventId: s.id },
    );
  }, [s]);

  if (notFound)
    return (
      <p className="text-lg">
        We couldn’t find that order. If you were charged, email {supportEmail} and we’ll sort it out
        today.
      </p>
    );
  if (!s) return <p className="text-muted font-mono text-sm">Checking your order…</p>;

  const delivered = s.emailSent;
  return (
    <div className="flex flex-col gap-6">
      {expired ? (
        <p role="alert" className="border-red bg-red-wash m-0 rounded-xl border-[1.5px] p-4">
          That download link has expired or been used 5 times. Ask for a fresh one below.
        </p>
      ) : null}
      <div className="card-ink flex flex-col gap-3 p-6">
        <span className="text-muted font-mono text-xs font-semibold tracking-[0.06em]">
          ORDER {s.id}
        </span>
        <span className="font-head text-2xl font-bold">{s.product}</span>
        <span className="text-body text-[15px]">
          ₹{s.amountInr.toLocaleString("en-IN")} · GST included
        </span>
        <span
          className={`font-semibold ${delivered ? "text-green-dark" : "text-blue"}`}
          role="status"
        >
          {delivered
            ? `✓ Sent to ${s.email}. Check your inbox (and spam).`
            : s.status === "failed"
              ? "Delivery hit a snag. We’ve been alerted and will email you shortly."
              : "Payment received. Preparing your stamped copy…"}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="font-head m-0 text-2xl font-bold">What happens next</h2>
        <ol className="m-0 flex list-decimal flex-col gap-1.5 pl-5 text-[16px] leading-relaxed">
          <li>
            Open the email and download both editions: A4 for a laptop, phone for reading on the go.
          </li>
          <li>
            Start with the module closest to your next round. Answer each follow-up out loud before
            reading the strong points.
          </li>
          <li>In a week we’ll ask how it went. A short review helps the next engineer decide.</li>
        </ol>
      </div>

      {delivered ? (
        <form
          className="border-ink bg-card flex flex-col gap-3 rounded-2xl border-[1.5px] p-5"
          onSubmit={async (e) => {
            e.preventDefault();
            const res = await fetch("/api/download/resend", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId, email }),
            });
            const data = (await res.json()) as { message?: string; error?: string };
            setMsg(data.message ?? data.error ?? "Done.");
          }}
        >
          <label htmlFor="resend-email" className="font-semibold">
            Need a fresh download link?
          </label>
          <div className="flex flex-wrap gap-2.5">
            <input
              id="resend-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="the email you paid with"
              className="border-ink bg-card min-h-12 flex-[1_1_220px] rounded-[10px] border-[1.5px] px-3.5 text-base"
            />
            <button type="submit" className="keycap-ghost !min-h-12 !py-2.5">
              Send a new link
            </button>
          </div>
          {msg ? (
            <p role="status" className="m-0 text-sm">
              {msg}
            </p>
          ) : null}
        </form>
      ) : null}
      <p className="text-muted m-0 text-sm">
        Stuck? Email {supportEmail}. We reply within 1 business day.
      </p>
    </div>
  );
}
