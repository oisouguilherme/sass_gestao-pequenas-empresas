import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@prisma/client";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-change-me",
);
const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

export interface JwtPayload {
  sub: string; // user id
  empresaId: string;
  role: Role;
  email: string;
  nome: string;
}

export async function signToken(payload: JwtPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .setSubject(payload.sub)
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (
      typeof payload.sub !== "string" ||
      typeof payload.empresaId !== "string" ||
      typeof payload.role !== "string"
    ) {
      return null;
    }
    return {
      sub: payload.sub,
      empresaId: payload.empresaId as string,
      role: payload.role as Role,
      email: (payload.email as string) ?? "",
      nome: (payload.nome as string) ?? "",
    };
  } catch {
    return null;
  }
}

export const AUTH_COOKIE = "gestao_token";
