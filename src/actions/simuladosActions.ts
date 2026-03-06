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

// ==========================================
// RESULTADOS DO SIMULADO (para externo)
// ==========================================

// Stopwords em português para filtragem de termos irrelevantes
const STOPWORDS = new Set([
    "a", "o", "e", "de", "da", "do", "em", "um", "uma", "que", "para", "com",
    "no", "na", "os", "as", "dos", "das", "por", "se", "ao", "ou", "mais",
    "como", "mas", "foi", "ser", "tem", "seu", "sua", "são", "está", "pelo",
    "pela", "nos", "nas", "esse", "essa", "este", "esta", "isso", "isto",
    "ele", "ela", "entre", "quando", "muito", "já", "também", "só", "sobre",
    "pode", "qual", "seus", "suas", "ter", "era", "ainda", "até", "sem",
    "mesmo", "cada", "vez", "bem", "deve", "aqui", "onde", "hay", "the",
    "is", "and", "of", "to", "in", "it", "for", "on", "are", "be", "was",
    "not", "with", "this", "that", "from", "but", "they", "have", "has",
]);

function normalizarTexto(texto: string): string[] {
    return texto
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // strip acentos
        .replace(/[^a-z0-9\s]/g, " ") // remove pontuação
        .split(/\s+/)
        .filter(t => t.length > 1 && !STOPWORDS.has(t));
}

function gerarBigrams(tokens: string[]): Set<string> {
    const bigrams = new Set<string>();
    for (let i = 0; i < tokens.length - 1; i++) {
        bigrams.add(`${tokens[i]}_${tokens[i + 1]}`);
    }
    return bigrams;
}

export type ClassificacaoResposta = "PROVAVEL_ACERTO" | "PARCIAL" | "PROVAVEL_ERRO" | "NAO_RESPONDIDA" | "SEM_GABARITO";

function calcularSimilaridade(respostaUsuario: string | null, respostaModelo: string | null): {
    similaridade: number;
    classificacao: ClassificacaoResposta;
} {
    if (!respostaUsuario?.trim()) {
        return { similaridade: 0, classificacao: "NAO_RESPONDIDA" };
    }
    if (!respostaModelo?.trim()) {
        return { similaridade: -1, classificacao: "SEM_GABARITO" };
    }

    const tokensUsuario = normalizarTexto(respostaUsuario);
    const tokensModelo = normalizarTexto(respostaModelo);

    if (tokensModelo.length === 0) {
        return { similaridade: -1, classificacao: "SEM_GABARITO" };
    }
    if (tokensUsuario.length === 0) {
        return { similaridade: 0, classificacao: "PROVAVEL_ERRO" };
    }

    // Unigram similarity (Jaccard orientado ao modelo)
    const setUsuario = new Set(tokensUsuario);
    const setModelo = new Set(tokensModelo);
    const intersecaoUni = [...setModelo].filter(t => setUsuario.has(t)).length;
    const unigramSim = intersecaoUni / setModelo.size;

    // Bigram similarity
    const bigramsUsuario = gerarBigrams(tokensUsuario);
    const bigramsModelo = gerarBigrams(tokensModelo);
    let bigramSim = 0;
    if (bigramsModelo.size > 0) {
        const intersecaoBi = [...bigramsModelo].filter(b => bigramsUsuario.has(b)).length;
        bigramSim = intersecaoBi / bigramsModelo.size;
    }

    // Weighted score: if bigrams exist, 60% unigrams + 40% bigrams; otherwise 100% unigrams
    const similaridade = bigramsModelo.size > 0
        ? Math.round((unigramSim * 0.6 + bigramSim * 0.4) * 100)
        : Math.round(unigramSim * 100);

    let classificacao: ClassificacaoResposta;
    if (similaridade >= 60) {
        classificacao = "PROVAVEL_ACERTO";
    } else if (similaridade >= 35) {
        classificacao = "PARCIAL";
    } else {
        classificacao = "PROVAVEL_ERRO";
    }

    return { similaridade, classificacao };
}

export async function getResultadosSimulado(sessaoId: number) {
    const sessao = await prisma.sessaoSimulado.findUnique({
        where: { id: sessaoId },
        include: {
            questoes: {
                include: { questao: true },
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
        const respondida = !!resposta?.respostaDiscursiva?.trim();
        const { similaridade, classificacao } = calcularSimilaridade(
            resposta?.respostaDiscursiva || null,
            sq.questao.respostaModelo
        );

        return {
            ordem: sq.ordem,
            enunciado: sq.questao.enunciado,
            banco: sq.questao.banco,
            dificuldade: sq.questao.dificuldade,
            imagemUrl: sq.questao.imagemUrl,
            respostaModelo: sq.questao.respostaModelo,
            respostaUsuario: resposta?.respostaDiscursiva || null,
            respondida,
            similaridade,
            classificacao,
        };
    });

    const totalQuestoes = questoesComRespostas.length;
    const respondidas = questoesComRespostas.filter(q => q.respondida).length;
    const provaveisAcertos = questoesComRespostas.filter(q => q.classificacao === "PROVAVEL_ACERTO").length;
    const parciais = questoesComRespostas.filter(q => q.classificacao === "PARCIAL").length;
    const provaveisErros = questoesComRespostas.filter(q => q.classificacao === "PROVAVEL_ERRO").length;

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
        naoRespondidas: totalQuestoes - respondidas,
        percentualRespondidas: totalQuestoes > 0 ? Math.round((respondidas / totalQuestoes) * 100) : 0,
        provaveisAcertos,
        parciais,
        provaveisErros,
        questoes: questoesComRespostas,
    };
}

