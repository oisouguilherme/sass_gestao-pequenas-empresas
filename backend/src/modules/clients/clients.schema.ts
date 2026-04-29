import { z } from "zod";

export const createClientSchema = z.object({
  nome: z.string().trim().min(1),
  documento: z.string().trim().optional(),
  telefone: z.string().trim().optional(),
  endereco: z.string().trim().optional(),
  email: z
    .string()
    .email()
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export const updateClientSchema = createClientSchema.partial();

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
