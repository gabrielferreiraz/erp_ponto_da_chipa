-- CreateEnum
CREATE TYPE "role" AS ENUM ('ADMIN', 'CAIXA', 'ATENDENTE');

-- CreateEnum
CREATE TYPE "tipo_pedido" AS ENUM ('LOCAL', 'VIAGEM');

-- CreateEnum
CREATE TYPE "order_status" AS ENUM ('ABERTO', 'AGUARDANDO_COBRANCA', 'CANCELADO', 'PAGO');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('PENDENTE', 'PAGO', 'FALHOU');

-- CreateEnum
CREATE TYPE "forma_pagamento" AS ENUM ('DINHEIRO', 'PIX', 'CARTAO_DEBITO', 'CARTAO_CREDITO');

-- CreateEnum
CREATE TYPE "status_item" AS ENUM ('ATIVO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "tipo_movimentacao" AS ENUM ('VENDA', 'REPOSICAO_VISOR', 'ENTRADA_ESTOQUE', 'AJUSTE', 'PERDA');

-- CreateEnum
CREATE TYPE "origem_estoque" AS ENUM ('ESTOQUE', 'VISOR');

-- CreateEnum
CREATE TYPE "shift_status" AS ENUM ('EM_ANDAMENTO', 'FINALIZADO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "role" "role" NOT NULL DEFAULT 'ATENDENTE',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cor" TEXT NOT NULL DEFAULT '#000000',
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produtos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "preco" DECIMAL(10,2) NOT NULL,
    "qtdEstoque" INTEGER NOT NULL DEFAULT 0,
    "qtdVisor" INTEGER NOT NULL DEFAULT 0,
    "estoqueMinimo" INTEGER NOT NULL DEFAULT 5,
    "disponivel" BOOLEAN NOT NULL DEFAULT true,
    "imagemUrl" TEXT,
    "precoAnterior" DECIMAL(10,2),
    "precoAtualizadoEm" TIMESTAMP(3),
    "precoAtualizadoPorId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mesas" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "mesas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "mesaId" TEXT,
    "tipo" "tipo_pedido" NOT NULL,
    "orderStatus" "order_status" NOT NULL DEFAULT 'AGUARDANDO_COBRANCA',
    "paymentStatus" "payment_status" NOT NULL DEFAULT 'PENDENTE',
    "observacao" TEXT,
    "formaPagamento" "forma_pagamento",
    "idempotencyKey" TEXT,
    "totalBruto" DECIMAL(10,2),
    "totalCancelado" DECIMAL(10,2),
    "totalFinal" DECIMAL(10,2),
    "atendenteId" TEXT NOT NULL,
    "caixaId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pagoEm" TIMESTAMP(3),

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_pedido" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "nomeSnapshot" TEXT NOT NULL,
    "precoSnapshot" DECIMAL(10,2) NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "status" "status_item" NOT NULL DEFAULT 'ATIVO',
    "motivoCancelamento" TEXT,
    "canceladoPorId" TEXT,
    "canceladoEm" TIMESTAMP(3),

    CONSTRAINT "itens_pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentacoes_estoque" (
    "id" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "tipo" "tipo_movimentacao" NOT NULL,
    "origem" "origem_estoque" NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "pedidoId" TEXT,
    "usuarioId" TEXT NOT NULL,
    "observacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentacoes_estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shift_closings" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "iniciadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizadoEm" TIMESTAMP(3),
    "status" "shift_status" NOT NULL DEFAULT 'EM_ANDAMENTO',

    CONSTRAINT "shift_closings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shift_closing_items" (
    "id" TEXT NOT NULL,
    "shiftClosingId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "qtdSistema" INTEGER NOT NULL,
    "qtdFisica" INTEGER NOT NULL,
    "diferenca" INTEGER NOT NULL,
    "motivo" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shift_closing_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "produtos_categoriaId_idx" ON "produtos"("categoriaId");

-- CreateIndex
CREATE INDEX "produtos_disponivel_idx" ON "produtos"("disponivel");

-- CreateIndex
CREATE UNIQUE INDEX "mesas_numero_key" ON "mesas"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_codigo_key" ON "pedidos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_idempotencyKey_key" ON "pedidos"("idempotencyKey");

-- CreateIndex
CREATE INDEX "pedidos_orderStatus_idx" ON "pedidos"("orderStatus");

-- CreateIndex
CREATE INDEX "pedidos_paymentStatus_idx" ON "pedidos"("paymentStatus");

-- CreateIndex
CREATE INDEX "pedidos_atendenteId_idx" ON "pedidos"("atendenteId");

-- CreateIndex
CREATE INDEX "pedidos_criadoEm_idx" ON "pedidos"("criadoEm");

-- CreateIndex
CREATE INDEX "itens_pedido_pedidoId_idx" ON "itens_pedido"("pedidoId");

-- CreateIndex
CREATE INDEX "itens_pedido_produtoId_idx" ON "itens_pedido"("produtoId");

-- CreateIndex
CREATE INDEX "itens_pedido_status_idx" ON "itens_pedido"("status");

-- CreateIndex
CREATE INDEX "movimentacoes_estoque_produtoId_idx" ON "movimentacoes_estoque"("produtoId");

-- CreateIndex
CREATE INDEX "movimentacoes_estoque_criadoEm_idx" ON "movimentacoes_estoque"("criadoEm");

-- CreateIndex
CREATE INDEX "movimentacoes_estoque_tipo_idx" ON "movimentacoes_estoque"("tipo");

-- CreateIndex
CREATE INDEX "shift_closings_status_idx" ON "shift_closings"("status");

-- CreateIndex
CREATE INDEX "shift_closings_iniciadoEm_idx" ON "shift_closings"("iniciadoEm");

-- CreateIndex
CREATE INDEX "shift_closing_items_shiftClosingId_idx" ON "shift_closing_items"("shiftClosingId");

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_mesaId_fkey" FOREIGN KEY ("mesaId") REFERENCES "mesas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_atendenteId_fkey" FOREIGN KEY ("atendenteId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_caixaId_fkey" FOREIGN KEY ("caixaId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_canceladoPorId_fkey" FOREIGN KEY ("canceladoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_closings" ADD CONSTRAINT "shift_closings_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_closing_items" ADD CONSTRAINT "shift_closing_items_shiftClosingId_fkey" FOREIGN KEY ("shiftClosingId") REFERENCES "shift_closings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_closing_items" ADD CONSTRAINT "shift_closing_items_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
