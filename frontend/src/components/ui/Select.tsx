import { forwardRef, type SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    { label, error, hint, className = "", id, children, ...rest },
    ref,
  ) {
    const inputId = id || rest.name || undefined;
    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-700"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          {...rest}
          className={`block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 ${
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-200"
              : "border-slate-300 focus:border-brand-500 focus:ring-brand-200"
          } ${className}`}
        >
          {children}
        </select>
        {error ? (
          <p className="text-xs text-red-600">{error}</p>
        ) : hint ? (
          <p className="text-xs text-slate-500">{hint}</p>
        ) : null}
      </div>
    );
  },
);
