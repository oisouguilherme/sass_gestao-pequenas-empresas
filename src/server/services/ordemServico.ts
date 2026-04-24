import { OrdemServicoStatus, Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";
import { mailer } from "../mailer";
import type { TenantContext } from "../auth/context";
import type {
  AssignUsersInput,
  ChangeStatusInput,
  CreateOrderInput,
  SetProductsInput,
  UpdateOrderInput,
} from "../validators/ordemServico";
import { BadRequestError, NotFoundError } from "../errors";

const FINAL_STATUSES = new Set<OrdemServicoStatus>([
  OrdemServicoStatus.FINALIZADO,
  OrdemServicoStatus.ARQUIVADO,
]);

export const orderInclude = {
  cliente: { select: { id: true, nome: true } },
  usuarios: {
    include: {
      usuario: { select: { id: true, nome: true, email: true } },
    },
  },
  produtos: {
    include: {
      produto: { select: { id: true, nome: true, preco: true, codigo: true } },
    },
  },
  statusLogs: {
    orderBy: { createdAt: "desc" as const },
    take: 30,
    include: { usuario: { select: { id: true, nome: true } } },
  },
} satisfies Prisma.OrdemServicoInclude;

export async function listOrders(
  ctx: TenantContext,
  filters: {
    status?: OrdemServicoStatus;
    clienteId?: string;
    q?: string;
    atrasadas?: boolean;
  },
) {
  const where: Prisma.OrdemServicoWhereInput = { empresaId: ctx.empresaId };
  if (filters.status) where.status = filters.status;
  if (filters.clienteId) where.clienteId = filters.clienteId;
  if (filters.q) {
    where.OR = [
      { nome: { contains: filters.q, mode: Prisma.QueryMode.insensitive } },
      {
        descricao: { contains: filters.q, mode: Prisma.QueryMode.insensitive },
      },
    ];
  }
  if (filters.atrasadas) {
    where.deadlineAt = { lt: new Date() };
    where.status = {
      notIn: [OrdemServicoStatus.FINALIZADO, OrdemServicoStatus.ARQUIVADO],
    };
  }
  return prisma.ordemServico.findMany({
    where,
    orderBy: [{ deadlineAt: "asc" }, { createdAt: "desc" }],
    include: {
      cliente: { select: { id: true, nome: true } },
      usuarios: { include: { usuario: { select: { id: true, nome: true } } } },
    },
  });
}

export async function getOrder(ctx: TenantContext, id: string) {
  const os = await prisma.ordemServico.findFirst({
    where: { id, empresaId: ctx.empresaId },
    include: orderInclude,
  });
  if (!os) throw new NotFoundError("OS não encontrada");
  return os;
}

export async function createOrder(ctx: TenantContext, input: CreateOrderInput) {
  const cliente = await prisma.cliente.findFirst({
    where: { id: input.clienteId, empresaId: ctx.empresaId },
  });
  if (!cliente) throw new BadRequestError("Cliente inválido");

  if (input.usuarioIds.length) {
    const count = await prisma.usuario.count({
      where: { id: { in: input.usuarioIds }, empresaId: ctx.empresaId },
    });
    if (count !== input.usuarioIds.length)
      throw new BadRequestError("Usuário inválido");
  }
  if (input.produtos.length) {
    const ids = input.produtos.map((p) => p.produtoId);
    const count = await prisma.produto.count({
      where: { id: { in: ids }, empresaId: ctx.empresaId },
    });
    if (count !== ids.length) throw new BadRequestError("Produto inválido");
  }

  const os = await prisma.$transaction(async (tx) => {
    const created = await tx.ordemServico.create({
      data: {
        nome: input.nome,
        descricao: input.descricao ?? null,
        clienteId: input.clienteId,
        empresaId: ctx.empresaId,
        deadlineAt: input.deadlineAt ?? null,
        status: OrdemServicoStatus.EM_ANDAMENTO,
        usuarios: {
          create: input.usuarioIds.map((usuarioId) => ({ usuarioId })),
        },
        produtos: {
          create: input.produtos.map((p) => ({
            produtoId: p.produtoId,
            quantidade: p.quantidade,
          })),
        },
        statusLogs: {
          create: {
            statusAnterior: null,
            statusNovo: OrdemServicoStatus.EM_ANDAMENTO,
            usuarioId: ctx.userId,
            observacao: "Criada",
          },
        },
      },
      include: orderInclude,
    });
    return created;
  });

  // Notificar usuários atribuídos
  if (input.usuarioIds.length) {
    const empresa = await prisma.empresa.findUnique({
      where: { id: ctx.empresaId },
      select: { nome: true },
    });
    const users = await prisma.usuario.findMany({
      where: { id: { in: input.usuarioIds } },
      select: { email: true, nome: true },
    });
    await Promise.all(
      users.map((u) =>
        mailer.sendAssignedToOS({
          to: u.email,
          nomeUsuario: u.nome,
          osNome: os.nome,
          osId: os.id,
          empresaNome: empresa?.nome ?? "",
        }),
      ),
    );
  }

  return os;
}

export async function updateOrder(
  ctx: TenantContext,
  id: string,
  input: UpdateOrderInput,
) {
  const existing = await prisma.ordemServico.findFirst({
    where: { id, empresaId: ctx.empresaId },
  });
  if (!existing) throw new NotFoundError("OS não encontrada");

  if (input.clienteId && input.clienteId !== existing.clienteId) {
    const c = await prisma.cliente.findFirst({
      where: { id: input.clienteId, empresaId: ctx.empresaId },
    });
    if (!c) throw new BadRequestError("Cliente inválido");
  }

  return prisma.ordemServico.update({
    where: { id },
    data: {
      ...(input.nome !== undefined && { nome: input.nome }),
      ...(input.descricao !== undefined && { descricao: input.descricao }),
      ...(input.clienteId !== undefined && { clienteId: input.clienteId }),
      ...(input.deadlineAt !== undefined && { deadlineAt: input.deadlineAt }),
      ...(input.pago !== undefined && { pago: input.pago }),
    },
    include: orderInclude,
  });
}

export async function changeStatus(
  ctx: TenantContext,
  id: string,
  input: ChangeStatusInput,
) {
  const existing = await prisma.ordemServico.findFirst({
    where: { id, empresaId: ctx.empresaId },
  });
  if (!existing) throw new NotFoundError("OS não encontrada");
  if (existing.status === input.status) return existing;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.ordemServico.update({
      where: { id },
      data: { status: input.status },
      include: orderInclude,
    });
    await tx.ordemServicoStatusLog.create({
      data: {
        ordemServicoId: id,
        statusAnterior: existing.status,
        statusNovo: input.status,
        usuarioId: ctx.userId,
        observacao: input.observacao ?? null,
      },
    });
    return updated;
  });
}

export async function assignUsers(
  ctx: TenantContext,
  id: string,
  input: AssignUsersInput,
) {
  const os = await prisma.ordemServico.findFirst({
    where: { id, empresaId: ctx.empresaId },
    include: { usuarios: true },
  });
  if (!os) throw new NotFoundError("OS não encontrada");

  if (input.usuarioIds.length) {
    const count = await prisma.usuario.count({
      where: { id: { in: input.usuarioIds }, empresaId: ctx.empresaId },
    });
    if (count !== input.usuarioIds.length)
      throw new BadRequestError("Usuário inválido");
  }

  const currentIds = new Set(os.usuarios.map((u) => u.usuarioId));
  const desiredIds = new Set(input.usuarioIds);
  const toAdd = [...desiredIds].filter((u) => !currentIds.has(u));
  const toRemove = [...currentIds].filter((u) => !desiredIds.has(u));

  await prisma.$transaction([
    ...(toRemove.length
      ? [
          prisma.ordemServicoUsuario.deleteMany({
            where: { ordemServicoId: id, usuarioId: { in: toRemove } },
          }),
        ]
      : []),
    ...toAdd.map((usuarioId) =>
      prisma.ordemServicoUsuario.create({
        data: { ordemServicoId: id, usuarioId },
      }),
    ),
  ]);

  // Notify only newly assigned
  if (toAdd.length) {
    const empresa = await prisma.empresa.findUnique({
      where: { id: ctx.empresaId },
      select: { nome: true },
    });
    const users = await prisma.usuario.findMany({
      where: { id: { in: toAdd } },
      select: { email: true, nome: true },
    });
    await Promise.all(
      users.map((u) =>
        mailer.sendAssignedToOS({
          to: u.email,
          nomeUsuario: u.nome,
          osNome: os.nome,
          osId: os.id,
          empresaNome: empresa?.nome ?? "",
        }),
      ),
    );
  }

  return getOrder(ctx, id);
}

export async function setProducts(
  ctx: TenantContext,
  id: string,
  input: SetProductsInput,
) {
  const os = await prisma.ordemServico.findFirst({
    where: { id, empresaId: ctx.empresaId },
  });
  if (!os) throw new NotFoundError("OS não encontrada");

  if (input.produtos.length) {
    const ids = input.produtos.map((p) => p.produtoId);
    const count = await prisma.produto.count({
      where: { id: { in: ids }, empresaId: ctx.empresaId },
    });
    if (count !== ids.length) throw new BadRequestError("Produto inválido");
  }

  await prisma.$transaction([
    prisma.ordemServicoProduto.deleteMany({ where: { ordemServicoId: id } }),
    ...input.produtos.map((p) =>
      prisma.ordemServicoProduto.create({
        data: {
          ordemServicoId: id,
          produtoId: p.produtoId,
          quantidade: p.quantidade,
        },
      }),
    ),
  ]);

  return getOrder(ctx, id);
}

export async function deleteOrder(ctx: TenantContext, id: string) {
  const existing = await prisma.ordemServico.findFirst({
    where: { id, empresaId: ctx.empresaId },
  });
  if (!existing) throw new NotFoundError("OS não encontrada");
  await prisma.ordemServico.delete({ where: { id } });
}

export function isFinalStatus(status: OrdemServicoStatus): boolean {
  return FINAL_STATUSES.has(status);
}
