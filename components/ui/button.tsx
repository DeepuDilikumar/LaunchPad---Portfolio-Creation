import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap select-none transition-[background-color,color,opacity,transform] duration-200 ease-[var(--ease-out-soft)] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary: "bg-invert text-invert-text hover:opacity-85",
  secondary: "bg-surface-2 text-text-1 hover:bg-surface-3",
  ghost: "text-text-2 hover:text-text-1 hover:bg-surface-2",
  danger: "bg-surface-2 text-failed hover:bg-surface-3",
};

const sizes: Record<Size, string> = {
  md: "h-10 px-[18px] text-[15px]",
  sm: "h-8 px-3.5 text-[13px]",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export function Button({ variant = "primary", size = "md", className, type = "button", ...rest }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, className)} {...rest} />;
}

type LinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  prefetch?: boolean;
};

export function LinkButton({ href, variant = "primary", size = "md", className, children, prefetch, ...rest }: LinkButtonProps) {
  const external = /^https?:\/\//.test(href);
  if (external) {
    return (
      <a href={href} className={buttonClass(variant, size, className)} target="_blank" rel="noreferrer noopener" {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} prefetch={prefetch} className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}
