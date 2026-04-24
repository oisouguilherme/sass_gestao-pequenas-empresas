import { withApi } from "@/server/api";
import { prisma } from "@/server/db/prisma";

export const GET = withApi(async ({ ctx }) => {
  const user = await prisma.usuario.findUnique({
    where: { id: ctx.userId },
    select: {
      id: true,
      nome: true,
      email: true,
      role: true,
      empresa: { select: { id: true, nome: true } },
    },
  });
  return { user };
});
