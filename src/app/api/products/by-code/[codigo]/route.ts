import { withApi } from "@/server/api";
import { getProductByCode } from "@/server/services/produto";

export const GET = withApi<{ codigo: string }>(({ ctx, params }) =>
  getProductByCode(ctx, params.codigo),
);
