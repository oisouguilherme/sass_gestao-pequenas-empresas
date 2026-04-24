import * as React from "react";
import { cn } from "@/lib/utils";

const fieldBase =
  "w-full rounded-lg border border-(--border) bg-(--surface) text-sm text-(--text-primary) " +
  "placeholder:text-(--text-disabled) shadow-none " +
  "transition-colors duration-150 " +
  "focus:border-(--accent) focus:outline-none focus:ring-2 focus:ring-(--accent-ring) " +
  "disabled:bg-(--surface-raised) disabled:text-(--text-disabled) disabled:cursor-not-allowed";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...rest }, ref) {
  return (
    <input
      ref={ref}
      className={cn("h-9 px-3", fieldBase, className)}
      {...rest}
    />
  );
});

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn("min-h-22 px-3 py-2", fieldBase, className)}
      {...rest}
    />
  );
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...rest }, ref) {
  return (
    <select
      ref={ref}
      className={cn("h-9 px-3 cursor-pointer", fieldBase, className)}
      {...rest}
    >
      {children}
    </select>
  );
});

export function Label({
  className,
  ...rest
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-xs font-600 uppercase tracking-wider text-(--text-secondary)",
        className,
      )}
      {...rest}
    />
  );
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-(--danger-text)">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-(--text-disabled)">{hint}</p>
      ) : null}
    </div>
  );
}
