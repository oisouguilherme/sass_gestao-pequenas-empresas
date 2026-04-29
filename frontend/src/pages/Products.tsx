import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, extractErrorMessage } from "@/lib/api";
import { formatBRL } from "@/lib/format";
import type { Paginated, Produto } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { DataTable, Pagination } from "@/components/ui/DataTable";
import { SearchInput } from "@/components/ui/SearchInput";

interface ProductForm {
  nome: string;
  codigo: string;
  preco: string;
}

const empty: ProductForm = { nome: "", codigo: "", preco: "" };

export default function ProductsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const canWrite = user?.role === "ADMIN" || user?.role === "OPERADOR";
  const canDelete = user?.role === "ADMIN";

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Produto | null>(null);
  const [form, setForm] = useState<ProductForm>(empty);

  const productsQ = useQuery({
    queryKey: ["products", page, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        perPage: "10",
      });
      if (search) params.set("q", search);
      return (await api.get<Paginated<Produto>>(`/products?${params}`)).data;
    },
  });

  const createMut = useMutation({
    mutationFn: async (data: ProductForm) =>
      api.post("/products", { ...data, preco: Number(data.preco) }),
    onSuccess: () => {
      toast.success("Produto criado");
      qc.invalidateQueries({ queryKey: ["products"] });
      closeModal();
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProductForm }) =>
      api.patch(`/products/${id}`, { ...data, preco: Number(data.preco) }),
    onSuccess: () => {
      toast.success("Produto atualizado");
      qc.invalidateQueries({ queryKey: ["products"] });
      closeModal();
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => {
      toast.success("Produto removido");
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setModalOpen(true);
  };

  const openEdit = (p: Produto) => {
    setEditing(p);
    setForm({ nome: p.nome, codigo: p.codigo, preco: String(p.preco) });
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
        title="Produtos"
        description="Catálogo de produtos da sua empresa"
        actions={
          canWrite && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Novo produto
            </Button>
          )
        }
      />

      <div className="mb-4 max-w-md">
        <SearchInput
          value={search}
          onChange={(v) => {
            setPage(1);
            setSearch(v);
          }}
          placeholder="Buscar por nome ou código…"
        />
      </div>

      <DataTable<Produto>
        loading={productsQ.isLoading}
        rows={productsQ.data?.data ?? []}
        rowKey={(p) => p.id}
        columns={[
          { key: "codigo", header: "Código", className: "font-mono" },
          { key: "nome", header: "Nome" },
          {
            key: "preco",
            header: "Preço",
            render: (p) => formatBRL(p.preco),
          },
          {
            key: "acoes",
            header: "",
            className: "text-right",
            render: (p) => (
              <div className="flex justify-end gap-1">
                {canWrite && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEdit(p)}
                    aria-label="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                {canDelete && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm(`Remover "${p.nome}"?`))
                        deleteMut.mutate(p.id);
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

      {productsQ.data && (
        <Pagination
          page={productsQ.data.meta.page}
          perPage={productsQ.data.meta.perPage}
          total={productsQ.data.meta.total}
          lastPage={productsQ.data.meta.lastPage}
          onChange={setPage}
        />
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? "Editar produto" : "Novo produto"}
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
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Nome"
            required
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
          />
          <Input
            label="Código"
            required
            value={form.codigo}
            onChange={(e) => setForm({ ...form, codigo: e.target.value })}
            hint="Único por empresa (também usado no PDV)"
          />
          <Input
            label="Preço"
            type="number"
            step="0.01"
            min="0"
            required
            value={form.preco}
            onChange={(e) => setForm({ ...form, preco: e.target.value })}
          />
          <button type="submit" hidden />
        </form>
      </Modal>
    </>
  );
}
