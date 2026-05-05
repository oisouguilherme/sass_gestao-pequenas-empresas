-- AlterTable: add clienteId to vendas
ALTER TABLE "vendas" ADD COLUMN "clienteId" TEXT;

-- AlterTable: add clienteId to ordens_servico
ALTER TABLE "ordens_servico" ADD COLUMN "clienteId" TEXT;

-- CreateTable: ordens_servico_historico
CREATE TABLE "ordens_servico_historico" (
    "id" TEXT NOT NULL,
    "ordemServicoId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ordens_servico_historico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vendas_clienteId_idx" ON "vendas"("clienteId");

-- CreateIndex
CREATE INDEX "ordens_servico_clienteId_idx" ON "ordens_servico"("clienteId");

-- CreateIndex
CREATE INDEX "ordens_servico_historico_ordemServicoId_idx" ON "ordens_servico_historico"("ordemServicoId");

-- AddForeignKey
ALTER TABLE "vendas" ADD CONSTRAINT "vendas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico_historico" ADD CONSTRAINT "ordens_servico_historico_ordemServicoId_fkey" FOREIGN KEY ("ordemServicoId") REFERENCES "ordens_servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;
