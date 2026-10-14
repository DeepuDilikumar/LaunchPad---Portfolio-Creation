import type { Review } from "@/lib/db/types";

/** Reviews from real orders only: name, role, years of experience and a verified-buyer badge. */
export function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return (
      <div className="border-ink bg-card/60 rounded-[14px] border-[1.5px] border-dashed p-6">
        <p className="text-body m-0 text-[16px] leading-relaxed">
          No reviews yet. We only show reviews from verified buyers, with their permission, so this
          space stays empty until real ones come in.
        </p>
      </div>
    );
  }
  return (
    <ul className="m-0 grid list-none grid-cols-1 gap-5 p-0 md:grid-cols-2">
      {reviews.map((r) => (
        <li
          key={r.id}
          className="card-ink flex flex-col gap-3 rounded-[14px] p-5 shadow-[4px_4px_0_var(--ink)]"
        >
          <span
            aria-label={`${r.rating} out of 5`}
            className="text-marker [text-shadow:0_0_1px_var(--ink)]"
          >
            {"★".repeat(r.rating)}
            <span className="text-rule">{"★".repeat(5 - r.rating)}</span>
          </span>
          <p className="m-0 text-[15.5px] leading-relaxed">“{r.body}”</p>
          <div className="text-muted mt-auto flex flex-wrap items-center gap-2 font-mono text-xs">
            <span className="text-ink font-semibold">{r.name}</span>
            <span>
              · {r.role} · {r.years} yrs
            </span>
            <span className="bg-green-wash text-green-dark rounded px-1.5 py-0.5 font-semibold">
              ✓ verified buyer
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
