import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { readChangelog } from "@/lib/changelog";
import { guideTitle } from "@/lib/delivery";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/config/site";

export const metadata = pageMetadata({
  title: "Changelog and errata",
  description: "Every version of every guide, and every mistake we fixed.",
  path: "/changelog",
  og: { title: "Changelog and errata", kicker: "changelog" },
});

export default function ChangelogPage() {
  const { guides, errata } = readChangelog();
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto flex max-w-[760px] flex-col gap-8 px-4 py-16 sm:px-6">
        <div className="flex flex-col gap-3">
          <span className="label">// changelog</span>
          <h1 className="h-display m-0 text-[clamp(36px,5vw,52px)]">What changed, and when.</h1>
          <p className="text-body m-0">
            Buyers get every update free for {site.delivery.updatesMonths} months, by email. Found a
            mistake? Write to {site.support.email}.
          </p>
        </div>
        {Object.entries(guides).map(([g, entries]) => (
          <section key={g} className="flex flex-col gap-4">
            <h2 className="font-head m-0 text-2xl font-bold">{guideTitle(g)}</h2>
            {entries.map((e) => (
              <div
                key={e.version}
                className="card-ink flex flex-col gap-2 p-5 shadow-[4px_4px_0_var(--ink)]"
              >
                <div className="flex flex-wrap items-center gap-3 font-mono text-sm">
                  <span className="font-semibold">v{e.version}</span>
                  <span className="text-muted">{e.date}</span>
                  {e.status === "in-review" ? (
                    <span className="bg-amber-wash text-amber-dark rounded px-1.5 py-0.5 text-xs font-semibold">
                      IN REVIEW
                    </span>
                  ) : null}
                </div>
                <ul className="m-0 list-disc pl-5">
                  {e.notes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))}
        <section className="flex flex-col gap-3">
          <h2 className="font-head m-0 text-2xl font-bold">Errata</h2>
          {errata.length === 0 ? (
            <p className="text-body m-0">
              No corrections yet. When we fix a mistake, it’s listed here with the date.
            </p>
          ) : (
            <ul className="m-0 list-disc pl-5">
              {errata.map((e) => (
                <li key={`${e.question}-${e.date}`}>
                  {e.date} · {guideTitle(e.guide)} · {e.question}: {e.fix}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
