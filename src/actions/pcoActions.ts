"use server"

import prisma from "@/src/lib/prisma"
import { revalidatePath } from "next/cache"
import { PCO, PerguntaPCO, TipoPerguntaPCO } from "../generated/prisma/client"
import type { PCOReportData, SecaoRelatorio, PerguntaRelatorio, DonutItem } from "@/src/lib/reports/pco/types"
import { extractNPSFromDistribuicao } from "@/src/lib/reports/utils/nps"
import { computeBreakdownAreas, computeFaixasPeriodo, computeTotalRespondentes } from "@/src/lib/reports/utils/contexto"
import { agruparTextos } from "@/src/lib/reports/utils/agrupamento"

// ==========================================
// TIPOS
// ==========================================

export interface PCOResumo {
    id: number
    nome: string
    status: "RASCUNHO" | "ATIVA" | "ENCERRADA"
    dataInicio: Date | null
    dataFim: Date | null
    totalParticipantes: number
    totalRespostas: number
    taxaResposta: number
    createdAt: Date
}

export interface PCOPageData {
    pcos: PCOResumo[]
    totalAtivas: number
    totalRascunhos: number
    totalEncerradas: number
}

// ==========================================
// COORD-SIDE: PÁGINA PRINCIPAL
// ==========================================

export async function getPCOPageData(): Promise<PCOPageData> {
    const pcos = await prisma.pCO.findMany({
        include: {
            participacoes: true,
        },
        orderBy: { createdAt: "desc" },
    })

    const pcosResumo: PCOResumo[] = pcos.map((pco) => {
        const totalParticipantes = pco.participacoes.length
        const totalRespostas = pco.participacoes.filter((p) => p.respondeu).length
        const taxaResposta = totalParticipantes > 0
            ? Math.round((totalRespostas / totalParticipantes) * 100)
            : 0

        return {
            id: pco.id,
            nome: pco.nome,
            status: pco.status,
            dataInicio: pco.dataInicio,
            dataFim: pco.dataFim,
            totalParticipantes,
            totalRespostas,
            taxaResposta,
            createdAt: pco.createdAt,
        }
    })

    return {
        pcos: pcosResumo,
        totalAtivas: pcosResumo.filter((p) => p.status === "ATIVA").length,
        totalRascunhos: pcosResumo.filter((p) => p.status === "RASCUNHO").length,
        totalEncerradas: pcosResumo.filter((p) => p.status === "ENCERRADA").length,
    }
}

// ==========================================
// COORD-SIDE: CRIAR PCO
// ==========================================

export interface CriarPCOInput {
    nome: string
    descricao?: string
    idCiclo?: number | null
    anonima?: boolean
    secoes: {
        titulo: string
        descricao?: string
        ordem: number
        perguntas: {
            texto: string
            tipo: "ESCALA" | "MULTIPLA_ESCOLHA" | "TEXTO_LIVRE"
            obrigatoria?: boolean
            mostrarJustificativa?: boolean
            opcoes?: string[]
        }[]
    }[]
}

export async function criarPCO(input: CriarPCOInput): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.pCO.create({
            data: {
                nome: input.nome,
                descricao: input.descricao,
                idCiclo: input.idCiclo ?? null,
                anonima: input.anonima ?? true,
                status: "RASCUNHO",
                secoes: {
                    create: input.secoes.map((s) => ({
                        titulo: s.titulo,
                        descricao: s.descricao,
                        ordem: s.ordem,
                        perguntas: {
                            create: s.perguntas.map((p, index) => ({
                                texto: p.texto,
                                tipo: p.tipo,
                                obrigatoria: p.obrigatoria ?? true,
                                mostrarJustificativa: p.mostrarJustificativa ?? false,
                                ordem: index + 1,
                                opcoes: p.opcoes
                                    ? {
                                        create: p.opcoes.map((o, i) => ({
                                            texto: o,
                                            ordem: i + 1,
                                        })),
                                    }
                                    : undefined,
                            })),
                        },
                    })),
                },
            },
        })

        return { success: true }
    } catch (error) {
        console.error("Erro ao criar PCO:", error)
        return { success: false, error: "Erro ao criar a pesquisa." }
    }
}

// ==========================================
// COORD-SIDE: INICIAR PCO
// ==========================================

export async function iniciarPCO(id: number): Promise<{ success: boolean; error?: string }> {
    try {
        // Buscar membros ativos
        const membrosAtivos = await prisma.membro.findMany({
            where: { isAtivo: true },
            select: { id: true },
        })

        if (membrosAtivos.length === 0) {
            return { success: false, error: "Nenhum membro ativo encontrado." }
        }

        await prisma.pCO.update({
            where: { id },
            data: {
                status: "ATIVA",
                dataInicio: new Date(),
                participacoes: {
                    createMany: {
                        data: membrosAtivos.map((m: { id: any }) => ({
                            membroId: m.id,
                            respondeu: false,
                        })),
                        skipDuplicates: true,
                    },
                },
            },
        })

        return { success: true }
    } catch (error) {
        console.error("Erro ao iniciar PCO:", error)
        return { success: false, error: "Erro ao iniciar a pesquisa." }
    }
}

// ==========================================
// COORD-SIDE: ENCERRAR PCO
// ==========================================

export async function encerrarPCO(id: number): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.pCO.update({
            where: { id },
            data: {
                status: "ENCERRADA",
                dataFim: new Date(),
            },
        })

        return { success: true }
    } catch (error) {
        console.error("Erro ao encerrar PCO:", error)
        return { success: false, error: "Erro ao encerrar a pesquisa." }
    }
}

// ==========================================
// COORD-SIDE: DELETAR PCO (RASCUNHO)
// ==========================================

export async function duplicarPCO(id: number): Promise<{ success: boolean; id?: number; error?: string }> {
    try {
        const original = await prisma.pCO.findUnique({
            where: { id },
            include: {
                secoes: {
                    include: {
                        perguntas: {
                            include: { opcoes: { orderBy: { ordem: 'asc' } } },
                            orderBy: { ordem: 'asc' }
                        }
                    },
                    orderBy: { ordem: 'asc' }
                }
            }
        })
        if (!original) return { success: false, error: "PCO não encontrada" }

        const nova = await prisma.pCO.create({
            data: {
                nome: `Cópia de ${original.nome}`,
                descricao: original.descricao,
                anonima: original.anonima,
                status: "RASCUNHO",
                secoes: {
                    create: original.secoes.map((s, sIndex) => ({
                        titulo: s.titulo,
                        descricao: s.descricao,
                        ordem: sIndex + 1,
                        perguntas: {
                            create: s.perguntas.map((p, pIndex) => ({
                                texto: p.texto,
                                tipo: p.tipo,
                                obrigatoria: p.obrigatoria,
                                mostrarJustificativa: p.mostrarJustificativa,
                                ordem: pIndex + 1,
                                opcoes: p.opcoes.length > 0
                                    ? { create: p.opcoes.map((o, i) => ({ texto: o.texto, ordem: i + 1 })) }
                                    : undefined,
                            }))
                        }
                    }))
                }
            }
        })

        revalidatePath('/coord/pco')
        return { success: true, id: nova.id }
    } catch (error) {
        console.error("Erro ao duplicar PCO:", error)
        return { success: false, error: "Erro ao duplicar a pesquisa." }
    }
}

export async function deletarPCO(id: number): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.pCO.delete({ where: { id } })
        return { success: true }
    } catch (error) {
        console.error("Erro ao deletar PCO:", error)
        return { success: false, error: "Erro ao deletar a pesquisa." }
    }
}

// ==========================================
// MEMBER-SIDE: VERIFICAR SE EXISTE PCO ATIVA
// ==========================================

export async function temPCOAtiva(membroId: number): Promise<boolean> {
    const count = await prisma.participacaoPCO.count({
        where: {
            membroId,
            respondeu: false,
            pco: { status: "ATIVA" },
        },
    })
    return count > 0
}

// ==========================================
// MEMBER-SIDE: BUSCAR PCOs ATIVAS
// ==========================================

export interface PCOParaResponder {
    id: number
    nome: string
    descricao: string | null
    dataFim: Date | null
    totalPerguntas: number
    jaRespondeu: boolean
    secoes: {
        id: number
        titulo: string
        descricao: string | null
        ordem: number
        perguntas: {
            id: number
            texto: string
            tipo: "ESCALA" | "MULTIPLA_ESCOLHA" | "TEXTO_LIVRE"
            obrigatoria: boolean
            mostrarJustificativa: boolean
            ordem: number
            opcoes: { id: number; texto: string; ordem: number }[]
        }[]
    }[]
}

export async function getPCOsAtivasParaMembro(membroId: number): Promise<PCOParaResponder[]> {
    const pcos = await prisma.pCO.findMany({
        where: {
            status: "ATIVA",
            participacoes: {
                some: { membroId },
            },
        },
        include: {
            secoes: {
                orderBy: { ordem: "asc" },
                include: {
                    perguntas: {
                        orderBy: { ordem: "asc" },
                        include: {
                            opcoes: { orderBy: { ordem: "asc" } },
                        },
                    },
                },
            },
            participacoes: {
                where: { membroId },
            },
        },
        orderBy: { createdAt: "desc" },
    })

    return pcos.map((pco: { participacoes: any[]; secoes: any[]; id: any; nome: any; descricao: any; dataFim: any }) => {
        const participacao = pco.participacoes[0]
        const jaRespondeu = participacao?.respondeu ?? false

        const totalPerguntas = pco.secoes.reduce((acc: number, s: { perguntas: string | any[] }) => acc + s.perguntas.length, 0)

        return {
            id: pco.id,
            nome: pco.nome,
            descricao: pco.descricao,
            dataFim: pco.dataFim,
            totalPerguntas,
            jaRespondeu,
            secoes: pco.secoes.map((s: { id: any; titulo: any; descricao: any; ordem: any; perguntas: any[] }) => ({
                id: s.id,
                titulo: s.titulo,
                descricao: s.descricao,
                ordem: s.ordem,
                perguntas: s.perguntas.map((p: { id: any; texto: any; tipo: any; obrigatoria: any; mostrarJustificativa: any; ordem: any; opcoes: any[] }) => ({
                    id: p.id,
                    texto: p.texto,
                    tipo: p.tipo,
                    obrigatoria: p.obrigatoria,
                    mostrarJustificativa: p.mostrarJustificativa,
                    ordem: p.ordem,
                    opcoes: p.opcoes.map((o: { id: any; texto: any; ordem: any }) => ({
                        id: o.id,
                        texto: o.texto,
                        ordem: o.ordem,
                    })),
                })),
            })),
        }
    })
}

// ==========================================
// MEMBER-SIDE: ENVIAR RESPOSTAS
// ==========================================

export interface EnviarRespostasPCOInput {
    membroId: number
    pcoId: number
    respostas: {
        perguntaId: number
        nota?: number
        opcaoId?: number
        texto?: string
        justificativa?: string
    }[]
}

export async function enviarRespostasPCO(
    input: EnviarRespostasPCOInput
): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.$transaction(async (tx) => {
            // Remover respostas anteriores (caso re-envie)
            await tx.respostaPCO.deleteMany({
                where: {
                    pcoId: input.pcoId,
                    membroId: input.membroId,
                },
            })

            // Criar todas as respostas de uma vez
            await tx.respostaPCO.createMany({
                data: input.respostas.map((r) => ({
                    perguntaId: r.perguntaId,
                    membroId: input.membroId,
                    pcoId: input.pcoId,
                    nota: r.nota ?? null,
                    opcaoId: r.opcaoId ?? null,
                    texto: r.texto ?? null,
                    justificativa: r.justificativa ?? null,
                })),
            })

            // Marcar participação como respondida
            await tx.participacaoPCO.updateMany({
                where: {
                    pcoId: input.pcoId,
                    membroId: input.membroId,
                },
                data: { respondeu: true },
            })
        }, { timeout: 30000 })

        return { success: true }
    } catch (error) {
        console.error("Erro ao enviar respostas PCO:", error)
        return { success: false, error: "Erro ao enviar respostas." }
    }
}

// ==========================================
// MEMBER-SIDE: VER RESPOSTAS DE UMA PCO RESPONDIDA
// ==========================================

export interface PCORespostasView {
    id: number
    nome: string
    descricao: string | null
    dataFim: Date | null
    secoes: {
        id: number
        titulo: string
        descricao: string | null
        ordem: number
        perguntas: {
            id: number
            texto: string
            tipo: "ESCALA" | "MULTIPLA_ESCOLHA" | "TEXTO_LIVRE"
            ordem: number
            mostrarJustificativa: boolean
            resposta: {
                nota: number | null
                texto: string | null
                justificativa: string | null
                opcaoTexto: string | null
            } | null
        }[]
    }[]
}

export async function getPCORespostasForMembro(
    membroId: number,
    pcoId: number
): Promise<PCORespostasView | null> {
    const pco = await prisma.pCO.findFirst({
        where: { id: pcoId },
        include: {
            secoes: {
                orderBy: { ordem: "asc" },
                include: {
                    perguntas: {
                        orderBy: { ordem: "asc" },
                        include: {
                            opcoes: { orderBy: { ordem: "asc" } },
                            respostas: { where: { membroId } },
                        },
                    },
                },
            },
        },
    })

    if (!pco) return null

    return {
        id: pco.id,
        nome: pco.nome,
        descricao: pco.descricao,
        dataFim: pco.dataFim,
        secoes: pco.secoes.map((s: any) => ({
            id: s.id,
            titulo: s.titulo,
            descricao: s.descricao,
            ordem: s.ordem,
            perguntas: s.perguntas.map((p: any) => {
                const resposta = p.respostas[0] ?? null
                const opcaoTexto = resposta?.opcaoId
                    ? (p.opcoes.find((o: any) => o.id === resposta.opcaoId)?.texto ?? null)
                    : null
                return {
                    id: p.id,
                    texto: p.texto,
                    tipo: p.tipo,
                    ordem: p.ordem,
                    mostrarJustificativa: p.mostrarJustificativa,
                    resposta: resposta
                        ? { nota: resposta.nota, texto: resposta.texto, justificativa: resposta.justificativa, opcaoTexto }
                        : null,
                }
            }),
        })),
    }
}

// ==========================================
// MEMBER-SIDE: HISTÓRICO DE PCOs RESPONDIDAS
// ==========================================

export interface PCOHistoricoItem {
    id: number
    nome: string
    descricao: string | null
    dataInicio: Date | null
    dataFim: Date | null
    status: "RASCUNHO" | "ATIVA" | "ENCERRADA"
}

export async function getPCOsHistoricoMembro(membroId: number): Promise<PCOHistoricoItem[]> {
    const participacoes = await prisma.participacaoPCO.findMany({
        where: { membroId, respondeu: true },
        include: {
            pco: { select: { id: true, nome: true, descricao: true, dataInicio: true, dataFim: true, status: true } },
        },
        orderBy: { pco: { dataInicio: "desc" } },
    })

    return participacoes.map((p: any) => ({
        id: p.pco.id,
        nome: p.pco.nome,
        descricao: p.pco.descricao,
        dataInicio: p.pco.dataInicio,
        dataFim: p.pco.dataFim,
        status: p.pco.status,
    }))
}

// ==========================================
// COORD-SIDE: BUSCAR PCO PARA EDITAR
// ==========================================

export interface PCOParaEditar {
    id: number
    nome: string
    descricao: string | null
    secoes: {
        id: number
        titulo: string
        descricao: string | null
        ordem: number
        perguntas: {
            id: number
            texto: string
            tipo: "ESCALA" | "MULTIPLA_ESCOLHA" | "TEXTO_LIVRE"
            obrigatoria: boolean
            mostrarJustificativa: boolean
            ordem: number
            opcoes: { id: number; texto: string; ordem: number }[]
        }[]
    }[]
}

export async function getPCOParaEditar(id: number): Promise<PCOParaEditar | null> {
    const pco = await prisma.pCO.findFirst({
        where: { id, status: "RASCUNHO" },
        include: {
            secoes: {
                orderBy: { ordem: "asc" },
                include: {
                    perguntas: {
                        orderBy: { ordem: "asc" },
                        include: { opcoes: { orderBy: { ordem: "asc" } } },
                    },
                },
            },
        },
    })

    if (!pco) return null

    return {
        id: pco.id,
        nome: pco.nome,
        descricao: pco.descricao,
        secoes: pco.secoes.map((s: any) => ({
            id: s.id,
            titulo: s.titulo,
            descricao: s.descricao,
            ordem: s.ordem,
            perguntas: s.perguntas.map((p: any) => ({
                id: p.id,
                texto: p.texto,
                tipo: p.tipo,
                obrigatoria: p.obrigatoria,
                mostrarJustificativa: p.mostrarJustificativa,
                ordem: p.ordem,
                opcoes: p.opcoes.map((o: any) => ({ id: o.id, texto: o.texto, ordem: o.ordem })),
            })),
        })),
    }
}

// ==========================================
// COORD-SIDE: EDITAR PCO (apenas RASCUNHO)
// ==========================================

export async function editarPCO(id: number, input: CriarPCOInput): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.$transaction(async (tx) => {
            const pco = await tx.pCO.findUnique({ where: { id }, select: { status: true } })
            if (!pco || pco.status !== "RASCUNHO") {
                throw new Error("Apenas PCOs em rascunho podem ser editadas.")
            }

            await tx.pCO.update({
                where: { id },
                data: { nome: input.nome, descricao: input.descricao ?? null },
            })

            await tx.secaoPCO.deleteMany({ where: { pcoId: id } })

            for (const [sIndex, s] of input.secoes.entries()) {
                await tx.secaoPCO.create({
                    data: {
                        pcoId: id,
                        titulo: s.titulo,
                        descricao: s.descricao ?? null,
                        ordem: sIndex + 1,
                        perguntas: {
                            create: s.perguntas.map((p, pIndex) => ({
                                texto: p.texto,
                                tipo: p.tipo,
                                obrigatoria: p.obrigatoria ?? true,
                                mostrarJustificativa: p.mostrarJustificativa ?? false,
                                ordem: pIndex + 1,
                                opcoes: p.opcoes
                                    ? { create: p.opcoes.map((o, i) => ({ texto: o, ordem: i + 1 })) }
                                    : undefined,
                            })),
                        },
                    },
                })
            }
        })

        return { success: true }
    } catch (error: any) {
        console.error("Erro ao editar PCO:", error)
        return { success: false, error: error.message || "Erro ao editar a pesquisa." }
    }
}

// ==========================================
// COORD-SIDE: DETALHES DE UMA PCO
// ==========================================

const ESCALA_LABELS: Record<number, string> = {
    2: "Concordo",
    1: "Concordo parcialmente",
    [-1]: "Discordo parcialmente",
    [-2]: "Discordo",
    0: "Não consigo responder",
}

// Distribuição de respostas escala para um grupo
export interface DistribuicaoGrupo {
    concordo: number
    concordoParcial: number
    discordoParcial: number
    discordo: number
    naoConsigo: number
    total: number
}

export interface PerguntaDetalhes {
    id: number
    texto: string
    tipo: "ESCALA" | "MULTIPLA_ESCOLHA" | "TEXTO_LIVRE"
    ordem: number
    mediaPorGrupo: Record<string, number>
    distribuicaoPorGrupo: Record<string, DistribuicaoGrupo>
    distribuicaoOpcoes: { texto: string; count: number }[]
    respostasTexto: string[]
    justificativas: string[]
}

export interface SecaoDetalhes {
    id: number
    titulo: string
    descricao: string | null
    ordem: number
    perguntas: PerguntaDetalhes[]
}

export interface ParticipanteDetalhes {
    membroId: number
    nome: string
    respondeu: boolean
    area: string
    isCoordenador: boolean
}

export interface PCODetalhes {
    id: number
    nome: string
    descricao: string | null
    status: "RASCUNHO" | "ATIVA" | "ENCERRADA"
    dataInicio: Date | null
    dataFim: Date | null
    createdAt: Date
    totalParticipantes: number
    totalRespostas: number
    taxaResposta: number
    grupos: string[]
    secoes: SecaoDetalhes[]
    participantes: ParticipanteDetalhes[]
}

export async function getPCODetalhes(pcoId: number): Promise<PCODetalhes | null> {
    const pco = await prisma.pCO.findUnique({
        where: { id: pcoId },
        include: {
            participacoes: {
                include: {
                    membro: {
                        select: { id: true, nome: true, isCoordenador: true, area: { select: { nome: true } } },
                    },
                },
            },
            secoes: {
                orderBy: { ordem: "asc" },
                include: {
                    perguntas: {
                        orderBy: { ordem: "asc" },
                        include: {
                            opcoes: { orderBy: { ordem: "asc" } },
                            respostas: {
                                include: {
                                    membro: {
                                        select: { id: true, isCoordenador: true, area: { select: { nome: true } } },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    })

    if (!pco) return null

    const totalParticipantes = pco.participacoes.length
    const totalRespostas = pco.participacoes.filter((p: { respondeu: any }) => p.respondeu).length
    const taxaResposta = totalParticipantes > 0
        ? Math.round((totalRespostas / totalParticipantes) * 100)
        : 0

    // Discover area names
    const areaNames = [...new Set(pco.participacoes.map((p: { membro: { area: { nome: any } } }) => p.membro.area.nome))].sort()
    const grupos = ["Geral", "Coord", ...areaNames]

    // Helper: compute escala stats for a filtered set of respostas
    function computeEscalaStats(respostas: { nota: number | null }[]) {
        const notasValidas = respostas.filter((r) => r.nota !== null && r.nota !== 0)
        const media = notasValidas.length > 0
            ? notasValidas.reduce((sum: number, r) => sum + (r.nota ?? 0), 0) / notasValidas.length
            : 0

        const dist: DistribuicaoGrupo = { concordo: 0, concordoParcial: 0, discordoParcial: 0, discordo: 0, naoConsigo: 0, total: respostas.length }
        respostas.forEach((r) => {
            if (r.nota === 2) dist.concordo++
            else if (r.nota === 1) dist.concordoParcial++
            else if (r.nota === -1) dist.discordoParcial++
            else if (r.nota === -2) dist.discordo++
            else if (r.nota === 0) dist.naoConsigo++
        })

        return { media, dist }
    }

    const secoes: SecaoDetalhes[] = pco.secoes.map((s: { titulo: any; id: any; descricao: any; ordem: any; perguntas: any[] }) => {
        return {
            id: s.id,
            titulo: s.titulo,
            descricao: s.descricao,
            ordem: s.ordem,
            perguntas: s.perguntas.map((p: { respostas: any; opcoes: any[]; texto: any; tipo: "ESCALA" | "MULTIPLA_ESCOLHA" | "TEXTO_LIVRE"; id: any; ordem: any }) => {
                const respostas = p.respostas

                // Default calculated stats
                let mediaPorGrupo: Record<string, number> = {}
                let distribuicaoPorGrupo: Record<string, DistribuicaoGrupo> = {}
                let distribuicaoOpcoes = p.opcoes.map((opcao: { texto: any; id: any }) => ({
                    texto: opcao.texto,
                    count: respostas.filter((r: { opcaoId: any }) => r.opcaoId === opcao.id).length,
                }))

                if (p.tipo === "ESCALA") {
                    // Calculate from responses (Normal logic)
                    // Geral
                    const geralStats = computeEscalaStats(respostas)
                    mediaPorGrupo["Geral"] = geralStats.media
                    distribuicaoPorGrupo["Geral"] = geralStats.dist

                    // Coord
                    const coordRespostas = respostas.filter((r: { membro: { isCoordenador: any } }) => r.membro.isCoordenador)
                    const coordStats = computeEscalaStats(coordRespostas)
                    mediaPorGrupo["Coord"] = coordStats.media
                    distribuicaoPorGrupo["Coord"] = coordStats.dist

                    // Per area
                    for (const areaNome of areaNames) {
                        const areaRespostas = respostas.filter((r: { membro: { area: { nome: unknown } } }) => r.membro.area.nome === areaNome)
                        const areaStats = computeEscalaStats(areaRespostas)
                        mediaPorGrupo[areaNome] = areaStats.media
                        distribuicaoPorGrupo[areaNome] = areaStats.dist
                    }
                }

                // Texto livre
                const respostasTexto = p.tipo === "TEXTO_LIVRE"
                    ? respostas.filter((r: { texto: string }) => r.texto && r.texto.trim()).map((r: { texto: any }) => r.texto!)
                    : []

                // Justificativas (escala)
                const justificativas = p.tipo === "ESCALA"
                    ? respostas
                        .filter((r: { justificativa: string }) => r.justificativa && r.justificativa.trim())
                        .map((r: { justificativa: any }) => r.justificativa!)
                    : []

                return {
                    id: p.id,
                    texto: p.texto,
                    tipo: p.tipo,
                    ordem: p.ordem,
                    mediaPorGrupo,
                    distribuicaoPorGrupo,
                    distribuicaoOpcoes,
                    respostasTexto,
                    justificativas,
                }
            })
        }
    })

    const participantes: ParticipanteDetalhes[] = pco.participacoes.map((p: { membro: { id: any; nome: any; area: { nome: any }; isCoordenador: any }; respondeu: any }) => ({
        membroId: p.membro.id,
        nome: p.membro.nome,
        respondeu: p.respondeu,
        area: p.membro.area.nome,
        isCoordenador: p.membro.isCoordenador,
    }))

    return {
        id: pco.id,
        nome: pco.nome,
        descricao: pco.descricao,
        status: pco.status,
        dataInicio: pco.dataInicio,
        dataFim: pco.dataFim,
        createdAt: pco.createdAt,
        totalParticipantes,
        totalRespostas,
        taxaResposta,
        grupos,
        secoes,
        participantes,
    }
}


// ==========================================
// COORD-SIDE: EXPORTAR CSV
// ==========================================

export async function exportarRespostasPCO(pcoId: number): Promise<{ headers: string[]; rows: string[][] }> {
    const pco = await prisma.pCO.findUnique({
        where: { id: pcoId },
        include: {
            secoes: {
                orderBy: { ordem: "asc" },
                include: {
                    perguntas: {
                        orderBy: { ordem: "asc" },
                        include: {
                            opcoes: { orderBy: { ordem: "asc" } },
                        },
                    },
                },
            },
            participacoes: {
                include: {
                    membro: { select: { nome: true } },
                },
            },
        },
    })

    if (!pco) return { headers: [], rows: [] }

    const respostas = await prisma.respostaPCO.findMany({
        where: { pcoId },
        include: {
            membro: { select: { id: true, nome: true } },
        },
    })

    // Flatten perguntas from sections for CSV columns
    const perguntasOrdenadas = pco.secoes.flatMap((s: { perguntas: any }) => s.perguntas)

    const headers = ["Membro", ...perguntasOrdenadas.flatMap((p: { ordem: any; texto: any; tipo: string }) => {
        const base = `Q${p.ordem} - ${p.texto}`
        if (p.tipo === "ESCALA") return [base, `${base} (Justificativa)`]
        return [base]
    })]

    const membrosMap = new Map<number, { nome: string; respostas: Map<number, typeof respostas[0]> }>()

    for (const p of pco.participacoes) {
        membrosMap.set(p.membroId, { nome: p.membro.nome, respostas: new Map() })
    }

    for (const r of respostas) {
        const membro = membrosMap.get(r.membroId)
        if (membro) {
            membro.respostas.set(r.perguntaId, r)
        }
    }

    const rows: string[][] = []
    for (const [, membro] of membrosMap) {
        const row = [membro.nome]
        for (const p of perguntasOrdenadas) {
            const r = membro.respostas.get(p.id)
            if (p.tipo === "ESCALA") {
                const label = r?.nota !== null && r?.nota !== undefined ? (ESCALA_LABELS[r.nota] ?? String(r.nota)) : ""
                row.push(`"${label}"`)
                row.push(`"${(r?.justificativa ?? "").replace(/"/g, '""')}"`)
            } else if (p.tipo === "MULTIPLA_ESCOLHA") {
                const opcao = p.opcoes.find((o: { id: any }) => o.id === r?.opcaoId)
                row.push(`"${opcao?.texto ?? ""}"`)
            } else {
                row.push(`"${(r?.texto ?? "").replace(/"/g, '""')}"`)
            }
        }
        rows.push(row)
    }

    return { headers, rows }
}

// ==========================================
// RELATÓRIO PCO — tipos e server actions
// ==========================================

export interface SalvarRelatorioPayload {
    meta?: {
        capaTitulo?: string
        objetivo?: string
        conclusao?: string
        contexto?: any
        npsHistorico?: Array<{ ciclo: string; nps: number }>
    }
    secoes?: Array<{
        secaoId: number
        introducao?: string
        conclusao?: string
    }>
    perguntas?: Array<{
        perguntaId: number
        insightTexto?: string
        agrupamentos?: { count: number; texto: string }[]
        callouts?: { tipo: "DESVIO" | "ATENCAO"; texto: string }[]
    }>
}

export async function getRelatorioPCO(pcoId: number): Promise<PCOReportData | null> {
    const detalhes = await getPCODetalhes(pcoId)
    if (!detalhes) return null

    const allPerguntaIds = detalhes.secoes.flatMap(s => s.perguntas.map(p => p.id))
    const allSecaoIds = detalhes.secoes.map(s => s.id)

    const [meta, secoesRel, perguntasRel] = await Promise.all([
        (prisma as any).relatorioPCOMeta.findUnique({ where: { pcoId } }),
        (prisma as any).relatorioSecaoPCO.findMany({
            where: { secaoId: { in: allSecaoIds } }
        }),
        (prisma as any).relatorioPerguntaPCO.findMany({
            where: { perguntaId: { in: allPerguntaIds } }
        }),
    ])

    const secaoRelMap = new Map<number, any>(secoesRel.map((s: any) => [s.secaoId, s]))
    const perguntaRelMap = new Map<number, any>(perguntasRel.map((p: any) => [p.perguntaId, p]))

    const totalRespostas = detalhes.totalRespostas
    const totalParticipantes = detalhes.totalParticipantes
    const taxaResposta = totalParticipantes > 0 ? Math.round((totalRespostas / totalParticipantes) * 100) : 0

    // ── 1. Separate the "Identificação" section ──────────────────────────────
    const identificacaoSecao = detalhes.secoes.find(
        s => s.titulo === "Identificação" || s.ordem === 1
    )

    // Helper to find a pergunta by text substring within the Identificação section
    const findIdentPergunta = (substring: string) =>
        identificacaoSecao?.perguntas.find(p =>
            p.texto.toLowerCase().includes(substring.toLowerCase())
        )

    // Compute contexto from Identificação section (unless coord override exists)
    let contexto: PCOReportData["meta"]["contexto"] = meta?.contexto ?? null
    if (!contexto && identificacaoSecao) {
        const areaPergunta = findIdentPergunta("área de alocação")
            ?? findIdentPergunta("area de alocacao")
            ?? findIdentPergunta("área")
            ?? findIdentPergunta("alocação")
        const periodoPergunta = findIdentPergunta("período atual")
            ?? findIdentPergunta("periodo atual")
            ?? findIdentPergunta("período")
            ?? findIdentPergunta("semestre")

        if (areaPergunta) {
            contexto = {
                totalMembros: computeTotalRespondentes(areaPergunta.distribuicaoOpcoes),
                breakdownAreas: computeBreakdownAreas(areaPergunta.distribuicaoOpcoes),
                faixas: periodoPergunta
                    ? computeFaixasPeriodo(periodoPergunta.distribuicaoOpcoes)
                    : [],
            }
        }
    }

    // ── 2. Build secoes (skip Identificação) ────────────────────────────────
    const isNPSQuestion = (texto: string, tipo: string) =>
        tipo === "MULTIPLA_ESCOLHA" &&
        (texto.toLowerCase().includes("recomendaria") ||
            texto.toLowerCase().includes("0 a 10"))

    const secoes: SecaoRelatorio[] = detalhes.secoes
        .filter(s => s.titulo !== "Identificação" && s.ordem !== 1)
        .map(s => {
            const sr = secaoRelMap.get(s.id)
            const perguntas: PerguntaRelatorio[] = s.perguntas.map(p => {
                const pr = perguntaRelMap.get(p.id)
                const tipo = p.tipo as "ESCALA" | "MULTIPLA_ESCOLHA" | "TEXTO_LIVRE"

                // ── 2a. NPS ──
                let npsData: PerguntaRelatorio["npsData"] = null
                if (isNPSQuestion(p.texto, tipo)) {
                    npsData = extractNPSFromDistribuicao(p.distribuicaoOpcoes)
                }

                // ── 2b. Donut (MULTIPLA_ESCOLHA that is NOT the NPS question) ──
                let donutData: DonutItem[] | null = null
                if (tipo === "MULTIPLA_ESCOLHA" && !isNPSQuestion(p.texto, tipo)) {
                    const total = p.distribuicaoOpcoes.reduce((acc, o) => acc + o.count, 0)
                    donutData = p.distribuicaoOpcoes
                        .filter(o => o.count > 0)
                        .map(o => ({
                            texto: o.texto,
                            count: o.count,
                            percent: total > 0 ? (o.count / total) * 100 : 0,
                        }))
                }

                // ── 2c. Agrupamentos (TEXTO_LIVRE) ──
                let agrupamentos: PerguntaRelatorio["agrupamentos"] = pr?.agrupamentos ?? null
                if (tipo === "TEXTO_LIVRE" && !agrupamentos && p.respostasTexto.length > 0) {
                    agrupamentos = agruparTextos(p.respostasTexto)
                }

                return {
                    id: p.id,
                    texto: p.texto,
                    tipo,
                    ordem: p.ordem,
                    mediaPorGrupo: p.mediaPorGrupo,
                    distribuicaoPorGrupo: p.distribuicaoPorGrupo,
                    distribuicaoOpcoes: p.distribuicaoOpcoes,
                    respostasTexto: p.respostasTexto,
                    justificativas: p.justificativas,
                    insightTexto: pr?.insightTexto ?? null,
                    agrupamentos,
                    callouts: pr?.callouts ?? null,
                    npsData,
                    donutData,
                }
            })
            return {
                id: s.id,
                titulo: s.titulo,
                descricao: s.descricao ?? null,
                ordem: s.ordem,
                perguntas,
                introducao: sr?.introducao ?? null,
                conclusao: sr?.conclusao ?? null,
            }
        })

    // ── 3. npsHistorico ──────────────────────────────────────────────────────
    let npsHistorico: PCOReportData["meta"]["npsHistorico"] = meta?.npsHistorico ?? null
    if (!npsHistorico) {
        try {
            const previousPCOs = await (prisma as any).pCO.findMany({
                where: {
                    id: { not: pcoId },
                    status: { in: ["ENCERRADA", "FINALIZADA"] },
                },
                orderBy: { createdAt: "asc" },
                select: { id: true, nome: true, createdAt: true },
            })

            // Take the last 2 before current (by createdAt)
            const current = detalhes.createdAt as Date | undefined
            const before = current
                ? previousPCOs.filter((p: any) => p.createdAt < current)
                : previousPCOs
            const last2: any[] = before.slice(-2)

            if (last2.length > 0) {
                const histItems = await Promise.all(
                    last2.map(async (prevPco: any) => {
                        // Fetch NPS question responses for this PCO
                        const npsQuestion = await (prisma as any).perguntaPCO.findFirst({
                            where: {
                                secao: { pcoId: prevPco.id },
                                tipo: "MULTIPLA_ESCOLHA",
                                OR: [
                                    { texto: { contains: "recomendaria" } },
                                    { texto: { contains: "0 a 10" } },
                                ],
                            },
                            include: { opcoes: true },
                        })
                        if (!npsQuestion) return null

                        const respostas = await (prisma as any).respostaPCO.findMany({
                            where: { perguntaId: npsQuestion.id },
                            select: { opcaoId: true },
                        })

                        const distribuicaoOpcoes = npsQuestion.opcoes.map((o: any) => ({
                            texto: o.texto,
                            count: respostas.filter((r: any) => r.opcaoId === o.id).length,
                        }))

                        const npsData = extractNPSFromDistribuicao(distribuicaoOpcoes)
                        return { ciclo: prevPco.nome, nps: npsData.npsPercent }
                    })
                )
                const valid = histItems.filter(Boolean) as { ciclo: string; nps: number }[]
                if (valid.length > 0) npsHistorico = valid
            }
        } catch {
            // silently ignore — npsHistorico stays null
        }
    }

    return {
        id: detalhes.id,
        nome: detalhes.nome,
        grupos: detalhes.grupos,
        secoes,
        totalParticipantes,
        totalRespostas,
        taxaResposta,
        meta: {
            capaTitulo: meta?.capaTitulo ?? null,
            objetivo: meta?.objetivo ?? null,
            conclusao: meta?.conclusao ?? null,
            contexto,
            npsHistorico,
        },
    }
}

export async function salvarRelatorioPCO(
    pcoId: number,
    payload: SalvarRelatorioPayload
): Promise<{ success: boolean; error?: string }> {
    try {
        const ops: Promise<any>[] = []

        if (payload.meta) {
            const metaData = {
                ...payload.meta,
                npsHistorico: payload.meta.npsHistorico ?? undefined,
            }
            ops.push(
                (prisma as any).relatorioPCOMeta.upsert({
                    where: { pcoId },
                    update: metaData,
                    create: { pcoId, ...metaData },
                })
            )
        }

        if (payload.secoes) {
            for (const secao of payload.secoes) {
                ops.push(
                    (prisma as any).relatorioSecaoPCO.upsert({
                        where: { secaoId: secao.secaoId },
                        update: { introducao: secao.introducao, conclusao: secao.conclusao },
                        create: { secaoId: secao.secaoId, introducao: secao.introducao, conclusao: secao.conclusao },
                    })
                )
            }
        }

        if (payload.perguntas) {
            for (const pergunta of payload.perguntas) {
                ops.push(
                    (prisma as any).relatorioPerguntaPCO.upsert({
                        where: { perguntaId: pergunta.perguntaId },
                        update: {
                            insightTexto: pergunta.insightTexto,
                            agrupamentos: pergunta.agrupamentos ?? undefined,
                            callouts: pergunta.callouts ?? undefined,
                        },
                        create: {
                            perguntaId: pergunta.perguntaId,
                            insightTexto: pergunta.insightTexto,
                            agrupamentos: pergunta.agrupamentos ?? undefined,
                            callouts: pergunta.callouts ?? undefined,
                        },
                    })
                )
            }
        }

        await Promise.all(ops)
        return { success: true }
    } catch (err: any) {
        console.error("salvarRelatorioPCO error:", err)
        return { success: false, error: err?.message ?? "Erro desconhecido" }
    }
}

