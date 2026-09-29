/** Skeleton shaped like the account page (no bare spinners). */
export default function AccountLoading() {
  return (
    <div
      className="mx-auto max-w-xl animate-pulse px-4 py-12 sm:px-6 md:py-20"
      role="status"
      aria-label="Loading your account"
    >
      <div className="h-9 w-40 rounded-md bg-muted" />
      <div className="mt-3 h-5 w-64 max-w-full rounded-md bg-muted" />
      <div className="mt-8 rounded-xl border border-border bg-card p-5 md:p-6">
        <div className="h-6 w-56 max-w-full rounded-md bg-muted" />
        <div className="mt-3 h-4 w-full rounded-md bg-muted" />
        <div className="mt-5 h-12 w-full rounded-md bg-muted sm:w-44" />
      </div>
    </div>
  )
}
