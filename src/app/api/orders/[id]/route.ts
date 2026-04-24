import { withApi, readJson } from "@/server/api";
import { updateOrderSchema } from "@/server/validators/ordemServico";
import {
  deleteOrder,
  getOrder,
  updateOrder,
} from "@/server/services/ordemServico";

export const GET = withApi<{ id: string }>(({ ctx, params }) =>
  getOrder(ctx, params.id),
);

export const PATCH = withApi<{ id: string }>(async ({ req, ctx, params }) => {
  const body = updateOrderSchema.parse(await readJson(req));
  return updateOrder(ctx, params.id, body);
});

export const DELETE = withApi<{ id: string }>(async ({ ctx, params }) => {
  await deleteOrder(ctx, params.id);
  return { ok: true };
});
