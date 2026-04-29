import { z } from 'zod'

export const osStatusSchema = z.enum(['ABERTA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA'])

export const createOrderSchema = z.object({
  nome: z.string().trim().min(1),
  descricao: z.string().trim().optional(),
  deadlineAt: z.coerce.date().optional(),
  pago: z.boolean().optional(),
  usuarioIds: z.array(z.string().min(1)).optional(),
  produtos: z
    .array(
      z.object({
        produtoId: z.string().min(1),
        quantidade: z.coerce.number().int().positive().default(1),
      }),
    )
    .optional(),
})

export const updateOrderSchema = z.object({
  nome: z.string().trim().min(1).optional(),
  descricao: z.string().trim().nullable().optional(),
  deadlineAt: z.coerce.date().nullable().optional(),
  pago: z.boolean().optional(),
})

export const updateStatusSchema = z.object({
  status: osStatusSchema,
})

export const setUsuariosSchema = z.object({
  usuarioIds: z.array(z.string().min(1)),
})

export const setProdutosSchema = z.object({
  produtos: z.array(
    z.object({
      produtoId: z.string().min(1),
      quantidade: z.coerce.number().int().positive().default(1),
    }),
  ),
})

export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(20),
  q: z.string().trim().min(1).optional(),
  status: osStatusSchema.optional(),
  usuarioId: z.string().optional(),
  deadlineAte: z.coerce.date().optional(),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>
