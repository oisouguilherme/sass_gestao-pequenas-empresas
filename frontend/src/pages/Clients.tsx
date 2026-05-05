import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, History } from "lucide-react";
import { toast } from "sonner";
import { api, extractErrorMessage } from "@/lib/api";
import type { Cliente, OrdemServico, Paginated, Venda } from "@/lib/types";
import { formatBRL, formatDate } from "@/lib/format";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { DataTable, Pagination } from "@/components/ui/DataTable";
import { SearchInput } from "@/components/ui/SearchInput";

interface ClientForm {
  nome: string;
  email: string;
  telefone: string;
  documento: string;
  endereco: string;
}

const empty: ClientForm = {
  nome: "",
  email: "",
  telefone: "",
  documento: "",
  endereco: "",
};

export default function ClientsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const canDelete = user?.role === "ADMIN";

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [form, setForm] = useState<ClientForm>(empty);
  const [historicoCliente, setHistoricoCliente] = useState<Cliente | null>(
    null,
  );

  const clientsQ = useQuery({
    queryKey: ["clients", page, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        perPage: "10",
      });
      if (search) params.set("q", search);
      return (await api.get<Paginated<Cliente>>(`/clients?${params}`)).data;
    },
  });

  function payload(data: ClientForm) {
    return {
      nome: data.nome,
      email: data.email || undefined,
      telefone: data.telefone || undefined,
      documento: data.documento || undefined,
      endereco: data.endereco || undefined,
    };
  }

  const createMut = useMutation({
    mutationFn: async (data: ClientForm) => api.post("/clients", payload(data)),
    onSuccess: () => {
      toast.success("Cliente criado");
      qc.invalidateQueries({ queryKey: ["clients"] });
      closeModal();
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ClientForm }) =>
      api.patch(`/clients/${id}`, payload(data)),
    onSuccess: () => {
      toast.success("Cliente atualizado");
      qc.invalidateQueries({ queryKey: ["clients"] });
      closeModal();
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => api.delete(`/clients/${id}`),
    onSuccess: () => {
      toast.success("Cliente removido");
      qc.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setModalOpen(true);
  };

  const openEdit = (c: Cliente) => {
    setEditing(c);
    setForm({
      nome: c.nome,
      email: c.email ?? "",
      telefone: c.telefone ?? "",
      documento: c.documento ?? "",
      endereco: c.endereco ?? "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(empty);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (editing) updateMut.mutate({ id: editing.id, data: form });
    else createMut.mutate(form);
  };

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Cadastro de clientes da sua empresa"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Novo cliente
          </Button>
        }
      />

      <div className="mb-4 max-w-md">
        <SearchInput
          value={search}
          onChange={(v) => {
            setPage(1);
            setSearch(v);
          }}
          placeholder="Buscar por nome, e-mail ou documento…"
        />
      </div>

      <DataTable<Cliente>
        loading={clientsQ.isLoading}
        rows={clientsQ.data?.data ?? []}
        rowKey={(c) => c.id}
        columns={[
          { key: "nome", header: "Nome" },
          { key: "email", header: "E-mail", render: (c) => c.email ?? "—" },
          {
            key: "telefone",
            header: "Telefone",
            render: (c) => c.telefone ?? "—",
          },
          {
            key: "documento",
            header: "Documento",
            render: (c) => c.documento ?? "—",
          },
          {
            key: "acoes",
            header: "",
            className: "text-right",
            render: (c) => (
              <div className="flex justify-end gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setHistoricoCliente(c)}
                  aria-label="Histórico"
                >
                  <History className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openEdit(c)}
                  aria-label="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                {canDelete && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm(`Remover "${c.nome}"?`))
                        deleteMut.mutate(c.id);
                    }}
                    aria-label="Remover"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            ),
          },
        ]}
      />

      {clientsQ.data && (
        <Pagination
          page={clientsQ.data.meta.page}
          perPage={clientsQ.data.meta.perPage}
          total={clientsQ.data.meta.total}
          lastPage={clientsQ.data.meta.lastPage}
          onChange={setPage}
        />
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? "Editar cliente" : "Novo cliente"}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={closeModal}>
              Cancelar
            </Button>
            <Button
              onClick={onSubmit as unknown as () => void}
              loading={createMut.isPending || updateMut.isPending}
            >
              {editing ? "Salvar" : "Criar"}
            </Button>
          </>
        }
      >
        <form
          onSubmit={onSubmit}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <Input
            label="Nome"
            required
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            className="sm:col-span-2"
          />
          <Input
            label="E-mail"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Telefone"
            value={form.telefone}
            onChange={(e) => setForm({ ...form, telefone: e.target.value })}
          />
          <Input
            label="Documento (CPF/CNPJ)"
            value={form.documento}
            onChange={(e) => setForm({ ...form, documento: e.target.value })}
          />
          <div className="sm:col-span-2">
            <Textarea
              label="Endereço"
              rows={2}
              value={form.endereco}
              onChange={(e) => setForm({ ...form, endereco: e.target.value })}
            />
          </div>
          <button type="submit" hidden />
        </form>
      </Modal>

      {/* Modal de histórico do cliente */}
      <ClienteHistoricoModal
        cliente={historicoCliente}
        onClose={() => setHistoricoCliente(null)}
      />
    </>
  );
}

interface ClienteHistorico {
  vendas: Venda[];
  ordens: OrdemServico[];
}

function ClienteHistoricoModal({
  cliente,
  onClose,
}: {
  cliente: Cliente | null;
  onClose: () => void;
}) {
  const historicoQ = useQuery({
    queryKey: ["client-historico", cliente?.id],
    enabled: !!cliente,
    queryFn: async () =>
      (await api.get<ClienteHistorico>(`/clients/${cliente!.id}/historico`))
        .data,
  });

  const h = historicoQ.data;

  return (
    <Modal
      open={!!cliente}
      onClose={onClose}
      title={`Histórico — ${cliente?.nome ?? ""}`}
      footer={
        <Button variant="outline" onClick={onClose}>
          Fechar
        </Button>
      }
    >
      {historicoQ.isPending && (
        <p className="text-sm text-slate-500">Carregando…</p>
      )}
      {h && (
        <div className="space-y-6">
          {/* Vendas */}
          <div>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Vendas ({h.vendas.length})
            </h3>
            {h.vendas.length === 0 ? (
              <p className="text-sm text-slate-400">Nenhuma venda.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                    <th className="pb-2 pr-3 font-medium">ID</th>
                    <th className="pb-2 pr-3 font-medium">Data</th>
                    <th className="pb-2 pr-3 font-medium">Total</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {h.vendas.map((v) => (
                    <tr key={v.id}>
                      <td className="py-1.5 pr-3 font-mono text-xs text-slate-400">
                        #{v.id.slice(-6).toUpperCase()}
                      </td>
                      <td className="py-1.5 pr-3">{formatDate(v.createdAt)}</td>
                      <td className="py-1.5 pr-3">{formatBRL(v.valorFinal)}</td>
                      <td className="py-1.5">{v.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Ordens de serviço */}
          <div>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Ordens de serviço ({h.ordens.length})
            </h3>
            {h.ordens.length === 0 ? (
              <p className="text-sm text-slate-400">
                Nenhuma ordem de serviço.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                    <th className="pb-2 pr-3 font-medium">Nome</th>
                    <th className="pb-2 pr-3 font-medium">Data</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {h.ordens.map((os) => (
                    <tr key={os.id}>
                      <td className="py-1.5 pr-3">{os.nome}</td>
                      <td className="py-1.5 pr-3">
                        {formatDate(os.createdAt)}
                      </td>
                      <td className="py-1.5">{os.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
