"use server"

import prisma from "@/src/lib/prisma"
import { StatusProva, TipoQuestao, StatusResultado, Prova, Questao, Alternativa, Candidato, ResultadoProva, RespostaQuestao } from "@/src/generated/prisma/client"

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
}

export type ProvaCompleta = {
    id: number
    titulo: string
    descricao: string | null
    tempoLimite: number | null
    embaralhar: boolean
    status: StatusProva
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

export async function getAllProvas(busca?: string, status?: StatusProva) {
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
        orderBy: { updatedAt: "desc" }
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

        const existingIds = existingAlternativas.map(a => a.id)
        const incomingIds = data.alternativas.filter(a => a.id).map(a => a.id!)

        // Delete removed alternativas
        const idsToDelete = existingIds.filter(id => !incomingIds.includes(id))
        if (idsToDelete.length > 0) {
            await prisma.alternativa.deleteMany({
                where: { id: { in: idsToDelete } }
            })
        }

        // Update or create alternativas
        for (const alt of data.alternativas) {
            if (alt.id) {
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
                    respostas: true
                }
            }
        }
    })

    // Check if all respostas are corrigidas
    const allCorrigidas = resposta.resultado.respostas.every(r => r.corrigida)

    if (allCorrigidas) {
        // Calculate final score
        const notaFinal = resposta.resultado.respostas.reduce(
            (acc, r) => acc + (r.pontuacao ? Number(r.pontuacao) : 0),
            0
        )

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
            const alternativaCorreta = resposta.questao.alternativas.find(a => a.correta)
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
        include: { respostas: true }
    })

    if (updated && updated.respostas.every(r => r.corrigida)) {
        const notaFinal = updated.respostas.reduce(
            (acc, r) => acc + (r.pontuacao ? Number(r.pontuacao) : 0),
            0
        )

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
        respostas: updated.respostas.map(r => ({
            ...r,
            pontuacao: r.pontuacao ? Number(r.pontuacao) : null
        }))
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

    const pontuacaoTotal = prova.questoes.reduce((acc, q) => acc + Number(q.pontos), 0)
    const resultadosCorrigidos = prova.resultados
    const notas = resultadosCorrigidos.map(r => Number(r.notaFinal || 0))

    const distribuicao = [0, 0, 0, 0, 0] // 0-2, 2-4, 4-6, 6-8, 8-10

    notas.forEach(nota => {
        if (nota < 2) distribuicao[0]++
        else if (nota < 4) distribuicao[1]++
        else if (nota < 6) distribuicao[2]++
        else if (nota < 8) distribuicao[3]++
        else distribuicao[4]++
    })

    // Calculate Hit Rate per Question
    // We need to look at all corrected answers for each question
    const questoesStats = prova.questoes.map(q => {
        let totalRespostas = 0
        let totalAcertos = 0

        resultadosCorrigidos.forEach(r => {
            const resposta = r.respostas.find(resp => resp.questaoId === q.id)
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
        mediaGeral: notas.length > 0 ? notas.reduce((a, b) => a + b, 0) / notas.length : 0,
        maiorNota: notas.length > 0 ? Math.max(...notas) : 0,
        menorNota: notas.length > 0 ? Math.min(...notas) : 0,
        distribuicao,
        questoesStats: questoesStats.sort((a, b) => b.taxaAcerto - a.taxaAcerto) // Order by easiest to hardest
    }
}
