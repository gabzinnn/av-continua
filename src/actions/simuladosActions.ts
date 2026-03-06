"use server";

import prisma from "../lib/prisma";
import { BancoSimulado, DificuldadeSimulado, StatusSessaoSimulado } from "../generated/prisma/client";

// ==========================================
// TYPES
// ==========================================

export interface QuestaoSimuladoData {
    enunciado: string;
    banco: BancoSimulado;
    dificuldade?: DificuldadeSimulado | null;
    respostaModelo?: string | null;
    imagemUrl?: string | null;
}

export interface QuestaoSimuladoCompleta {
    id: number;
    enunciado: string;
    banco: BancoSimulado;
    dificuldade: DificuldadeSimulado | null;
    respostaModelo: string | null;
    imagemUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface SessaoSimuladoCompleta {
    id: number;
    nomeUsuario: string;
    emailUsuario: string;
    tipoSimulado: string;
    dificuldade: string | null;
    tempoTotalSegundos: number;
    tempoRestanteSegundos: number;
    status: StatusSessaoSimulado;
    createdAt: Date;
    finalizadoEm: Date | null;
    questoes: {
        id: number;
        questaoId: number;
        ordem: number;
        questao: QuestaoSimuladoCompleta;
    }[];
    respostas: {
        id: number;
        questaoId: number;
        respostaDiscursiva: string | null;
    }[];
}

// ==========================================
// QUESTÃO SIMULADO CRUD
// ==========================================

export async function getAllQuestoesSimulado(busca?: string, banco?: string) {
    const questoes = await prisma.questaoSimulado.findMany({
        where: {
            AND: [
                busca ? {
                    enunciado: { contains: busca, mode: "insensitive" }
                } : {},
                banco && banco !== "Todos" ? {
                    banco: banco === "GMAT" ? "GMAT" : "BUSINESS_CASE"
                } : {},
            ]
        },
        orderBy: { createdAt: "desc" }
    });

    return questoes as QuestaoSimuladoCompleta[];
}

export async function getQuestaoSimuladoById(id: number) {
    return prisma.questaoSimulado.findUnique({
        where: { id }
    });
}

export async function createQuestaoSimulado(data: QuestaoSimuladoData) {
    return prisma.questaoSimulado.create({
        data: {
            enunciado: data.enunciado,
            banco: data.banco,
            dificuldade: data.dificuldade ?? undefined,
            respostaModelo: data.respostaModelo,
            imagemUrl: data.imagemUrl,
        }
    });
}

export async function updateQuestaoSimulado(id: number, data: Partial<QuestaoSimuladoData>) {
    return prisma.questaoSimulado.update({
        where: { id },
        data: {
            ...(data.enunciado !== undefined && { enunciado: data.enunciado }),
            ...(data.banco !== undefined && { banco: data.banco }),
            ...(data.dificuldade !== undefined && { dificuldade: data.dificuldade }),
            ...(data.respostaModelo !== undefined && { respostaModelo: data.respostaModelo }),
            ...(data.imagemUrl !== undefined && { imagemUrl: data.imagemUrl }),
        }
    });
}

export async function deleteQuestaoSimulado(id: number) {
    return prisma.questaoSimulado.delete({
        where: { id }
    });
}

// ==========================================
// ESTATÍSTICAS DO DASHBOARD
// ==========================================

export async function getSimuladosStats() {
    const [totalQuestoes, questoesGMAT, questoesBC, totalSessoes] = await Promise.all([
        prisma.questaoSimulado.count(),
        prisma.questaoSimulado.count({ where: { banco: "GMAT" } }),
        prisma.questaoSimulado.count({ where: { banco: "BUSINESS_CASE" } }),
        prisma.sessaoSimulado.count(),
    ]);

    return {
        totalQuestoes,
        questoesGMAT,
        questoesBC,
        totalSessoes
    };
}

// ==========================================
// SESSÃO SIMULADO — ÚLTIMAS ATIVIDADES
// ==========================================

export async function getUltimasSessoes(limit: number = 10) {
    const sessoes = await prisma.sessaoSimulado.findMany({
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
            questoes: true,
            respostas: true,
        }
    });

    return sessoes.map(s => ({
        id: s.id,
        nomeUsuario: s.nomeUsuario,
        emailUsuario: s.emailUsuario,
        tipoSimulado: s.tipoSimulado,
        qtdQuestoes: s.questoes.length,
        tempoRestanteSegundos: s.tempoRestanteSegundos,
        status: s.status,
        createdAt: s.createdAt,
        finalizadoEm: s.finalizadoEm,
    }));
}

// ==========================================
// SESSÃO SIMULADO CRUD (para externo)
// ==========================================

export async function criarSessaoSimulado(
    nomeUsuario: string,
    emailUsuario: string,
    tipoSimulado: string,
    dificuldade: string | undefined,
    qtdQuestoes: number
) {
    // Filtrar questões do banco
    const whereClause: any = {};

    if (tipoSimulado !== "Geral") {
        whereClause.banco = tipoSimulado === "GMAT" ? "GMAT" : "BUSINESS_CASE";
    }

    if (dificuldade) {
        const dificuldadeMap: Record<string, DificuldadeSimulado> = {
            "Fácil": "FACIL",
            "Médio": "MEDIO",
            "Difícil": "DIFICIL"
        };
        if (dificuldadeMap[dificuldade]) {
            whereClause.dificuldade = dificuldadeMap[dificuldade];
        }
    }

    // Buscar questões disponíveis
    const questoesDisponiveis = await prisma.questaoSimulado.findMany({
        where: whereClause,
    });

    if (questoesDisponiveis.length === 0) {
        return null;
    }

    // Shuffle e selecionar
    const shuffled = questoesDisponiveis.sort(() => 0.5 - Math.random());
    const selecionadas = shuffled.slice(0, Math.min(qtdQuestoes, shuffled.length));

    if (selecionadas.length === 0) {
        return null;
    }

    const tempoTotal = selecionadas.length * 120; // 2 min por questão

    // Criar sessão
    const sessao = await prisma.sessaoSimulado.create({
        data: {
            nomeUsuario,
            emailUsuario,
            tipoSimulado,
            dificuldade: dificuldade || null,
            tempoTotalSegundos: tempoTotal,
            tempoRestanteSegundos: tempoTotal,
            status: "EM_ANDAMENTO",
            questoes: {
                create: selecionadas.map((q, idx) => ({
                    questaoId: q.id,
                    ordem: idx + 1,
                }))
            }
        },
        include: {
            questoes: {
                include: { questao: true },
                orderBy: { ordem: "asc" }
            },
            respostas: true,
        }
    });

    return sessao;
}

export async function getSessaoSimulado(id: number) {
    const sessao = await prisma.sessaoSimulado.findUnique({
        where: { id },
        include: {
            questoes: {
                include: { questao: true },
                orderBy: { ordem: "asc" }
            },
            respostas: true,
        }
    });

    return sessao;
}

export async function responderQuestaoSimulado(
    sessaoId: number,
    questaoId: number,
    respostaDiscursiva: string
) {
    return prisma.respostaSimulado.upsert({
        where: {
            sessaoId_questaoId: { sessaoId, questaoId }
        },
        create: {
            sessaoId,
            questaoId,
            respostaDiscursiva
        },
        update: {
            respostaDiscursiva
        }
    });
}

export async function atualizarTempoSessao(sessaoId: number, tempoRestante: number) {
    return prisma.sessaoSimulado.update({
        where: { id: sessaoId },
        data: { tempoRestanteSegundos: tempoRestante }
    });
}

export async function finalizarSessaoSimulado(sessaoId: number) {
    return prisma.sessaoSimulado.update({
        where: { id: sessaoId },
        data: {
            status: "FINALIZADO",
            finalizadoEm: new Date()
        }
    });
}
