import { withApi, readJson } from "@/server/api";
import { setProductsSchema } from "@/server/validators/ordemServico";
import { setProducts } from "@/server/services/ordemServico";

export const PUT = withApi<{ id: string }>(async ({ req, ctx, params }) => {
  const body = setProductsSchema.parse(await readJson(req));
  return setProducts(ctx, params.id, body);
});
