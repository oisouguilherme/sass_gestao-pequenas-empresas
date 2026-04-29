import { Router } from "express";
import {
  authJwt,
  requireRole,
  requireTenant,
} from "@/shared/middlewares/auth.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import { validate } from "@/shared/middlewares/validate.js";
import * as controller from "./products.controller.js";
import { createProductSchema, updateProductSchema } from "./products.schema.js";

const router = Router();

router.use(authJwt, requireTenant);

router.get("/", asyncHandler(controller.list));
router.get("/by-codigo/:codigo", asyncHandler(controller.getByCodigo));
router.get("/:id", asyncHandler(controller.getById));

router.post(
  "/",
  requireRole("ADMIN", "OPERADOR"),
  validate(createProductSchema),
  asyncHandler(controller.create),
);
router.patch(
  "/:id",
  requireRole("ADMIN", "OPERADOR"),
  validate(updateProductSchema),
  asyncHandler(controller.update),
);
router.delete("/:id", requireRole("ADMIN"), asyncHandler(controller.remove));

export default router;
