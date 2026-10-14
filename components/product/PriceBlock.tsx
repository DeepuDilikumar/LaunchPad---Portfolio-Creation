import { formatInr, site, type Product } from "@/config/site";
import { priceInfo } from "@/lib/catalog";
import { BuyButton } from "./BuyButton";

/** Price, what's included, GST note and one CTA. No countdown, no struck-through price. */
export function PriceBlock({
  product,
  onSale,
  compact = false,
}: {
  product: Product;
  onSale: boolean;
  compact?: boolean;
}) {
  const p = priceInfo(product);
  return (
    <div className="card-ink flex max-w-[480px] flex-col gap-3 p-6 shadow-[8px_8px_0_var(--ink)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-mono text-xs font-semibold tracking-[0.06em]">
          ONE-TIME · INCL. GST
        </span>
        {p.launch ? <span className="stamp">LAUNCH PRICE</span> : null}
      </div>
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="h-display text-[64px] leading-none">{formatInr(p.price)}</span>
        {p.launch ? (
          <span className="text-body text-[15px]">
            {formatInr(p.regular)} after <strong>{p.launchEndsLabel}</strong>
          </span>
        ) : null}
      </div>
      {p.perQuestion && !compact ? (
        <span className="marker self-start text-[15px] font-semibold">
          ₹{p.perQuestion} per question
        </span>
      ) : null}
      {onSale ? (
        <BuyButton product={product.slug} label="Get the guide" brand={site.name} />
      ) : (
        <span className="border-ink rounded-xl border-[1.5px] border-dashed px-4 py-3 text-center font-semibold">
          In final review. Not on sale yet.
        </span>
      )}
      <div className="text-muted flex flex-wrap justify-center gap-x-4 gap-y-1.5 font-mono text-xs">
        <span>UPI · cards · netbanking</span>
        <span>{site.delivery.promise}</span>
        <span>{site.refund.days}-day refund</span>
      </div>
    </div>
  );
}
