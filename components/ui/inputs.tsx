import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const field =
  "w-full rounded-[12px] border border-line bg-surface-2 px-3.5 text-[15px] text-text-1 placeholder:text-text-3 transition-colors focus:border-line-strong focus:outline-none focus-visible:outline-2 focus-visible:outline-text-1";

export function Input({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(field, "h-11", className)} {...p} />;
}

export function Textarea({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(field, "py-3 leading-6 min-h-[110px] resize-y", className)} {...p} />;
}

export function Select({ className, children, ...p }: SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select className={cn(field, "h-11 appearance-none", className)} {...p}>
      {children}
    </select>
  );
}

export function Field({ label, hint, htmlFor, children, error }: { label: string; hint?: string; htmlFor: string; children: ReactNode; error?: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block t-small font-medium text-text-1">
        {label}
      </label>
      {children}
      {error ? (
        <p className="t-small text-failed" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="t-small text-text-2">{hint}</p>
      ) : null}
    </div>
  );
}
