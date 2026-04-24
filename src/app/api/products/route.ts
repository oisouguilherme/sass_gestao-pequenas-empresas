import { withApi, readJson } from "@/server/api";
import { createProductSchema } from "@/server/validators/produto";
import { createProduct, listProducts } from "@/server/services/produto";

export const GET = withApi(async ({ req, ctx }) => {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? undefined;
  return listProducts(ctx, q);
});

export const POST = withApi(async ({ req, ctx }) => {
  const body = createProductSchema.parse(await readJson(req));
  return createProduct(ctx, body);
});
