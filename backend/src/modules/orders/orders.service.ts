import { Prisma, type OSStatus } from "@prisma/client";
import { prisma } from "@/shared/config/prisma.js";
import { BadRequestError, NotFoundError } from "@/shared/errors/AppError.js";
import { paginatedResult } from "@/shared/utils/pagination.js";
import { sendOSAssignedEmail } from "@/shared/mail/templates.js";
import type { AuthenticatedUser } from "@/shared/middlewares/auth.js";
import type {
  CreateOrderInput,
  ListOrdersQuery,
  UpdateOrderInput,
} from "./orders.schema.js";

const ORDER_INCLUDE = {
  usuarios: {
    include: { usuario: { select: { id: true, nome: true, email: true } } },
  },
  produtos: { include: { produto: true } },
} satisfies Prisma.OrdemServicoInclude;

function buildAccessFilter(
  user: AuthenticatedUser,
): Prisma.OrdemServicoWhereInput {
  // ADMIN vê tudo da empresa; demais roles veem só onde estão atribuídos.
  if (user.role === "ADMIN") return {};
  return { usuarios: { some: { usuarioId: user.id } } };
}

export async function list(user: AuthenticatedUser, query: ListOrdersQuery) {
  const where: Prisma.OrdemServicoWhereInput = {
    empresaId: user.empresaId,
    deletedAt: null,
    ...buildAccessFilter(user),
    ...(query.status && { status: query.status }),
    ...(query.usuarioId && {
      usuarios: { some: { usuarioId: query.usuarioId } },
    }),
    ...(query.deadlineAte && { deadlineAt: { lte: query.deadlineAte } }),
    ...(query.q && {
      OR: [
        { nome: { contains: query.q, mode: "insensitive" } },
        { descricao: { contains: query.q, mode: "insensitive" } },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    prisma.ordemServico.findMany({
      where,
      include: ORDER_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.perPage,
      take: query.perPage,
    }),
    prisma.ordemServico.count({ where }),
  ]);

  return paginatedResult(data, total, {
    page: query.page,
    perPage: query.perPage,
  });
}

export async function findById(user: AuthenticatedUser, id: string) {
  const os = await prisma.ordemServico.findFirst({
    where: {
      id,
      empresaId: user.empresaId,
      deletedAt: null,
      ...buildAccessFilter(user),
    },
    include: ORDER_INCLUDE,
  });
  if (!os) throw new NotFoundError("Ordem de serviço não encontrada");
  return os;
}

export async function create(user: AuthenticatedUser, input: CreateOrderInput) {
  const { usuarioIds = [], produtos = [], ...rest } = input;

  if (usuarioIds.length)
    await ensureUsuariosBelongToEmpresa(user.empresaId, usuarioIds);
  if (produtos.length)
    await ensureProdutosBelongToEmpresa(
      user.empresaId,
      produtos.map((p) => p.produtoId),
    );

  const os = await prisma.ordemServico.create({
    data: {
      ...rest,
      empresaId: user.empresaId,
      usuarios: usuarioIds.length
        ? { create: usuarioIds.map((usuarioId) => ({ usuarioId })) }
        : undefined,
      produtos: produtos.length
        ? {
            create: produtos.map((p) => ({
              produtoId: p.produtoId,
              quantidade: p.quantidade,
            })),
          }
        : undefined,
    },
    include: ORDER_INCLUDE,
  });

  // Notifica assíncronamente cada usuário atribuído na criação
  if (usuarioIds.length)
    notifyAssignedUsers(os.id, usuarioIds).catch(() => undefined);

  return os;
}

export async function update(
  user: AuthenticatedUser,
  id: string,
  input: UpdateOrderInput,
) {
  await assertOSBelongsToEmpresa(user.empresaId, id);
  return prisma.ordemServico.update({
    where: { id },
    data: input,
    include: ORDER_INCLUDE,
  });
}

export async function updateStatus(
  user: AuthenticatedUser,
  id: string,
  status: OSStatus,
) {
  await assertOSBelongsToEmpresa(user.empresaId, id);
  return prisma.ordemServico.update({
    where: { id },
    data: { status },
    include: ORDER_INCLUDE,
  });
}

export async function setUsuarios(
  user: AuthenticatedUser,
  id: string,
  usuarioIds: string[],
) {
  await assertOSBelongsToEmpresa(user.empresaId, id);
  await ensureUsuariosBelongToEmpresa(user.empresaId, usuarioIds);

  const current = await prisma.ordemServicoUsuario.findMany({
    where: { ordemServicoId: id },
    select: { usuarioId: true },
  });
  const currentIds = new Set(current.map((u) => u.usuarioId));
  const newIds = new Set(usuarioIds);

  const toAdd = usuarioIds.filter((u) => !currentIds.has(u));
  const toRemove = [...currentIds].filter((u) => !newIds.has(u));

  await prisma.$transaction([
    ...(toRemove.length
      ? [
          prisma.ordemServicoUsuario.deleteMany({
            where: { ordemServicoId: id, usuarioId: { in: toRemove } },
          }),
        ]
      : []),
    ...(toAdd.length
      ? [
          prisma.ordemServicoUsuario.createMany({
            data: toAdd.map((usuarioId) => ({ ordemServicoId: id, usuarioId })),
          }),
        ]
      : []),
  ]);

  // Dispara e-mails apenas para os recém-atribuídos (idempotente)
  if (toAdd.length) notifyAssignedUsers(id, toAdd).catch(() => undefined);

  return findById(user, id);
}

export async function setProdutos(
  user: AuthenticatedUser,
  id: string,
  produtos: { produtoId: string; quantidade: number }[],
) {
  await assertOSBelongsToEmpresa(user.empresaId, id);
  await ensureProdutosBelongToEmpresa(
    user.empresaId,
    produtos.map((p) => p.produtoId),
  );

  await prisma.$transaction([
    prisma.ordemServicoProduto.deleteMany({ where: { ordemServicoId: id } }),
    ...(produtos.length
      ? [
          prisma.ordemServicoProduto.createMany({
            data: produtos.map((p) => ({
              ordemServicoId: id,
              produtoId: p.produtoId,
              quantidade: p.quantidade,
            })),
          }),
        ]
      : []),
  ]);

  return findById(user, id);
}

export async function remove(user: AuthenticatedUser, id: string) {
  await assertOSBelongsToEmpresa(user.empresaId, id);
  await prisma.ordemServico.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

// ---------- Helpers ----------

async function assertOSBelongsToEmpresa(empresaId: string, id: string) {
  const exists = await prisma.ordemServico.findFirst({
    where: { id, empresaId, deletedAt: null },
    select: { id: true },
  });
  if (!exists) throw new NotFoundError("Ordem de serviço não encontrada");
}

async function ensureUsuariosBelongToEmpresa(
  empresaId: string,
  usuarioIds: string[],
) {
  if (!usuarioIds.length) return;
  const count = await prisma.usuario.count({
    where: { id: { in: usuarioIds }, empresaId, deletedAt: null },
  });
  if (count !== usuarioIds.length) {
    throw new BadRequestError("Um ou mais usuários não pertencem à empresa");
  }
}

async function ensureProdutosBelongToEmpresa(
  empresaId: string,
  produtoIds: string[],
) {
  if (!produtoIds.length) return;
  const unique = [...new Set(produtoIds)];
  const count = await prisma.produto.count({
    where: { id: { in: unique }, empresaId, deletedAt: null },
  });
  if (count !== unique.length) {
    throw new BadRequestError("Um ou mais produtos não pertencem à empresa");
  }
}

async function notifyAssignedUsers(osId: string, usuarioIds: string[]) {
  const [os, usuarios] = await Promise.all([
    prisma.ordemServico.findUnique({
      where: { id: osId },
      select: { id: true, nome: true, descricao: true, deadlineAt: true },
    }),
    prisma.usuario.findMany({
      where: { id: { in: usuarioIds } },
      select: { nome: true, email: true },
    }),
  ]);
  if (!os) return;
  await Promise.all(
    usuarios.map((u) =>
      sendOSAssignedEmail({ to: u.email, usuarioNome: u.nome, os }),
    ),
  );
}
