import { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";
import type { TenantContext } from "../auth/context";
import type {
  CreateCustomerInput,
  UpdateCustomerInput,
} from "../validators/cliente";
import { NotFoundError } from "../errors";

export async function listCustomers(ctx: TenantContext, q?: string) {
  return prisma.cliente.findMany({
    where: {
      empresaId: ctx.empresaId,
      ...(q
        ? {
            OR: [
              { nome: { contains: q, mode: Prisma.QueryMode.insensitive } },
              {
                documento: { contains: q, mode: Prisma.QueryMode.insensitive },
              },
              { telefone: { contains: q, mode: Prisma.QueryMode.insensitive } },
            ],
          }
        : {}),
    },
    orderBy: { nome: "asc" },
  });
}

export async function getCustomer(ctx: TenantContext, id: string) {
  const c = await prisma.cliente.findFirst({
    where: { id, empresaId: ctx.empresaId },
    include: {
      ordens: {
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          nome: true,
          status: true,
          pago: true,
          deadlineAt: true,
          createdAt: true,
        },
      },
    },
  });
  if (!c) throw new NotFoundError("Cliente não encontrado");
  return c;
}

export async function createCustomer(
  ctx: TenantContext,
  input: CreateCustomerInput,
) {
  return prisma.cliente.create({
    data: {
      ...input,
      empresaId: ctx.empresaId,
    },
  });
}

export async function updateCustomer(
  ctx: TenantContext,
  id: string,
  input: UpdateCustomerInput,
) {
  const existing = await prisma.cliente.findFirst({
    where: { id, empresaId: ctx.empresaId },
  });
  if (!existing) throw new NotFoundError("Cliente não encontrado");
  return prisma.cliente.update({
    where: { id },
    data: input,
  });
}

export async function deleteCustomer(ctx: TenantContext, id: string) {
  const existing = await prisma.cliente.findFirst({
    where: { id, empresaId: ctx.empresaId },
  });
  if (!existing) throw new NotFoundError("Cliente não encontrado");
  await prisma.cliente.delete({ where: { id } });
}
