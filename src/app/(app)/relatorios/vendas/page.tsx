"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { api } from "@/lib/api-client";
import { formatBRL } from "@/lib/utils";

interface Report {
  totalVendido: number;
  quantidade: number;
  ticketMedio: number;
  porUsuario: {
    usuarioId: string;
    nome: string;
    total: number;
    quantidade: number;
  }[];
  porStatus: { status: string; total: number; quantidade: number }[];
}

interface User {
  id: string;
  nome: string;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function daysAgoISO(d: number) {
  const x = new Date();
  x.setDate(x.getDate() - d);
  return x.toISOString().slice(0, 10);
}

export default function RelatorioVendasPage() {
  const [from, setFrom] = useState(daysAgoISO(30));
  const [to, setTo] = useState(todayISO());
  const [usuarioId, setUsuarioId] = useState("");
  const [status, setStatus] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [data, setData] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .get<User[]>("/api/users")
      .then(setUsers)
      .catch(() => undefined);
  }, []);

  async function run() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("from", new Date(from).toISOString());
      params.set("to", new Date(to + "T23:59:59").toISOString());
      if (usuarioId) params.set("usuarioId", usuarioId);
      if (status) params.set("status", status);
      const r = await api.get<Report>(`/api/reports/sales?${params}`);
      setData(r);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(run);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function preset(days: number) {
    setFrom(daysAgoISO(days));
    setTo(todayISO());
  }

  return (
    <>
      <PageHeader
        title="Relatório de vendas"
        description="Somente administradores."
      />
      <Card className="mb-4">
        <div className="grid gap-3 sm:grid-cols-5">
          <Field label="De">
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </Field>
          <Field label="Até">
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </Field>
          <Field label="Usuário">
            <Select
              value={usuarioId}
              onChange={(e) => setUsuarioId(e.target.value)}
            >
              <option value="">Todos</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Todos</option>
              <option value="EM_ANDAMENTO">Em andamento</option>
              <option value="FINALIZADA">Finalizada</option>
              <option value="CANCELADA">Cancelada</option>
            </Select>
          </Field>
          <div className="flex items-end">
            <Button onClick={run} loading={loading} className="w-full">
              Aplicar
            </Button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <button
            className="rounded border border-gray-200 px-2 py-1"
            onClick={() => preset(0)}
          >
            Hoje
          </button>
          <button
            className="rounded border border-gray-200 px-2 py-1"
            onClick={() => preset(7)}
          >
            7 dias
          </button>
          <button
            className="rounded border border-gray-200 px-2 py-1"
            onClick={() => preset(30)}
          >
            30 dias
          </button>
          <button
            className="rounded border border-gray-200 px-2 py-1"
            onClick={() => preset(90)}
          >
            90 dias
          </button>
        </div>
      </Card>

      {data && (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <Kpi label="Total vendido" value={formatBRL(data.totalVendido)} />
            <Kpi label="Quantidade" value={String(data.quantidade)} />
            <Kpi label="Ticket médio" value={formatBRL(data.ticketMedio)} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <h3 className="mb-2 text-sm font-semibold text-gray-700">
                Por usuário
              </h3>
              {data.porUsuario.length === 0 ? (
                <p className="text-sm text-gray-500">Sem dados.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-gray-500">
                    <tr>
                      <th className="py-1">Usuário</th>
                      <th className="py-1 text-right">Qtd</th>
                      <th className="py-1 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.porUsuario.map((u) => (
                      <tr key={u.usuarioId}>
                        <td className="py-1.5">{u.nome}</td>
                        <td className="py-1.5 text-right">{u.quantidade}</td>
                        <td className="py-1.5 text-right">
                          {formatBRL(u.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
            <Card>
              <h3 className="mb-2 text-sm font-semibold text-gray-700">
                Por status
              </h3>
              {data.porStatus.length === 0 ? (
                <p className="text-sm text-gray-500">Sem dados.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-gray-500">
                    <tr>
                      <th className="py-1">Status</th>
                      <th className="py-1 text-right">Qtd</th>
                      <th className="py-1 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.porStatus.map((s) => (
                      <tr key={s.status}>
                        <td className="py-1.5">{s.status}</td>
                        <td className="py-1.5 text-right">{s.quantidade}</td>
                        <td className="py-1.5 text-right">
                          {formatBRL(s.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </div>
        </>
      )}
    </>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
    </Card>
  );
}
