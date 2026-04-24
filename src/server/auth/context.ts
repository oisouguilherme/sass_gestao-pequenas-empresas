import { cookies } from "next/headers";
import type { Role } from "@prisma/client";
import { AUTH_COOKIE, verifyToken, type JwtPayload } from "./jwt";
import { ForbiddenError, UnauthorizedError } from "../errors";

export interface TenantContext {
  userId: string;
  empresaId: string;
  role: Role;
  email: string;
  nome: string;
}

export async function getOptionalContext(
  req?: Request,
): Promise<TenantContext | null> {
  let token: string | undefined;

  // 1. Cookie (preferred)
  try {
    const c = await cookies();
    token = c.get(AUTH_COOKIE)?.value;
  } catch {
    // outside request scope
  }

  // 2. Authorization header fallback
  if (!token && req) {
    const auth = req.headers.get("authorization");
    if (auth?.toLowerCase().startsWith("bearer ")) {
      token = auth.slice(7).trim();
    }
  }

  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  return jwtToContext(payload);
}

export async function getTenantContext(req?: Request): Promise<TenantContext> {
  const ctx = await getOptionalContext(req);
  if (!ctx) throw new UnauthorizedError();
  return ctx;
}

export function requireRole(ctx: TenantContext, ...roles: Role[]): void {
  if (!roles.includes(ctx.role)) {
    throw new ForbiddenError("Permissão insuficiente");
  }
}

function jwtToContext(p: JwtPayload): TenantContext {
  return {
    userId: p.sub,
    empresaId: p.empresaId,
    role: p.role,
    email: p.email,
    nome: p.nome,
  };
}
