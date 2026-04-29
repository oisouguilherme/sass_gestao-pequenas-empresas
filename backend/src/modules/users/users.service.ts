import type { Prisma } from '@prisma/client'
import { prisma } from '@/shared/config/prisma.js'
import { hashPassword } from '@/shared/utils/hash.js'
import { ConflictError, NotFoundError } from '@/shared/errors/AppError.js'
import {
  buildPagination,
  paginatedResult,
  type PaginationQuery,
} from '@/shared/utils/pagination.js'
import type { CreateUserInput, UpdateUserInput } from './users.schema.js'

const SAFE_SELECT = {
  id: true,
  nome: true,
  email: true,
  telefone: true,
  role: true,
  empresaId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UsuarioSelect

export async function list(empresaId: string, query: PaginationQuery) {
  const where: Prisma.UsuarioWhereInput = {
    empresaId,
    deletedAt: null,
    ...(query.q && {
      OR: [
        { nome: { contains: query.q, mode: 'insensitive' } },
        { email: { contains: query.q, mode: 'insensitive' } },
      ],
    }),
  }

  const [data, total] = await Promise.all([
    prisma.usuario.findMany({
      where,
      select: SAFE_SELECT,
      orderBy: { createdAt: 'desc' },
      ...buildPagination(query),
    }),
    prisma.usuario.count({ where }),
  ])

  return paginatedResult(data, total, query)
}

export async function findById(empresaId: string, id: string) {
  const user = await prisma.usuario.findFirst({
    where: { id, empresaId, deletedAt: null },
    select: SAFE_SELECT,
  })
  if (!user) throw new NotFoundError('Usuário não encontrado')
  return user
}

export async function create(empresaId: string, input: CreateUserInput) {
  const existing = await prisma.usuario.findUnique({ where: { email: input.email } })
  if (existing) throw new ConflictError('E-mail já cadastrado')

  const senha = await hashPassword(input.senha)
  return prisma.usuario.create({
    data: { ...input, senha, empresaId },
    select: SAFE_SELECT,
  })
}

export async function update(empresaId: string, id: string, input: UpdateUserInput) {
  await findById(empresaId, id) // garante tenant

  if (input.email) {
    const existing = await prisma.usuario.findUnique({ where: { email: input.email } })
    if (existing && existing.id !== id) throw new ConflictError('E-mail já cadastrado')
  }

  const data: Prisma.UsuarioUpdateInput = { ...input }
  if (input.senha) data.senha = await hashPassword(input.senha)

  return prisma.usuario.update({
    where: { id },
    data,
    select: SAFE_SELECT,
  })
}

export async function remove(empresaId: string, id: string, currentUserId: string) {
  if (id === currentUserId) {
    throw new ConflictError('Você não pode remover o próprio usuário')
  }
  await findById(empresaId, id)
  await prisma.usuario.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
}
