import type { Request, Response } from "express";
import * as service from "./sales.service.js";
import { listSalesQuerySchema } from "./sales.schema.js";

export async function list(req: Request, res: Response) {
  const query = listSalesQuerySchema.parse(req.query);
  res.json(await service.list(req.user!, query));
}

export async function getById(req: Request, res: Response) {
  res.json(await service.findById(req.user!, req.params.id));
}

export async function create(req: Request, res: Response) {
  res.status(201).json(await service.create(req.user!, req.body));
}

export async function addItem(req: Request, res: Response) {
  res.json(await service.addItem(req.user!, req.params.id, req.body));
}

export async function removeItem(req: Request, res: Response) {
  res.json(
    await service.removeItem(req.user!, req.params.id, req.params.produtoId),
  );
}

export async function setDiscount(req: Request, res: Response) {
  res.json(
    await service.setDiscount(req.user!, req.params.id, req.body.desconto),
  );
}

export async function finalize(req: Request, res: Response) {
  res.json(
    await service.finalize(req.user!, req.params.id, req.body.tipoPagamento),
  );
}

export async function cancel(req: Request, res: Response) {
  res.json(await service.cancel(req.user!, req.params.id));
}
