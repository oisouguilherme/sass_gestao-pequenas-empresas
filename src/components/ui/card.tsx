import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-(--border) bg-(--surface) p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]",
        className,
      )}
      {...rest}
    />
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex items-end justify-between gap-4">
      <div>
        <h1 className="text-[1.65rem] font-700 leading-tight text-(--text-primary) tracking-tight">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-(--text-secondary)">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
    </div>
  );
}

export function Badge({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: "gray" | "blue" | "green" | "red" | "amber" | "purple";
}) {
  const tones: Record<string, string> = {
    gray:   "bg-stone-100 text-stone-700 border border-stone-200",
    blue:   "bg-(--info-bg) text-(--info-text) border border-blue-200",
    green:  "bg-(--success-bg) text-(--success-text) border border-green-200",
    red:    "bg-(--danger-bg) text-(--danger-text) border border-red-200",
    amber:  "bg-(--warning-bg) text-(--warning-text) border border-amber-200",
    purple: "bg-(--purple-bg) text-(--purple-text) border border-purple-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-600 tracking-wide",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="rounded-xl border-2 border-dashed border-(--border) bg-(--surface-raised) p-10 text-center">
      <p className="font-600 text-(--text-secondary)">{title}</p>
      {description ? (
        <p className="mt-1 text-sm text-(--text-disabled)">{description}</p>
      ) : null}
    </div>
  );
}
