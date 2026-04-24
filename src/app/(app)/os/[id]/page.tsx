"use client";

import { use, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, PageHeader, Badge } from "@/components/ui/card";
import { Field, Select } from "@/components/ui/input";
import { api } from "@/lib/api-client";
import { formatBRL, formatDate, isOverdue } from "@/lib/utils";

type Status =
  | "EM_ANDAMENTO"
  | "AGUARDANDO_APROVACAO"
  | "AGUARDANDO_RETIRADA"
  | "FINALIZADO"
  | "ARQUIVADO";

const STATUS_LABEL: Record<Status, string> = {
  EM_ANDAMENTO: "Em andamento",
  AGUARDANDO_APROVACAO: "Aguardando aprovação",
  AGUARDANDO_RETIRADA: "Aguardando retirada",
  FINALIZADO: "Finalizado",
  ARQUIVADO: "Arquivado",
};

interface Order {
  id: string;
  nome: string;
  descricao: string | null;
  status: Status;
  pago: boolean;
  deadlineAt: string | null;
  createdAt: string;
  cliente: { id: string; nome: string };
  usuarios: { usuario: { id: string; nome: string; email: string } }[];
  produtos: {
    produtoId: string;
    quantidade: number;
    produto: { id: string; nome: string; preco: string; codigo: string | null };
  }[];
  statusLogs: {
    id: string;
    statusAnterior: Status | null;
    statusNovo: Status;
    observacao: string | null;
    createdAt: string;
    usuario: { id: string; nome: string } | null;
  }[];
}

export default function OSDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<Order | null>(null);
  const [allUsers, setAllUsers] = useState<{ id: string; nome: string }[]>([]);

  async function load() {
    try {
      const o = await api.get<Order>(`/api/orders/${id}`);
      setData(o);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  useEffect(() => {
    queueMicrotask(load);
    api
      .get<{ id: string; nome: string }[]>("/api/users")
      .then(setAllUsers)
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!data) return <p className="text-sm text-gray-500">Carregando...</p>;

  async function changeStatus(newStatus: Status) {
    try {
      await api.post(`/api/orders/${id}/status`, { status: newStatus });
      toast.success("Status atualizado");
      load();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function togglePaid() {
    try {
      await api.patch(`/api/orders/${id}`, { pago: !data!.pago });
      toast.success("Atualizado");
      load();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function toggleAssign(uId: string) {
    const current = new Set(data!.usuarios.map((u) => u.usuario.id));
    if (current.has(uId)) current.delete(uId);
    else current.add(uId);
    try {
      await api.post(`/api/orders/${id}/assign`, { usuarioIds: [...current] });
      toast.success("Responsáveis atualizados");
      load();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <>
      <PageHeader
        title={data.nome}
        description={`Cliente: ${data.cliente.nome}`}
        actions={
          <Button variant="outline" onClick={togglePaid}>
            {data.pago ? "Marcar como não pago" : "Marcar como pago"}
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {data.pago ? (
                <Badge tone="green">Pago</Badge>
              ) : (
                <Badge tone="gray">Não pago</Badge>
              )}
              {isOverdue(data.deadlineAt) &&
              data.status !== "FINALIZADO" &&
              data.status !== "ARQUIVADO" ? (
                <Badge tone="red">Atrasada</Badge>
              ) : null}
              <Badge tone="blue">{STATUS_LABEL[data.status]}</Badge>
            </div>
            <Field label="Mudar status">
              <Select
                value={data.status}
                onChange={(e) => changeStatus(e.target.value as Status)}
              >
                {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <dl className="mt-4 space-y-1 text-sm">
            <Row
              k="Prazo"
              v={data.deadlineAt ? formatDate(data.deadlineAt) : "—"}
            />
            <Row k="Criada em" v={formatDate(data.createdAt)} />
            <Row k="Descrição" v={data.descricao || "—"} />
          </dl>

          <h3 className="mb-2 mt-6 text-sm font-semibold text-gray-700">
            Produtos
          </h3>
          {data.produtos.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum produto vinculado.</p>
          ) : (
            <ul className="divide-y divide-gray-100 text-sm">
              {data.produtos.map((p) => (
                <li key={p.produtoId} className="flex justify-between py-2">
                  <span>
                    {p.produto.nome} × {p.quantidade}
                  </span>
                  <span>
                    {formatBRL(Number(p.produto.preco) * p.quantidade)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <h3 className="mb-2 mt-6 text-sm font-semibold text-gray-700">
            Histórico de status
          </h3>
          <ul className="divide-y divide-gray-100 text-sm">
            {data.statusLogs.map((l) => (
              <li key={l.id} className="py-2">
                <p>
                  <span className="font-medium">
                    {l.statusAnterior ? STATUS_LABEL[l.statusAnterior] : "—"}
                  </span>{" "}
                  →{" "}
                  <span className="font-medium">
                    {STATUS_LABEL[l.statusNovo]}
                  </span>
                </p>
                <p className="text-xs text-gray-500">
                  {formatDate(l.createdAt)}
                  {l.usuario ? ` • por ${l.usuario.nome}` : ""}
                  {l.observacao ? ` • ${l.observacao}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h3 className="mb-2 text-sm font-semibold text-gray-700">
            Responsáveis
          </h3>
          {data.usuarios.length === 0 ? (
            <p className="mb-3 text-sm text-gray-500">Nenhum atribuído.</p>
          ) : (
            <ul className="mb-3 space-y-1 text-sm">
              {data.usuarios.map((u) => (
                <li key={u.usuario.id}>
                  {u.usuario.nome}{" "}
                  <span className="text-xs text-gray-400">
                    ({u.usuario.email})
                  </span>
                </li>
              ))}
            </ul>
          )}
          {allUsers.length > 0 && (
            <>
              <p className="mb-1 text-xs font-medium uppercase text-gray-400">
                Atribuir
              </p>
              <div className="space-y-1">
                {allUsers.map((u) => {
                  const assigned = data.usuarios.some(
                    (x) => x.usuario.id === u.id,
                  );
                  return (
                    <label
                      key={u.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={assigned}
                        onChange={() => toggleAssign(u.id)}
                      />
                      {u.nome}
                    </label>
                  );
                })}
              </div>
            </>
          )}
        </Card>
      </div>
    </>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="w-24 text-gray-500">{k}:</dt>
      <dd className="flex-1 text-gray-800">{v}</dd>
    </div>
  );
}
