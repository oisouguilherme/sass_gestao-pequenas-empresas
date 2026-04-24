import { Role } from "@prisma/client";
import { prisma } from "../db/prisma";
import { hashPassword } from "../auth/password";
import { mailer } from "../mailer";
import type { TenantContext } from "../auth/context";
import type { CreateUserInput, UpdateUserInput } from "../validators/usuario";
import { ConflictError, NotFoundError } from "../errors";

const SAFE_USER_SELECT = {
  id: true,
  nome: true,
  email: true,
  telefone: true,
  role: true,
  ativo: true,
  createdAt: true,
  updatedAt: true,
} as const;

function randomPassword(): string {
  return (
    Math.random().toString(36).slice(-10) +
    Math.random().toString(36).slice(-2).toUpperCase()
  );
}

export async function listUsers(ctx: TenantContext) {
  return prisma.usuario.findMany({
    where: { empresaId: ctx.empresaId },
    select: SAFE_USER_SELECT,
    orderBy: { createdAt: "desc" },
  });
}

export async function createUser(ctx: TenantContext, input: CreateUserInput) {
  const existing = await prisma.usuario.findUnique({
    where: { email: input.email },
  });
  if (existing) throw new ConflictError("E-mail já cadastrado");

  const senhaPlain = input.senha ?? randomPassword();
  const senhaHash = await hashPassword(senhaPlain);

  const empresa = await prisma.empresa.findUniqueOrThrow({
    where: { id: ctx.empresaId },
    select: { nome: true },
  });

  const user = await prisma.usuario.create({
    data: {
      nome: input.nome,
      email: input.email,
      senhaHash,
      telefone: input.telefone ?? null,
      role: input.role ?? Role.OPERACIONAL,
      empresaId: ctx.empresaId,
    },
    select: SAFE_USER_SELECT,
  });

  await mailer.sendUserCreated({
    to: user.email,
    nomeUsuario: user.nome,
    senhaTemporaria: senhaPlain,
    empresaNome: empresa.nome,
  });

  return user;
}

export async function updateUser(
  ctx: TenantContext,
  id: string,
  input: UpdateUserInput,
) {
  const user = await prisma.usuario.findFirst({
    where: { id, empresaId: ctx.empresaId },
  });
  if (!user) throw new NotFoundError("Usuário não encontrado");

  const data: Record<string, unknown> = {};
  if (input.nome !== undefined) data.nome = input.nome;
  if (input.telefone !== undefined) data.telefone = input.telefone;
  if (input.role !== undefined) data.role = input.role;
  if (input.ativo !== undefined) data.ativo = input.ativo;
  if (input.senha) data.senhaHash = await hashPassword(input.senha);

  return prisma.usuario.update({
    where: { id },
    data,
    select: SAFE_USER_SELECT,
  });
}

export async function deactivateUser(ctx: TenantContext, id: string) {
  if (id === ctx.userId) {
    throw new ConflictError("Você não pode se desativar");
  }
  const user = await prisma.usuario.findFirst({
    where: { id, empresaId: ctx.empresaId },
  });
  if (!user) throw new NotFoundError("Usuário não encontrado");
  return prisma.usuario.update({
    where: { id },
    data: { ativo: false },
    select: SAFE_USER_SELECT,
  });
}
