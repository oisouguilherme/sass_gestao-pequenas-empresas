"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, PageHeader, Badge } from "@/components/ui/card";
import { api } from "@/lib/api-client";
import { formatBRL, formatDate, isOverdue } from "@/lib/utils";

interface Dashboard {
  vendasHoje: { total: string; quantidade: number };
  osEmAndamento: number;
  osAtrasadas: number;
  ultimasVendas: {
    id: string;
    valorFinal: string;
    status: string;
    createdAt: string;
    usuario: { nome: string };
  }[];
  proximasOS: {
    id: string;
    nome: string;
    deadlineAt: string | null;
    status: string;
    cliente: { nome: string };
  }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);

  useEffect(() => {
    api
      .get<Dashboard>("/api/dashboard")
      .then(setData)
      .catch(() => undefined);
  }, []);

  return (
    <>
      <PageHeader title="Dashboard" description="Visão geral do dia." />
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Vendas hoje"
          value={formatBRL(Number(data?.vendasHoje.total ?? 0))}
        >
          <span className="text-xs text-(--text-secondary)">
            {data?.vendasHoje.quantidade ?? 0} venda(s)
          </span>
        </KpiCard>
        <KpiCard
          label="OS em andamento"
          value={String(data?.osEmAndamento ?? 0)}
        />
        <KpiCard
          label="OS atrasadas"
          value={String(data?.osAtrasadas ?? 0)}
          tone={data && data.osAtrasadas > 0 ? "red" : "gray"}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-(--text-primary)">
            Últimas vendas
          </h2>
          {data?.ultimasVendas.length ? (
            <ul className="divide-y divide-(--border)">
              {data.ultimasVendas.map((v) => (
                <li
                  key={v.id}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <div>
                    <p className="font-medium text-(--text-primary)">
                      {formatBRL(Number(v.valorFinal))}
                    </p>
                    <p className="text-xs text-(--text-secondary)">
                      {v.usuario.nome} • {formatDate(v.createdAt)}
                    </p>
                  </div>
                  <Badge tone={v.status === "CANCELADA" ? "red" : "green"}>
                    {v.status}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-(--text-secondary)">Sem vendas ainda.</p>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-(--text-primary)">
            Próximas OS
          </h2>
          {data?.proximasOS.length ? (
            <ul className="divide-y divide-(--border)">
              {data.proximasOS.map((os) => (
                <li
                  key={os.id}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <div>
                    <Link
                      href={`/os/${os.id}`}
                      className="font-medium text-(--text-primary) hover:text-(--accent) hover:underline"
                    >
                      {os.nome}
                    </Link>
                    <p className="text-xs text-(--text-secondary)">
                      {os.cliente.nome} • Prazo:{" "}
                      {os.deadlineAt ? formatDate(os.deadlineAt) : "—"}
                    </p>
                  </div>
                  {isOverdue(os.deadlineAt) ? (
                    <Badge tone="red">Atrasada</Badge>
                  ) : (
                    <Badge tone="blue">{os.status.replace("_", " ")}</Badge>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-(--text-secondary)">Sem OS pendentes.</p>
          )}
        </Card>
      </div>
    </>
  );
}

function KpiCard({
  label,
  value,
  tone = "gray",
  children,
}: {
  label: string;
  value: string;
  tone?: "gray" | "red";
  children?: React.ReactNode;
}) {
  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-wider text-(--text-secondary)">{label}</p>
      <p
        className={`mt-2 text-3xl font-bold tracking-tight ${tone === "red" ? "text-red-500" : "text-(--text-primary)"}`}
      >
        {value}
      </p>
      {children ? <div className="mt-1">{children}</div> : null}
    </Card>
  );
}
