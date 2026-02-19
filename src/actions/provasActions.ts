"use server"

import prisma from "../lib/prisma"
import { StatusProva, TipoQuestao, StatusResultado, Prova, Questao, Alternativa, Candidato, ResultadoProva, RespostaQuestao } from "../generated/prisma/client"

// ==========================================
// TYPES
// ==========================================

export type AlternativaData = {
    id?: number
    texto: string
    correta: boolean
    ordem: number
}

export type QuestaoData = {
    id?: number
    tipo: TipoQuestao
    enunciado: string
    imagens?: string[]
    pontos: number
    ordem: number
    alternativas?: AlternativaData[]
}

export type ProvaData = {
    titulo: string
    descricao?: string | null
    tempoLimite?: number | null
    embaralhar?: boolean
    status?: StatusProva
    processoSeletivoId?: number | null
}

// ==========================================
// PROCESSO SELETIVO CRUD
// ==========================================

export type ProcessoSeletivoSimples = {
    id: number
    nome: string
    ativo: boolean
}

export async function getAllProcessosSeletivos() {
    const processos = await prisma.processoSeletivo.findMany({
        where: { ativo: true },
        orderBy: { createdAt: 'desc' }
    })
    return processos as ProcessoSeletivoSimples[]
}

export async function createProcessoSeletivo(nome: string) {
    return prisma.processoSeletivo.create({
        data: { nome }
    })
}

export type ProvaCompleta = {
    id: number
    titulo: string
    descricao: string | null
    tempoLimite: number | null
    embaralhar: boolean
    status: StatusProva
    processoSeletivoId: number | null
    processoSeletivo: {
        id: number
        nome: string
    } | null
    createdAt: Date
    updatedAt: Date
    questoes: QuestaoCompleta[]
    _count: {
        questoes: number
        resultados: number
    }
    pontuacaoTotal: number
}

export type QuestaoCompleta = {
    id: number
    provaId: number
    tipo: TipoQuestao
    enunciado: string
    pontos: number
    ordem: number
    imagens: {
        id: number
        url: string
        ordem: number
    }[]
    alternativas: {
        id: number
        questaoId: number
        texto: string
        correta: boolean
        ordem: number
    }[]
}

export type ResultadoProvaCompleto = {
    id: number
    provaId: number
    candidatoId: number
    status: StatusResultado
    notaFinal: number | null
    aprovadoProva: boolean | null
    tempoGasto: number | null
    iniciadoEm: Date
    finalizadoEm: Date | null
    candidato: {
        id: number
        nome: string
        email: string
        dre: string | null
    }
    respostas: {
        id: number
        questaoId: number
        alternativaId: number | null
        respostaTexto: string | null
        pontuacao: number | null
        corrigida: boolean
    }[]
}

// ==========================================
// PROVA CRUD
// ==========================================

export type OrderByOption = "updatedAt_desc" | "updatedAt_asc" | "titulo_asc" | "titulo_desc"

export async function getAllProvas(busca?: string, status?: StatusProva, orderBy: OrderByOption = "updatedAt_desc") {
    let orderByClause: any = { updatedAt: "desc" }

    switch (orderBy) {
        case "updatedAt_asc":
            orderByClause = { updatedAt: "asc" }
            break
        case "titulo_asc":
            orderByClause = { titulo: "asc" }
            break
        case "titulo_desc":
            orderByClause = { titulo: "desc" }
            break
        case "updatedAt_desc":
        default:
            orderByClause = { updatedAt: "desc" }
            break
    }

    const provas = await prisma.prova.findMany({
        where: {
            AND: [
                busca ? {
                    OR: [
                        { titulo: { contains: busca, mode: "insensitive" } },
                        { descricao: { contains: busca, mode: "insensitive" } },
                    ]
                } : {},
                status ? { status } : {},
            ]
        },
        include: {
            processoSeletivo: {
                select: {
                    id: true,
                    nome: true
                }
            },
            questoes: {
                orderBy: { ordem: "asc" },
                include: {
                    alternativas: {
                        orderBy: { ordem: "asc" }
                    },
                    imagens: {
                        orderBy: { ordem: "asc" }
                    }
                }
            },
            _count: {
                select: {
                    questoes: true,
                    resultados: true,
                }
            }
        },
        orderBy: orderByClause
    })

    return provas.map(prova => ({
        ...prova,
        questoes: prova.questoes.map(q => ({
            ...q,
            pontos: Number(q.pontos),
            alternativas: q.alternativas
        })),
        pontuacaoTotal: prova.questoes.reduce((acc, q) => acc + Number(q.pontos), 0)
    })) as ProvaCompleta[]
}

export async function getProvaById(id: number) {
    const prova = await prisma.prova.findUnique({
        where: { id },
        include: {
            processoSeletivo: {
                select: {
                    id: true,
                    nome: true
                }
            },
            questoes: {
                orderBy: { ordem: "asc" },
                include: {
                    alternativas: {
                        orderBy: { ordem: "asc" }
                    },
                    imagens: {
                        orderBy: { ordem: "asc" }
                    }
                }
            },
            _count: {
                select: {
                    questoes: true,
                    resultados: true,
                }
            }
        }
    })

    if (!prova) return null

    return {
        ...prova,
        questoes: prova.questoes.map(q => ({
            ...q,
            pontos: Number(q.pontos),
            alternativas: q.alternativas
        })),
        pontuacaoTotal: prova.questoes.reduce((acc, q) => acc + Number(q.pontos), 0)
    } as ProvaCompleta
}

export async function duplicateProva(id: number) {
    // 1. Buscar a prova original com todas as relações
    const original = await prisma.prova.findUnique({
        where: { id },
        include: {
            questoes: {
                include: {
                    alternativas: true,
                    imagens: true
                }
            }
        }
    })

    if (!original) throw new Error("Prova não encontrada")

    // 2. Criar a nova prova com os dados básicos
    const novaProva = await prisma.prova.create({
        data: {
            titulo: `${original.titulo} (Cópia)`,
            descricao: original.descricao,
            tempoLimite: original.tempoLimite,
            embaralhar: original.embaralhar,
            status: "RASCUNHO", // Sempre começa como rascunho
            processoSeletivoId: original.processoSeletivoId
            // createdAt e updatedAt são automáticos
        }
    })

    // 3. Criar as questões, alternativas e imagens para a nova prova
    if (original.questoes && original.questoes.length > 0) {
        for (const questao of original.questoes) {
            await prisma.questao.create({
                data: {
                    provaId: novaProva.id,
                    tipo: questao.tipo,
                    enunciado: questao.enunciado,
                    pontos: questao.pontos,
                    ordem: questao.ordem,
                    imagens: {
                        create: questao.imagens.map((img: { url: any; ordem: any }) => ({
                            url: img.url,
                            ordem: img.ordem
                        }))
                    },
                    alternativas: {
                        create: questao.alternativas.map((alt: { texto: any; correta: any; ordem: any }) => ({
                            texto: alt.texto,
                            correta: alt.correta,
                            ordem: alt.ordem
                        }))
                    }
                }
            })
        }
    }

    return novaProva
}

export async function createProva(data: ProvaData) {
    if (data.status === "PUBLICADA") {
        await prisma.prova.updateMany({
            where: { status: "PUBLICADA" },
            data: { status: "ENCERRADA" }
        })
    }

    return prisma.prova.create({
        data: {
            titulo: data.titulo,
            descricao: data.descricao,
            tempoLimite: data.tempoLimite,
            embaralhar: data.embaralhar ?? false,
            status: data.status ?? "RASCUNHO",
            processoSeletivoId: data.processoSeletivoId,
        }
    })
}

export async function updateProva(id: number, data: ProvaData) {
    if (data.status === "PUBLICADA") {
        await prisma.prova.updateMany({
            where: {
                status: "PUBLICADA",
                id: { not: id }
            },
            data: { status: "ENCERRADA" }
        })
    }

    return prisma.prova.update({
        where: { id },
        data: {
            titulo: data.titulo,
            descricao: data.descricao,
            tempoLimite: data.tempoLimite,
            embaralhar: data.embaralhar,
            status: data.status,
            processoSeletivoId: data.processoSeletivoId,
        }
    })
}

export async function deleteProva(id: number) {
    return prisma.prova.delete({
        where: { id }
    })
}

// ==========================================
// QUESTÃO CRUD
// ==========================================

export async function createQuestao(provaId: number, data: QuestaoData) {
    const questao = await prisma.questao.create({
        data: {
            provaId,
            tipo: data.tipo,
            enunciado: data.enunciado,
            pontos: data.pontos,
            ordem: data.ordem,
            imagens: data.imagens ? {
                create: data.imagens.map((url, index) => ({
                    url,
                    ordem: index
                }))
            } : undefined,
            alternativas: data.alternativas ? {
                create: data.alternativas.map(alt => ({
                    texto: alt.texto,
                    correta: alt.correta,
                    ordem: alt.ordem,
                }))
            } : undefined
        },
        include: {
            alternativas: {
                orderBy: { ordem: "asc" }
            },
            imagens: {
                orderBy: { ordem: "asc" }
            }
        }
    })

    return {
        ...questao,
        pontos: Number(questao.pontos)
    }
}

export async function updateQuestao(id: number, data: QuestaoData) {
    // First, update the questao basic fields
    await prisma.questao.update({
        where: { id },
        data: {
            tipo: data.tipo,
            enunciado: data.enunciado,
            pontos: data.pontos,
            ordem: data.ordem,
        }
    })

    // Handle images update
    if (data.imagens) {
        // Delete existing images
        await prisma.imagemQuestao.deleteMany({
            where: { questaoId: id }
        })

        // Create new images
        if (data.imagens.length > 0) {
            await prisma.imagemQuestao.createMany({
                data: data.imagens.map((url, index) => ({
                    questaoId: id,
                    url,
                    ordem: index
                }))
            })
        }
    }

    // Handle alternativas update
    if (data.alternativas) {
        // Get existing alternativas
        const existingAlternativas = await prisma.alternativa.findMany({
            where: { questaoId: id }
        })

        const existingIds = existingAlternativas.map((a: { id: any }) => a.id)
        const incomingIds = data.alternativas.filter(a => a.id).map(a => a.id!)

        // Delete removed alternativas
        const idsToDelete = existingIds.filter((id: number) => !incomingIds.includes(id))
        if (idsToDelete.length > 0) {
            await prisma.alternativa.deleteMany({
                where: { id: { in: idsToDelete } }
            })
        }

        // Update or create alternativas
        for (const alt of data.alternativas) {
            // Check if ID is present and is a valid Postgres Integer (not a timestamp/temp ID)
            // Postgres Integer max is 2,147,483,647. Timestamps are > 1.7 trillion.
            if (alt.id && alt.id < 2147483647) {
                await prisma.alternativa.update({
                    where: { id: alt.id },
                    data: {
                        texto: alt.texto,
                        correta: alt.correta,
                        ordem: alt.ordem,
                    }
                })
            } else {
                await prisma.alternativa.create({
                    data: {
                        questaoId: id,
                        texto: alt.texto,
                        correta: alt.correta,
                        ordem: alt.ordem,
                    }
                })
            }
        }
    }

    const updated = await prisma.questao.findUnique({
        where: { id },
        include: {
            alternativas: {
                orderBy: { ordem: "asc" }
            },
            imagens: {
                orderBy: { ordem: "asc" }
            }
        }
    })

    return updated ? {
        ...updated,
        pontos: Number(updated.pontos)
    } : null
}

export async function deleteQuestao(id: number) {
    return prisma.questao.delete({
        where: { id }
    })
}

export async function reorderQuestoes(provaId: number, ordem: { id: number; ordem: number }[]) {
    const updates = ordem.map(item =>
        prisma.questao.update({
            where: { id: item.id },
            data: { ordem: item.ordem }
        })
    )
    await prisma.$transaction(updates)
}

export async function deleteResultadoProva(resultadoId: number): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.resultadoProva.delete({
            where: { id: resultadoId }
        })
        return { success: true }
    } catch (error) {
        console.error("Erro ao deletar resultado:", error)
        return { success: false, error: "Erro ao deletar resultado" }
    }
}

// ==========================================
// RESULTADOS
// ==========================================

export async function getResultadosProva(provaId: number) {
    const resultados = await prisma.resultadoProva.findMany({
        where: { provaId },
        include: {
            candidato: true,
            respostas: true,
            prova: {
                include: {
                    questoes: {
                        include: {
                            imagens: { orderBy: { ordem: "asc" } }
                        }
                    }
                }
            }
        },
        orderBy: { iniciadoEm: "desc" }
    })

    return resultados.map(r => ({
        ...r,
        notaFinal: r.notaFinal ? Number(r.notaFinal) : null,
        respostas: r.respostas.map(resp => ({
            ...resp,
            pontuacao: resp.pontuacao ? Number(resp.pontuacao) : null
        })),
        prova: {
            ...r.prova,
            questoes: r.prova.questoes.map(q => ({
                ...q,
                pontos: Number(q.pontos)
            }))
        }
    })) as ResultadoProvaCompleto[]
}

export async function getResultadoDetalhado(resultadoId: number) {
    const resultado = await prisma.resultadoProva.findUnique({
        where: { id: resultadoId },
        include: {
            candidato: true,
            respostas: {
                include: {
                    questao: {
                        include: {
                            alternativas: {
                                orderBy: { ordem: "asc" }
                            },
                            imagens: {
                                orderBy: { ordem: "asc" }
                            }
                        }
                    }
                }
            },
            prova: {
                include: {
                    questoes: {
                        orderBy: { ordem: "asc" },
                        include: {
                            alternativas: {
                                orderBy: { ordem: "asc" }
                            },
                            imagens: {
                                orderBy: { ordem: "asc" }
                            }
                        }
                    }
                }
            }
        }
    })

    if (!resultado) return null

    return {
        ...resultado,
        notaFinal: resultado.notaFinal ? Number(resultado.notaFinal) : null,
        respostas: resultado.respostas.map(resp => ({
            ...resp,
            pontuacao: resp.pontuacao ? Number(resp.pontuacao) : null,
            questao: {
                ...resp.questao,
                pontos: Number(resp.questao.pontos)
            }
        })),
        prova: {
            ...resultado.prova,
            questoes: resultado.prova.questoes.map(q => ({
                ...q,
                pontos: Number(q.pontos)
            }))
        }
    }
}

export async function corrigirResposta(respostaId: number, pontuacao: number) {
    const resposta = await prisma.respostaQuestao.update({
        where: { id: respostaId },
        data: {
            pontuacao: pontuacao,
            corrigida: true,
        },
        include: {
            resultado: {
                include: {
                    respostas: true,
                    prova: {
                        include: {
                            questoes: true
                        }
                    }
                }
            }
        }
    })

    // Check if all respostas are corrigidas
    const allCorrigidas = resposta.resultado.respostas.every((r: { corrigida: any }) => r.corrigida)

    if (allCorrigidas) {
        // Calculate total points earned
        const pontosObtidos = resposta.resultado.respostas.reduce(
            (acc: number, r: { pontuacao: any }) => acc + (r.pontuacao ? Number(r.pontuacao) : 0),
            0
        )

        // Calculate total possible points from the exam
        const pontosTotais = resposta.resultado.prova.questoes.reduce(
            (acc: number, q: { pontos: any }) => acc + Number(q.pontos),
            0
        )

        // Normalize to 0-10 scale
        const notaFinal = pontosTotais > 0
            ? (pontosObtidos / pontosTotais) * 10
            : 0

        await prisma.resultadoProva.update({
            where: { id: resposta.resultadoId },
            data: {
                status: "CORRIGIDA",
                notaFinal: notaFinal
            }
        })
    }

    // We strip the 'resultado' relation before returning because it contains
    // nested 'respostas' with Decimals that cause serialization errors.
    const { resultado, ...safeResposta } = resposta

    return {
        ...safeResposta,
        pontuacao: safeResposta.pontuacao ? Number(safeResposta.pontuacao) : null
    }
}

export async function autoCorrigirMultiplaEscolha(resultadoId: number) {
    const resultado = await prisma.resultadoProva.findUnique({
        where: { id: resultadoId },
        include: {
            respostas: {
                include: {
                    questao: {
                        include: {
                            alternativas: true
                        }
                    }
                }
            }
        }
    })

    if (!resultado) return null

    for (const resposta of resultado.respostas) {
        if ((resposta.questao.tipo === "MULTIPLA_ESCOLHA" || resposta.questao.tipo === "VERDADEIRO_FALSO") && !resposta.corrigida) {
            const alternativaCorreta = resposta.questao.alternativas.find((a: { correta: any }) => a.correta)
            const acertou = resposta.alternativaId === alternativaCorreta?.id

            await prisma.respostaQuestao.update({
                where: { id: resposta.id },
                data: {
                    pontuacao: acertou ? Number(resposta.questao.pontos) : 0,
                    corrigida: true,
                }
            })
        }
    }

    // Check if all are now corrigidas
    const updated = await prisma.resultadoProva.findUnique({
        where: { id: resultadoId },
        include: {
            respostas: true,
            prova: {
                include: {
                    questoes: true
                }
            }
        }
    })

    if (updated && updated.respostas.every((r: { corrigida: any }) => r.corrigida)) {
        // Calculate total points earned
        const pontosObtidos = updated.respostas.reduce(
            (acc: number, r: { pontuacao: any }) => acc + (r.pontuacao ? Number(r.pontuacao) : 0),
            0
        )

        // Calculate total possible points from the exam
        const pontosTotais = updated.prova.questoes.reduce(
            (acc: number, q: { pontos: any }) => acc + Number(q.pontos),
            0
        )

        // Normalize to 0-10 scale
        const notaFinal = pontosTotais > 0
            ? (pontosObtidos / pontosTotais) * 10
            : 0

        await prisma.resultadoProva.update({
            where: { id: resultadoId },
            data: {
                status: "CORRIGIDA",
                notaFinal: notaFinal
            }
        })
    }

    if (!updated) return null

    return {
        ...updated,
        notaFinal: updated.notaFinal ? Number(updated.notaFinal) : null,
        respostas: updated.respostas.map((r: { pontuacao: any }) => ({
            ...r,
            pontuacao: r.pontuacao ? Number(r.pontuacao) : null
        }))
    }
}

// ==========================================
// APROVAÇÃO MANUAL DE CANDIDATOS
// ==========================================

export async function aprovarCandidatoProva(
    resultadoId: number,
    aprovado: boolean
): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.resultadoProva.update({
            where: { id: resultadoId },
            data: { aprovadoProva: aprovado }
        })
        return { success: true }
    } catch {
        return { success: false, error: "Erro ao atualizar status de aprovação" }
    }
}

// ==========================================
// STATS
// ==========================================

export async function getProvaStats(provaId: number) {
    const prova = await prisma.prova.findUnique({
        where: { id: provaId },
        include: {
            questoes: true,
            resultados: {
                where: { status: "CORRIGIDA" },
                include: { respostas: true }
            }
        }
    })

    if (!prova) return null

    const pontuacaoTotal = prova.questoes.reduce((acc: number, q: { pontos: any }) => acc + Number(q.pontos), 0)
    const resultadosCorrigidos = prova.resultados
    const notas = resultadosCorrigidos.map((r: { notaFinal: any }) => Number(r.notaFinal || 0))

    const distribuicao = [0, 0, 0, 0, 0] // 0-2, 2-4, 4-6, 6-8, 8-10

    notas.forEach((nota: number) => {
        if (nota < 2) distribuicao[0]++
        else if (nota < 4) distribuicao[1]++
        else if (nota < 6) distribuicao[2]++
        else if (nota < 8) distribuicao[3]++
        else distribuicao[4]++
    })

    // Keep distribution as absolute counts for the chart
    // The chart will display X axis as percentage ranges (0-20%, etc)
    // and Y axis as number of students

    // Calculate Hit Rate per Question
    // We need to look at all corrected answers for each question
    const questoesStats = prova.questoes.map((q: { id: any; pontos: any; enunciado: any; tipo: any }) => {
        let totalRespostas = 0
        let totalAcertos = 0

        resultadosCorrigidos.forEach((r: { respostas: any[] }) => {
            const resposta = r.respostas.find((resp: { questaoId: any }) => resp.questaoId === q.id)
            if (resposta && resposta.corrigida) {
                totalRespostas++
                // Consider "Acerto" if pontuacao is equal to max points (full credit)
                // Or maybe partial credit? Let's use > 0 for now or proportional.
                // Best metric: Average percentage score for the question
                const pontosObtidos = Number(resposta.pontuacao || 0)
                const pontosMaximos = Number(q.pontos)

                if (pontosMaximos > 0) {
                    totalAcertos += (pontosObtidos / pontosMaximos)
                }
            }
        })

        const taxaAcerto = totalRespostas > 0 ? (totalAcertos / totalRespostas) * 100 : 0

        return {
            id: q.id,
            enunciado: q.enunciado,
            tipo: q.tipo,
            taxaAcerto
        }
    })

    return {
        totalParticipantes: prova.resultados.length,
        totalCorrigidos: resultadosCorrigidos.length,
        pontuacaoTotal,
        mediaGeral: notas.length > 0 ? notas.reduce((a: any, b: any) => a + b, 0) / notas.length : 0,
        maiorNota: notas.length > 0 ? Math.max(...notas) : 0,
        menorNota: notas.length > 0 ? Math.min(...notas) : 0,
        distribuicao,
        questoesStats: questoesStats.sort((a: { taxaAcerto: number }, b: { taxaAcerto: number }) => b.taxaAcerto - a.taxaAcerto) // Order by easiest to hardest
    }
}
