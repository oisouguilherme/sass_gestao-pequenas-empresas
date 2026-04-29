import type { Prisma } from '@prisma/client'
import { prisma } from '@/shared/config/prisma.js'
import { NotFoundError } from '@/shared/errors/AppError.js'
import {
  buildPagination,
  paginatedResult,
  type PaginationQuery,
} from '@/shared/utils/pagination.js'
import type { CreateProductInput, UpdateProductInput } from './products.schema.js'

export async function list(empresaId: string, query: PaginationQuery) {
  const where: Prisma.ProdutoWhereInput = {
    empresaId,
    deletedAt: null,
    ...(query.q && {
      OR: [
        { nome: { contains: query.q, mode: 'insensitive' } },
        { codigo: { contains: query.q, mode: 'insensitive' } },
      ],
    }),
  }

  const [data, total] = await Promise.all([
    prisma.produto.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      ...buildPagination(query),
    }),
    prisma.produto.count({ where }),
  ])

  return paginatedResult(data, total, query)
}

export async function findById(empresaId: string, id: string) {
  const product = await prisma.produto.findFirst({
    where: { id, empresaId, deletedAt: null },
  })
  if (!product) throw new NotFoundError('Produto não encontrado')
  return product
}

export async function findByCodigo(empresaId: string, codigo: string) {
  const product = await prisma.produto.findFirst({
    where: { empresaId, codigo, deletedAt: null },
  })
  if (!product) throw new NotFoundError('Produto não encontrado')
  return product
}

export async function create(empresaId: string, input: CreateProductInput) {
  return prisma.produto.create({
    data: { ...input, empresaId },
  })
}

export async function update(empresaId: string, id: string, input: UpdateProductInput) {
  await findById(empresaId, id)
  return prisma.produto.update({
    where: { id },
    data: input,
  })
}

export async function remove(empresaId: string, id: string) {
  await findById(empresaId, id)
  await prisma.produto.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
}
