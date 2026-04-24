import { withApi } from "@/server/api";
import { globalSearch } from "@/server/services/reports";

export const GET = withApi(async ({ req, ctx }) => {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  return globalSearch(ctx, q);
});
