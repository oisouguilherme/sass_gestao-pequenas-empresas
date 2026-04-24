import { withApi } from "@/server/api";
import { getSale } from "@/server/services/venda";

export const GET = withApi<{ id: string }>(({ ctx, params }) =>
  getSale(ctx, params.id),
);
