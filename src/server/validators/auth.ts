import { z } from "zod";

export const signupSchema = z.object({
  empresa: z.object({
    nome: z.string().min(2).max(120),
    nomeResponsavel: z.string().min(2).max(120),
  }),
  admin: z.object({
    nome: z.string().min(2).max(120),
    email: z.string().email().max(180),
    senha: z.string().min(8).max(72),
    telefone: z.string().max(40).optional().nullable(),
  }),
});

export const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
