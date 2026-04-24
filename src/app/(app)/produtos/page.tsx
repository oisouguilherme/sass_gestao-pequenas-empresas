"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Field, Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/api-client";
import { formatBRL } from "@/lib/utils";

interface Product {
  id: string;
  nome: string;
  preco: string;
  codigo: string | null;
}

export default function ProdutosPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nome: "", preco: "", codigo: "" });

  async function load() {
    try {
      const data = await api.get<Product[]>(
        `/api/products${q ? `?q=${encodeURIComponent(q)}` : ""}`,
      );
      setItems(data);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function openNew() {
    setEditing(null);
    setForm({ nome: "", preco: "", codigo: "" });
    setOpen(true);
  }
  function openEdit(p: Product) {
    setEditing(p);
    setForm({ nome: p.nome, preco: String(p.preco), codigo: p.codigo ?? "" });
    setOpen(true);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const body = {
        nome: form.nome,
        preco: Number(form.preco),
        codigo: form.codigo || null,
      };
      if (editing) {
        await api.patch(`/api/products/${editing.id}`, body);
        toast.success("Produto atualizado");
      } else {
        await api.post("/api/products", body);
        toast.success("Produto criado");
      }
      setOpen(false);
      load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Excluir produto?")) return;
    try {
      await api.del(`/api/products/${id}`);
      toast.success("Excluído");
      load();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <>
      <PageHeader
        title="Produtos"
        description="Catálogo de produtos da empresa."
        actions={<Button onClick={openNew}>Novo produto</Button>}
      />
      <div className="mb-4 max-w-sm">
        <Input
          placeholder="Buscar por nome ou código..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <DataTable
        rows={items}
        rowKey={(p) => p.id}
        columns={[
          { header: "Nome", accessor: (p) => p.nome },
          { header: "Código", accessor: (p) => p.codigo ?? "—" },
          { header: "Preço", accessor: (p) => formatBRL(Number(p.preco)) },
          {
            header: "",
            accessor: (p) => (
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(p.id)}
                >
                  Excluir
                </Button>
              </div>
            ),
            className: "text-right",
          },
        ]}
      />

      <Modal
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Editar produto" : "Novo produto"}
      >
        <form onSubmit={onSubmit} className="space-y-3">
          <Field label="Nome">
            <Input
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              required
            />
          </Field>
          <Field label="Preço">
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.preco}
              onChange={(e) => setForm({ ...form, preco: e.target.value })}
              required
            />
          </Field>
          <Field label="Código (barras)" hint="Opcional, único por empresa.">
            <Input
              value={form.codigo}
              onChange={(e) => setForm({ ...form, codigo: e.target.value })}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={loading}>
              Salvar
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
