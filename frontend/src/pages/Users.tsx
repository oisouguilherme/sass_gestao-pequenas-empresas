import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { api, extractErrorMessage } from '@/lib/api'
import type { Paginated, Role, Usuario } from '@/lib/types'
import { useAuth } from '@/contexts/AuthContext'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { DataTable, Pagination } from '@/components/ui/DataTable'
import { SearchInput } from '@/components/ui/SearchInput'

interface UserForm {
  nome: string
  email: string
  senha: string
  telefone: string
  role: Role
}

const empty: UserForm = {
  nome: '',
  email: '',
  senha: '',
  telefone: '',
  role: 'OPERADOR',
}

const ROLE_TONE: Record<Role, 'brand' | 'info' | 'neutral'> = {
  ADMIN: 'brand',
  VENDEDOR: 'info',
  OPERADOR: 'neutral',
}

export default function UsersPage() {
  const { user: me } = useAuth()
  const qc = useQueryClient()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Usuario | null>(null)
  const [form, setForm] = useState<UserForm>(empty)

  const usersQ = useQuery({
    queryKey: ['users', page, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        perPage: '10',
      })
      if (search) params.set('q', search)
      return (await api.get<Paginated<Usuario>>(`/users?${params}`)).data
    },
  })

  const createMut = useMutation({
    mutationFn: async (data: UserForm) =>
      api.post('/users', {
        ...data,
        telefone: data.telefone || undefined,
      }),
    onSuccess: () => {
      toast.success('Usuário criado')
      qc.invalidateQueries({ queryKey: ['users'] })
      closeModal()
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  })

  const updateMut = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UserForm }) => {
      const body: Record<string, unknown> = {
        nome: data.nome,
        email: data.email,
        role: data.role,
        telefone: data.telefone || null,
      }
      if (data.senha) body.senha = data.senha
      return api.patch(`/users/${id}`, body)
    },
    onSuccess: () => {
      toast.success('Usuário atualizado')
      qc.invalidateQueries({ queryKey: ['users'] })
      closeModal()
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      toast.success('Usuário removido')
      qc.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  })

  const openCreate = () => {
    setEditing(null)
    setForm(empty)
    setModalOpen(true)
  }

  const openEdit = (u: Usuario) => {
    setEditing(u)
    setForm({
      nome: u.nome,
      email: u.email,
      senha: '',
      telefone: u.telefone ?? '',
      role: u.role,
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    setForm(empty)
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (editing) updateMut.mutate({ id: editing.id, data: form })
    else createMut.mutate(form)
  }

  return (
    <>
      <PageHeader
        title="Usuários"
        description="Equipe que acessa o sistema"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Novo usuário
          </Button>
        }
      />

      <div className="mb-4 max-w-md">
        <SearchInput
          value={search}
          onChange={(v) => {
            setPage(1)
            setSearch(v)
          }}
          placeholder="Buscar por nome ou e-mail…"
        />
      </div>

      <DataTable<Usuario>
        loading={usersQ.isLoading}
        rows={usersQ.data?.data ?? []}
        rowKey={(u) => u.id}
        columns={[
          { key: 'nome', header: 'Nome' },
          { key: 'email', header: 'E-mail' },
          {
            key: 'telefone',
            header: 'Telefone',
            render: (u) => u.telefone ?? '—',
          },
          {
            key: 'role',
            header: 'Função',
            render: (u) => <Badge tone={ROLE_TONE[u.role]}>{u.role}</Badge>,
          },
          {
            key: 'acoes',
            header: '',
            className: 'text-right',
            render: (u) => (
              <div className="flex justify-end gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openEdit(u)}
                  aria-label="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                {me?.id !== u.id && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm(`Remover "${u.nome}"?`)) deleteMut.mutate(u.id)
                    }}
                    aria-label="Remover"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            ),
          },
        ]}
      />

      {usersQ.data && (
        <Pagination
          page={usersQ.data.meta.page}
          perPage={usersQ.data.meta.perPage}
          total={usersQ.data.meta.total}
          lastPage={usersQ.data.meta.lastPage}
          onChange={setPage}
        />
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Editar usuário' : 'Novo usuário'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={closeModal}>
              Cancelar
            </Button>
            <Button
              onClick={onSubmit as unknown as () => void}
              loading={createMut.isPending || updateMut.isPending}
            >
              {editing ? 'Salvar' : 'Criar'}
            </Button>
          </>
        }
      >
        <form
          onSubmit={onSubmit}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <Input
            label="Nome"
            required
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            className="sm:col-span-2"
          />
          <Input
            label="E-mail"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Telefone"
            value={form.telefone}
            onChange={(e) => setForm({ ...form, telefone: e.target.value })}
          />
          <Input
            label={editing ? 'Nova senha (opcional)' : 'Senha'}
            type="password"
            required={!editing}
            value={form.senha}
            onChange={(e) => setForm({ ...form, senha: e.target.value })}
            hint="Mínimo 6 caracteres"
          />
          <Select
            label="Função"
            value={form.role}
            onChange={(e) =>
              setForm({ ...form, role: e.target.value as Role })
            }
          >
            <option value="ADMIN">Administrador</option>
            <option value="VENDEDOR">Vendedor</option>
            <option value="OPERADOR">Operador</option>
          </Select>
          <button type="submit" hidden />
        </form>
      </Modal>
    </>
  )
}
