"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { api } from "@/lib/api-client";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/dashboard";
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("admin@demo.com");
  const [senha, setSenha] = useState("admin1234");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/auth/login", { email, senha });
      router.push(next);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-(--text-primary)">
        Bem-vindo de volta
      </h1>
      <p className="mb-8 mt-2 text-sm text-(--text-secondary)">
        Entre com suas credenciais para acessar o painel.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="E-mail" htmlFor="email">
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </Field>
        <Field label="Senha" htmlFor="senha">
          <Input
            id="senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            autoComplete="current-password"
          />
        </Field>
        <Button
          type="submit"
          loading={loading}
          className="mt-2 w-full"
          size="lg"
        >
          Entrar
        </Button>
      </form>

      <div
        className="mt-6 rounded-xl border border-(--border) p-4 text-xs"
        style={{ background: "var(--accent-subtle)" }}
      >
        <p className="font-semibold text-(--accent)">Demo</p>
        <p className="mt-1 text-(--text-secondary)">
          admin@demo.com · admin1234
        </p>
      </div>

      <p className="mt-6 text-center text-sm text-(--text-secondary)">
        Não tem conta?{" "}
        <Link
          href="/signup"
          className="font-semibold text-(--accent) hover:underline"
        >
          Criar empresa
        </Link>
      </p>
    </div>
  );
}
