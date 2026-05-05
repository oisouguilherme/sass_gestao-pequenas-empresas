import type { Request, Response } from "express";
import * as service from "./clients.service.js";
import { paginationSchema } from "@/shared/utils/pagination.js";

export async function list(req: Request, res: Response) {
  const query = paginationSchema.parse(req.query);
  res.json(await service.list(req.user!.empresaId, query));
}

export async function getById(req: Request, res: Response) {
  res.json(await service.findById(req.user!.empresaId, req.params.id));
}

export async function create(req: Request, res: Response) {
  res.status(201).json(await service.create(req.user!.empresaId, req.body));
}

export async function update(req: Request, res: Response) {
  res.json(await service.update(req.user!.empresaId, req.params.id, req.body));
}

export async function remove(req: Request, res: Response) {
  await service.remove(req.user!.empresaId, req.params.id);
  res.status(204).send();
}

export async function getHistorico(req: Request, res: Response) {
  res.json(await service.getHistorico(req.user!.empresaId, req.params.id));
}
