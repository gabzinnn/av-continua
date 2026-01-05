-- CreateEnum
CREATE TYPE "StatusProva" AS ENUM ('RASCUNHO', 'PUBLICADA', 'ENCERRADA');

-- CreateEnum
CREATE TYPE "TipoQuestao" AS ENUM ('MULTIPLA_ESCOLHA', 'DISSERTATIVA', 'VERDADEIRO_FALSO');

-- CreateEnum
CREATE TYPE "StatusResultado" AS ENUM ('PENDENTE', 'CORRIGIDA');

-- CreateTable
CREATE TABLE "Prova" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "tempoLimite" INTEGER,
    "embaralhar" BOOLEAN NOT NULL DEFAULT false,
    "status" "StatusProva" NOT NULL DEFAULT 'RASCUNHO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prova_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Questao" (
    "id" SERIAL NOT NULL,
    "provaId" INTEGER NOT NULL,
    "tipo" "TipoQuestao" NOT NULL,
    "enunciado" TEXT NOT NULL,
    "imagemUrl" TEXT,
    "pontos" DECIMAL(10,2) NOT NULL,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "Questao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alternativa" (
    "id" SERIAL NOT NULL,
    "questaoId" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "correta" BOOLEAN NOT NULL DEFAULT false,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "Alternativa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidato" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Candidato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultadoProva" (
    "id" SERIAL NOT NULL,
    "provaId" INTEGER NOT NULL,
    "candidatoId" INTEGER NOT NULL,
    "status" "StatusResultado" NOT NULL DEFAULT 'PENDENTE',
    "notaFinal" DECIMAL(10,2),
    "tempoGasto" INTEGER,
    "iniciadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizadoEm" TIMESTAMP(3),

    CONSTRAINT "ResultadoProva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RespostaQuestao" (
    "id" SERIAL NOT NULL,
    "resultadoId" INTEGER NOT NULL,
    "questaoId" INTEGER NOT NULL,
    "alternativaId" INTEGER,
    "respostaTexto" TEXT,
    "pontuacao" DECIMAL(10,2),
    "corrigida" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RespostaQuestao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Questao_provaId_idx" ON "Questao"("provaId");

-- CreateIndex
CREATE INDEX "Alternativa_questaoId_idx" ON "Alternativa"("questaoId");

-- CreateIndex
CREATE UNIQUE INDEX "Candidato_email_key" ON "Candidato"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ResultadoProva_provaId_candidatoId_key" ON "ResultadoProva"("provaId", "candidatoId");

-- CreateIndex
CREATE UNIQUE INDEX "RespostaQuestao_resultadoId_questaoId_key" ON "RespostaQuestao"("resultadoId", "questaoId");

-- AddForeignKey
ALTER TABLE "Questao" ADD CONSTRAINT "Questao_provaId_fkey" FOREIGN KEY ("provaId") REFERENCES "Prova"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alternativa" ADD CONSTRAINT "Alternativa_questaoId_fkey" FOREIGN KEY ("questaoId") REFERENCES "Questao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultadoProva" ADD CONSTRAINT "ResultadoProva_provaId_fkey" FOREIGN KEY ("provaId") REFERENCES "Prova"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultadoProva" ADD CONSTRAINT "ResultadoProva_candidatoId_fkey" FOREIGN KEY ("candidatoId") REFERENCES "Candidato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaQuestao" ADD CONSTRAINT "RespostaQuestao_resultadoId_fkey" FOREIGN KEY ("resultadoId") REFERENCES "ResultadoProva"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaQuestao" ADD CONSTRAINT "RespostaQuestao_questaoId_fkey" FOREIGN KEY ("questaoId") REFERENCES "Questao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
