import type { Request, Response } from "express";
import { Router } from "express";
import {
  authJwt,
  requireRole,
  requireTenant,
} from "@/shared/middlewares/auth.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import { salesReport } from "./reports.service.js";
import { salesReportQuerySchema } from "./reports.schema.js";

const router = Router();
router.use(authJwt, requireTenant);

router.get(
  "/sales",
  requireRole("ADMIN", "VENDEDOR"),
  asyncHandler(async (req: Request, res: Response) => {
    const query = salesReportQuerySchema.parse(req.query);
    res.json(await salesReport(req.user!.empresaId, query));
  }),
);

export default router;
