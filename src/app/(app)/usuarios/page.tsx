"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, PageHeader, Badge } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Field, Input, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";

interface User {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  role: "ADMIN" | "OPERACIONAL";
  ativo: boolean;
  createdAt: string;
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    role: "OPERACIONAL",
    senha: "",
  });

  async function load() {
    try {
      const data = await api.get<User[]>("/api/users");
      setUsers(data);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  useEffect(() => {
    queueMicrotask(load);
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/users", {
        nome: form.nome,
        email: form.email,
        telefone: form.telefone || null,
        role: form.role,
        senha: form.senha || undefined,
      });
      toast.success("Usuário criado");
      setOpen(false);
      setForm({
        nome: "",
        email: "",
        telefone: "",
        role: "OPERACIONAL",
        senha: "",
      });
      load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function deactivate(id: string) {
    if (!confirm("Desativar este usuário?")) return;
    try {
      await api.del(`/api/users/${id}`);
      toast.success("Usuário desativado");
      load();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <>
      <PageHeader
        title="Usuários"
        description="Gerencie os usuários da empresa."
        actions={<Button onClick={() => setOpen(true)}>Novo usuário</Button>}
      />
      <DataTable
        rows={users}
        rowKey={(u) => u.id}
        columns={[
          { header: "Nome", accessor: (u) => u.nome },
          { header: "E-mail", accessor: (u) => u.email },
          { header: "Telefone", accessor: (u) => u.telefone ?? "—" },
          {
            header: "Perfil",
            accessor: (u) => (
              <Badge tone={u.role === "ADMIN" ? "purple" : "blue"}>
                {u.role}
              </Badge>
            ),
          },
          {
            header: "Status",
            accessor: (u) =>
              u.ativo ? (
                <Badge tone="green">Ativo</Badge>
              ) : (
                <Badge tone="gray">Inativo</Badge>
              ),
          },
          { header: "Criado em", accessor: (u) => formatDate(u.createdAt) },
          {
            header: "",
            accessor: (u) =>
              u.ativo ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deactivate(u.id)}
                >
                  Desativar
                </Button>
              ) : null,
          },
        ]}
      />

      <Modal open={open} onOpenChange={setOpen} title="Novo usuário">
        <form onSubmit={onCreate} className="space-y-3">
          <Field label="Nome">
            <Input
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              required
            />
          </Field>
          <Field label="E-mail">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </Field>
          <Field label="Telefone">
            <Input
              value={form.telefone}
              onChange={(e) => setForm({ ...form, telefone: e.target.value })}
            />
          </Field>
          <Field label="Perfil">
            <Select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="OPERACIONAL">Operacional</option>
              <option value="ADMIN">Admin</option>
            </Select>
          </Field>
          <Field
            label="Senha (opcional)"
            hint="Se vazio, será gerada e logada no console."
          >
            <Input
              type="password"
              value={form.senha}
              onChange={(e) => setForm({ ...form, senha: e.target.value })}
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
