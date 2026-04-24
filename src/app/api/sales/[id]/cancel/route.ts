import { withApi } from "@/server/api";
import { cancelSale } from "@/server/services/venda";

export const POST = withApi<{ id: string }>(({ ctx, params }) =>
  cancelSale(ctx, params.id),
);
