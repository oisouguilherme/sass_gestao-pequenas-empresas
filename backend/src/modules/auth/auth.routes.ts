import { Router } from "express";
import rateLimit from "express-rate-limit";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import { authJwt } from "@/shared/middlewares/auth.js";
import { validate } from "@/shared/middlewares/validate.js";
import * as authController from "./auth.controller.js";
import { loginSchema } from "./auth.schema.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Muitas tentativas de login. Tente novamente em alguns minutos.",
  },
});

router.post(
  "/login",
  loginLimiter,
  validate(loginSchema),
  asyncHandler(authController.login),
);
router.post("/refresh", asyncHandler(authController.refresh));
router.post("/logout", asyncHandler(authController.logout));
router.get("/me", authJwt, asyncHandler(authController.me));

export default router;
