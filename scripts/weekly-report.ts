/**
 * Weekly numbers: orders, revenue, ad spend (typed in with `pnpm ad-spend`), cost per order,
 * Readiness Check finishes and leads, plus orders by UTM campaign.
 *   pnpm report:weekly [--weeks 4]
 */
import { loadEnv } from "./lib/env";

loadEnv();

function weekStart(d: Date): Date {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = (x.getUTCDay() + 6) % 7; // Monday = 0
  x.setUTCDate(x.getUTCDate() - day);
  return x;
}

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

async function main() {
  const { getStore } = await import("../lib/db");
  const args = process.argv.slice(2);
  const weeks = Number(args[args.indexOf("--weeks") + 1]) || 4;
  const store = getStore();
  const thisWeek = weekStart(new Date());
  const rows: Record<string, string | number>[] = [];
  const campaigns = new Map<string, { orders: number; revenue: number }>();

  for (let i = weeks - 1; i >= 0; i--) {
    const from = new Date(thisWeek.getTime() - i * 7 * 86400_000);
    const to = new Date(from.getTime() + 7 * 86400_000);
    const orders = (await store.listOrders(from.toISOString(), to.toISOString())).filter((o) =>
      ["paid", "fulfilled"].includes(o.status),
    );
    const refunds = (await store.listOrders(from.toISOString(), to.toISOString())).filter(
      (o) => o.status === "refunded",
    ).length;
    const revenue = orders.reduce((n, o) => n + o.amount / 100, 0);
    const spend = (
      await store.listAdSpend(from.toISOString().slice(0, 10), to.toISOString().slice(0, 10))
    ).reduce((n, s) => n + s.amount, 0);
    const finishes = await store.countQuizResults(from.toISOString(), to.toISOString());
    const leads = await store.countLeads(from.toISOString(), to.toISOString());
    for (const o of orders) {
      const k = o.utm.campaign ?? "(none)";
      const c = campaigns.get(k) ?? { orders: 0, revenue: 0 };
      c.orders++;
      c.revenue += o.amount / 100;
      campaigns.set(k, c);
    }
    rows.push({
      week: from.toISOString().slice(0, 10),
      orders: orders.length,
      revenue: inr(revenue),
      "avg order": orders.length ? inr(revenue / orders.length) : "-",
      "ad spend": inr(spend),
      "cost/order": orders.length && spend ? inr(spend / orders.length) : "-",
      "cost/avg order":
        orders.length && spend
          ? `${Math.round((spend / orders.length / (revenue / orders.length)) * 100)}%`
          : "-",
      "checks finished": finishes,
      leads,
      refunds,
    });
  }
  console.table(rows);
  console.log("Orders by campaign:");
  console.table(
    [...campaigns].map(([campaign, c]) => ({
      campaign,
      orders: c.orders,
      revenue: inr(c.revenue),
    })),
  );
  console.log("Target: ad cost per order ≤ 50% of the average order.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
