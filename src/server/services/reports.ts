import { OrdemServicoStatus, Prisma, VendaStatus } from "@prisma/client";
import { prisma } from "../db/prisma";
import type { TenantContext } from "../auth/context";
import type { ReportFilters } from "../validators/venda";

export async function salesReport(ctx: TenantContext, filters: ReportFilters) {
  const where: Prisma.VendaWhereInput = {
    empresaId: ctx.empresaId,
    ...(filters.from || filters.to
      ? {
          createdAt: {
            ...(filters.from && { gte: filters.from }),
            ...(filters.to && { lte: filters.to }),
          },
        }
      : {}),
    ...(filters.usuarioId && { usuarioId: filters.usuarioId }),
    ...(filters.status && { status: filters.status as VendaStatus }),
  };

  const [totals, byUser, byStatus, count] = await Promise.all([
    prisma.venda.aggregate({
      where,
      _sum: { valorFinal: true, valorTotal: true, desconto: true },
      _avg: { valorFinal: true },
      _count: true,
    }),
    prisma.venda.groupBy({
      by: ["usuarioId"],
      where,
      _sum: { valorFinal: true },
      _count: true,
    }),
    prisma.venda.groupBy({
      by: ["status"],
      where,
      _sum: { valorFinal: true },
      _count: true,
    }),
    prisma.venda.count({ where }),
  ]);

  const userIds = byUser.map((b) => b.usuarioId);
  const users = await prisma.usuario.findMany({
    where: { id: { in: userIds } },
    select: { id: true, nome: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u.nome]));

  return {
    totalVendido: totals._sum.valorFinal ?? new Prisma.Decimal(0),
    totalBruto: totals._sum.valorTotal ?? new Prisma.Decimal(0),
    totalDesconto: totals._sum.desconto ?? new Prisma.Decimal(0),
    quantidade: count,
    ticketMedio: totals._avg.valorFinal ?? new Prisma.Decimal(0),
    porUsuario: byUser.map((b) => ({
      usuarioId: b.usuarioId,
      nome: userMap.get(b.usuarioId) ?? "—",
      total: b._sum.valorFinal ?? new Prisma.Decimal(0),
      quantidade: b._count,
    })),
    porStatus: byStatus.map((b) => ({
      status: b.status,
      total: b._sum.valorFinal ?? new Prisma.Decimal(0),
      quantidade: b._count,
    })),
  };
}

export async function dashboardSummary(ctx: TenantContext) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const now = new Date();

  const [vendasHoje, osEmAndamento, osAtrasadas, ultimasVendas, proximasOS] =
    await Promise.all([
      prisma.venda.aggregate({
        where: {
          empresaId: ctx.empresaId,
          createdAt: { gte: startOfDay, lte: endOfDay },
          status: { not: VendaStatus.CANCELADA },
        },
        _sum: { valorFinal: true },
        _count: true,
      }),
      prisma.ordemServico.count({
        where: {
          empresaId: ctx.empresaId,
          status: {
            notIn: [
              OrdemServicoStatus.FINALIZADO,
              OrdemServicoStatus.ARQUIVADO,
            ],
          },
        },
      }),
      prisma.ordemServico.count({
        where: {
          empresaId: ctx.empresaId,
          deadlineAt: { lt: now },
          status: {
            notIn: [
              OrdemServicoStatus.FINALIZADO,
              OrdemServicoStatus.ARQUIVADO,
            ],
          },
        },
      }),
      prisma.venda.findMany({
        where: { empresaId: ctx.empresaId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { usuario: { select: { nome: true } } },
      }),
      prisma.ordemServico.findMany({
        where: {
          empresaId: ctx.empresaId,
          status: {
            notIn: [
              OrdemServicoStatus.FINALIZADO,
              OrdemServicoStatus.ARQUIVADO,
            ],
          },
        },
        orderBy: [{ deadlineAt: "asc" }],
        take: 5,
        include: { cliente: { select: { nome: true } } },
      }),
    ]);

  return {
    vendasHoje: {
      total: vendasHoje._sum.valorFinal ?? new Prisma.Decimal(0),
      quantidade: vendasHoje._count,
    },
    osEmAndamento,
    osAtrasadas,
    ultimasVendas,
    proximasOS,
  };
}

export async function globalSearch(ctx: TenantContext, q: string) {
  if (!q || q.length < 2) return { clientes: [], produtos: [], ordens: [] };
  const filter = { contains: q, mode: Prisma.QueryMode.insensitive };
  const [clientes, produtos, ordens] = await Promise.all([
    prisma.cliente.findMany({
      where: {
        empresaId: ctx.empresaId,
        OR: [{ nome: filter }, { documento: filter }],
      },
      take: 5,
      select: { id: true, nome: true, documento: true },
    }),
    prisma.produto.findMany({
      where: {
        empresaId: ctx.empresaId,
        OR: [{ nome: filter }, { codigo: filter }],
      },
      take: 5,
      select: { id: true, nome: true, codigo: true, preco: true },
    }),
    prisma.ordemServico.findMany({
      where: {
        empresaId: ctx.empresaId,
        nome: filter,
      },
      take: 5,
      select: { id: true, nome: true, status: true },
    }),
  ]);
  return { clientes, produtos, ordens };
}
