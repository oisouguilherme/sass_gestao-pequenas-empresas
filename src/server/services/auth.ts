import { Role } from "@prisma/client";
import { prisma } from "../db/prisma";
import { hashPassword, verifyPassword } from "../auth/password";
import { signToken, type JwtPayload } from "../auth/jwt";
import type { LoginInput, SignupInput } from "../validators/auth";
import { ConflictError, UnauthorizedError } from "../errors";

export async function signup(
  input: SignupInput,
): Promise<{ token: string; payload: JwtPayload }> {
  const existing = await prisma.usuario.findUnique({
    where: { email: input.admin.email },
  });
  if (existing) throw new ConflictError("E-mail já cadastrado");

  const senhaHash = await hashPassword(input.admin.senha);

  const result = await prisma.$transaction(async (tx) => {
    const empresa = await tx.empresa.create({
      data: {
        nome: input.empresa.nome,
        nomeResponsavel: input.empresa.nomeResponsavel,
      },
    });
    const usuario = await tx.usuario.create({
      data: {
        nome: input.admin.nome,
        email: input.admin.email,
        senhaHash,
        telefone: input.admin.telefone ?? null,
        role: Role.ADMIN,
        empresaId: empresa.id,
      },
    });
    return { empresa, usuario };
  });

  const payload: JwtPayload = {
    sub: result.usuario.id,
    empresaId: result.empresa.id,
    role: result.usuario.role,
    email: result.usuario.email,
    nome: result.usuario.nome,
  };
  const token = await signToken(payload);
  return { token, payload };
}

export async function login(
  input: LoginInput,
): Promise<{ token: string; payload: JwtPayload }> {
  const user = await prisma.usuario.findUnique({
    where: { email: input.email },
    include: { empresa: true },
  });
  if (!user || !user.ativo)
    throw new UnauthorizedError("Credenciais inválidas");
  if (!user.empresa.ativa) throw new UnauthorizedError("Empresa inativa");

  const ok = await verifyPassword(input.senha, user.senhaHash);
  if (!ok) throw new UnauthorizedError("Credenciais inválidas");

  const payload: JwtPayload = {
    sub: user.id,
    empresaId: user.empresaId,
    role: user.role,
    email: user.email,
    nome: user.nome,
  };
  const token = await signToken(payload);
  return { token, payload };
}
