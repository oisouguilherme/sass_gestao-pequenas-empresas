import { Role } from "@prisma/client";
import { withApi, readJson } from "@/server/api";
import { createUserSchema } from "@/server/validators/usuario";
import { createUser, listUsers } from "@/server/services/usuario";

export const GET = withApi(async ({ ctx }) => listUsers(ctx), {
  roles: [Role.ADMIN],
});

export const POST = withApi(
  async ({ req, ctx }) => {
    const body = createUserSchema.parse(await readJson(req));
    return createUser(ctx, body);
  },
  { roles: [Role.ADMIN] },
);
