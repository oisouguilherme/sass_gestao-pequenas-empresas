import { z } from "zod";
import { TipoPagamento } from "@prisma/client";

export const createSaleSchema = z.object({
  tipoPagamento: z.nativeEnum(TipoPagamento),
  desconto: z.coerce.number().nonnegative().default(0),
  itens: z
    .array(
      z.object({
        produtoId: z.string().min(1),
        quantidade: z.number().int().min(1),
      }),
    )
    .min(1, "Adicione ao menos 1 item"),
});

export const reportFiltersSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  usuarioId: z.string().optional(),
  status: z.string().optional(),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type ReportFilters = z.infer<typeof reportFiltersSchema>;
