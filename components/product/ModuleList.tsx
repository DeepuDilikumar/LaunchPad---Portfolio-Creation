export function ModuleList({
  modules,
  counts,
}: {
  modules: { slug: string; number: number; title: string }[];
  counts: { modules: number; questions: number };
}) {
  return (
    <div className="border-ink bg-card flex min-w-0 flex-[999_1_520px] flex-col gap-4 rounded-[14px] border-[1.5px] p-6 sm:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-head m-0 text-3xl font-extrabold tracking-tight">Contents</h2>
        <span className="text-muted font-mono text-xs">
          {modules.length} modules
          {counts.questions ? ` · ${counts.questions} questions so far` : ""}
        </span>
      </div>
      <ol className="m-0 grid list-none grid-cols-1 gap-x-8 p-0 sm:grid-cols-2">
        {modules.map((m) => (
          <li
            key={m.slug}
            className="border-rule flex items-baseline gap-3 border-t border-dashed py-2.5"
          >
            <span className="text-faint font-mono text-xs">
              {String(m.number).padStart(2, "0")}
            </span>
            <span className="font-medium">{m.title}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
