import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({
  className,
  children,
  padded = true,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { padded?: boolean; children?: ReactNode }) {
  return (
    <div
      className={cn("rounded-[24px] bg-surface-1 border border-line", padded && "p-5 md:p-8", className)}
      {...rest}
    >
      {children}
    </div>
  );
}

/** Desktop-app style window with three dots and a 36px title bar. */
export function AppWindow({
  title,
  children,
  className,
  bodyClassName,
  right,
}: {
  title?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  right?: ReactNode;
}) {
  return (
    <div className={cn("overflow-hidden rounded-[16px] border border-line bg-surface-1", className)}>
      <div className="relative flex h-9 items-center border-b border-line px-3.5">
        <div className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-surface-3" />
          <span className="size-2.5 rounded-full bg-surface-3" />
          <span className="size-2.5 rounded-full bg-surface-3" />
        </div>
        {title ? (
          <div className="pointer-events-none absolute inset-x-0 text-center t-small text-text-2 truncate px-20">{title}</div>
        ) : null}
        {right ? <div className="ml-auto">{right}</div> : null}
      </div>
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}

export function PhoneFrame({ children, className, label }: { children: ReactNode; className?: string; label?: string }) {
  return (
    <div
      role={label ? "img" : undefined}
      aria-label={label}
      className={cn(
        "relative mx-auto w-[260px] md:w-[300px] aspect-[9/19] rounded-[44px] border border-line-strong bg-[#0b0b0b] p-[10px] shadow-[0_40px_120px_-40px_rgba(255,255,255,0.08)]",
        className,
      )}
    >
      <div className="absolute left-1/2 top-[18px] z-10 h-[22px] w-[86px] -translate-x-1/2 rounded-full bg-black" aria-hidden />
      <div className="relative h-full w-full overflow-hidden rounded-[34px] bg-surface-1">{children}</div>
    </div>
  );
}

export function LaptopFrame({ children, className, label }: { children: ReactNode; className?: string; label?: string }) {
  return (
    <div role={label ? "img" : undefined} aria-label={label} className={cn("mx-auto w-full max-w-[760px]", className)}>
      <div className="rounded-[18px] border border-line-strong bg-[#0b0b0b] p-[10px] pb-[12px]">
        <div className="relative aspect-[16/10] overflow-hidden rounded-[10px] bg-surface-1">{children}</div>
      </div>
      <div className="mx-auto h-[12px] w-full rounded-b-[14px] border border-t-0 border-line-strong bg-[#141414]" aria-hidden />
    </div>
  );
}
