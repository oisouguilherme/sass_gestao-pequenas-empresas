import { Prisma } from "@prisma/client";
import { prisma } from "@/shared/config/prisma.js";
import type { SalesReportQuery } from "./reports.schema.js";

export async function salesReport(empresaId: string, query: SalesReportQuery) {
  const status = query.status ?? "FINALIZADA";

  const where: Prisma.VendaWhereInput = {
    empresaId,
    status,
    ...(query.usuarioId && { usuarioId: query.usuarioId }),
    ...((query.from || query.to) && {
      createdAt: {
        ...(query.from && { gte: query.from }),
        ...(query.to && { lte: query.to }),
      },
    }),
  };

  const [agg, byUser] = await Promise.all([
    prisma.venda.aggregate({
      where,
      _sum: { valorFinal: true },
      _count: { _all: true },
      _avg: { valorFinal: true },
    }),
    query.usuarioId
      ? Promise.resolve(null)
      : prisma.venda.groupBy({
          by: ["usuarioId"],
          where,
          _sum: { valorFinal: true },
          _count: { _all: true },
        }),
  ]);

  let breakdown: Array<{
    usuarioId: string;
    usuarioNome: string | null;
    totalVendido: string;
    numeroVendas: number;
  }> = [];

  if (byUser && byUser.length) {
    const usuarios = await prisma.usuario.findMany({
      where: { id: { in: byUser.map((b) => b.usuarioId) } },
      select: { id: true, nome: true },
    });
    const nameMap = new Map(usuarios.map((u) => [u.id, u.nome]));
    breakdown = byUser
      .map((b) => ({
        usuarioId: b.usuarioId,
        usuarioNome: nameMap.get(b.usuarioId) ?? null,
        totalVendido: (b._sum.valorFinal ?? new Prisma.Decimal(0)).toFixed(2),
        numeroVendas: b._count._all,
      }))
      .sort((a, b) => Number(b.totalVendido) - Number(a.totalVendido));
  }

  return {
    filtros: {
      from: query.from ?? null,
      to: query.to ?? null,
      usuarioId: query.usuarioId ?? null,
      status,
    },
    totais: {
      totalVendido: (agg._sum.valorFinal ?? new Prisma.Decimal(0)).toFixed(2),
      numeroVendas: agg._count._all,
      ticketMedio: (agg._avg.valorFinal ?? new Prisma.Decimal(0)).toFixed(2),
    },
    porUsuario: breakdown,
  };
}
