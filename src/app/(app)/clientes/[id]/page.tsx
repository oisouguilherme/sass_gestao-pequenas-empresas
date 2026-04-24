"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Card, PageHeader, Badge } from "@/components/ui/card";
import { api } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";

interface CustomerDetail {
  id: string;
  nome: string;
  documento: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  ordens: {
    id: string;
    nome: string;
    status: string;
    pago: boolean;
    deadlineAt: string | null;
    createdAt: string;
  }[];
}

export default function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<CustomerDetail | null>(null);

  useEffect(() => {
    api
      .get<CustomerDetail>(`/api/customers/${id}`)
      .then(setData)
      .catch(() => undefined);
  }, [id]);

  if (!data) return <p className="text-sm text-gray-500">Carregando...</p>;

  return (
    <>
      <PageHeader title={data.nome} description={data.documento ?? "—"} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-2 text-sm font-semibold text-gray-700">Contato</h2>
          <dl className="space-y-1 text-sm">
            <Row k="Telefone" v={data.telefone} />
            <Row k="E-mail" v={data.email} />
            <Row k="Endereço" v={data.endereco} />
          </dl>
        </Card>
        <Card>
          <h2 className="mb-2 text-sm font-semibold text-gray-700">
            Ordens de Serviço
          </h2>
          {data.ordens.length === 0 ? (
            <p className="text-sm text-gray-500">Sem OS vinculadas.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.ordens.map((o) => (
                <li
                  key={o.id}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <div>
                    <Link
                      href={`/os/${o.id}`}
                      className="font-medium hover:underline"
                    >
                      {o.nome}
                    </Link>
                    <p className="text-xs text-gray-500">
                      Criada {formatDate(o.createdAt)} • Prazo{" "}
                      {o.deadlineAt ? formatDate(o.deadlineAt) : "—"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {o.pago ? <Badge tone="green">Pago</Badge> : null}
                    <Badge tone="blue">{o.status.replace(/_/g, " ")}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

function Row({ k, v }: { k: string; v: string | null }) {
  return (
    <div className="flex gap-2">
      <dt className="w-20 text-gray-500">{k}:</dt>
      <dd className="flex-1 text-gray-800">{v ?? "—"}</dd>
    </div>
  );
}
