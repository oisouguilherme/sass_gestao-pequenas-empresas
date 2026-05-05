import type { Prisma } from "@prisma/client";
import { prisma } from "@/shared/config/prisma.js";
import { NotFoundError } from "@/shared/errors/AppError.js";
import {
  buildPagination,
  paginatedResult,
  type PaginationQuery,
} from "@/shared/utils/pagination.js";
import type { CreateClientInput, UpdateClientInput } from "./clients.schema.js";

export async function list(empresaId: string, query: PaginationQuery) {
  const where: Prisma.ClienteWhereInput = {
    empresaId,
    deletedAt: null,
    ...(query.q && {
      OR: [
        { nome: { contains: query.q, mode: "insensitive" } },
        { documento: { contains: query.q, mode: "insensitive" } },
        { email: { contains: query.q, mode: "insensitive" } },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    prisma.cliente.findMany({
      where,
      orderBy: { createdAt: "desc" },
      ...buildPagination(query),
    }),
    prisma.cliente.count({ where }),
  ]);

  return paginatedResult(data, total, query);
}

export async function findById(empresaId: string, id: string) {
  const cliente = await prisma.cliente.findFirst({
    where: { id, empresaId, deletedAt: null },
  });
  if (!cliente) throw new NotFoundError("Cliente não encontrado");
  return cliente;
}

export async function create(empresaId: string, input: CreateClientInput) {
  return prisma.cliente.create({ data: { ...input, empresaId } });
}

export async function update(
  empresaId: string,
  id: string,
  input: UpdateClientInput,
) {
  await findById(empresaId, id);
  return prisma.cliente.update({ where: { id }, data: input });
}

export async function remove(empresaId: string, id: string) {
  await findById(empresaId, id);
  await prisma.cliente.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

export async function getHistorico(empresaId: string, id: string) {
  await findById(empresaId, id);
  const [vendas, ordens] = await Promise.all([
    prisma.venda.findMany({
      where: { clienteId: id, empresaId },
      include: {
        produtos: { include: { produto: true } },
        usuario: { select: { id: true, nome: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.ordemServico.findMany({
      where: { clienteId: id, empresaId, deletedAt: null },
      include: {
        produtos: { include: { produto: true } },
        usuarios: {
          include: { usuario: { select: { id: true, nome: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);
  return { vendas, ordens };
}
