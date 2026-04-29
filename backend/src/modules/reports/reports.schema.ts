import { z } from 'zod'

export const salesReportQuerySchema = z
  .object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    usuarioId: z.string().optional(),
    status: z.enum(['ABERTA', 'FINALIZADA', 'CANCELADA']).optional(),
  })
  .refine(
    (v) => {
      if (v.from && v.to) return v.from <= v.to
      return true
    },
    { message: '`from` deve ser anterior ou igual a `to`' },
  )

export type SalesReportQuery = z.infer<typeof salesReportQuerySchema>
