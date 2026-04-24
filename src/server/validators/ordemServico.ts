import { z } from "zod";
import { OrdemServicoStatus } from "@prisma/client";

export const createOrderSchema = z.object({
  nome: z.string().min(1).max(180),
  descricao: z.string().max(2000).optional().nullable(),
  clienteId: z.string().min(1),
  deadlineAt: z.coerce.date().optional().nullable(),
  usuarioIds: z.array(z.string()).default([]),
  produtos: z
    .array(
      z.object({
        produtoId: z.string().min(1),
        quantidade: z.number().int().min(1),
      }),
    )
    .default([]),
});

export const updateOrderSchema = z.object({
  nome: z.string().min(1).max(180).optional(),
  descricao: z.string().max(2000).optional().nullable(),
  clienteId: z.string().optional(),
  deadlineAt: z.coerce.date().optional().nullable(),
  pago: z.boolean().optional(),
});

export const assignUsersSchema = z.object({
  usuarioIds: z.array(z.string().min(1)),
});

export const setProductsSchema = z.object({
  produtos: z.array(
    z.object({
      produtoId: z.string().min(1),
      quantidade: z.number().int().min(1),
    }),
  ),
});

export const changeStatusSchema = z.object({
  status: z.nativeEnum(OrdemServicoStatus),
  observacao: z.string().max(500).optional().nullable(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type AssignUsersInput = z.infer<typeof assignUsersSchema>;
export type SetProductsInput = z.infer<typeof setProductsSchema>;
export type ChangeStatusInput = z.infer<typeof changeStatusSchema>;
