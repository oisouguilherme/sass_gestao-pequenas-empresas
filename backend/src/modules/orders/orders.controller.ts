import type { Request, Response } from "express";
import * as service from "./orders.service.js";
import { listOrdersQuerySchema } from "./orders.schema.js";

export async function list(req: Request, res: Response) {
  const query = listOrdersQuerySchema.parse(req.query);
  res.json(await service.list(req.user!, query));
}

export async function getById(req: Request, res: Response) {
  res.json(await service.findById(req.user!, req.params.id));
}

export async function create(req: Request, res: Response) {
  res.status(201).json(await service.create(req.user!, req.body));
}

export async function update(req: Request, res: Response) {
  res.json(await service.update(req.user!, req.params.id, req.body));
}

export async function updateStatus(req: Request, res: Response) {
  res.json(
    await service.updateStatus(req.user!, req.params.id, req.body.status),
  );
}

export async function setUsuarios(req: Request, res: Response) {
  res.json(
    await service.setUsuarios(req.user!, req.params.id, req.body.usuarioIds),
  );
}

export async function setProdutos(req: Request, res: Response) {
  res.json(
    await service.setProdutos(req.user!, req.params.id, req.body.produtos),
  );
}

export async function getHistorico(req: Request, res: Response) {
  res.json(await service.getHistorico(req.user!, req.params.id));
}

export async function remove(req: Request, res: Response) {
  await service.remove(req.user!, req.params.id);
  res.status(204).send();
}
