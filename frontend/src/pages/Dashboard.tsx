import { useQuery } from '@tanstack/react-query'
import {
  ClipboardList,
  Package,
  ScanBarcode,
  TrendingUp,
  Users,
} from 'lucide-react'
import { api } from '@/lib/api'
import { formatBRL } from '@/lib/format'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type {
  Cliente,
  OrdemServico,
  Paginated,
  Produto,
  ReportSales,
} from '@/lib/types'
import { useAuth } from '@/contexts/AuthContext'
import { Link } from 'react-router-dom'

interface KpiProps {
  label: string
  value: string | number
  icon: React.ReactNode
  hint?: string
}

function Kpi({ label, value, icon, hint }: KpiProps) {
  return (
    <Card>
      <CardBody className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          {icon}
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {hint && <p className="text-xs text-slate-400">{hint}</p>}
        </div>
      </CardBody>
    </Card>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const canSeeReports = user?.role === 'ADMIN' || user?.role === 'VENDEDOR'

  const reportsQ = useQuery({
    queryKey: ['reports', 'sales', 'dashboard'],
    queryFn: async () => (await api.get<ReportSales>('/reports/sales')).data,
    enabled: canSeeReports,
  })

  const productsQ = useQuery({
    queryKey: ['products', 'count'],
    queryFn: async () =>
      (await api.get<Paginated<Produto>>('/products?perPage=1')).data,
  })

  const clientsQ = useQuery({
    queryKey: ['clients', 'count'],
    queryFn: async () =>
      (await api.get<Paginated<Cliente>>('/clients?perPage=1')).data,
  })

  const ordersQ = useQuery({
    queryKey: ['orders', 'recent'],
    queryFn: async () =>
      (await api.get<Paginated<OrdemServico>>('/orders?perPage=5')).data,
  })

  return (
    <>
      <PageHeader
        title={`Olá, ${user?.nome.split(' ')[0]}`}
        description="Visão geral da sua operação"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {canSeeReports && (
          <>
            <Kpi
              label="Total vendido"
              value={formatBRL(reportsQ.data?.totais.totalVendido ?? 0)}
              icon={<TrendingUp className="h-6 w-6" />}
              hint="Vendas finalizadas"
            />
            <Kpi
              label="Vendas"
              value={reportsQ.data?.totais.numeroVendas ?? 0}
              icon={<ScanBarcode className="h-6 w-6" />}
              hint={`Ticket médio ${formatBRL(reportsQ.data?.totais.ticketMedio ?? 0)}`}
            />
          </>
        )}
        <Kpi
          label="Produtos"
          value={productsQ.data?.meta.total ?? 0}
          icon={<Package className="h-6 w-6" />}
        />
        <Kpi
          label="Clientes"
          value={clientsQ.data?.meta.total ?? 0}
          icon={<Users className="h-6 w-6" />}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h2 className="font-semibold text-slate-900">
              Ordens de serviço recentes
            </h2>
            <Link
              to="/orders"
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Ver todas →
            </Link>
          </div>
          <CardBody>
            {ordersQ.isLoading ? (
              <p className="py-8 text-center text-sm text-slate-500">
                Carregando…
              </p>
            ) : (ordersQ.data?.data.length ?? 0) === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                Nenhuma OS cadastrada.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {ordersQ.data?.data.map((os) => (
                  <li
                    key={os.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <Link
                        to={`/orders/${os.id}`}
                        className="font-medium text-slate-900 hover:text-brand-600"
                      >
                        {os.nome}
                      </Link>
                      <p className="text-xs text-slate-500">
                        {os.usuarios.length} responsáve{os.usuarios.length === 1 ? 'l' : 'is'}
                      </p>
                    </div>
                    <OSStatusBadge status={os.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {canSeeReports && (
          <Card>
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="font-semibold text-slate-900">
                Vendas por usuário
              </h2>
            </div>
            <CardBody>
              {(reportsQ.data?.porUsuario.length ?? 0) === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  Sem vendas no período.
                </p>
              ) : (
                <ul className="space-y-3">
                  {reportsQ.data?.porUsuario.map((u) => (
                    <li
                      key={u.usuarioId}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {u.usuarioNome}
                        </p>
                        <p className="text-xs text-slate-500">
                          {u.numeroVendas} venda
                          {u.numeroVendas === 1 ? '' : 's'}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">
                        {formatBRL(u.totalVendido)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <QuickAction
          to="/sales"
          label="Abrir PDV"
          icon={<ScanBarcode className="h-5 w-5" />}
        />
        <QuickAction
          to="/orders"
          label="Nova OS"
          icon={<ClipboardList className="h-5 w-5" />}
        />
        <QuickAction
          to="/products"
          label="Cadastrar produto"
          icon={<Package className="h-5 w-5" />}
        />
      </div>
    </>
  )
}

function OSStatusBadge({ status }: { status: OrdemServico['status'] }) {
  const map = {
    ABERTA: { tone: 'info' as const, label: 'Aberta' },
    EM_ANDAMENTO: { tone: 'warning' as const, label: 'Em andamento' },
    CONCLUIDA: { tone: 'success' as const, label: 'Concluída' },
    CANCELADA: { tone: 'danger' as const, label: 'Cancelada' },
  }
  const cfg = map[status]
  return <Badge tone={cfg.tone}>{cfg.label}</Badge>
}

function QuickAction({
  to,
  label,
  icon,
}: {
  to: string
  label: string
  icon: React.ReactNode
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        {icon}
      </span>
      {label}
    </Link>
  )
}
