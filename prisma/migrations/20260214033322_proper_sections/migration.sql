/*
  Warnings:

  - You are about to drop the column `telefone` on the `Candidato` table. All the data in the column will be lost.
  - You are about to drop the column `imagemUrl` on the `Questao` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[dre]` on the table `Candidato` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "EscalaNotas" AS ENUM ('A', 'P_MAIS', 'P_ALTO', 'P', 'P_BAIXO', 'P_MENOS', 'R');

-- CreateEnum
CREATE TYPE "StatusPCO" AS ENUM ('RASCUNHO', 'ATIVA', 'ENCERRADA');

-- CreateEnum
CREATE TYPE "TipoPerguntaPCO" AS ENUM ('ESCALA', 'MULTIPLA_ESCOLHA', 'TEXTO_LIVRE');

-- DropForeignKey
ALTER TABLE "RespostaQuestao" DROP CONSTRAINT "RespostaQuestao_questaoId_fkey";

-- DropForeignKey
ALTER TABLE "ResultadoProva" DROP CONSTRAINT "ResultadoProva_provaId_fkey";

-- AlterTable
ALTER TABLE "Avaliacao" ADD COLUMN     "idCiclo" INTEGER;

-- AlterTable
ALTER TABLE "Candidato" DROP COLUMN "telefone",
ADD COLUMN     "apresArtigo" DECIMAL(5,2),
ADD COLUMN     "aprovadoCapacitacao" BOOLEAN,
ADD COLUMN     "aprovadoDinamica" BOOLEAN,
ADD COLUMN     "aprovadoEntrevista" BOOLEAN,
ADD COLUMN     "curso" TEXT,
ADD COLUMN     "dre" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "notaArtigo" DECIMAL(5,2),
ADD COLUMN     "notaCase" "EscalaNotas",
ADD COLUMN     "notaDinamica" "EscalaNotas",
ADD COLUMN     "notaEntrevista" "EscalaNotas",
ADD COLUMN     "observacao" TEXT,
ADD COLUMN     "periodo" TEXT;

-- AlterTable
ALTER TABLE "Demanda" ADD COLUMN     "idCiclo" INTEGER,
ADD COLUMN     "idSubarea" INTEGER;

-- AlterTable
ALTER TABLE "Membro" ADD COLUMN     "isLiderSubarea" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "subareaId" INTEGER;

-- AlterTable
ALTER TABLE "Prova" ADD COLUMN     "processoSeletivoId" INTEGER;

-- AlterTable
ALTER TABLE "Questao" DROP COLUMN "imagemUrl";

-- AlterTable
ALTER TABLE "RespostaAvaliacao" ADD COLUMN     "oneOnOneFeito" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ResultadoProva" ADD COLUMN     "aprovadoProva" BOOLEAN;

-- CreateTable
CREATE TABLE "Subarea" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "areaId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subarea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ciclo" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(6) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ciclo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessoSeletivo" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcessoSeletivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImagemQuestao" (
    "id" SERIAL NOT NULL,
    "questaoId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImagemQuestao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Termometro" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "dataInicial" DATE NOT NULL,
    "dataFinal" DATE NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "idCiclo" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Termometro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerguntaTermometro" (
    "id" SERIAL NOT NULL,
    "termometroId" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerguntaTermometro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RespostaTermometro" (
    "id" SERIAL NOT NULL,
    "idMembro" INTEGER NOT NULL,
    "idTermometro" INTEGER NOT NULL,
    "nota" INTEGER NOT NULL,

    CONSTRAINT "RespostaTermometro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PCO" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "status" "StatusPCO" NOT NULL DEFAULT 'RASCUNHO',
    "dataInicio" TIMESTAMP(3),
    "dataFim" TIMESTAMP(3),
    "idCiclo" INTEGER,
    "anonima" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PCO_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecaoPCO" (
    "id" SERIAL NOT NULL,
    "pcoId" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "ordem" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecaoPCO_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerguntaPCO" (
    "id" SERIAL NOT NULL,
    "secaoId" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "tipo" "TipoPerguntaPCO" NOT NULL DEFAULT 'ESCALA',
    "obrigatoria" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerguntaPCO_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpcaoPerguntaPCO" (
    "id" SERIAL NOT NULL,
    "perguntaId" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "OpcaoPerguntaPCO_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipacaoPCO" (
    "id" SERIAL NOT NULL,
    "pcoId" INTEGER NOT NULL,
    "membroId" INTEGER NOT NULL,
    "respondeu" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ParticipacaoPCO_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RespostaPCO" (
    "id" SERIAL NOT NULL,
    "perguntaId" INTEGER NOT NULL,
    "membroId" INTEGER NOT NULL,
    "pcoId" INTEGER NOT NULL,
    "nota" INTEGER,
    "opcaoId" INTEGER,
    "texto" TEXT,
    "justificativa" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RespostaPCO_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ImagemQuestao_questaoId_idx" ON "ImagemQuestao"("questaoId");

-- CreateIndex
CREATE INDEX "SecaoPCO_pcoId_idx" ON "SecaoPCO"("pcoId");

-- CreateIndex
CREATE INDEX "PerguntaPCO_secaoId_idx" ON "PerguntaPCO"("secaoId");

-- CreateIndex
CREATE INDEX "OpcaoPerguntaPCO_perguntaId_idx" ON "OpcaoPerguntaPCO"("perguntaId");

-- CreateIndex
CREATE UNIQUE INDEX "ParticipacaoPCO_pcoId_membroId_key" ON "ParticipacaoPCO"("pcoId", "membroId");

-- CreateIndex
CREATE INDEX "RespostaPCO_pcoId_idx" ON "RespostaPCO"("pcoId");

-- CreateIndex
CREATE UNIQUE INDEX "RespostaPCO_perguntaId_membroId_key" ON "RespostaPCO"("perguntaId", "membroId");

-- CreateIndex
CREATE UNIQUE INDEX "Candidato_dre_key" ON "Candidato"("dre");

-- CreateIndex
CREATE INDEX "Prova_processoSeletivoId_idx" ON "Prova"("processoSeletivoId");

-- AddForeignKey
ALTER TABLE "Subarea" ADD CONSTRAINT "Subarea_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membro" ADD CONSTRAINT "Membro_subareaId_fkey" FOREIGN KEY ("subareaId") REFERENCES "Subarea"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_idCiclo_fkey" FOREIGN KEY ("idCiclo") REFERENCES "Ciclo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Demanda" ADD CONSTRAINT "Demanda_idSubarea_fkey" FOREIGN KEY ("idSubarea") REFERENCES "Subarea"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Demanda" ADD CONSTRAINT "Demanda_idCiclo_fkey" FOREIGN KEY ("idCiclo") REFERENCES "Ciclo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prova" ADD CONSTRAINT "Prova_processoSeletivoId_fkey" FOREIGN KEY ("processoSeletivoId") REFERENCES "ProcessoSeletivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImagemQuestao" ADD CONSTRAINT "ImagemQuestao_questaoId_fkey" FOREIGN KEY ("questaoId") REFERENCES "Questao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultadoProva" ADD CONSTRAINT "ResultadoProva_provaId_fkey" FOREIGN KEY ("provaId") REFERENCES "Prova"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaQuestao" ADD CONSTRAINT "RespostaQuestao_questaoId_fkey" FOREIGN KEY ("questaoId") REFERENCES "Questao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Termometro" ADD CONSTRAINT "Termometro_idCiclo_fkey" FOREIGN KEY ("idCiclo") REFERENCES "Ciclo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerguntaTermometro" ADD CONSTRAINT "PerguntaTermometro_termometroId_fkey" FOREIGN KEY ("termometroId") REFERENCES "Termometro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaTermometro" ADD CONSTRAINT "RespostaTermometro_idMembro_fkey" FOREIGN KEY ("idMembro") REFERENCES "Membro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaTermometro" ADD CONSTRAINT "RespostaTermometro_idTermometro_fkey" FOREIGN KEY ("idTermometro") REFERENCES "Termometro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PCO" ADD CONSTRAINT "PCO_idCiclo_fkey" FOREIGN KEY ("idCiclo") REFERENCES "Ciclo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecaoPCO" ADD CONSTRAINT "SecaoPCO_pcoId_fkey" FOREIGN KEY ("pcoId") REFERENCES "PCO"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerguntaPCO" ADD CONSTRAINT "PerguntaPCO_secaoId_fkey" FOREIGN KEY ("secaoId") REFERENCES "SecaoPCO"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpcaoPerguntaPCO" ADD CONSTRAINT "OpcaoPerguntaPCO_perguntaId_fkey" FOREIGN KEY ("perguntaId") REFERENCES "PerguntaPCO"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipacaoPCO" ADD CONSTRAINT "ParticipacaoPCO_pcoId_fkey" FOREIGN KEY ("pcoId") REFERENCES "PCO"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipacaoPCO" ADD CONSTRAINT "ParticipacaoPCO_membroId_fkey" FOREIGN KEY ("membroId") REFERENCES "Membro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaPCO" ADD CONSTRAINT "RespostaPCO_perguntaId_fkey" FOREIGN KEY ("perguntaId") REFERENCES "PerguntaPCO"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaPCO" ADD CONSTRAINT "RespostaPCO_membroId_fkey" FOREIGN KEY ("membroId") REFERENCES "Membro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
