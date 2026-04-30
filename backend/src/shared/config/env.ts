import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3333),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  APP_URL: z.string().url().default("http://localhost:5173"),

  DATABASE_URL: z.string().min(1),

  JWT_ACCESS_SECRET: z
    .string()
    .min(16, "JWT_ACCESS_SECRET deve ter pelo menos 16 caracteres"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(16, "JWT_REFRESH_SECRET deve ter pelo menos 16 caracteres"),
  JWT_ACCESS_EXPIRES: z.string().default("15m"),
  JWT_REFRESH_EXPIRES: z.string().default("7d"),

  SMTP_HOST: z.string().optional().or(z.literal("")),
  SMTP_PORT: z.preprocess(
    (v) => (v === "" || v === undefined ? undefined : v),
    z.coerce.number().int().positive().optional(),
  ),
  SMTP_USER: z.string().optional().or(z.literal("")),
  SMTP_PASS: z.string().optional().or(z.literal("")),
  SMTP_FROM: z.string().default("SaaS Gestão <no-reply@saasgestao.local>"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error(
    "❌ Variáveis de ambiente inválidas:",
    parsed.error.flatten().fieldErrors,
  );
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
