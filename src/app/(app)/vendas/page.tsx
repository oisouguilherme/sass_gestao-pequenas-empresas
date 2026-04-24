"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, PageHeader, Badge } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/api-client";
import { formatBRL, formatDate } from "@/lib/utils";

type SaleStatus = "EM_ANDAMENTO" | "FINALIZADA" | "CANCELADA";
type Pagamento = "CARTAO" | "PIX" | "DINHEIRO";

interface Sale {
  id: string;
  status: SaleStatus;
  tipoPagamento: Pagamento;
  valorTotal: string;
  desconto: string;
  valorFinal: string;
  createdAt: string;
  cancelAt: string | null;
  usuario: { id: string; nome: string };
  itens: {
    id: string;
    quantidade: number;
    precoUnitario: string;
    produto: { nome: string };
  }[];
}

interface Product {
  id: string;
  nome: string;
  preco: string;
  codigo: string | null;
}

export default function VendasPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<
    { produtoId: string; nome: string; preco: number; quantidade: number }[]
  >([]);
  const [tipoPagamento, setTipoPagamento] = useState<Pagamento>("PIX");
  const [desconto, setDesconto] = useState("0");
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      const data = await api.get<Sale[]>("/api/sales");
      setSales(data);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  useEffect(() => {
    queueMicrotask(load);
  }, []);

  async function openNew() {
    setCart([]);
    setDesconto("0");
    setTipoPagamento("PIX");
    setSearch("");
    setOpen(true);
    if (products.length === 0) {
      try {
        setProducts(await api.get<Product[]>("/api/products"));
      } catch (err) {
        toast.error((err as Error).message);
      }
    }
  }

  function addProduct(p: Product) {
    setCart((c) => {
      const existing = c.find((i) => i.produtoId === p.id);
      if (existing) {
        return c.map((i) =>
          i.produtoId === p.id ? { ...i, quantidade: i.quantidade + 1 } : i,
        );
      }
      return [
        ...c,
        {
          produtoId: p.id,
          nome: p.nome,
          preco: Number(p.preco),
          quantidade: 1,
        },
      ];
    });
  }

  function setQty(id: string, q: number) {
    setCart((c) =>
      c.map((i) =>
        i.produtoId === id ? { ...i, quantidade: Math.max(1, q) } : i,
      ),
    );
  }

  function removeFromCart(id: string) {
    setCart((c) => c.filter((i) => i.produtoId !== id));
  }

  const total = useMemo(
    () => cart.reduce((acc, i) => acc + i.preco * i.quantidade, 0),
    [cart],
  );
  const final = Math.max(0, total - Number(desconto || 0));

  const filteredProducts = useMemo(() => {
    if (!search) return products.slice(0, 8);
    const s = search.toLowerCase();
    return products
      .filter(
        (p) =>
          p.nome.toLowerCase().includes(s) ||
          (p.codigo ?? "").toLowerCase().includes(s),
      )
      .slice(0, 8);
  }, [search, products]);

  async function checkout(finalize: boolean) {
    if (cart.length === 0) {
      toast.error("Carrinho vazio");
      return;
    }
    setLoading(true);
    try {
      const sale = await api.post<Sale>("/api/sales", {
        tipoPagamento,
        desconto: Number(desconto || 0),
        itens: cart.map((i) => ({
          produtoId: i.produtoId,
          quantidade: i.quantidade,
        })),
      });
      if (finalize) {
        await api.post(`/api/sales/${sale.id}/finalize`);
      }
      toast.success(finalize ? "Venda finalizada" : "Venda criada");
      setOpen(false);
      load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function cancelSale(id: string) {
    if (!confirm("Cancelar esta venda?")) return;
    try {
      await api.post(`/api/sales/${id}/cancel`);
      toast.success("Venda cancelada");
      load();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function finalizeSale(id: string) {
    try {
      await api.post(`/api/sales/${id}/finalize`);
      toast.success("Finalizada");
      load();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <>
      <PageHeader
        title="Vendas"
        actions={<Button onClick={openNew}>Nova venda</Button>}
      />
      <div className="grid gap-3">
        {sales.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhuma venda.</p>
        ) : (
          sales.map((s) => (
            <Card key={s.id} className="flex items-center justify-between">
              <div>
                <p className="text-base font-semibold">
                  {formatBRL(Number(s.valorFinal))}
                </p>
                <p className="text-xs text-gray-500">
                  {s.itens.length} item(ns) • {s.tipoPagamento} •{" "}
                  {s.usuario.nome} • {formatDate(s.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  tone={
                    s.status === "CANCELADA"
                      ? "red"
                      : s.status === "FINALIZADA"
                        ? "green"
                        : "amber"
                  }
                >
                  {s.status}
                </Badge>
                {s.status === "EM_ANDAMENTO" && (
                  <>
                    <Button size="sm" onClick={() => finalizeSale(s.id)}>
                      Finalizar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => cancelSale(s.id)}
                    >
                      Cancelar
                    </Button>
                  </>
                )}
                {s.status === "FINALIZADA" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => cancelSale(s.id)}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Nova venda"
        className="max-w-2xl"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Field label="Buscar produto (nome ou código)">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Digite..."
              />
            </Field>
            <ul className="mt-2 max-h-64 divide-y divide-gray-100 overflow-auto rounded border border-gray-200">
              {filteredProducts.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{p.nome}</p>
                    <p className="text-xs text-gray-500">
                      {p.codigo ?? "—"} • {formatBRL(Number(p.preco))}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addProduct(p)}
                  >
                    Adicionar
                  </Button>
                </li>
              ))}
              {filteredProducts.length === 0 && (
                <li className="p-3 text-sm text-gray-500">Sem resultados.</li>
              )}
            </ul>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-gray-700">Carrinho</p>
            {cart.length === 0 ? (
              <p className="text-sm text-gray-500">Vazio.</p>
            ) : (
              <ul className="mb-3 divide-y divide-gray-100 text-sm">
                {cart.map((i) => (
                  <li
                    key={i.produtoId}
                    className="flex items-center justify-between gap-2 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{i.nome}</p>
                      <p className="text-xs text-gray-500">
                        {formatBRL(i.preco)}
                      </p>
                    </div>
                    <input
                      type="number"
                      min={1}
                      value={i.quantidade}
                      onChange={(e) =>
                        setQty(i.produtoId, Number(e.target.value))
                      }
                      className="h-8 w-14 rounded border border-gray-300 px-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeFromCart(i.produtoId)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      remover
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <Field label="Pagamento">
              <Select
                value={tipoPagamento}
                onChange={(e) => setTipoPagamento(e.target.value as Pagamento)}
              >
                <option value="PIX">Pix</option>
                <option value="CARTAO">Cartão</option>
                <option value="DINHEIRO">Dinheiro</option>
              </Select>
            </Field>
            <Field label="Desconto">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={desconto}
                onChange={(e) => setDesconto(e.target.value)}
              />
            </Field>
            <div className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Total:</span>
                <span>{formatBRL(total)}</span>
              </div>
              <div className="flex justify-between">
                <span>Desconto:</span>
                <span>- {formatBRL(Number(desconto || 0))}</span>
              </div>
              <div className="flex justify-between text-base font-semibold">
                <span>A pagar:</span>
                <span>{formatBRL(final)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => checkout(false)}
            loading={loading}
          >
            Salvar (em andamento)
          </Button>
          <Button
            type="button"
            onClick={() => checkout(true)}
            loading={loading}
          >
            Finalizar
          </Button>
        </div>
      </Modal>
    </>
  );
}
