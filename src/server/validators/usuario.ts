import { z } from "zod";
import { Role } from "@prisma/client";

export const createUserSchema = z.object({
  nome: z.string().min(2).max(120),
  email: z.string().email().max(180),
  telefone: z.string().max(40).optional().nullable(),
  role: z.nativeEnum(Role).default(Role.OPERACIONAL),
  senha: z.string().min(8).max(72).optional(),
});

export const updateUserSchema = z.object({
  nome: z.string().min(2).max(120).optional(),
  telefone: z.string().max(40).optional().nullable(),
  role: z.nativeEnum(Role).optional(),
  ativo: z.boolean().optional(),
  senha: z.string().min(8).max(72).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
