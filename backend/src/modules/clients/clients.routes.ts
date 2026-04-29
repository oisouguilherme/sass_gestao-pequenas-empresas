import { Router } from "express";
import {
  authJwt,
  requireRole,
  requireTenant,
} from "@/shared/middlewares/auth.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import { validate } from "@/shared/middlewares/validate.js";
import * as controller from "./clients.controller.js";
import { createClientSchema, updateClientSchema } from "./clients.schema.js";

const router = Router();

router.use(authJwt, requireTenant);

router.get("/", asyncHandler(controller.list));
router.get("/:id", asyncHandler(controller.getById));
router.post(
  "/",
  requireRole("ADMIN", "OPERADOR", "VENDEDOR"),
  validate(createClientSchema),
  asyncHandler(controller.create),
);
router.patch(
  "/:id",
  requireRole("ADMIN", "OPERADOR", "VENDEDOR"),
  validate(updateClientSchema),
  asyncHandler(controller.update),
);
router.delete("/:id", requireRole("ADMIN"), asyncHandler(controller.remove));

export default router;
