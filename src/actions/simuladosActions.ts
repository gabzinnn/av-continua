"use server";

import prisma from "../lib/prisma";
import { BancoSimulado, DificuldadeSimulado, StatusSessaoSimulado } from "../generated/prisma/client";

// ==========================================
// TYPES
// ==========================================

export interface AlternativaData {
    texto: string;
    correta: boolean;
    ordem: number;
}

export interface QuestaoSimuladoData {
    enunciado: string;
    banco: BancoSimulado;
    dificuldade?: DificuldadeSimulado | null;
    imagemUrl?: string | null;
    alternativas: AlternativaData[];
}

export interface AlternativaCompleta {
    id: number;
    questaoId: number;
    texto: string;
    correta: boolean;
    ordem: number;
}

export interface QuestaoSimuladoCompleta {
    id: number;
    enunciado: string;
    banco: BancoSimulado;
    dificuldade: DificuldadeSimulado | null;
    imagemUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    alternativas: AlternativaCompleta[];
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
        alternativaSelecionadaId: number | null;
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
        include: {
            alternativas: { orderBy: { ordem: "asc" } }
        },
        orderBy: { createdAt: "desc" }
    });

    return questoes as QuestaoSimuladoCompleta[];
}

export async function getQuestaoSimuladoById(id: number) {
    return prisma.questaoSimulado.findUnique({
        where: { id },
        include: {
            alternativas: { orderBy: { ordem: "asc" } }
        }
    });
}

export async function createQuestaoSimulado(data: QuestaoSimuladoData) {
    return prisma.questaoSimulado.create({
        data: {
            enunciado: data.enunciado,
            banco: data.banco,
            dificuldade: data.dificuldade ?? undefined,
            imagemUrl: data.imagemUrl,
            alternativas: {
                create: data.alternativas.map(a => ({
                    texto: a.texto,
                    correta: a.correta,
                    ordem: a.ordem,
                }))
            }
        },
        include: {
            alternativas: { orderBy: { ordem: "asc" } }
        }
    });
}

export async function updateQuestaoSimulado(id: number, data: Partial<QuestaoSimuladoData>) {
    // Update question fields + replace all alternativas
    return prisma.$transaction(async (tx) => {
        // Update main question fields
        await tx.questaoSimulado.update({
            where: { id },
            data: {
                ...(data.enunciado !== undefined && { enunciado: data.enunciado }),
                ...(data.banco !== undefined && { banco: data.banco }),
                ...(data.dificuldade !== undefined && { dificuldade: data.dificuldade }),
                ...(data.imagemUrl !== undefined && { imagemUrl: data.imagemUrl }),
            }
        });

        // If alternativas provided, replace all
        if (data.alternativas) {
            await tx.alternativaSimulado.deleteMany({ where: { questaoId: id } });
            await tx.alternativaSimulado.createMany({
                data: data.alternativas.map(a => ({
                    questaoId: id,
                    texto: a.texto,
                    correta: a.correta,
                    ordem: a.ordem,
                }))
            });
        }

        return tx.questaoSimulado.findUnique({
            where: { id },
            include: { alternativas: { orderBy: { ordem: "asc" } } }
        });
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

    // Buscar questões disponíveis (only those with alternativas)
    const questoesDisponiveis = await prisma.questaoSimulado.findMany({
        where: {
            ...whereClause,
            alternativas: { some: {} }
        },
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
                include: {
                    questao: {
                        include: { alternativas: { orderBy: { ordem: "asc" } } }
                    }
                },
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
                include: {
                    questao: {
                        include: { alternativas: { orderBy: { ordem: "asc" } } }
                    }
                },
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
    alternativaSelecionadaId: number
) {
    return prisma.respostaSimulado.upsert({
        where: {
            sessaoId_questaoId: { sessaoId, questaoId }
        },
        create: {
            sessaoId,
            questaoId,
            alternativaSelecionadaId
        },
        update: {
            alternativaSelecionadaId
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

// ==========================================
// RESULTADOS DO SIMULADO (para externo)
// ==========================================

export type ClassificacaoResposta = "CORRETA" | "INCORRETA" | "NAO_RESPONDIDA";

export async function getResultadosSimulado(sessaoId: number) {
    const sessao = await prisma.sessaoSimulado.findUnique({
        where: { id: sessaoId },
        include: {
            questoes: {
                include: {
                    questao: {
                        include: { alternativas: { orderBy: { ordem: "asc" } } }
                    }
                },
                orderBy: { ordem: "asc" }
            },
            respostas: true,
        }
    });

    if (!sessao || sessao.status !== "FINALIZADO") {
        return null;
    }

    const questoesComRespostas = sessao.questoes.map((sq) => {
        const resposta = sessao.respostas.find(r => r.questaoId === sq.questaoId);
        const alternativaCorreta = sq.questao.alternativas.find(a => a.correta);
        const alternativaSelecionadaId = resposta?.alternativaSelecionadaId ?? null;
        const respondida = alternativaSelecionadaId !== null;

        let classificacao: ClassificacaoResposta;
        if (!respondida) {
            classificacao = "NAO_RESPONDIDA";
        } else if (alternativaCorreta && alternativaSelecionadaId === alternativaCorreta.id) {
            classificacao = "CORRETA";
        } else {
            classificacao = "INCORRETA";
        }

        return {
            ordem: sq.ordem,
            enunciado: sq.questao.enunciado,
            banco: sq.questao.banco,
            dificuldade: sq.questao.dificuldade,
            imagemUrl: sq.questao.imagemUrl,
            alternativas: sq.questao.alternativas.map(a => ({
                id: a.id,
                texto: a.texto,
                correta: a.correta,
                ordem: a.ordem,
            })),
            alternativaSelecionadaId,
            respondida,
            classificacao,
        };
    });

    const totalQuestoes = questoesComRespostas.length;
    const respondidas = questoesComRespostas.filter(q => q.respondida).length;
    const acertos = questoesComRespostas.filter(q => q.classificacao === "CORRETA").length;
    const erros = questoesComRespostas.filter(q => q.classificacao === "INCORRETA").length;
    const naoRespondidas = questoesComRespostas.filter(q => q.classificacao === "NAO_RESPONDIDA").length;

    return {
        id: sessao.id,
        nomeUsuario: sessao.nomeUsuario,
        emailUsuario: sessao.emailUsuario,
        tipoSimulado: sessao.tipoSimulado,
        dificuldade: sessao.dificuldade,
        tempoTotalSegundos: sessao.tempoTotalSegundos,
        tempoRestanteSegundos: sessao.tempoRestanteSegundos,
        finalizadoEm: sessao.finalizadoEm,
        totalQuestoes,
        respondidas,
        acertos,
        erros,
        naoRespondidas,
        percentualAcerto: respondidas > 0 ? Math.round((acertos / respondidas) * 100) : 0,
        questoes: questoesComRespostas,
    };
}
