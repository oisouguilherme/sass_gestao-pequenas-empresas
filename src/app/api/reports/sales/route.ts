import { Role } from "@prisma/client";
import { withApi } from "@/server/api";
import { reportFiltersSchema } from "@/server/validators/venda";
import { salesReport } from "@/server/services/reports";

export const GET = withApi(
  async ({ req, ctx }) => {
    const url = new URL(req.url);
    const filters = reportFiltersSchema.parse({
      from: url.searchParams.get("from") ?? undefined,
      to: url.searchParams.get("to") ?? undefined,
      usuarioId: url.searchParams.get("usuarioId") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
    });
    return salesReport(ctx, filters);
  },
  { roles: [Role.ADMIN] },
);
