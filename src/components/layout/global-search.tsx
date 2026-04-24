"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";

interface SearchResult {
  clientes: { id: string; nome: string; documento: string | null }[];
  produtos: {
    id: string;
    nome: string;
    codigo: string | null;
    preco: string;
  }[];
  ordens: { id: string; nome: string; status: string }[];
}

export function GlobalSearch() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResult>({
    clientes: [],
    produtos: [],
    ordens: [],
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.length < 2) {
      queueMicrotask(() =>
        setResults({ clientes: [], produtos: [], ordens: [] }),
      );
      return;
    }
    const t = setTimeout(() => {
      api
        .get<SearchResult>(`/api/search?q=${encodeURIComponent(q)}`)
        .then((r) => setResults(r))
        .catch(() => undefined);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const hasResults =
    results.clientes.length + results.produtos.length + results.ordens.length >
    0;

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <input
        placeholder="Buscar clientes, produtos, OS…"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className="h-9 w-full rounded-lg px-3 text-sm outline-none transition"
        style={{
          background: "var(--shell-hover-bg)",
          border: "1px solid var(--shell-border)",
          color: "var(--shell-text)",
        }}
      />
      {open && q.length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-96 overflow-auto rounded-xl border border-(--border) bg-(--surface) shadow-[0_8px_32px_rgba(0,0,0,0.14)]">
          {!hasResults ? (
            <p className="p-3 text-sm text-(--text-secondary)">Nenhum resultado.</p>
          ) : (
            <div className="divide-y divide-(--border) text-sm">
              {results.clientes.length > 0 && (
                <Section title="Clientes">
                  {results.clientes.map((c) => (
                    <Item
                      key={c.id}
                      href={`/clientes/${c.id}`}
                      onClick={() => setOpen(false)}
                      label={c.nome}
                      hint={c.documento ?? undefined}
                    />
                  ))}
                </Section>
              )}
              {results.produtos.length > 0 && (
                <Section title="Produtos">
                  {results.produtos.map((p) => (
                    <Item
                      key={p.id}
                      href="/produtos"
                      onClick={() => setOpen(false)}
                      label={p.nome}
                      hint={p.codigo ?? undefined}
                    />
                  ))}
                </Section>
              )}
              {results.ordens.length > 0 && (
                <Section title="Ordens de Serviço">
                  {results.ordens.map((o) => (
                    <Item
                      key={o.id}
                      href={`/os/${o.id}`}
                      onClick={() => setOpen(false)}
                      label={o.nome}
                      hint={o.status}
                    />
                  ))}
                </Section>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-1">
      <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-(--text-secondary)">
        {title}
      </p>
      {children}
    </div>
  );
}

function Item({
  href,
  label,
  hint,
  onClick,
}: {
  href: string;
  label: string;
  hint?: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center justify-between px-3 py-2 text-(--text-primary) hover:bg-(--surface-raised)"
    >
      <span className="truncate">{label}</span>
      {hint ? <span className="ml-2 text-xs text-(--text-secondary)">{hint}</span> : null}
    </Link>
  );
}
