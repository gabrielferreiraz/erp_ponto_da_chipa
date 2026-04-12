-- Add cash register closing fields to shift_closings
ALTER TABLE "shift_closings" ADD COLUMN "qtdPedidos" INTEGER;
ALTER TABLE "shift_closings" ADD COLUMN "totalVendas" DECIMAL(10,2);
ALTER TABLE "shift_closings" ADD COLUMN "totalDinheiro" DECIMAL(10,2);
ALTER TABLE "shift_closings" ADD COLUMN "totalPix" DECIMAL(10,2);
ALTER TABLE "shift_closings" ADD COLUMN "totalCartaoDebito" DECIMAL(10,2);
ALTER TABLE "shift_closings" ADD COLUMN "totalCartaoCredito" DECIMAL(10,2);
ALTER TABLE "shift_closings" ADD COLUMN "totalCancelados" DECIMAL(10,2);
ALTER TABLE "shift_closings" ADD COLUMN "dinheiroFisico" DECIMAL(10,2);
ALTER TABLE "shift_closings" ADD COLUMN "divergenciaCaixa" DECIMAL(10,2);
ALTER TABLE "shift_closings" ADD COLUMN "observacaoCaixa" TEXT;
