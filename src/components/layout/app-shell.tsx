"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
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

const NAV: { href: string; label: string; adminOnly?: boolean }[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/os", label: "Ordens de Serviço" },
  { href: "/vendas", label: "Vendas" },
  { href: "/clientes", label: "Clientes" },
  { href: "/produtos", label: "Produtos" },
  { href: "/usuarios", label: "Usuários", adminOnly: true },
  { href: "/relatorios/vendas", label: "Relatórios", adminOnly: true },
];

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
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r border-gray-200 bg-white lg:flex lg:flex-col">
        <div className="border-b border-gray-200 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400">
            Empresa
          </p>
          <p className="text-sm font-semibold text-gray-900">
            {me?.empresa.nome ?? "..."}
          </p>
        </div>
        <nav className="flex-1 space-y-1 p-2">
          {NAV.filter((n) => !n.adminOnly || isAdmin).map((n) => {
            const active =
              pathname === n.href || pathname.startsWith(n.href + "/");
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "block rounded px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-blue-50 font-medium text-blue-700"
                    : "text-gray-700 hover:bg-gray-100",
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-gray-200 p-4 text-xs text-gray-500">
          <p className="font-medium text-gray-700">{me?.nome}</p>
          <p className="truncate">{me?.email}</p>
          <p className="mt-1 uppercase text-gray-400">{me?.role}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 w-full"
            onClick={logout}
          >
            Sair
          </Button>
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        <header className="flex items-center gap-4 border-b border-gray-200 bg-white px-4 py-3 lg:px-6">
          <GlobalSearch />
        </header>
        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
