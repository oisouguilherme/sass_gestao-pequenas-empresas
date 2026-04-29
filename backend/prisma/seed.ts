import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ---- Empresa demo ----
  const empresa = await prisma.empresa.upsert({
    where: { id: "demo-empresa-id" },
    update: {},
    create: {
      id: "demo-empresa-id",
      nome: "Empresa Demo LTDA",
      nomeResponsavel: "Maria Silva",
    },
  });

  // ---- Usuários ----
  const senhaHash = await bcrypt.hash("admin123", 10);

  const admin = await prisma.usuario.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: {
      nome: "Admin Demo",
      email: "admin@demo.com",
      senha: senhaHash,
      telefone: "11999990000",
      role: Role.ADMIN,
      empresaId: empresa.id,
    },
  });

  const vendedor = await prisma.usuario.upsert({
    where: { email: "vendedor@demo.com" },
    update: {},
    create: {
      nome: "Vendedor Demo",
      email: "vendedor@demo.com",
      senha: await bcrypt.hash("vendedor123", 10),
      telefone: "11988880000",
      role: Role.VENDEDOR,
      empresaId: empresa.id,
    },
  });

  const operador = await prisma.usuario.upsert({
    where: { email: "operador@demo.com" },
    update: {},
    create: {
      nome: "Operador Demo",
      email: "operador@demo.com",
      senha: await bcrypt.hash("operador123", 10),
      role: Role.OPERADOR,
      empresaId: empresa.id,
    },
  });

  // ---- Produtos ----
  const produtos = [
    { codigo: "P001", nome: "Camiseta Básica", preco: 49.9 },
    { codigo: "P002", nome: "Calça Jeans", preco: 159.9 },
    { codigo: "P003", nome: "Tênis Esportivo", preco: 299.9 },
  ];

  for (const p of produtos) {
    await prisma.produto.upsert({
      where: { empresaId_codigo: { empresaId: empresa.id, codigo: p.codigo } },
      update: {},
      create: { ...p, empresaId: empresa.id },
    });
  }

  // ---- Clientes ----
  const clientes = [
    {
      nome: "João Pereira",
      documento: "123.456.789-00",
      telefone: "11977770000",
    },
    { nome: "Ana Costa", documento: "987.654.321-00", telefone: "11966660000" },
  ];

  for (const c of clientes) {
    const existing = await prisma.cliente.findFirst({
      where: { empresaId: empresa.id, documento: c.documento },
    });
    if (!existing) {
      await prisma.cliente.create({ data: { ...c, empresaId: empresa.id } });
    }
  }

  // ---- Ordem de Serviço de exemplo ----
  const osCount = await prisma.ordemServico.count({
    where: { empresaId: empresa.id },
  });
  if (osCount === 0) {
    await prisma.ordemServico.create({
      data: {
        nome: "OS demo - manutenção",
        descricao: "Ordem de exemplo criada pelo seed.",
        empresaId: empresa.id,
        deadlineAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        usuarios: { create: [{ usuarioId: vendedor.id }] },
      },
    });
  }

  console.log("✅ Seed concluído.");
  console.log("   Empresa:", empresa.nome);
  console.log("   Login admin:    admin@demo.com    / admin123");
  console.log("   Login vendedor: vendedor@demo.com / vendedor123");
  console.log("   Login operador: operador@demo.com / operador123");
  void admin;
  void operador;
}

main()
  .catch((err) => {
    console.error("❌ Seed falhou:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
