import { withApi, readJson } from "@/server/api";
import { createCustomerSchema } from "@/server/validators/cliente";
import { createCustomer, listCustomers } from "@/server/services/cliente";

export const GET = withApi(async ({ req, ctx }) => {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? undefined;
  return listCustomers(ctx, q);
});

export const POST = withApi(async ({ req, ctx }) => {
  const body = createCustomerSchema.parse(await readJson(req));
  return createCustomer(ctx, body);
});
