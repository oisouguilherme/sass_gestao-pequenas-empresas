"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Field, Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/api-client";

interface Customer {
  id: string;
  nome: string;
  documento: string | null;
  telefone: string | null;
  email: string | null;
}

export default function ClientesPage() {
  const [items, setItems] = useState<Customer[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    documento: "",
    telefone: "",
    email: "",
    endereco: "",
  });

  async function load() {
    try {
      const data = await api.get<Customer[]>(
        `/api/customers${q ? `?q=${encodeURIComponent(q)}` : ""}`,
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/customers", {
        nome: form.nome,
        documento: form.documento || null,
        telefone: form.telefone || null,
        email: form.email || null,
        endereco: form.endereco || null,
      });
      toast.success("Cliente criado");
      setOpen(false);
      setForm({
        nome: "",
        documento: "",
        telefone: "",
        email: "",
        endereco: "",
      });
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
        title="Clientes"
        description="Cadastro de clientes."
        actions={<Button onClick={() => setOpen(true)}>Novo cliente</Button>}
      />
      <div className="mb-4 max-w-sm">
        <Input
          placeholder="Buscar por nome, documento, telefone..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <DataTable
        rows={items}
        rowKey={(c) => c.id}
        columns={[
          {
            header: "Nome",
            accessor: (c) => (
              <Link
                href={`/clientes/${c.id}`}
                className="font-medium text-blue-600 hover:underline"
              >
                {c.nome}
              </Link>
            ),
          },
          { header: "Documento", accessor: (c) => c.documento ?? "—" },
          { header: "Telefone", accessor: (c) => c.telefone ?? "—" },
          { header: "E-mail", accessor: (c) => c.email ?? "—" },
        ]}
      />

      <Modal open={open} onOpenChange={setOpen} title="Novo cliente">
        <form onSubmit={onSubmit} className="space-y-3">
          <Field label="Nome">
            <Input
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              required
            />
          </Field>
          <Field label="Documento (CPF/CNPJ)">
            <Input
              value={form.documento}
              onChange={(e) => setForm({ ...form, documento: e.target.value })}
            />
          </Field>
          <Field label="Telefone">
            <Input
              value={form.telefone}
              onChange={(e) => setForm({ ...form, telefone: e.target.value })}
            />
          </Field>
          <Field label="E-mail">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <Field label="Endereço">
            <Input
              value={form.endereco}
              onChange={(e) => setForm({ ...form, endereco: e.target.value })}
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
              Criar
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
