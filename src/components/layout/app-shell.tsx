"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";
import { GlobalSearch } from "./global-search";

interface MeResponse {
  user: {
    id: string;
    nome: string;
    email: string;
    role: "ADMIN" | "OPERACIONAL";
    empresa: { id: string; nome: string };
  };
}

const NAV: {
  href: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
}[] = [
  { href: "/dashboard", label: "Dashboard", icon: "◈" },
  { href: "/os", label: "Ordens de Serviço", icon: "◎" },
  { href: "/vendas", label: "Vendas", icon: "◇" },
  { href: "/clientes", label: "Clientes", icon: "◉" },
  { href: "/produtos", label: "Produtos", icon: "▣" },
  { href: "/usuarios", label: "Usuários", icon: "◑", adminOnly: true },
  {
    href: "/relatorios/vendas",
    label: "Relatórios",
    icon: "◫",
    adminOnly: true,
  },
];

function Initials({ nome }: { nome: string }) {
  const parts = nome.trim().split(" ");
  const init =
    parts.length >= 2
      ? parts[0][0] + parts[parts.length - 1][0]
      : parts[0].slice(0, 2);
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-(--accent) text-xs font-semibold text-white">
      {init.toUpperCase()}
    </span>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<MeResponse["user"] | null>(null);

  useEffect(() => {
    api
      .get<MeResponse>("/api/auth/me")
      .then((r) => setMe(r.user))
      .catch(() => router.push("/login"));
  }, [router]);

  async function logout() {
    try {
      await api.post("/api/auth/logout");
      router.push("/login");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  const isAdmin = me?.role === "ADMIN";

  return (
    <div className="flex min-h-screen" style={{ background: "var(--body-bg)" }}>
      {/* ── Sidebar ── */}
      <aside
        className="hidden w-56 shrink-0 flex-col lg:flex"
        style={{
          background: "var(--shell-bg)",
          borderRight: "1px solid var(--shell-border)",
        }}
      >
        {/* Logo / Empresa */}
        <div
          className="px-4 py-5"
          style={{ borderBottom: "1px solid var(--shell-border)" }}
        >
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg text-lg font-bold"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              G
            </span>
            <div className="min-w-0">
              <p
                className="truncate text-xs font-semibold leading-none"
                style={{ color: "var(--shell-text)" }}
              >
                {me?.empresa.nome ?? "Carregando…"}
              </p>
              <p
                className="mt-0.5 text-[10px] uppercase tracking-widest"
                style={{ color: "var(--shell-muted)" }}
              >
                Gestão
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 px-2 py-3">
          {NAV.filter((n) => !n.adminOnly || isAdmin).map((n) => {
            const active =
              pathname === n.href || pathname.startsWith(n.href + "/");
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-150",
                  active ? "font-semibold" : "font-normal hover:opacity-100",
                )}
                style={
                  active
                    ? {
                        background: "var(--shell-active-bg)",
                        color: "var(--shell-active)",
                      }
                    : {
                        color: "var(--shell-muted)",
                      }
                }
                onMouseEnter={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background =
                      "var(--shell-hover-bg)";
                    (e.currentTarget as HTMLElement).style.color =
                      "var(--shell-text)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background =
                      "transparent";
                    (e.currentTarget as HTMLElement).style.color =
                      "var(--shell-muted)";
                  }
                }}
              >
                <span className="w-4 shrink-0 text-center text-base leading-none">
                  {n.icon}
                </span>
                {n.label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div
          className="px-3 py-4"
          style={{ borderTop: "1px solid var(--shell-border)" }}
        >
          {me ? (
            <div className="flex items-center gap-2.5">
              <Initials nome={me.nome} />
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-xs font-semibold leading-tight"
                  style={{ color: "var(--shell-text)" }}
                >
                  {me.nome}
                </p>
                <p
                  className="truncate text-[10px]"
                  style={{ color: "var(--shell-muted)" }}
                >
                  {me.role === "ADMIN" ? "Administrador" : "Operacional"}
                </p>
              </div>
              <button
                onClick={logout}
                title="Sair"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors"
                style={{ color: "var(--shell-muted)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "var(--shell-hover-bg)";
                  (e.currentTarget as HTMLElement).style.color = "#ef4444";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "transparent";
                  (e.currentTarget as HTMLElement).style.color =
                    "var(--shell-muted)";
                }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M11 11l3-3-3-3M14 8H6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          ) : (
            <div
              className="h-8 animate-pulse rounded-lg"
              style={{ background: "var(--shell-border)" }}
            />
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex min-w-0 flex-1 flex-col">
        <header
          className="flex items-center gap-4 px-5 py-3"
          style={{
            background: "var(--shell-bg)",
            borderBottom: "1px solid var(--shell-border)",
          }}
        >
          <GlobalSearch />
        </header>
        <div className="flex-1 p-5 lg:p-7">{children}</div>
      </main>
    </div>
  );
}
