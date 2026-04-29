import crypto from "node:crypto";
import { prisma } from "@/shared/config/prisma.js";
import { comparePassword } from "@/shared/utils/hash.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "@/shared/utils/jwt.js";
import { UnauthorizedError } from "@/shared/errors/AppError.js";
import { env } from "@/shared/config/env.js";
import type { LoginInput } from "./auth.schema.js";

const REFRESH_TTL_MS = parseDurationMs(env.JWT_REFRESH_EXPIRES);

function parseDurationMs(input: string): number {
  const match = /^(\d+)([smhd])$/.exec(input.trim());
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = Number(match[1]);
  const unit = match[2];
  const mult =
    unit === "s"
      ? 1000
      : unit === "m"
        ? 60_000
        : unit === "h"
          ? 3_600_000
          : 86_400_000;
  return value * mult;
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

interface ClientMeta {
  userAgent?: string;
  ip?: string;
}

export async function login(input: LoginInput, meta: ClientMeta) {
  const usuario = await prisma.usuario.findUnique({
    where: { email: input.email },
    include: { empresa: true },
  });

  if (!usuario || usuario.deletedAt) {
    throw new UnauthorizedError("Credenciais inválidas");
  }

  if (!usuario.empresa.ativa || usuario.empresa.deletedAt) {
    throw new UnauthorizedError("Empresa inativa");
  }

  const ok = await comparePassword(input.senha, usuario.senha);
  if (!ok) throw new UnauthorizedError("Credenciais inválidas");

  return issueTokens(usuario, meta);
}

export async function refresh(
  rawRefreshToken: string | undefined,
  meta: ClientMeta,
) {
  if (!rawRefreshToken) throw new UnauthorizedError("Refresh token ausente");

  let payload;
  try {
    payload = verifyRefreshToken(rawRefreshToken);
  } catch {
    throw new UnauthorizedError("Refresh token inválido");
  }

  const tokenHash = hashToken(rawRefreshToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new UnauthorizedError("Refresh token inválido ou expirado");
  }
  if (stored.usuarioId !== payload.sub) {
    throw new UnauthorizedError("Refresh token inválido");
  }

  // Rotação: revoga o atual
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  const usuario = await prisma.usuario.findUnique({
    where: { id: payload.sub },
    include: { empresa: true },
  });
  if (!usuario || usuario.deletedAt || !usuario.empresa.ativa) {
    throw new UnauthorizedError("Usuário inválido");
  }

  return issueTokens(usuario, meta);
}

export async function logout(rawRefreshToken: string | undefined) {
  if (!rawRefreshToken) return;
  const tokenHash = hashToken(rawRefreshToken);
  await prisma.refreshToken
    .update({ where: { tokenHash }, data: { revokedAt: new Date() } })
    .catch(() => undefined);
}

export async function me(usuarioId: string) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    include: { empresa: true },
  });
  if (!usuario) throw new UnauthorizedError();
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    role: usuario.role,
    telefone: usuario.telefone,
    empresa: {
      id: usuario.empresa.id,
      nome: usuario.empresa.nome,
    },
  };
}

async function issueTokens(
  usuario: {
    id: string;
    empresaId: string;
    role: "ADMIN" | "VENDEDOR" | "OPERADOR";
    nome: string;
    email: string;
  },
  meta: ClientMeta,
) {
  const accessToken = signAccessToken({
    sub: usuario.id,
    empresaId: usuario.empresaId,
    role: usuario.role,
  });

  const jti = crypto.randomUUID();
  const refreshToken = signRefreshToken({ sub: usuario.id, jti });
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);

  await prisma.refreshToken.create({
    data: {
      id: jti,
      tokenHash,
      usuarioId: usuario.id,
      expiresAt,
      userAgent: meta.userAgent?.slice(0, 255),
      ip: meta.ip?.slice(0, 64),
    },
  });

  return {
    accessToken,
    refreshToken,
    refreshExpiresAt: expiresAt,
    user: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role,
      empresaId: usuario.empresaId,
    },
  };
}
