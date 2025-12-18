-- CreateTable
CREATE TABLE "Area" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membro" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "fotoUrl" TEXT,
    "dre" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "isAtivo" BOOLEAN NOT NULL DEFAULT true,
    "areaId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coordenador" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coordenador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Avaliacao" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "finalizada" BOOLEAN NOT NULL DEFAULT false,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Avaliacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RespostaAvaliacao" (
    "id" SERIAL NOT NULL,
    "avaliacaoId" INTEGER NOT NULL,
    "avaliadorId" INTEGER NOT NULL,
    "avaliadoId" INTEGER NOT NULL,
    "notaEntrega" INTEGER NOT NULL,
    "notaCultura" INTEGER NOT NULL,
    "feedbackTexto" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RespostaAvaliacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanoAcao" (
    "id" SERIAL NOT NULL,
    "respostaAvaliacaoId" INTEGER NOT NULL,
    "responsavelId" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL,
    "concluido" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanoAcao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvaliacaoFeedback" (
    "id" SERIAL NOT NULL,
    "respostaAvaliacaoId" INTEGER NOT NULL,
    "avaliadoId" INTEGER NOT NULL,
    "notaFeedback" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvaliacaoFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipacaoAvaliacao" (
    "id" SERIAL NOT NULL,
    "avaliacaoId" INTEGER NOT NULL,
    "membroId" INTEGER NOT NULL,
    "respondeuAvaliacao" BOOLEAN NOT NULL DEFAULT false,
    "avaliouFeedbacks" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ParticipacaoAvaliacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Demanda" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "finalizada" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Demanda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlocacaoDemanda" (
    "id" SERIAL NOT NULL,
    "membroId" INTEGER NOT NULL,
    "demandaId" INTEGER NOT NULL,
    "isLider" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AlocacaoDemanda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Coordenador_usuario_key" ON "Coordenador"("usuario");

-- CreateIndex
CREATE UNIQUE INDEX "RespostaAvaliacao_avaliacaoId_avaliadorId_avaliadoId_key" ON "RespostaAvaliacao"("avaliacaoId", "avaliadorId", "avaliadoId");

-- CreateIndex
CREATE UNIQUE INDEX "AvaliacaoFeedback_respostaAvaliacaoId_key" ON "AvaliacaoFeedback"("respostaAvaliacaoId");

-- CreateIndex
CREATE UNIQUE INDEX "ParticipacaoAvaliacao_avaliacaoId_membroId_key" ON "ParticipacaoAvaliacao"("avaliacaoId", "membroId");

-- CreateIndex
CREATE UNIQUE INDEX "AlocacaoDemanda_membroId_demandaId_key" ON "AlocacaoDemanda"("membroId", "demandaId");

-- AddForeignKey
ALTER TABLE "Membro" ADD CONSTRAINT "Membro_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Coordenador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaAvaliacao" ADD CONSTRAINT "RespostaAvaliacao_avaliacaoId_fkey" FOREIGN KEY ("avaliacaoId") REFERENCES "Avaliacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaAvaliacao" ADD CONSTRAINT "RespostaAvaliacao_avaliadorId_fkey" FOREIGN KEY ("avaliadorId") REFERENCES "Membro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaAvaliacao" ADD CONSTRAINT "RespostaAvaliacao_avaliadoId_fkey" FOREIGN KEY ("avaliadoId") REFERENCES "Membro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanoAcao" ADD CONSTRAINT "PlanoAcao_respostaAvaliacaoId_fkey" FOREIGN KEY ("respostaAvaliacaoId") REFERENCES "RespostaAvaliacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanoAcao" ADD CONSTRAINT "PlanoAcao_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Membro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvaliacaoFeedback" ADD CONSTRAINT "AvaliacaoFeedback_respostaAvaliacaoId_fkey" FOREIGN KEY ("respostaAvaliacaoId") REFERENCES "RespostaAvaliacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvaliacaoFeedback" ADD CONSTRAINT "AvaliacaoFeedback_avaliadoId_fkey" FOREIGN KEY ("avaliadoId") REFERENCES "Membro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipacaoAvaliacao" ADD CONSTRAINT "ParticipacaoAvaliacao_avaliacaoId_fkey" FOREIGN KEY ("avaliacaoId") REFERENCES "Avaliacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipacaoAvaliacao" ADD CONSTRAINT "ParticipacaoAvaliacao_membroId_fkey" FOREIGN KEY ("membroId") REFERENCES "Membro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlocacaoDemanda" ADD CONSTRAINT "AlocacaoDemanda_membroId_fkey" FOREIGN KEY ("membroId") REFERENCES "Membro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlocacaoDemanda" ADD CONSTRAINT "AlocacaoDemanda_demandaId_fkey" FOREIGN KEY ("demandaId") REFERENCES "Demanda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
