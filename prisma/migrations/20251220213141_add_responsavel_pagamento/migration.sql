-- AlterTable
ALTER TABLE "Pagamento" ADD COLUMN     "responsavelId" INTEGER;

-- AddForeignKey
ALTER TABLE "Pagamento" ADD CONSTRAINT "Pagamento_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Membro"("id") ON DELETE SET NULL ON UPDATE CASCADE;
