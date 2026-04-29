import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, ScanBarcode, Receipt } from "lucide-react";
import { api } from "@/lib/api";
import type { Paginated, ReportSales, Usuario } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { formatBRL } from "@/lib/format";
import { DataTable } from "@/components/ui/DataTable";

type Status = "FINALIZADA" | "CANCELADA" | "ABERTA";

interface Filters {
  from: string;
  to: string;
  usuarioId: string;
  status: Status;
}

const empty: Filters = {
  from: "",
  to: "",
  usuarioId: "",
  status: "FINALIZADA",
};

export default function ReportsPage() {
  const [filters, setFilters] = useState<Filters>(empty);

  const params = useMemo(() => {
    const p = new URLSearchParams();
    if (filters.from) p.set("from", filters.from);
    if (filters.to) p.set("to", filters.to);
    if (filters.usuarioId) p.set("usuarioId", filters.usuarioId);
    if (filters.status) p.set("status", filters.status);
    return p.toString();
  }, [filters]);

  const reportQ = useQuery({
    queryKey: ["reports", "sales", params],
    queryFn: async () =>
      (await api.get<ReportSales>(`/reports/sales?${params}`)).data,
  });

  const usersQ = useQuery({
    queryKey: ["users", "all"],
    queryFn: async () =>
      (await api.get<Paginated<Usuario>>("/users?perPage=100")).data,
  });

  return (
    <>
      <PageHeader
        title="Relatórios"
        description="Análise de vendas por período e por usuário"
      />

      <Card className="mb-6">
        <CardBody>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <Input
              label="De"
              type="date"
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            />
            <Input
              label="Até"
              type="date"
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            />
            <Select
              label="Usuário"
              value={filters.usuarioId}
              onChange={(e) =>
                setFilters({ ...filters, usuarioId: e.target.value })
              }
            >
              <option value="">Todos</option>
              {usersQ.data?.data.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </Select>
            <Select
              label="Status"
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value as Status })
              }
            >
              <option value="FINALIZADA">Finalizada</option>
              <option value="CANCELADA">Cancelada</option>
              <option value="ABERTA">Aberta</option>
            </Select>
          </div>
        </CardBody>
      </Card>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Kpi
          label="Total vendido"
          value={formatBRL(reportQ.data?.totais.totalVendido ?? 0)}
          icon={<TrendingUp className="h-6 w-6" />}
        />
        <Kpi
          label="Nº vendas"
          value={String(reportQ.data?.totais.numeroVendas ?? 0)}
          icon={<ScanBarcode className="h-6 w-6" />}
        />
        <Kpi
          label="Ticket médio"
          value={formatBRL(reportQ.data?.totais.ticketMedio ?? 0)}
          icon={<Receipt className="h-6 w-6" />}
        />
      </div>

      <Card>
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="font-semibold text-slate-900">Vendas por usuário</h2>
        </div>
        <CardBody className="p-0">
          <DataTable
            loading={reportQ.isLoading}
            rows={reportQ.data?.porUsuario ?? []}
            rowKey={(r) => r.usuarioId}
            emptyMessage="Sem vendas no período."
            columns={[
              { key: "usuarioNome", header: "Usuário" },
              { key: "numeroVendas", header: "Vendas" },
              {
                key: "totalVendido",
                header: "Total",
                render: (r) => formatBRL(r.totalVendido),
              },
            ]}
          />
        </CardBody>
      </Card>
    </>
  );
}

function Kpi({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardBody className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          {icon}
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
      </CardBody>
    </Card>
  );
}
