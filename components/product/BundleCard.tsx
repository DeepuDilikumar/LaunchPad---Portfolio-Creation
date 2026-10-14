import { formatInr, type Product } from "@/config/site";
import { WaitlistForm } from "./WaitlistForm";

export function BundleCard({
  bundle,
  variant = "dark",
}: {
  bundle: Product;
  variant?: "dark" | "strip";
}) {
  if (variant === "strip") {
    return (
      <div className="border-ink bg-card/60 flex flex-wrap items-center justify-between gap-4 rounded-[14px] border-[1.5px] border-dashed px-6 py-5">
        <div className="flex flex-col gap-1">
          <span className="text-muted font-mono text-xs font-semibold">
            COMING NEXT · {bundle.name.toUpperCase()} · {formatInr(bundle.price)}
          </span>
          <span className="text-base">{bundle.tagline}</span>
        </div>
        <WaitlistForm product={bundle.slug} />
      </div>
    );
  }
  return (
    <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-3.5 rounded-2xl border-[1.5px] border-dashed border-[#BDB4A0] p-7">
      <span className="font-mono text-xs font-semibold tracking-[0.06em] text-[#BDB4A0]">
        COMING NEXT · {bundle.name.toUpperCase()}
      </span>
      <span className="h-display text-card text-[56px] leading-none">
        {formatInr(bundle.price)}
      </span>
      <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-base text-[#E9E3D3]">
        <li>Backend Switch Guide</li>
        <li>System Design Follow-Ups</li>
        {bundle.extras?.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
      <div className="mt-auto">
        <WaitlistForm product={bundle.slug} dark />
      </div>
    </div>
  );
}
