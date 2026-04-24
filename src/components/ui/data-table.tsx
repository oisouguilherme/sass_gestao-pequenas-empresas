import * as React from "react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  header: string;
  accessor: (row: T) => React.ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns,
  rows,
  empty = "Nada por aqui ainda.",
  rowKey,
  onRowClick,
}: {
  columns: Column<T>[];
  rows: T[];
  empty?: string;
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-(--border) bg-(--surface-raised) p-10 text-center text-sm text-(--text-secondary)">
        {empty}
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-xl border border-(--border) bg-(--surface) shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-(--border) bg-(--surface-raised)">
            {columns.map((c, i) => (
              <th
                key={i}
                className={cn(
                  "px-4 py-3 text-xs font-600 uppercase tracking-wider text-(--text-secondary)",
                  c.className,
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={rowKey(row)}
              className={cn(
                ri < rows.length - 1 && "border-b border-(--border)",
                onRowClick
                  ? "cursor-pointer transition-colors hover:bg-(--accent-subtle)"
                  : "transition-colors hover:bg-(--surface-raised)",
              )}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((c, i) => (
                <td
                  key={i}
                  className={cn(
                    "px-4 py-3.5 text-(--text-primary)",
                    c.className,
                  )}
                >
                  {c.accessor(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
