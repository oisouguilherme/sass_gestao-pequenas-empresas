import { withApi, readJson } from "@/server/api";
import { assignUsersSchema } from "@/server/validators/ordemServico";
import { assignUsers } from "@/server/services/ordemServico";

export const POST = withApi<{ id: string }>(async ({ req, ctx, params }) => {
  const body = assignUsersSchema.parse(await readJson(req));
  return assignUsers(ctx, params.id, body);
});
