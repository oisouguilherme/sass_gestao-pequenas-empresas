import { VendaStatus } from "@prisma/client";
import { withApi, readJson } from "@/server/api";
import { createSaleSchema } from "@/server/validators/venda";
import { createSale, listSales } from "@/server/services/venda";

export const GET = withApi(async ({ req, ctx }) => {
  const url = new URL(req.url);
  const statusParam = url.searchParams.get("status");
  const status =
    statusParam && statusParam in VendaStatus
      ? (statusParam as VendaStatus)
      : undefined;
  return listSales(ctx, {
    status,
    usuarioId: url.searchParams.get("usuarioId") ?? undefined,
  });
});

export const POST = withApi(async ({ req, ctx }) => {
  const body = createSaleSchema.parse(await readJson(req));
  return createSale(ctx, body);
});
