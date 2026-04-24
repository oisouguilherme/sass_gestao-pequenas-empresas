import { withApi, readJson } from "@/server/api";
import { updateProductSchema } from "@/server/validators/produto";
import {
  deleteProduct,
  getProduct,
  updateProduct,
} from "@/server/services/produto";

export const GET = withApi<{ id: string }>(({ ctx, params }) =>
  getProduct(ctx, params.id),
);

export const PATCH = withApi<{ id: string }>(async ({ req, ctx, params }) => {
  const body = updateProductSchema.parse(await readJson(req));
  return updateProduct(ctx, params.id, body);
});

export const DELETE = withApi<{ id: string }>(async ({ ctx, params }) => {
  await deleteProduct(ctx, params.id);
  return { ok: true };
});
