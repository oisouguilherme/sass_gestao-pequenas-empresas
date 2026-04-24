import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-(--accent) text-white hover:bg-(--accent-hover) disabled:opacity-40 shadow-sm",
  secondary:
    "bg-(--surface-raised) text-(--text-primary) border border-(--border) hover:bg-(--border) disabled:opacity-40",
  ghost:
    "bg-transparent text-(--text-secondary) hover:bg-(--border) hover:text-(--text-primary)",
  danger:
    "bg-(--danger-bg) text-(--danger-text) border border-(--danger-text) hover:bg-red-100 disabled:opacity-40",
  outline:
    "border border-(--border-strong) bg-(--surface) text-(--text-primary) hover:border-(--text-secondary) hover:bg-(--surface-raised)",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-9 px-4 text-sm",
  lg: "h-11 px-5 text-base",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", size = "md", className, loading, disabled, children, ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium tracking-wide transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent-ring) focus-visible:ring-offset-1",
          "disabled:cursor-not-allowed select-none",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        disabled={disabled || loading}
        {...rest}
      >
        {loading ? (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    );
  },
);
