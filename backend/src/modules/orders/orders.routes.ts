import { Router } from 'express'
import { authJwt, requireRole, requireTenant } from '@/shared/middlewares/auth.js'
import { asyncHandler } from '@/shared/middlewares/asyncHandler.js'
import { validate } from '@/shared/middlewares/validate.js'
import * as controller from './orders.controller.js'
import {
  createOrderSchema,
  setProdutosSchema,
  setUsuariosSchema,
  updateOrderSchema,
  updateStatusSchema,
} from './orders.schema.js'

const router = Router()
router.use(authJwt, requireTenant)

const writeRoles = ['ADMIN', 'OPERADOR'] as const

router.get('/', asyncHandler(controller.list))
router.get('/:id', asyncHandler(controller.getById))

router.post(
  '/',
  requireRole(...writeRoles),
  validate(createOrderSchema),
  asyncHandler(controller.create),
)
router.patch(
  '/:id',
  requireRole(...writeRoles),
  validate(updateOrderSchema),
  asyncHandler(controller.update),
)
router.patch(
  '/:id/status',
  requireRole(...writeRoles),
  validate(updateStatusSchema),
  asyncHandler(controller.updateStatus),
)
router.put(
  '/:id/usuarios',
  requireRole(...writeRoles),
  validate(setUsuariosSchema),
  asyncHandler(controller.setUsuarios),
)
router.put(
  '/:id/produtos',
  requireRole(...writeRoles),
  validate(setProdutosSchema),
  asyncHandler(controller.setProdutos),
)
router.delete('/:id', requireRole('ADMIN'), asyncHandler(controller.remove))

export default router
