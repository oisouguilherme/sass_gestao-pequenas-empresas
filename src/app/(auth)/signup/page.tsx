"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { api } from "@/lib/api-client";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    empresaNome: "",
    nomeResponsavel: "",
    nome: "",
    email: "",
    senha: "",
    telefone: "",
  });

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/auth/signup", {
        empresa: {
          nome: form.empresaNome,
          nomeResponsavel: form.nomeResponsavel,
        },
        admin: {
          nome: form.nome,
          email: form.email,
          senha: form.senha,
          telefone: form.telefone || null,
        },
      });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-6">
      <h1 className="text-xl font-semibold">Criar empresa</h1>
      <p className="mb-6 mt-1 text-sm text-gray-500">
        Você será o administrador da nova empresa.
      </p>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Nome da empresa">
          <Input
            value={form.empresaNome}
            onChange={(e) => set("empresaNome", e.target.value)}
            required
          />
        </Field>
        <Field label="Nome do responsável">
          <Input
            value={form.nomeResponsavel}
            onChange={(e) => set("nomeResponsavel", e.target.value)}
            required
          />
        </Field>
        <hr />
        <Field label="Seu nome">
          <Input
            value={form.nome}
            onChange={(e) => set("nome", e.target.value)}
            required
          />
        </Field>
        <Field label="E-mail de acesso">
          <Input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            required
          />
        </Field>
        <Field label="Senha" hint="Mínimo de 8 caracteres">
          <Input
            type="password"
            value={form.senha}
            onChange={(e) => set("senha", e.target.value)}
            minLength={8}
            required
          />
        </Field>
        <Field label="Telefone (opcional)">
          <Input
            value={form.telefone}
            onChange={(e) => set("telefone", e.target.value)}
          />
        </Field>
        <Button type="submit" loading={loading} className="w-full">
          Criar e entrar
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-500">
        Já tem conta?{" "}
        <Link href="/login" className="text-blue-600 hover:underline">
          Entrar
        </Link>
      </p>
    </Card>
  );
}
