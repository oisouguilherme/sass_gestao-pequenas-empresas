import { z } from 'zod'

export const createProductSchema = z.object({
  nome: z.string().trim().min(1),
  preco: z.coerce.number().nonnegative(),
  codigo: z.string().trim().min(1),
})

export const updateProductSchema = createProductSchema.partial()

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
