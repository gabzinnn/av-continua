-- AlterTable
ALTER TABLE "Demanda" ADD COLUMN     "idArea" INTEGER;

-- AddForeignKey
ALTER TABLE "Demanda" ADD CONSTRAINT "Demanda_idArea_fkey" FOREIGN KEY ("idArea") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;
