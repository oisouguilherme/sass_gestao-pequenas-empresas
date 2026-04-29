import { z } from "zod";

export const tipoPagamentoSchema = z.enum([
  "DINHEIRO",
  "PIX",
  "CREDITO",
  "DEBITO",
]);

export const createSaleSchema = z.object({
  produtos: z
    .array(
      z.object({
        produtoId: z.string().min(1),
        quantidade: z.coerce.number().int().positive().default(1),
      }),
    )
    .optional()
    .default([]),
  desconto: z.coerce.number().nonnegative().default(0),
});

export const addItemSchema = z
  .object({
    produtoId: z.string().min(1).optional(),
    codigo: z.string().min(1).optional(),
    quantidade: z.coerce.number().int().positive().default(1),
  })
  .refine((v) => v.produtoId || v.codigo, {
    message: "Informe produtoId ou codigo",
  });

export const removeItemSchema = z.object({
  produtoId: z.string().min(1),
});

export const setDiscountSchema = z.object({
  desconto: z.coerce.number().nonnegative(),
});

export const finalizeSaleSchema = z.object({
  tipoPagamento: tipoPagamentoSchema,
});

export const listSalesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(["ABERTA", "FINALIZADA", "CANCELADA"]).optional(),
  usuarioId: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type AddItemInput = z.infer<typeof addItemSchema>;
export type ListSalesQuery = z.infer<typeof listSalesQuerySchema>;
