import { z } from "zod";

export const createProductSchema = z.object({
  nome: z.string().min(1).max(180),
  preco: z.coerce.number().nonnegative().max(99999999.99),
  codigo: z.string().max(80).optional().nullable(),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
