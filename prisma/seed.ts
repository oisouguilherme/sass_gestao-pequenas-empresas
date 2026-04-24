import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const existing = await prisma.empresa.findFirst({
    where: { nome: "Gráfica Demo" },
  });
  if (existing) {
    console.log("Seed já aplicado.");
    return;
  }

  const empresa = await prisma.empresa.create({
    data: {
      nome: "Gráfica Demo",
      nomeResponsavel: "João Demo",
    },
  });

  await prisma.usuario.create({
    data: {
      nome: "Admin Demo",
      email: "admin@demo.com",
      senhaHash: await hash("admin1234", 10),
      role: Role.ADMIN,
      empresaId: empresa.id,
    },
  });

  await prisma.usuario.create({
    data: {
      nome: "Operador Demo",
      email: "op@demo.com",
      senhaHash: await hash("op123456", 10),
      role: Role.OPERACIONAL,
      empresaId: empresa.id,
    },
  });

  await prisma.produto.createMany({
    data: [
      {
        nome: "Cartão de Visita 250un",
        preco: 80,
        codigo: "CV250",
        empresaId: empresa.id,
      },
      {
        nome: "Banner 1x1m",
        preco: 60,
        codigo: "BN1X1",
        empresaId: empresa.id,
      },
      { nome: "Adesivo A4", preco: 25, codigo: "AD-A4", empresaId: empresa.id },
    ],
  });

  await prisma.cliente.create({
    data: {
      nome: "Cliente Exemplo",
      documento: "12345678900",
      telefone: "(11) 99999-9999",
      email: "cliente@exemplo.com",
      empresaId: empresa.id,
    },
  });

  console.log("Seed aplicado.");
  console.log("Login admin: admin@demo.com / admin1234");
  console.log("Login op:    op@demo.com / op123456");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
