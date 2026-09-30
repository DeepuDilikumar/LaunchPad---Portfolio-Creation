import { PrimaryCta, Reassurance } from "./hero"

export function FinalCta() {
  return (
    <section aria-labelledby="final-cta-title" className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start gap-4 rounded-2xl bg-tonal p-6 text-tonal-foreground md:items-center md:p-14 md:text-center">
          <h2 id="final-cta-title" className="text-h1 font-normal md:text-h1-lg">
            See where you stand in 2 minutes.
          </h2>
          <p className="max-w-xl md:text-lg">
            Your portfolio goes live for free. Your score tells you what to fix next.
          </p>
          <div data-cta-sentinel className="mt-2 flex w-full flex-col gap-4 sm:w-auto md:items-center">
            <PrimaryCta className="w-full sm:w-auto" />
            <Reassurance className="text-tonal-foreground md:justify-center" />
          </div>
        </div>
      </div>
    </section>
  )
}
