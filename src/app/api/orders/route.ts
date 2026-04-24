import { OrdemServicoStatus } from "@prisma/client";
import { withApi, readJson } from "@/server/api";
import { createOrderSchema } from "@/server/validators/ordemServico";
import { createOrder, listOrders } from "@/server/services/ordemServico";

export const GET = withApi(async ({ req, ctx }) => {
  const url = new URL(req.url);
  const statusParam = url.searchParams.get("status");
  const status =
    statusParam && statusParam in OrdemServicoStatus
      ? (statusParam as OrdemServicoStatus)
      : undefined;
  return listOrders(ctx, {
    status,
    clienteId: url.searchParams.get("clienteId") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
    atrasadas: url.searchParams.get("atrasadas") === "1",
  });
});

export const POST = withApi(async ({ req, ctx }) => {
  const body = createOrderSchema.parse(await readJson(req));
  return createOrder(ctx, body);
});
