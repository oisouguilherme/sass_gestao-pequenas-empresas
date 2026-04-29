import type { Request, Response } from 'express'
import * as service from './users.service.js'
import { paginationSchema } from '@/shared/utils/pagination.js'

export async function list(req: Request, res: Response) {
  const query = paginationSchema.parse(req.query)
  const result = await service.list(req.user!.empresaId, query)
  res.json(result)
}

export async function getById(req: Request, res: Response) {
  const user = await service.findById(req.user!.empresaId, req.params.id)
  res.json(user)
}

export async function create(req: Request, res: Response) {
  const user = await service.create(req.user!.empresaId, req.body)
  res.status(201).json(user)
}

export async function update(req: Request, res: Response) {
  const user = await service.update(req.user!.empresaId, req.params.id, req.body)
  res.json(user)
}

export async function remove(req: Request, res: Response) {
  await service.remove(req.user!.empresaId, req.params.id, req.user!.id)
  res.status(204).send()
}
