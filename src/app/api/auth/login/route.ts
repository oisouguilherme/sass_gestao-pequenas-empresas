import { NextResponse } from "next/server";
import { withPublicApi, readJson } from "@/server/api";
import { loginSchema } from "@/server/validators/auth";
import { login } from "@/server/services/auth";
import { AUTH_COOKIE } from "@/server/auth/jwt";

export const POST = withPublicApi(async ({ req }) => {
  const body = loginSchema.parse(await readJson(req));
  const { token, payload } = await login(body);

  const res = NextResponse.json({
    user: {
      id: payload.sub,
      nome: payload.nome,
      email: payload.email,
      role: payload.role,
    },
    empresaId: payload.empresaId,
  });
  res.cookies.set({
    name: AUTH_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
});
