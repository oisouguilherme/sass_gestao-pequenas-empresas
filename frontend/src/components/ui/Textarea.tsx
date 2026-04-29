import { forwardRef, type TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, error, className = "", id, ...rest }, ref) {
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
        <textarea
          ref={ref}
          id={inputId}
          {...rest}
          className={`block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 ${
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-200"
              : "border-slate-300 focus:border-brand-500 focus:ring-brand-200"
          } ${className}`}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  },
);
