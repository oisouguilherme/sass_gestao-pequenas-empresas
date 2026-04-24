import { Role } from "@prisma/client";
import { withApi, readJson } from "@/server/api";
import { updateUserSchema } from "@/server/validators/usuario";
import { deactivateUser, updateUser } from "@/server/services/usuario";

export const PATCH = withApi<{ id: string }>(
  async ({ req, ctx, params }) => {
    const body = updateUserSchema.parse(await readJson(req));
    return updateUser(ctx, params.id, body);
  },
  { roles: [Role.ADMIN] },
);

export const DELETE = withApi<{ id: string }>(
  async ({ ctx, params }) => deactivateUser(ctx, params.id),
  { roles: [Role.ADMIN] },
);
