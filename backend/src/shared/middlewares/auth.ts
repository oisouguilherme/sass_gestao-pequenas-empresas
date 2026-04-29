import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { verifyAccessToken, type AccessTokenPayload } from '../utils/jwt.js'
import { UnauthorizedError, ForbiddenError } from '../errors/AppError.js'

export interface AuthenticatedUser {
  id: string
  empresaId: string
  role: AccessTokenPayload['role']
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthenticatedUser
  }
}

export function authJwt(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Token de acesso ausente'))
  }
  const token = header.slice('Bearer '.length).trim()
  if (!token) return next(new UnauthorizedError('Token de acesso ausente'))

  try {
    const payload = verifyAccessToken(token)
    req.user = {
      id: payload.sub,
      empresaId: payload.empresaId,
      role: payload.role,
    }
    return next()
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new UnauthorizedError('Token expirado'))
    }
    return next(new UnauthorizedError('Token inválido'))
  }
}

export function requireRole(...roles: AccessTokenPayload['role'][]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new UnauthorizedError())
    if (!roles.includes(req.user.role)) return next(new ForbiddenError())
    next()
  }
}

/** Garante que o usuário autenticado está dentro de uma empresa válida. */
export function requireTenant(req: Request, _res: Response, next: NextFunction) {
  if (!req.user?.empresaId) return next(new UnauthorizedError('Tenant ausente'))
  next()
}
