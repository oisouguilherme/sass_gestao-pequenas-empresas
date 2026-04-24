import { withApi } from "@/server/api";
import { finalizeSale } from "@/server/services/venda";

export const POST = withApi<{ id: string }>(({ ctx, params }) =>
  finalizeSale(ctx, params.id),
);
