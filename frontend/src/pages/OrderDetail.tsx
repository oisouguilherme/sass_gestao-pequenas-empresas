import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, extractErrorMessage } from "@/lib/api";
import type {
  OrdemServico,
  OSStatus,
  Paginated,
  Produto,
  Usuario,
} from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { formatDate } from "@/lib/format";

type Tab = "dados" | "usuarios" | "produtos" | "status";

const STATUS_LABEL: Record<OSStatus, string> = {
  ABERTA: "Aberta",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("dados");

  const orderQ = useQuery({
    queryKey: ["order", id],
    queryFn: async () => (await api.get<OrdemServico>(`/orders/${id}`)).data,
    enabled: !!id,
  });

  const deleteMut = useMutation({
    mutationFn: async () => api.delete(`/orders/${id}`),
    onSuccess: () => {
      toast.success("OS removida");
      qc.invalidateQueries({ queryKey: ["orders"] });
      navigate("/orders");
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  if (orderQ.isLoading) {
    return <p className="text-sm text-slate-500">Carregando…</p>;
  }
  if (!orderQ.data) {
    return <p className="text-sm text-slate-500">OS não encontrada.</p>;
  }

  const os = orderQ.data;

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/orders"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {os.nome}
            </h1>
            <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
              <Badge
                tone={
                  os.status === "ABERTA"
                    ? "info"
                    : os.status === "EM_ANDAMENTO"
                      ? "warning"
                      : os.status === "CONCLUIDA"
                        ? "success"
                        : "danger"
                }
              >
                {STATUS_LABEL[os.status]}
              </Badge>
              <span>· criada em {formatDate(os.createdAt)}</span>
            </div>
          </div>
        </div>
        <Button
          variant="danger"
          size="sm"
          onClick={() => {
            if (confirm("Remover esta OS?")) deleteMut.mutate();
          }}
        >
          <Trash2 className="h-4 w-4" /> Excluir
        </Button>
      </div>

      <div className="mb-4 border-b border-slate-200">
        <nav className="-mb-px flex gap-6">
          {(
            [
              ["dados", "Dados"],
              ["usuarios", "Usuários"],
              ["produtos", "Produtos"],
              ["status", "Status"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key as Tab)}
              className={`border-b-2 px-1 py-3 text-sm font-medium transition ${
                tab === key
                  ? "border-brand-600 text-brand-600"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {tab === "dados" && <DadosTab os={os} />}
      {tab === "usuarios" && <UsuariosTab os={os} />}
      {tab === "produtos" && <ProdutosTab os={os} />}
      {tab === "status" && <StatusTab os={os} />}
    </>
  );
}

function DadosTab({ os }: { os: OrdemServico }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    nome: os.nome,
    descricao: os.descricao ?? "",
    deadlineAt: os.deadlineAt ? os.deadlineAt.slice(0, 16) : "",
    pago: os.pago,
  });

  const mut = useMutation({
    mutationFn: async () =>
      api.patch(`/orders/${os.id}`, {
        nome: form.nome,
        descricao: form.descricao || null,
        deadlineAt: form.deadlineAt || null,
        pago: form.pago,
      }),
    onSuccess: () => {
      toast.success("Salvo");
      qc.invalidateQueries({ queryKey: ["order", os.id] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  return (
    <Card>
      <CardBody className="space-y-4">
        <Input
          label="Nome"
          value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
        />
        <Textarea
          label="Descrição"
          rows={4}
          value={form.descricao}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })}
        />
        <Input
          label="Prazo"
          type="datetime-local"
          value={form.deadlineAt}
          onChange={(e) => setForm({ ...form, deadlineAt: e.target.value })}
        />
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.pago}
            onChange={(e) => setForm({ ...form, pago: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          Marcar como pago
        </label>
        <div className="flex justify-end">
          <Button onClick={() => mut.mutate()} loading={mut.isPending}>
            Salvar alterações
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function UsuariosTab({ os }: { os: OrdemServico }) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string[]>(
    os.usuarios.map((u) => u.usuarioId),
  );

  const usersQ = useQuery({
    queryKey: ["users", "all"],
    queryFn: async () =>
      (await api.get<Paginated<Usuario>>("/users?perPage=100")).data,
  });

  const mut = useMutation({
    mutationFn: async () =>
      api.put(`/orders/${os.id}/usuarios`, { usuarioIds: selected }),
    onSuccess: () => {
      toast.success("Atribuição atualizada (e-mail enviado aos novos)");
      qc.invalidateQueries({ queryKey: ["order", os.id] });
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const toggle = (id: string) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );

  return (
    <Card>
      <CardBody className="space-y-4">
        <p className="text-sm text-slate-600">
          Selecione os usuários responsáveis. Novos atribuídos receberão um
          e-mail.
        </p>
        <div className="max-h-72 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
          {usersQ.data?.data.map((u) => (
            <label
              key={u.id}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={selected.includes(u.id)}
                onChange={() => toggle(u.id)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm font-medium">{u.nome}</span>
              <span className="text-xs text-slate-500">{u.email}</span>
              <Badge tone="neutral">{u.role}</Badge>
            </label>
          ))}
        </div>
        <div className="flex justify-end">
          <Button onClick={() => mut.mutate()} loading={mut.isPending}>
            Salvar atribuições
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function ProdutosTab({ os }: { os: OrdemServico }) {
  const qc = useQueryClient();
  const [items, setItems] = useState(
    os.produtos.map((p) => ({
      produtoId: p.produtoId,
      quantidade: p.quantidade,
    })),
  );
  const [pickProductId, setPickProductId] = useState("");

  const productsQ = useQuery({
    queryKey: ["products", "all"],
    queryFn: async () =>
      (await api.get<Paginated<Produto>>("/products?perPage=200")).data,
  });

  const mut = useMutation({
    mutationFn: async () =>
      api.put(`/orders/${os.id}/produtos`, { produtos: items }),
    onSuccess: () => {
      toast.success("Produtos atualizados");
      qc.invalidateQueries({ queryKey: ["order", os.id] });
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const addItem = () => {
    if (!pickProductId) return;
    if (items.find((i) => i.produtoId === pickProductId)) return;
    setItems([...items, { produtoId: pickProductId, quantidade: 1 }]);
    setPickProductId("");
  };

  const findProduct = (id: string) =>
    productsQ.data?.data.find((p) => p.id === id);

  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex gap-2">
          <Select
            value={pickProductId}
            onChange={(e) => setPickProductId(e.target.value)}
            className="flex-1"
          >
            <option value="">Selecione um produto…</option>
            {productsQ.data?.data
              .filter((p) => !items.find((i) => i.produtoId === p.id))
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.codigo} — {p.nome}
                </option>
              ))}
          </Select>
          <Button onClick={addItem} disabled={!pickProductId}>
            Adicionar
          </Button>
        </div>

        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            Nenhum produto vinculado.
          </p>
        ) : (
          <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200">
            {items.map((it, idx) => {
              const p = findProduct(it.produtoId);
              return (
                <li key={it.produtoId} className="flex items-center gap-2 p-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {p?.nome ?? it.produtoId}
                    </p>
                    <p className="text-xs text-slate-500">{p?.codigo}</p>
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={it.quantidade}
                    onChange={(e) => {
                      const q = Math.max(1, Number(e.target.value) || 1);
                      const next = [...items];
                      next[idx] = { ...next[idx], quantidade: q };
                      setItems(next);
                    }}
                    className="w-20 rounded border border-slate-300 px-2 py-1 text-sm"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setItems(
                        items.filter((x) => x.produtoId !== it.produtoId),
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex justify-end">
          <Button onClick={() => mut.mutate()} loading={mut.isPending}>
            Salvar produtos
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function StatusTab({ os }: { os: OrdemServico }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<OSStatus>(os.status);

  const mut = useMutation({
    mutationFn: async () => api.patch(`/orders/${os.id}/status`, { status }),
    onSuccess: () => {
      toast.success("Status atualizado");
      qc.invalidateQueries({ queryKey: ["order", os.id] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  return (
    <Card>
      <CardBody className="space-y-4">
        <Select
          label="Status atual"
          value={status}
          onChange={(e) => setStatus(e.target.value as OSStatus)}
        >
          {(
            ["ABERTA", "EM_ANDAMENTO", "CONCLUIDA", "CANCELADA"] as OSStatus[]
          ).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
        <div className="flex justify-end">
          <Button
            onClick={() => mut.mutate()}
            disabled={status === os.status}
            loading={mut.isPending}
          >
            Atualizar status
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
