import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ScanBarcode, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { api, extractErrorMessage } from '@/lib/api'
import type { Paginated, TipoPagamento, Venda } from '@/lib/types'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatBRL, formatDate } from '@/lib/format'

export default function SalesPage() {
  const qc = useQueryClient()
  const [activeSale, setActiveSale] = useState<Venda | null>(null)
  const [codigo, setCodigo] = useState('')
  const [quantidade, setQuantidade] = useState(1)
  const [desconto, setDesconto] = useState('0')
  const [tipoPagamento, setTipoPagamento] = useState<TipoPagamento>('DINHEIRO')
  const inputRef = useRef<HTMLInputElement>(null)

  // Lista as últimas vendas
  const salesQ = useQuery({
    queryKey: ['sales', 'recent'],
    queryFn: async () =>
      (await api.get<Paginated<Venda>>('/sales?perPage=10')).data,
  })

  useEffect(() => {
    if (activeSale) inputRef.current?.focus()
  }, [activeSale])

  const createMut = useMutation({
    mutationFn: async () => (await api.post<Venda>('/sales', {})).data,
    onSuccess: (sale) => {
      setActiveSale(sale)
      setDesconto('0')
      setTipoPagamento('DINHEIRO')
      qc.invalidateQueries({ queryKey: ['sales'] })
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  })

  const addItemMut = useMutation({
    mutationFn: async ({
      saleId,
      codigo,
      quantidade,
    }: {
      saleId: string
      codigo: string
      quantidade: number
    }) =>
      (
        await api.post<Venda>(`/sales/${saleId}/itens`, {
          codigo,
          quantidade,
        })
      ).data,
    onSuccess: (sale) => {
      setActiveSale(sale)
      setCodigo('')
      setQuantidade(1)
      inputRef.current?.focus()
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  })

  const removeItemMut = useMutation({
    mutationFn: async ({
      saleId,
      produtoId,
    }: {
      saleId: string
      produtoId: string
    }) =>
      (await api.delete<Venda>(`/sales/${saleId}/itens/${produtoId}`)).data,
    onSuccess: (sale) => setActiveSale(sale),
    onError: (e) => toast.error(extractErrorMessage(e)),
  })

  const discountMut = useMutation({
    mutationFn: async ({
      saleId,
      desconto,
    }: {
      saleId: string
      desconto: number
    }) =>
      (
        await api.patch<Venda>(`/sales/${saleId}/desconto`, { desconto })
      ).data,
    onSuccess: (sale) => setActiveSale(sale),
    onError: (e) => toast.error(extractErrorMessage(e)),
  })

  const finalizeMut = useMutation({
    mutationFn: async ({
      saleId,
      tipoPagamento,
    }: {
      saleId: string
      tipoPagamento: TipoPagamento
    }) =>
      (
        await api.post<Venda>(`/sales/${saleId}/finalizar`, {
          tipoPagamento,
        })
      ).data,
    onSuccess: () => {
      toast.success('Venda finalizada!')
      setActiveSale(null)
      qc.invalidateQueries({ queryKey: ['sales'] })
      qc.invalidateQueries({ queryKey: ['reports'] })
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  })

  const cancelMut = useMutation({
    mutationFn: async (saleId: string) =>
      (await api.post<Venda>(`/sales/${saleId}/cancelar`)).data,
    onSuccess: () => {
      toast.success('Venda cancelada')
      setActiveSale(null)
      qc.invalidateQueries({ queryKey: ['sales'] })
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  })

  const onAddItem = (e: FormEvent) => {
    e.preventDefault()
    if (!activeSale) return
    const code = codigo.trim()
    if (!code) return
    addItemMut.mutate({
      saleId: activeSale.id,
      codigo: code,
      quantidade: Math.max(1, quantidade),
    })
  }

  const applyDiscount = () => {
    if (!activeSale) return
    discountMut.mutate({
      saleId: activeSale.id,
      desconto: Math.max(0, Number(desconto) || 0),
    })
  }

  return (
    <>
      <PageHeader
        title="PDV — Ponto de Venda"
        description="Bipe ou digite o código do produto para adicionar à venda"
        actions={
          !activeSale && (
            <Button
              size="lg"
              onClick={() => createMut.mutate()}
              loading={createMut.isPending}
            >
              <ScanBarcode className="h-5 w-5" /> Iniciar venda
            </Button>
          )
        }
      />

      {!activeSale ? (
        <Card>
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="font-semibold text-slate-900">Vendas recentes</h2>
          </div>
          <CardBody>
            {salesQ.isLoading ? (
              <p className="py-6 text-center text-sm text-slate-500">
                Carregando…
              </p>
            ) : (salesQ.data?.data.length ?? 0) === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">
                Nenhuma venda ainda. Clique em <b>Iniciar venda</b>.
              </p>
            ) : (
              <ul className="divide-y divide-slate-200">
                {salesQ.data?.data.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        Venda #{s.id.slice(-8)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDate(s.createdAt)} ·{' '}
                        {s.produtos.length} ite
                        {s.produtos.length === 1 ? 'm' : 'ns'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">
                        {formatBRL(s.valorFinal)}
                      </span>
                      <Badge
                        tone={
                          s.status === 'FINALIZADA'
                            ? 'success'
                            : s.status === 'ABERTA'
                              ? 'info'
                              : 'danger'
                        }
                      >
                        {s.status}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Coluna principal: scanner + itens */}
          <div className="space-y-4 lg:col-span-2">
            <Card>
              <CardBody>
                <form onSubmit={onAddItem} className="flex gap-2">
                  <Input
                    ref={inputRef}
                    autoFocus
                    label="Código do produto"
                    placeholder="Bipe ou digite e pressione Enter"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    className="font-mono"
                    autoComplete="off"
                  />
                  <div className="w-24">
                    <Input
                      label="Qtd"
                      type="number"
                      min={1}
                      value={quantidade}
                      onChange={(e) =>
                        setQuantidade(Math.max(1, Number(e.target.value) || 1))
                      }
                    />
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" loading={addItemMut.isPending}>
                      Adicionar
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>

            <Card>
              <div className="border-b border-slate-200 px-6 py-4">
                <h2 className="font-semibold text-slate-900">
                  Itens ({activeSale.produtos.length})
                </h2>
              </div>
              <CardBody>
                {activeSale.produtos.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-500">
                    Nenhum item adicionado.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-200">
                    {activeSale.produtos.map((it) => (
                      <li
                        key={it.produtoId}
                        className="flex items-center justify-between py-3"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">
                            {it.produto.nome}
                          </p>
                          <p className="text-xs text-slate-500">
                            {it.produto.codigo} · {formatBRL(it.precoUnitario)}{' '}
                            × {it.quantidade}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">
                            {formatBRL(it.subtotal)}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              removeItemMut.mutate({
                                saleId: activeSale.id,
                                produtoId: it.produtoId,
                              })
                            }
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Coluna lateral: resumo + finalização */}
          <div className="space-y-4">
            <Card>
              <div className="border-b border-slate-200 px-6 py-4">
                <h2 className="font-semibold text-slate-900">Resumo</h2>
              </div>
              <CardBody className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-medium">
                    {formatBRL(activeSale.valorTotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Desconto</span>
                  <span className="font-medium text-red-600">
                    − {formatBRL(activeSale.desconto)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-bold">
                  <span>Total</span>
                  <span>{formatBRL(activeSale.valorFinal)}</span>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    label="Desconto (R$)"
                    type="number"
                    min="0"
                    step="0.01"
                    value={desconto}
                    onChange={(e) => setDesconto(e.target.value)}
                  />
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={applyDiscount}
                      loading={discountMut.isPending}
                    >
                      Aplicar
                    </Button>
                  </div>
                </div>

                <Select
                  label="Pagamento"
                  value={tipoPagamento}
                  onChange={(e) =>
                    setTipoPagamento(e.target.value as TipoPagamento)
                  }
                >
                  <option value="DINHEIRO">Dinheiro</option>
                  <option value="CARTAO">Cartão</option>
                  <option value="PIX">PIX</option>
                  <option value="BOLETO">Boleto</option>
                </Select>

                <Button
                  size="lg"
                  className="w-full"
                  onClick={() =>
                    finalizeMut.mutate({
                      saleId: activeSale.id,
                      tipoPagamento,
                    })
                  }
                  loading={finalizeMut.isPending}
                  disabled={activeSale.produtos.length === 0}
                >
                  Finalizar venda
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-red-600 hover:bg-red-50"
                  onClick={() => {
                    if (confirm('Cancelar esta venda?'))
                      cancelMut.mutate(activeSale.id)
                  }}
                  loading={cancelMut.isPending}
                >
                  <X className="h-4 w-4" /> Cancelar venda
                </Button>
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </>
  )
}
