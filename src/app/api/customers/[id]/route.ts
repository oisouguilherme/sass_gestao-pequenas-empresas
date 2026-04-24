import { withApi, readJson } from "@/server/api";
import { updateCustomerSchema } from "@/server/validators/cliente";
import {
  deleteCustomer,
  getCustomer,
  updateCustomer,
} from "@/server/services/cliente";

export const GET = withApi<{ id: string }>(({ ctx, params }) =>
  getCustomer(ctx, params.id),
);

export const PATCH = withApi<{ id: string }>(async ({ req, ctx, params }) => {
  const body = updateCustomerSchema.parse(await readJson(req));
  return updateCustomer(ctx, params.id, body);
});

export const DELETE = withApi<{ id: string }>(async ({ ctx, params }) => {
  await deleteCustomer(ctx, params.id);
  return { ok: true };
});
