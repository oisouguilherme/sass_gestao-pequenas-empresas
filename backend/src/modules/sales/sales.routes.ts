import { Router } from 'express'
import { authJwt, requireRole, requireTenant } from '@/shared/middlewares/auth.js'
import { asyncHandler } from '@/shared/middlewares/asyncHandler.js'
import { validate } from '@/shared/middlewares/validate.js'
import * as controller from './sales.controller.js'
import {
  addItemSchema,
  createSaleSchema,
  finalizeSaleSchema,
  setDiscountSchema,
} from './sales.schema.js'

const router = Router()
router.use(authJwt, requireTenant)

const saleRoles = ['ADMIN', 'VENDEDOR', 'OPERADOR'] as const

router.get('/', asyncHandler(controller.list))
router.get('/:id', asyncHandler(controller.getById))

router.post(
  '/',
  requireRole(...saleRoles),
  validate(createSaleSchema),
  asyncHandler(controller.create),
)
router.post(
  '/:id/itens',
  requireRole(...saleRoles),
  validate(addItemSchema),
  asyncHandler(controller.addItem),
)
router.delete('/:id/itens/:produtoId', requireRole(...saleRoles), asyncHandler(controller.removeItem))

router.patch(
  '/:id/desconto',
  requireRole(...saleRoles),
  validate(setDiscountSchema),
  asyncHandler(controller.setDiscount),
)
router.post(
  '/:id/finalizar',
  requireRole(...saleRoles),
  validate(finalizeSaleSchema),
  asyncHandler(controller.finalize),
)
router.post('/:id/cancelar', requireRole(...saleRoles), asyncHandler(controller.cancel))

export default router
