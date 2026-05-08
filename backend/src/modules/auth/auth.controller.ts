import type { Request, Response } from "express";
import { env } from "@/shared/config/env.js";
import * as authService from "./auth.service.js";

const REFRESH_COOKIE = "sg_refresh";

function setRefreshCookie(res: Response, token: string, expiresAt: Date) {
  // Em produção, frontend e backend ficam em domínios distintos (vercel.app é Public Suffix),
  // então o cookie deve ser sameSite=none + secure para ser enviado cross-site.
  const isProd = env.NODE_ENV === "production";
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/auth",
    expires: expiresAt,
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, { path: "/auth" });
}

export async function login(req: Request, res: Response) {
  const result = await authService.login(req.body, {
    userAgent: req.headers["user-agent"],
    ip: req.ip,
  });
  setRefreshCookie(res, result.refreshToken, result.refreshExpiresAt);
  res.json({
    accessToken: result.accessToken,
    user: result.user,
  });
}

export async function refresh(req: Request, res: Response) {
  const cookieToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;
  const result = await authService.refresh(cookieToken, {
    userAgent: req.headers["user-agent"],
    ip: req.ip,
  });
  setRefreshCookie(res, result.refreshToken, result.refreshExpiresAt);
  res.json({
    accessToken: result.accessToken,
    user: result.user,
  });
}

export async function logout(req: Request, res: Response) {
  const cookieToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;
  await authService.logout(cookieToken);
  clearRefreshCookie(res);
  res.status(204).send();
}

export async function me(req: Request, res: Response) {
  const user = await authService.me(req.user!.id);
  res.json(user);
}
