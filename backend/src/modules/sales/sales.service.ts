import { Prisma, type Venda } from "@prisma/client";
import { prisma } from "@/shared/config/prisma.js";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "@/shared/errors/AppError.js";
import { paginatedResult } from "@/shared/utils/pagination.js";
import type { AuthenticatedUser } from "@/shared/middlewares/auth.js";
import { calculateTotals, lineSubtotal } from "./sales.calculator.js";
import type {
  AddItemInput,
  CreateSaleInput,
  ListSalesQuery,
  UpdateFinalizedInput,
} from "./sales.schema.js";

const SALE_INCLUDE = {
  produtos: { include: { produto: true } },
  usuario: { select: { id: true, nome: true, email: true } },
  cliente: { select: { id: true, nome: true } },
} satisfies Prisma.VendaInclude;

export async function list(user: AuthenticatedUser, query: ListSalesQuery) {
  const where: Prisma.VendaWhereInput = {
    empresaId: user.empresaId,
    ...(query.status && { status: query.status }),
    ...(query.usuarioId && { usuarioId: query.usuarioId }),
    ...((query.from || query.to) && {
      createdAt: {
        ...(query.from && { gte: query.from }),
        ...(query.to && { lte: query.to }),
      },
    }),
  };
  const [data, total] = await Promise.all([
    prisma.venda.findMany({
      where,
      include: SALE_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.perPage,
      take: query.perPage,
    }),
    prisma.venda.count({ where }),
  ]);
  return paginatedResult(data, total, {
    page: query.page,
    perPage: query.perPage,
  });
}

export async function findById(user: AuthenticatedUser, id: string) {
  const venda = await prisma.venda.findFirst({
    where: { id, empresaId: user.empresaId },
    include: SALE_INCLUDE,
  });
  if (!venda) throw new NotFoundError("Venda não encontrada");
  return venda;
}

export async function create(user: AuthenticatedUser, input: CreateSaleInput) {
  const venda = await prisma.venda.create({
    data: {
      empresaId: user.empresaId,
      usuarioId: user.id,
      desconto: new Prisma.Decimal(input.desconto ?? 0),
      ...(input.clienteId && { clienteId: input.clienteId }),
    },
  });

  if (input.produtos?.length) {
    for (const item of input.produtos) {
      await addItem(user, venda.id, {
        produtoId: item.produtoId,
        quantidade: item.quantidade,
      });
    }
  } else {
    await recalcAndPersist(venda.id);
  }

  return findById(user, venda.id);
}

export async function addItem(
  user: AuthenticatedUser,
  vendaId: string,
  input: AddItemInput,
) {
  const venda = await ensureSaleEditable(user.empresaId, vendaId);

  const produto = input.produtoId
    ? await prisma.produto.findFirst({
        where: {
          id: input.produtoId,
          empresaId: user.empresaId,
          deletedAt: null,
        },
      })
    : await prisma.produto.findFirst({
        where: {
          codigo: input.codigo!,
          empresaId: user.empresaId,
          deletedAt: null,
        },
      });

  if (!produto) throw new NotFoundError("Produto não encontrado");

  const existing = await prisma.vendaProduto.findUnique({
    where: { vendaId_produtoId: { vendaId, produtoId: produto.id } },
  });

  if (existing) {
    const novaQtd = existing.quantidade + input.quantidade;
    await prisma.vendaProduto.update({
      where: { vendaId_produtoId: { vendaId, produtoId: produto.id } },
      data: {
        quantidade: novaQtd,
        precoUnitario: produto.preco, // snapshot atualizado se preço mudou
        subtotal: lineSubtotal({
          precoUnitario: produto.preco,
          quantidade: novaQtd,
        }),
      },
    });
  } else {
    await prisma.vendaProduto.create({
      data: {
        vendaId,
        produtoId: produto.id,
        quantidade: input.quantidade,
        precoUnitario: produto.preco,
        subtotal: lineSubtotal({
          precoUnitario: produto.preco,
          quantidade: input.quantidade,
        }),
      },
    });
  }

  await recalcAndPersist(venda.id);
  return findById(user, venda.id);
}

export async function removeItem(
  user: AuthenticatedUser,
  vendaId: string,
  produtoId: string,
) {
  const venda = await ensureSaleEditable(user.empresaId, vendaId);
  await prisma.vendaProduto
    .delete({ where: { vendaId_produtoId: { vendaId, produtoId } } })
    .catch(() => {
      throw new NotFoundError("Item não encontrado na venda");
    });
  await recalcAndPersist(venda.id);
  return findById(user, venda.id);
}

export async function setDiscount(
  user: AuthenticatedUser,
  vendaId: string,
  desconto: number,
) {
  const venda = await ensureSaleEditable(user.empresaId, vendaId);
  await prisma.venda.update({
    where: { id: venda.id },
    data: { desconto: new Prisma.Decimal(desconto) },
  });
  await recalcAndPersist(venda.id);
  return findById(user, venda.id);
}

export async function finalize(
  user: AuthenticatedUser,
  vendaId: string,
  tipoPagamento: "DINHEIRO" | "PIX" | "CREDITO" | "DEBITO",
) {
  const venda = await ensureSaleEditable(user.empresaId, vendaId);

  const items = await prisma.vendaProduto.count({ where: { vendaId } });
  if (!items)
    throw new BadRequestError("Não é possível finalizar venda sem itens");

  await prisma.venda.update({
    where: { id: venda.id },
    data: { status: "FINALIZADA", tipoPagamento },
  });
  return findById(user, venda.id);
}

export async function cancel(user: AuthenticatedUser, vendaId: string) {
  const venda = await prisma.venda.findFirst({
    where: { id: vendaId, empresaId: user.empresaId },
  });
  if (!venda) throw new NotFoundError("Venda não encontrada");
  if (venda.status === "CANCELADA")
    throw new ConflictError("Venda já está cancelada");

  await prisma.venda.update({
    where: { id: vendaId },
    data: { status: "CANCELADA", cancelAt: new Date() },
  });
  return findById(user, vendaId);
}

export async function reopen(user: AuthenticatedUser, vendaId: string) {
  const venda = await prisma.venda.findFirst({
    where: { id: vendaId, empresaId: user.empresaId },
  });
  if (!venda) throw new NotFoundError("Venda não encontrada");
  if (venda.status === "CANCELADA")
    throw new ConflictError("Venda cancelada não pode ser reaberta");
  if (venda.status === "ABERTA")
    throw new ConflictError("Venda já está aberta");

  await prisma.venda.update({
    where: { id: vendaId },
    data: { status: "ABERTA", tipoPagamento: null },
  });
  return findById(user, vendaId);
}

export async function updateFinalized(
  user: AuthenticatedUser,
  vendaId: string,
  input: UpdateFinalizedInput,
) {
  const venda = await prisma.venda.findFirst({
    where: { id: vendaId, empresaId: user.empresaId },
  });
  if (!venda) throw new NotFoundError("Venda não encontrada");

  await prisma.venda.update({
    where: { id: vendaId },
    data: {
      ...(input.clienteId !== undefined && { clienteId: input.clienteId }),
      ...(input.tipoPagamento !== undefined && {
        tipoPagamento: input.tipoPagamento,
      }),
      ...(input.desconto !== undefined && {
        desconto: new Prisma.Decimal(input.desconto),
      }),
    },
  });

  if (input.desconto !== undefined) {
    await recalcAndPersist(vendaId);
  }

  return findById(user, vendaId);
}

// ---------- Helpers ----------

async function ensureSaleEditable(
  empresaId: string,
  vendaId: string,
): Promise<Venda> {
  const venda = await prisma.venda.findFirst({
    where: { id: vendaId, empresaId },
  });
  if (!venda) throw new NotFoundError("Venda não encontrada");
  if (venda.status !== "ABERTA") {
    throw new ConflictError(
      `Venda não pode ser editada (status: ${venda.status})`,
    );
  }
  return venda;
}

async function recalcAndPersist(vendaId: string) {
  const [venda, items] = await Promise.all([
    prisma.venda.findUnique({
      where: { id: vendaId },
      select: { desconto: true },
    }),
    prisma.vendaProduto.findMany({
      where: { vendaId },
      select: { precoUnitario: true, quantidade: true },
    }),
  ]);
  if (!venda) return;
  const totals = calculateTotals(items, venda.desconto);
  await prisma.venda.update({
    where: { id: vendaId },
    data: {
      valorTotal: totals.valorTotal,
      desconto: totals.desconto,
      valorFinal: totals.valorFinal,
    },
  });
}
