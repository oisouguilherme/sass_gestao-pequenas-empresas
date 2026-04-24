import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { HttpError } from "./errors";
import { getTenantContext, type TenantContext } from "./auth/context";
import type { Role } from "@prisma/client";
import { ForbiddenError } from "./errors";

type Handler<T> = (args: {
  req: Request;
  ctx: TenantContext;
  params: T;
}) => Promise<unknown>;

interface Options {
  roles?: Role[];
}

export function withApi<T = Record<string, string>>(
  handler: Handler<T>,
  opts: Options = {},
) {
  return async (
    req: Request,
    context: { params: Promise<T> } | { params: T },
  ) => {
    try {
      const params = ((await (context as { params: Promise<T> }).params) ??
        (context as { params: T }).params) as T;

      const ctx = await getTenantContext(req);
      if (opts.roles && !opts.roles.includes(ctx.role)) {
        throw new ForbiddenError();
      }
      const data = await handler({ req, ctx, params });
      if (data instanceof NextResponse) return data;
      if (data === undefined || data === null)
        return NextResponse.json({ ok: true });
      return NextResponse.json(data);
    } catch (err) {
      return toErrorResponse(err);
    }
  };
}

export function withPublicApi<T = Record<string, string>>(
  handler: (args: { req: Request; params: T }) => Promise<unknown>,
) {
  return async (
    req: Request,
    context: { params: Promise<T> } | { params: T },
  ) => {
    try {
      const params = ((await (context as { params: Promise<T> }).params) ??
        (context as { params: T }).params) as T;
      const data = await handler({ req, params });
      if (data instanceof NextResponse) return data;
      if (data === undefined || data === null)
        return NextResponse.json({ ok: true });
      return NextResponse.json(data);
    } catch (err) {
      return toErrorResponse(err);
    }
  };
}

function toErrorResponse(err: unknown): NextResponse {
  if (err instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Dados inválidos",
          details: err.issues,
        },
      },
      { status: 422 },
    );
  }
  if (err instanceof HttpError) {
    return NextResponse.json(
      { error: { code: err.code, message: err.message } },
      { status: err.status },
    );
  }
  console.error("[api] unhandled error", err);
  return NextResponse.json(
    { error: { code: "INTERNAL", message: "Erro interno" } },
    { status: 500 },
  );
}

export async function readJson<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new HttpError(400, "BAD_REQUEST", "JSON inválido");
  }
}
