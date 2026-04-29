import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { env } from "./shared/config/env.js";
import { errorHandler } from "./shared/middlewares/errorHandler.js";
import authRoutes from "./modules/auth/auth.routes.js";
import usersRoutes from "./modules/users/users.routes.js";
import productsRoutes from "./modules/products/products.routes.js";
import clientsRoutes from "./modules/clients/clients.routes.js";
import ordersRoutes from "./modules/orders/orders.routes.js";
import salesRoutes from "./modules/sales/sales.routes.js";
import reportsRoutes from "./modules/reports/reports.routes.js";

export function createApp(): Express {
  const app = express();

  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  // Rate limit global modesto para mitigar abusos
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 600,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === "/health",
  });
  app.use(globalLimiter);

  app.get("/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      service: "saas-gestao-backend",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/auth", authRoutes);
  app.use("/users", usersRoutes);
  app.use("/products", productsRoutes);
  app.use("/clients", clientsRoutes);
  app.use("/orders", ordersRoutes);
  app.use("/sales", salesRoutes);
  app.use("/reports", reportsRoutes);

  app.use((_req, res) => {
    res.status(404).json({ message: "Rota não encontrada" });
  });

  app.use(errorHandler);

  return app;
}
