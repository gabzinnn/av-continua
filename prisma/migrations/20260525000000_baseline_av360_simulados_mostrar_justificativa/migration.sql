-- ============================================================
-- BASELINE: Changes applied via db push, not tracked in migrations.
-- Mark as applied with: prisma migrate resolve --applied 20260525000000_baseline_av360_simulados_mostrar_justificativa
-- ============================================================

-- ==========================================
-- AVALIAÇÃO 360
-- ==========================================

-- CreateEnum
CREATE TYPE "StatusAvaliacao360" AS ENUM ('RASCUNHO', 'ATIVA', 'ENCERRADA');

-- CreateEnum
CREATE TYPE "TipoPergunta360" AS ENUM ('ESCALA', 'TEXTO_ABERTO');

-- CreateTable
CREATE TABLE "Avaliacao360" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "status" "StatusAvaliacao360" NOT NULL DEFAULT 'RASCUNHO',
    "dataInicio" TIMESTAMP(3),
    "dataFim" TIMESTAMP(3),
    "idCiclo" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Avaliacao360_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dimensao360" (
    "id" SERIAL NOT NULL,
    "avaliacaoId" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "peso" DECIMAL(5,2),
    "ordem" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dimensao360_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pergunta360" (
    "id" SERIAL NOT NULL,
    "dimensaoId" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "tipo" "TipoPergunta360" NOT NULL DEFAULT 'ESCALA',
    "obrigatoria" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pergunta360_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback360" (
    "id" SERIAL NOT NULL,
    "avaliacaoId" INTEGER NOT NULL,
    "avaliadorId" INTEGER NOT NULL,
    "avaliadoId" INTEGER NOT NULL,
    "finalizado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feedback360_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RespostaPergunta360" (
    "id" SERIAL NOT NULL,
    "feedbackId" INTEGER NOT NULL,
    "perguntaId" INTEGER NOT NULL,
    "nota" INTEGER,
    "texto" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RespostaPergunta360_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Dimensao360_avaliacaoId_idx" ON "Dimensao360"("avaliacaoId");

-- CreateIndex
CREATE INDEX "Pergunta360_dimensaoId_idx" ON "Pergunta360"("dimensaoId");

-- CreateIndex
CREATE UNIQUE INDEX "Feedback360_avaliacaoId_avaliadorId_avaliadoId_key" ON "Feedback360"("avaliacaoId", "avaliadorId", "avaliadoId");

-- CreateIndex
CREATE INDEX "Feedback360_avaliacaoId_idx" ON "Feedback360"("avaliacaoId");

-- CreateIndex
CREATE INDEX "Feedback360_avaliadorId_idx" ON "Feedback360"("avaliadorId");

-- CreateIndex
CREATE INDEX "Feedback360_avaliadoId_idx" ON "Feedback360"("avaliadoId");

-- CreateIndex
CREATE UNIQUE INDEX "RespostaPergunta360_feedbackId_perguntaId_key" ON "RespostaPergunta360"("feedbackId", "perguntaId");

-- CreateIndex
CREATE INDEX "RespostaPergunta360_feedbackId_idx" ON "RespostaPergunta360"("feedbackId");

-- CreateIndex
CREATE INDEX "RespostaPergunta360_perguntaId_idx" ON "RespostaPergunta360"("perguntaId");

-- AddForeignKey
ALTER TABLE "Avaliacao360" ADD CONSTRAINT "Avaliacao360_idCiclo_fkey" FOREIGN KEY ("idCiclo") REFERENCES "Ciclo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dimensao360" ADD CONSTRAINT "Dimensao360_avaliacaoId_fkey" FOREIGN KEY ("avaliacaoId") REFERENCES "Avaliacao360"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pergunta360" ADD CONSTRAINT "Pergunta360_dimensaoId_fkey" FOREIGN KEY ("dimensaoId") REFERENCES "Dimensao360"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback360" ADD CONSTRAINT "Feedback360_avaliacaoId_fkey" FOREIGN KEY ("avaliacaoId") REFERENCES "Avaliacao360"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback360" ADD CONSTRAINT "Feedback360_avaliadorId_fkey" FOREIGN KEY ("avaliadorId") REFERENCES "Membro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback360" ADD CONSTRAINT "Feedback360_avaliadoId_fkey" FOREIGN KEY ("avaliadoId") REFERENCES "Membro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaPergunta360" ADD CONSTRAINT "RespostaPergunta360_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "Feedback360"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaPergunta360" ADD CONSTRAINT "RespostaPergunta360_perguntaId_fkey" FOREIGN KEY ("perguntaId") REFERENCES "Pergunta360"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ==========================================
-- SIMULADOS — PROGRAMA DE PREPARAÇÃO
-- ==========================================

-- CreateEnum
CREATE TYPE "BancoSimulado" AS ENUM ('GMAT', 'BUSINESS_CASE');

-- CreateEnum
CREATE TYPE "DificuldadeSimulado" AS ENUM ('FACIL', 'MEDIO', 'DIFICIL');

-- CreateEnum
CREATE TYPE "StatusSessaoSimulado" AS ENUM ('EM_ANDAMENTO', 'FINALIZADO');

-- CreateTable
CREATE TABLE "QuestaoSimulado" (
    "id" SERIAL NOT NULL,
    "enunciado" TEXT NOT NULL,
    "banco" "BancoSimulado" NOT NULL,
    "dificuldade" "DificuldadeSimulado",
    "respostaModelo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestaoSimulado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlternativaSimulado" (
    "id" SERIAL NOT NULL,
    "questaoId" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "correta" BOOLEAN NOT NULL DEFAULT false,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "AlternativaSimulado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImagemQuestaoSimulado" (
    "id" SERIAL NOT NULL,
    "questaoId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImagemQuestaoSimulado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessaoSimulado" (
    "id" SERIAL NOT NULL,
    "nomeUsuario" TEXT NOT NULL,
    "emailUsuario" TEXT NOT NULL,
    "tipoSimulado" TEXT NOT NULL,
    "dificuldade" TEXT,
    "tempoTotalSegundos" INTEGER NOT NULL,
    "tempoRestanteSegundos" INTEGER NOT NULL,
    "status" "StatusSessaoSimulado" NOT NULL DEFAULT 'EM_ANDAMENTO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizadoEm" TIMESTAMP(3),

    CONSTRAINT "SessaoSimulado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessaoSimuladoQuestao" (
    "id" SERIAL NOT NULL,
    "sessaoId" INTEGER NOT NULL,
    "questaoId" INTEGER NOT NULL,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "SessaoSimuladoQuestao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RespostaSimulado" (
    "id" SERIAL NOT NULL,
    "sessaoId" INTEGER NOT NULL,
    "questaoId" INTEGER NOT NULL,
    "respostaDiscursiva" TEXT,
    "alternativaSelecionadaId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RespostaSimulado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AlternativaSimulado_questaoId_idx" ON "AlternativaSimulado"("questaoId");

-- CreateIndex
CREATE INDEX "ImagemQuestaoSimulado_questaoId_idx" ON "ImagemQuestaoSimulado"("questaoId");

-- CreateIndex
CREATE UNIQUE INDEX "SessaoSimuladoQuestao_sessaoId_questaoId_key" ON "SessaoSimuladoQuestao"("sessaoId", "questaoId");

-- CreateIndex
CREATE INDEX "SessaoSimuladoQuestao_sessaoId_idx" ON "SessaoSimuladoQuestao"("sessaoId");

-- CreateIndex
CREATE UNIQUE INDEX "RespostaSimulado_sessaoId_questaoId_key" ON "RespostaSimulado"("sessaoId", "questaoId");

-- CreateIndex
CREATE INDEX "RespostaSimulado_sessaoId_idx" ON "RespostaSimulado"("sessaoId");

-- AddForeignKey
ALTER TABLE "AlternativaSimulado" ADD CONSTRAINT "AlternativaSimulado_questaoId_fkey" FOREIGN KEY ("questaoId") REFERENCES "QuestaoSimulado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImagemQuestaoSimulado" ADD CONSTRAINT "ImagemQuestaoSimulado_questaoId_fkey" FOREIGN KEY ("questaoId") REFERENCES "QuestaoSimulado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessaoSimuladoQuestao" ADD CONSTRAINT "SessaoSimuladoQuestao_sessaoId_fkey" FOREIGN KEY ("sessaoId") REFERENCES "SessaoSimulado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessaoSimuladoQuestao" ADD CONSTRAINT "SessaoSimuladoQuestao_questaoId_fkey" FOREIGN KEY ("questaoId") REFERENCES "QuestaoSimulado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaSimulado" ADD CONSTRAINT "RespostaSimulado_sessaoId_fkey" FOREIGN KEY ("sessaoId") REFERENCES "SessaoSimulado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ==========================================
-- PERGUNTA PCO: mostrarJustificativa
-- ==========================================

-- AlterTable
ALTER TABLE "PerguntaPCO" ADD COLUMN "mostrarJustificativa" BOOLEAN NOT NULL DEFAULT false;

