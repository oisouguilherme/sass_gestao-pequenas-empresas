import { z } from "zod";

export const roleSchema = z.enum(["ADMIN", "VENDEDOR", "OPERADOR"]);

export const createUserSchema = z.object({
  nome: z.string().trim().min(2),
  email: z.string().email(),
  senha: z.string().min(6),
  telefone: z.string().trim().optional(),
  role: roleSchema.default("OPERADOR"),
});

export const updateUserSchema = z.object({
  nome: z.string().trim().min(2).optional(),
  email: z.string().email().optional(),
  senha: z.string().min(6).optional(),
  telefone: z.string().trim().nullable().optional(),
  role: roleSchema.optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
