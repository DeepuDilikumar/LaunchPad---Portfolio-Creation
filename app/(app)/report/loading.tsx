export default function ReportLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6 md:pt-10" role="status" aria-label="Loading your report">
      <div className="skeleton h-9 w-56 rounded-lg" />
      <div className="skeleton mt-5 h-40 rounded-2xl" />
      <div className="skeleton mt-4 h-56 rounded-2xl" />
      <div className="skeleton mt-4 h-32 rounded-2xl" />
    </div>
  )
}
