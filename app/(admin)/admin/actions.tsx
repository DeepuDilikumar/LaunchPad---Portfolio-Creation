"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/inputs";
import { useToast } from "@/components/ui/toast";

async function post(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown> & { error?: string };
  return { ok: res.ok, data };
}

export function RefundButton({ purchaseId }: { purchaseId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      size="sm"
      variant="danger"
      disabled={busy}
      onClick={async () => {
        if (!window.confirm("Refund this purchase and remove the learner's access?")) return;
        setBusy(true);
        const r = await post("/api/admin/refund", { purchaseId });
        setBusy(false);
        toast(r.ok ? "Refunded" : (r.data.error ?? "Refund failed"), r.ok ? "passed" : "failed");
        router.refresh();
      }}
    >
      Refund
    </Button>
  );
}

const scopes = ["all", "review", "project:pulse", "project:ledger", "project:reel", "project:dispatch", "project:scribe", "project:atlas"];

export function AccessForm() {
  const toast = useToast();
  const [who, setWho] = useState("");
  const [scope, setScope] = useState("all");
  const run = async (action: "grant" | "revoke") => {
    const r = await post("/api/admin/access", { action, who, scope });
    toast(r.ok ? `${action === "grant" ? "Granted" : "Revoked"} ${scope} for @${String(r.data.handle)}` : (r.data.error ?? "Failed"), r.ok ? "passed" : "failed");
  };
  return (
    <div className="space-y-3">
      <Field label="Learner handle or email" htmlFor="acc-who">
        <Input id="acc-who" value={who} onChange={(e) => setWho(e.target.value)} />
      </Field>
      <Field label="Scope" htmlFor="acc-scope">
        <Select id="acc-scope" value={scope} onChange={(e) => setScope(e.target.value)}>
          {scopes.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </Field>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => void run("grant")} disabled={!who}>
          Grant access
        </Button>
        <Button size="sm" variant="secondary" onClick={() => void run("revoke")} disabled={!who}>
          Revoke access
        </Button>
      </div>
    </div>
  );
}

export function CouponForm() {
  const router = useRouter();
  const [kind, setKind] = useState("grant");
  const [scope, setScope] = useState("all");
  const [value, setValue] = useState("20");
  const [max, setMax] = useState("30");
  const [expires, setExpires] = useState("");
  const [prefix, setPrefix] = useState("TEAM");
  const [countN, setCountN] = useState("1");
  const [codes, setCodes] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const create = async () => {
    setErr(null);
    const r = await post("/api/admin/coupons", {
      kind,
      scope: kind === "grant" ? scope : undefined,
      value: kind === "grant" ? 0 : Number(value),
      maxRedemptions: max ? Number(max) : undefined,
      expiresAt: expires ? new Date(`${expires}T23:59:59Z`).toISOString() : undefined,
      prefix: prefix.toUpperCase(),
      count: Number(countN),
    });
    if (!r.ok) return setErr(r.data.error ?? "Failed");
    setCodes(r.data.codes as string[]);
    router.refresh();
  };
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Kind" htmlFor="cp-kind">
          <Select id="cp-kind" value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="grant">Grant access</option>
            <option value="percent">Percent off</option>
            <option value="flat">Flat off (minor units)</option>
          </Select>
        </Field>
        {kind === "grant" ? (
          <Field label="Scope" htmlFor="cp-scope">
            <Select id="cp-scope" value={scope} onChange={(e) => setScope(e.target.value)}>
              {scopes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <Field label="Value" htmlFor="cp-value">
            <Input id="cp-value" inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value)} />
          </Field>
        )}
        <Field label="Max redemptions per code" htmlFor="cp-max">
          <Input id="cp-max" inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value)} />
        </Field>
        <Field label="Expires" htmlFor="cp-exp">
          <Input id="cp-exp" type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />
        </Field>
        <Field label="Prefix" htmlFor="cp-prefix">
          <Input id="cp-prefix" value={prefix} onChange={(e) => setPrefix(e.target.value)} />
        </Field>
        <Field label="How many codes" htmlFor="cp-count">
          <Input id="cp-count" inputMode="numeric" value={countN} onChange={(e) => setCountN(e.target.value)} />
        </Field>
      </div>
      <Button size="sm" onClick={() => void create()}>
        Create codes
      </Button>
      {err ? (
        <p role="alert" className="t-small text-failed">
          {err}
        </p>
      ) : null}
      {codes.length ? (
        <pre className="max-h-40 overflow-auto theme-dark rounded-[10px] bg-bg p-3 font-mono text-[12px] text-text-1" data-new-codes>
          {codes.join("\n")}
        </pre>
      ) : null}
    </div>
  );
}
