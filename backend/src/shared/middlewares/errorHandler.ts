import type { ErrorRequestHandler } from 'express'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'
import { AppError } from '../errors/AppError.js'
import { env } from '../config/env.js'

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      message: err.message,
      code: err.code,
      details: err.details,
    })
    return
  }

  if (err instanceof ZodError) {
    res.status(422).json({
      message: 'Erro de validação',
      code: 'VALIDATION_ERROR',
      details: err.flatten().fieldErrors,
    })
    return
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({
        message: 'Registro duplicado',
        code: 'CONFLICT',
        details: err.meta,
      })
      return
    }
    if (err.code === 'P2025') {
      res.status(404).json({ message: 'Recurso não encontrado', code: 'NOT_FOUND' })
      return
    }
  }

  // eslint-disable-next-line no-console
  console.error('[unhandled error]', err)
  res.status(500).json({
    message: 'Erro interno do servidor',
    code: 'INTERNAL_SERVER_ERROR',
    ...(env.NODE_ENV !== 'production' && { error: String(err?.message ?? err) }),
  })
}
