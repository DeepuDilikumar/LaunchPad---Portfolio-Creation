import type { Metadata } from "next";
import { and, count, countDistinct, desc, eq, gte, ilike, or, sql, sum } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/session";
import { getDb, schema } from "@/lib/db";
import { formatPrice, pricingConfig, type Currency } from "@/config/pricing";
import { anyMock, mock } from "@/lib/env";
import { AppHeader } from "@/components/app/app-header";
import { AccessForm, CouponForm, RefundButton } from "./actions";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86_400_000);
}

function Section({ title, children, id }: { title: string; children: React.ReactNode; id: string }) {
  return (
    <section aria-labelledby={id} className="rounded-[24px] border border-line bg-surface-1 p-5 md:p-6">
      <h2 id={id} className="t-h3 text-text-1">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

const th = "py-2 pr-4 text-left t-small font-medium text-text-2";
const td = "py-2 pr-4 t-small text-text-1 align-top";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireAdmin();
  const { q } = await searchParams;
  const db = await getDb();
  const since = daysAgo(30);
  const ev = (name: string) => and(eq(schema.analyticsEvents.event, name), gte(schema.analyticsEvents.createdAt, since));

  const [[visits], [signups], [firstCp], [paywall], [purchasesN]] = await Promise.all([
    db.select({ n: count() }).from(schema.analyticsEvents).where(ev("landing_view")),
    db.select({ n: count() }).from(schema.analyticsEvents).where(ev("signup_completed")),
    db.select({ n: countDistinct(schema.analyticsEvents.userId) }).from(schema.analyticsEvents).where(ev("checkpoint_passed")),
    db.select({ n: count() }).from(schema.analyticsEvents).where(ev("paywall_viewed")),
    db.select({ n: count() }).from(schema.analyticsEvents).where(ev("purchase_completed")),
  ]);
  const funnel = [
    { label: "Visitors (landing views)", n: Number(visits?.n ?? 0) },
    { label: "Sign-ups", n: Number(signups?.n ?? 0) },
    { label: "Reached a first checkpoint", n: Number(firstCp?.n ?? 0) },
    { label: "Paywall views", n: Number(paywall?.n ?? 0) },
    { label: "Purchases", n: Number(purchasesN?.n ?? 0) },
  ];
  const max = Math.max(1, ...funnel.map((f) => f.n));

  const purchases = await db
    .select({ p: schema.purchases, handle: schema.profiles.handle })
    .from(schema.purchases)
    .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.purchases.userId))
    .orderBy(desc(schema.purchases.createdAt))
    .limit(50);
  const revenue = await db
    .select({ currency: schema.purchases.currency, total: sum(schema.purchases.amount) })
    .from(schema.purchases)
    .where(eq(schema.purchases.status, "paid"))
    .groupBy(schema.purchases.currency);
  const coupons = await db.select().from(schema.coupons).orderBy(desc(schema.coupons.createdAt)).limit(50);
  const tutor = await db
    .select({ day: sql<string>`to_char(${schema.tutorMessages.createdAt}, 'YYYY-MM-DD')`, msgs: count(), tin: sum(schema.tutorMessages.tokensIn), tout: sum(schema.tutorMessages.tokensOut), users: countDistinct(schema.tutorMessages.userId) })
    .from(schema.tutorMessages)
    .where(and(gte(schema.tutorMessages.createdAt, since), eq(schema.tutorMessages.role, "assistant")))
    .groupBy(sql`1`)
    .orderBy(desc(sql`1`))
    .limit(14);
  const cost = (tin: number, tout: number) => (tin / 1e6) * pricingConfig.tutor.costPerMTok.input + (tout / 1e6) * pricingConfig.tutor.costPerMTok.output;
  const users = await db
    .select()
    .from(schema.profiles)
    .where(q ? or(ilike(schema.profiles.handle, `%${q}%`), ilike(schema.profiles.email, `%${q}%`)) : undefined)
    .orderBy(desc(schema.profiles.createdAt))
    .limit(25);
  const leads = await db.select().from(schema.leads).orderBy(desc(schema.leads.createdAt)).limit(25);
  const pendingWebhooks = await db.select({ n: count() }).from(schema.webhookEvents).where(sql`${schema.webhookEvents.processedAt} is null`);

  return (
    <>
      <AppHeader user={user} />
      <main id="main" className="container-bp space-y-6 pb-24 pt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="t-h2 text-text-1">Admin</h1>
          {anyMock ? (
            <p className="t-small text-text-2">
              Mock providers: {Object.entries(mock).filter(([, v]) => v).map(([k]) => k).join(", ")}
            </p>
          ) : null}
        </div>

        <Section title="Funnel, last 30 days" id="funnel">
          <ol className="space-y-2" data-funnel>
            {funnel.map((f, i) => (
              <li key={f.label} className="grid grid-cols-[200px_1fr_60px] items-center gap-3">
                <span className="t-small text-text-2">{f.label}</span>
                <span className="h-2 rounded-full bg-surface-3">
                  <span className="block h-2 rounded-full bg-text-1" style={{ width: `${(f.n / max) * 100}%` }} />
                </span>
                <span className="text-right font-mono t-small text-text-1" data-funnel-step={i}>
                  {f.n}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-3 t-small text-text-3">Counted server-side without cookies. Landing views are only counted for visitors whose browsers run the page script.</p>
        </Section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="Manual access" id="access">
            <AccessForm />
          </Section>
          <Section title="Create coupon codes" id="coupons-new">
            <CouponForm />
          </Section>
        </div>

        <Section title="Purchases" id="purchases">
          <p className="mb-3 t-small text-text-2">
            Paid revenue: {revenue.length ? revenue.map((r) => formatPrice(Number(r.total ?? 0), r.currency as Currency)).join(" · ") : "none yet"} · Unprocessed webhooks: {Number(pendingWebhooks[0]?.n ?? 0)}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr>
                  {["When", "Learner", "Product", "Amount", "Status", "Payment", ""].map((h) => (
                    <th key={h} className={th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {purchases.map(({ p, handle }) => (
                  <tr key={p.id} data-purchase={p.id}>
                    <td className={td}>{p.createdAt.toISOString().slice(0, 16).replace("T", " ")}</td>
                    <td className={td}>@{handle}</td>
                    <td className={td}>
                      {p.productSlug}
                      {p.projectSlug ? ` · ${p.projectSlug}` : ""}
                      {p.couponCode ? ` · ${p.couponCode}` : ""}
                    </td>
                    <td className={td}>{formatPrice(p.amount, p.currency as Currency)}</td>
                    <td className={td} data-status>
                      {p.status}
                    </td>
                    <td className={`${td} font-mono text-[12px]`}>{p.providerPaymentId ?? "—"}</td>
                    <td className={td}>{p.status === "paid" ? <RefundButton purchaseId={p.id} /> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Tutor usage and cost, last 30 days" id="tutor">
          <p className="mb-3 t-small text-text-2">
            Estimated at ${pricingConfig.tutor.costPerMTok.input}/${pricingConfig.tutor.costPerMTok.output} per million input/output tokens. Mock replies log zero tokens.
          </p>
          <table className="w-full">
            <thead>
              <tr>
                {["Day", "Replies", "Learners", "Tokens in", "Tokens out", "Cost (USD)"].map((h) => (
                  <th key={h} className={th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line" data-tutor-usage>
              {tutor.map((r) => (
                <tr key={r.day}>
                  <td className={td}>{r.day}</td>
                  <td className={td}>{r.msgs}</td>
                  <td className={td}>{r.users}</td>
                  <td className={td}>{Number(r.tin ?? 0).toLocaleString("en-US")}</td>
                  <td className={td}>{Number(r.tout ?? 0).toLocaleString("en-US")}</td>
                  <td className={td}>{cost(Number(r.tin ?? 0), Number(r.tout ?? 0)).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="Coupons" id="coupons">
            <ul className="divide-y divide-line" data-coupons>
              {coupons.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2 t-small">
                  <span className="font-mono text-text-1">{c.code}</span>
                  <span className="text-text-2">
                    {c.kind === "grant" ? `grants ${c.scope}` : c.kind === "percent" ? `${c.value}% off` : `${c.value} off`} · {c.redemptions}/{c.maxRedemptions ?? "∞"}
                    {c.expiresAt ? ` · expires ${c.expiresAt.toISOString().slice(0, 10)}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </Section>
          <Section title="Team and college leads" id="leads">
            <ul className="divide-y divide-line">
              {leads.map((l) => (
                <li key={l.id} className="py-2 t-small">
                  <p className="text-text-1">
                    {l.organization} · {l.kind} · {l.seats ?? "?"} seats
                  </p>
                  <p className="text-text-2">
                    {l.name} · {l.email}
                  </p>
                </li>
              ))}
            </ul>
          </Section>
        </div>

        <Section title="Learners" id="users">
          <form className="mb-3 flex gap-2" action="/admin">
            <label htmlFor="admin-q" className="sr-only">
              Search learners
            </label>
            <input id="admin-q" name="q" defaultValue={q} placeholder="Search handle or email" className="h-9 w-full max-w-[320px] rounded-[10px] border border-line bg-surface-2 px-3 t-small text-text-1" />
          </form>
          <ul className="divide-y divide-line">
            {users.map((u) => (
              <li key={u.userId} className="flex flex-wrap justify-between gap-2 py-2 t-small">
                <span className="text-text-1">
                  @{u.handle} {u.role === "admin" ? "· admin" : ""}
                </span>
                <span className="text-text-2">
                  {u.email} · joined {u.createdAt.toISOString().slice(0, 10)}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      </main>
    </>
  );
}
