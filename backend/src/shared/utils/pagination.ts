import { z } from 'zod'

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(20),
  q: z.string().trim().min(1).optional(),
})

export type PaginationQuery = z.infer<typeof paginationSchema>

export interface Paginated<T> {
  data: T[]
  meta: {
    page: number
    perPage: number
    total: number
    totalPages: number
  }
}

export const buildPagination = ({ page, perPage }: PaginationQuery) => ({
  skip: (page - 1) * perPage,
  take: perPage,
})

export const paginatedResult = <T>(
  data: T[],
  total: number,
  { page, perPage }: PaginationQuery,
): Paginated<T> => ({
  data,
  meta: {
    page,
    perPage,
    total,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  },
})
