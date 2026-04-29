import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-600/60 focus-visible:ring-brand-500",
  secondary:
    "bg-slate-100 text-slate-900 hover:bg-slate-200 disabled:opacity-60 focus-visible:ring-slate-400",
  ghost:
    "bg-transparent text-slate-700 hover:bg-slate-100 disabled:opacity-60 focus-visible:ring-slate-400",
  danger:
    "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-600/60 focus-visible:ring-red-500",
  outline:
    "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-60 focus-visible:ring-slate-400",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  loading,
  disabled,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading && (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
          aria-hidden
        />
      )}
      {children}
    </button>
  );
}
