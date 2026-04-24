import { withApi, readJson } from "@/server/api";
import { changeStatusSchema } from "@/server/validators/ordemServico";
import { changeStatus } from "@/server/services/ordemServico";

export const POST = withApi<{ id: string }>(async ({ req, ctx, params }) => {
  const body = changeStatusSchema.parse(await readJson(req));
  return changeStatus(ctx, params.id, body);
});
