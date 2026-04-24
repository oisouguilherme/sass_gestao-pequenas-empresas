import { Prisma, VendaStatus } from "@prisma/client";
import { prisma } from "../db/prisma";
import type { TenantContext } from "../auth/context";
import type { CreateSaleInput } from "../validators/venda";
import { BadRequestError, ConflictError, NotFoundError } from "../errors";

const saleInclude = {
  usuario: { select: { id: true, nome: true } },
  itens: {
    include: { produto: { select: { id: true, nome: true, codigo: true } } },
  },
} satisfies Prisma.VendaInclude;

export function calcSaleTotals(
  items: {
    precoUnitario: Prisma.Decimal | number | string;
    quantidade: number;
  }[],
  desconto: Prisma.Decimal | number | string,
): { valorTotal: Prisma.Decimal; valorFinal: Prisma.Decimal } {
  const total = items.reduce((acc, it) => {
    const preco = new Prisma.Decimal(it.precoUnitario);
    return acc.plus(preco.mul(it.quantidade));
  }, new Prisma.Decimal(0));
  const desc = new Prisma.Decimal(desconto);
  const final = total.minus(desc);
  if (final.isNegative())
    throw new BadRequestError("Desconto maior que o total");
  return { valorTotal: total, valorFinal: final };
}

export async function listSales(
  ctx: TenantContext,
  filters: { status?: VendaStatus; usuarioId?: string },
) {
  const where: Prisma.VendaWhereInput = { empresaId: ctx.empresaId };
  if (filters.status) where.status = filters.status;
  if (filters.usuarioId) where.usuarioId = filters.usuarioId;
  return prisma.venda.findMany({
    where,
    include: saleInclude,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function getSale(ctx: TenantContext, id: string) {
  const v = await prisma.venda.findFirst({
    where: { id, empresaId: ctx.empresaId },
    include: saleInclude,
  });
  if (!v) throw new NotFoundError("Venda não encontrada");
  return v;
}

export async function createSale(ctx: TenantContext, input: CreateSaleInput) {
  const ids = input.itens.map((i) => i.produtoId);
  const produtos = await prisma.produto.findMany({
    where: { id: { in: ids }, empresaId: ctx.empresaId },
  });
  if (produtos.length !== ids.length)
    throw new BadRequestError("Produto inválido");

  const itens = input.itens.map((i) => {
    const prod = produtos.find((p) => p.id === i.produtoId)!;
    return {
      produtoId: prod.id,
      quantidade: i.quantidade,
      precoUnitario: prod.preco,
    };
  });

  const { valorTotal, valorFinal } = calcSaleTotals(itens, input.desconto);

  return prisma.venda.create({
    data: {
      empresaId: ctx.empresaId,
      usuarioId: ctx.userId,
      tipoPagamento: input.tipoPagamento,
      valorTotal,
      desconto: new Prisma.Decimal(input.desconto),
      valorFinal,
      status: VendaStatus.EM_ANDAMENTO,
      itens: {
        create: itens.map((it) => ({
          produtoId: it.produtoId,
          quantidade: it.quantidade,
          precoUnitario: it.precoUnitario,
        })),
      },
    },
    include: saleInclude,
  });
}

export async function finalizeSale(ctx: TenantContext, id: string) {
  const v = await prisma.venda.findFirst({
    where: { id, empresaId: ctx.empresaId },
  });
  if (!v) throw new NotFoundError("Venda não encontrada");
  if (v.status === VendaStatus.FINALIZADA) return v;
  if (v.status === VendaStatus.CANCELADA)
    throw new ConflictError("Venda cancelada");
  return prisma.venda.update({
    where: { id },
    data: { status: VendaStatus.FINALIZADA },
    include: saleInclude,
  });
}

export async function cancelSale(ctx: TenantContext, id: string) {
  const v = await prisma.venda.findFirst({
    where: { id, empresaId: ctx.empresaId },
  });
  if (!v) throw new NotFoundError("Venda não encontrada");
  if (v.status === VendaStatus.CANCELADA) return v;
  return prisma.venda.update({
    where: { id },
    data: { status: VendaStatus.CANCELADA, cancelAt: new Date() },
    include: saleInclude,
  });
}
