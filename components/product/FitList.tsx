export function FitList() {
  return (
    <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-5">
      <div className="border-green bg-green-wash flex rotate-[0.6deg] flex-col gap-2.5 rounded-[14px] border-[1.5px] p-5">
        <span className="text-green-dark font-mono text-[11px] font-semibold">MADE FOR YOU IF</span>
        <span className="text-[15px] leading-normal">
          ✓ You have 2–8 years and a backend round coming up
        </span>
        <span className="text-[15px] leading-normal">
          ✓ You’ve built real things but stall on “why”
        </span>
        <span className="text-[15px] leading-normal">
          ✓ Your interview is in the next few weeks
        </span>
      </div>
      <div className="border-red bg-red-wash flex -rotate-[0.6deg] flex-col gap-2.5 rounded-[14px] border-[1.5px] p-5">
        <span className="text-red-dark font-mono text-[11px] font-semibold">NOT FOR YOU IF</span>
        <span className="text-[15px] leading-normal">
          ✗ You don’t have work projects to talk about yet
        </span>
        <span className="text-[15px] leading-normal">
          ✗ You want answers to memorise word for word
        </span>
        <span className="text-[15px] leading-normal">✗ You want leaked company questions</span>
      </div>
    </div>
  );
}
