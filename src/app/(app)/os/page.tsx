"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, PageHeader, Badge } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/api-client";
import { formatDate, isOverdue } from "@/lib/utils";

type OrderStatus =
  | "EM_ANDAMENTO"
  | "AGUARDANDO_APROVACAO"
  | "AGUARDANDO_RETIRADA"
  | "FINALIZADO"
  | "ARQUIVADO";

interface Order {
  id: string;
  nome: string;
  status: OrderStatus;
  pago: boolean;
  deadlineAt: string | null;
  cliente: { id: string; nome: string };
  usuarios: { usuario: { id: string; nome: string } }[];
}

interface Customer {
  id: string;
  nome: string;
}
interface User {
  id: string;
  nome: string;
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  EM_ANDAMENTO: "Em andamento",
  AGUARDANDO_APROVACAO: "Aguardando aprovação",
  AGUARDANDO_RETIRADA: "Aguardando retirada",
  FINALIZADO: "Finalizado",
  ARQUIVADO: "Arquivado",
};

export default function OrdensPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [atrasadas, setAtrasadas] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    clienteId: "",
    deadlineAt: "",
    usuarioIds: [] as string[],
  });

  async function load() {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (atrasadas) params.set("atrasadas", "1");
      const data = await api.get<Order[]>(
        `/api/orders${params.toString() ? `?${params}` : ""}`,
      );
      setOrders(data);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  useEffect(() => {
    queueMicrotask(load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, atrasadas]);

  async function openNew() {
    setForm({
      nome: "",
      descricao: "",
      clienteId: "",
      deadlineAt: "",
      usuarioIds: [],
    });
    setOpen(true);
    if (customers.length === 0) {
      try {
        const [cs, us] = await Promise.all([
          api.get<Customer[]>("/api/customers"),
          api.get<User[]>("/api/users").catch(() => []),
        ]);
        setCustomers(cs);
        setUsers(us);
      } catch {
        // operacional não vê /api/users; ignora
      }
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/orders", {
        nome: form.nome,
        descricao: form.descricao || null,
        clienteId: form.clienteId,
        deadlineAt: form.deadlineAt
          ? new Date(form.deadlineAt).toISOString()
          : null,
        usuarioIds: form.usuarioIds,
        produtos: [],
      });
      toast.success("OS criada");
      setOpen(false);
      load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Ordens de Serviço"
        actions={<Button onClick={openNew}>Nova OS</Button>}
      />
      <Card className="mb-4 flex flex-wrap items-end gap-3">
        <Field label="Status">
          <Select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as OrderStatus | "")
            }
          >
            <option value="">Todos</option>
            {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={atrasadas}
            onChange={(e) => setAtrasadas(e.target.checked)}
          />
          Apenas atrasadas
        </label>
      </Card>

      {orders.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhuma OS.</p>
      ) : (
        <div className="grid gap-3">
          {orders.map((os) => (
            <Card key={os.id} className="flex items-center justify-between">
              <div>
                <Link
                  href={`/os/${os.id}`}
                  className="text-base font-medium hover:underline"
                >
                  {os.nome}
                </Link>
                <p className="text-sm text-gray-500">
                  {os.cliente.nome}
                  {os.deadlineAt ? ` • Prazo ${formatDate(os.deadlineAt)}` : ""}
                  {os.usuarios.length
                    ? ` • ${os.usuarios.map((u) => u.usuario.nome).join(", ")}`
                    : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {os.pago ? <Badge tone="green">Pago</Badge> : null}
                {isOverdue(os.deadlineAt) &&
                os.status !== "FINALIZADO" &&
                os.status !== "ARQUIVADO" ? (
                  <Badge tone="red">Atrasada</Badge>
                ) : null}
                <Badge tone="blue">{STATUS_LABEL[os.status]}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onOpenChange={setOpen} title="Nova OS">
        <form onSubmit={onSubmit} className="space-y-3">
          <Field label="Nome">
            <Input
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              required
            />
          </Field>
          <Field label="Cliente">
            <Select
              value={form.clienteId}
              onChange={(e) => setForm({ ...form, clienteId: e.target.value })}
              required
            >
              <option value="">Selecione...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Prazo">
            <Input
              type="datetime-local"
              value={form.deadlineAt}
              onChange={(e) => setForm({ ...form, deadlineAt: e.target.value })}
            />
          </Field>
          <Field label="Descrição">
            <Textarea
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            />
          </Field>
          {users.length > 0 && (
            <Field label="Responsáveis">
              <div className="max-h-32 space-y-1 overflow-auto rounded border border-gray-200 p-2">
                {users.map((u) => {
                  const checked = form.usuarioIds.includes(u.id);
                  return (
                    <label
                      key={u.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            usuarioIds: e.target.checked
                              ? [...f.usuarioIds, u.id]
                              : f.usuarioIds.filter((x) => x !== u.id),
                          }))
                        }
                      />
                      {u.nome}
                    </label>
                  );
                })}
              </div>
            </Field>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={loading}>
              Criar OS
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
