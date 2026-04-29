import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { api, extractErrorMessage } from '@/lib/api'
import type { OrdemServico, OSStatus, Paginated, Usuario } from '@/lib/types'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { DataTable, Pagination } from '@/components/ui/DataTable'
import { SearchInput } from '@/components/ui/SearchInput'
import { formatDate } from '@/lib/format'

const STATUS_LABEL: Record<OSStatus, { tone: 'info' | 'warning' | 'success' | 'danger'; label: string }> = {
  ABERTA: { tone: 'info', label: 'Aberta' },
  EM_ANDAMENTO: { tone: 'warning', label: 'Em andamento' },
  CONCLUIDA: { tone: 'success', label: 'Concluída' },
  CANCELADA: { tone: 'danger', label: 'Cancelada' },
}

interface OrderForm {
  nome: string
  descricao: string
  deadlineAt: string
  usuarioIds: string[]
}

const empty: OrderForm = {
  nome: '',
  descricao: '',
  deadlineAt: '',
  usuarioIds: [],
}

export default function OrdersPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<OSStatus | ''>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<OrderForm>(empty)

  const ordersQ = useQuery({
    queryKey: ['orders', page, search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        perPage: '10',
      })
      if (search) params.set('q', search)
      if (statusFilter) params.set('status', statusFilter)
      return (await api.get<Paginated<OrdemServico>>(`/orders?${params}`)).data
    },
  })

  const usersQ = useQuery({
    queryKey: ['users', 'all'],
    queryFn: async () =>
      (await api.get<Paginated<Usuario>>('/users?perPage=100')).data,
  })

  const createMut = useMutation({
    mutationFn: async (data: OrderForm) =>
      api.post('/orders', {
        nome: data.nome,
        descricao: data.descricao || undefined,
        deadlineAt: data.deadlineAt || undefined,
        usuarioIds: data.usuarioIds.length ? data.usuarioIds : undefined,
      }),
    onSuccess: () => {
      toast.success('OS criada')
      qc.invalidateQueries({ queryKey: ['orders'] })
      setModalOpen(false)
      setForm(empty)
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  })

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    createMut.mutate(form)
  }

  const toggleUser = (id: string) => {
    setForm((f) => ({
      ...f,
      usuarioIds: f.usuarioIds.includes(id)
        ? f.usuarioIds.filter((u) => u !== id)
        : [...f.usuarioIds, id],
    }))
  }

  return (
    <>
      <PageHeader
        title="Ordens de Serviço"
        description="Gerencie as OSs e atribua responsáveis"
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" /> Nova OS
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <SearchInput
            value={search}
            onChange={(v) => {
              setPage(1)
              setSearch(v)
            }}
            placeholder="Buscar por nome…"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => {
            setPage(1)
            setStatusFilter(e.target.value as OSStatus | '')
          }}
        >
          <option value="">Todos os status</option>
          <option value="ABERTA">Aberta</option>
          <option value="EM_ANDAMENTO">Em andamento</option>
          <option value="CONCLUIDA">Concluída</option>
          <option value="CANCELADA">Cancelada</option>
        </Select>
      </div>

      <DataTable<OrdemServico>
        loading={ordersQ.isLoading}
        rows={ordersQ.data?.data ?? []}
        rowKey={(o) => o.id}
        columns={[
          {
            key: 'nome',
            header: 'OS',
            render: (o) => (
              <Link
                to={`/orders/${o.id}`}
                className="font-medium text-brand-600 hover:text-brand-700"
              >
                {o.nome}
              </Link>
            ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (o) => (
              <Badge tone={STATUS_LABEL[o.status].tone}>
                {STATUS_LABEL[o.status].label}
              </Badge>
            ),
          },
          {
            key: 'responsaveis',
            header: 'Responsáveis',
            render: (o) =>
              o.usuarios.length > 0
                ? o.usuarios.map((u) => u.usuario.nome).join(', ')
                : '—',
          },
          {
            key: 'deadline',
            header: 'Prazo',
            render: (o) => formatDate(o.deadlineAt),
          },
          {
            key: 'pago',
            header: 'Pago',
            render: (o) =>
              o.pago ? (
                <Badge tone="success">Sim</Badge>
              ) : (
                <Badge tone="neutral">Não</Badge>
              ),
          },
        ]}
      />

      {ordersQ.data && (
        <Pagination
          page={ordersQ.data.meta.page}
          perPage={ordersQ.data.meta.perPage}
          total={ordersQ.data.meta.total}
          lastPage={ordersQ.data.meta.lastPage}
          onChange={setPage}
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setForm(empty)
        }}
        title="Nova ordem de serviço"
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setModalOpen(false)
                setForm(empty)
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={onSubmit as unknown as () => void}
              loading={createMut.isPending}
            >
              Criar
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
          <Textarea
            label="Descrição"
            rows={3}
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          />
          <Input
            label="Prazo"
            type="datetime-local"
            value={form.deadlineAt}
            onChange={(e) => setForm({ ...form, deadlineAt: e.target.value })}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Atribuir a
            </label>
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
              {usersQ.data?.data.map((u) => (
                <label
                  key={u.id}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={form.usuarioIds.includes(u.id)}
                    onChange={() => toggleUser(u.id)}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm">{u.nome}</span>
                  <Badge tone="neutral">{u.role}</Badge>
                </label>
              ))}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Quem for atribuído receberá um e-mail.
            </p>
          </div>
          <button type="submit" hidden />
        </form>
      </Modal>
    </>
  )
}
