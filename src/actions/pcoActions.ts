"use server"

import prisma from "@/src/lib/prisma"
import { PCO, PerguntaPCO, TipoPerguntaPCO } from "../generated/prisma/client"

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
                perguntas: s.perguntas.map((p: { id: any; texto: any; tipo: any; obrigatoria: any; ordem: any; opcoes: any[] }) => ({
                    id: p.id,
                    texto: p.texto,
                    tipo: p.tipo,
                    obrigatoria: p.obrigatoria,
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

