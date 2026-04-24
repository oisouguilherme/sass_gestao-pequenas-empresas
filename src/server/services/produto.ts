import { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";
import type { TenantContext } from "../auth/context";
import type {
  CreateProductInput,
  UpdateProductInput,
} from "../validators/produto";
import { ConflictError, NotFoundError } from "../errors";

export async function listProducts(ctx: TenantContext, q?: string) {
  return prisma.produto.findMany({
    where: {
      empresaId: ctx.empresaId,
      ...(q
        ? {
            OR: [
              { nome: { contains: q, mode: Prisma.QueryMode.insensitive } },
              { codigo: { contains: q, mode: Prisma.QueryMode.insensitive } },
            ],
          }
        : {}),
    },
    orderBy: { nome: "asc" },
  });
}

export async function getProduct(ctx: TenantContext, id: string) {
  const p = await prisma.produto.findFirst({
    where: { id, empresaId: ctx.empresaId },
  });
  if (!p) throw new NotFoundError("Produto não encontrado");
  return p;
}

export async function getProductByCode(ctx: TenantContext, codigo: string) {
  const p = await prisma.produto.findFirst({
    where: { empresaId: ctx.empresaId, codigo },
  });
  if (!p) throw new NotFoundError("Produto não encontrado");
  return p;
}

export async function createProduct(
  ctx: TenantContext,
  input: CreateProductInput,
) {
  if (input.codigo) {
    const exists = await prisma.produto.findFirst({
      where: { empresaId: ctx.empresaId, codigo: input.codigo },
    });
    if (exists) throw new ConflictError("Código já cadastrado");
  }
  return prisma.produto.create({
    data: {
      nome: input.nome,
      preco: new Prisma.Decimal(input.preco),
      codigo: input.codigo ?? null,
      empresaId: ctx.empresaId,
    },
  });
}

export async function updateProduct(
  ctx: TenantContext,
  id: string,
  input: UpdateProductInput,
) {
  const existing = await prisma.produto.findFirst({
    where: { id, empresaId: ctx.empresaId },
  });
  if (!existing) throw new NotFoundError("Produto não encontrado");

  if (input.codigo && input.codigo !== existing.codigo) {
    const dupe = await prisma.produto.findFirst({
      where: { empresaId: ctx.empresaId, codigo: input.codigo, NOT: { id } },
    });
    if (dupe) throw new ConflictError("Código já cadastrado");
  }

  return prisma.produto.update({
    where: { id },
    data: {
      ...(input.nome !== undefined && { nome: input.nome }),
      ...(input.preco !== undefined && {
        preco: new Prisma.Decimal(input.preco),
      }),
      ...(input.codigo !== undefined && { codigo: input.codigo }),
    },
  });
}

export async function deleteProduct(ctx: TenantContext, id: string) {
  const existing = await prisma.produto.findFirst({
    where: { id, empresaId: ctx.empresaId },
  });
  if (!existing) throw new NotFoundError("Produto não encontrado");
  await prisma.produto.delete({ where: { id } });
}
