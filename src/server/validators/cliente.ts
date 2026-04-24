import { z } from "zod";

export const createCustomerSchema = z.object({
  nome: z.string().min(1).max(180),
  documento: z.string().max(40).optional().nullable(),
  telefone: z.string().max(40).optional().nullable(),
  endereco: z.string().max(255).optional().nullable(),
  email: z
    .string()
    .email()
    .max(180)
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
