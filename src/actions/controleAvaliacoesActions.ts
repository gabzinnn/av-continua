"use server"

import prisma from "@/src/lib/prisma"
import { revalidatePath } from "next/cache"

// Interface para avaliação atual
export interface AvaliacaoAtiva {
    id: number
    nome: string
    dataInicio: Date
    diasRestantes: number
    progressoPercent: number
    membrosAvaliaram: number
    totalMembros: number
}

// Interface para item de histórico
export interface AvaliacaoHistorico {
    id: number
    nome: string
    dataInicio: Date
    dataFim: Date | null
    totalParticipantes: number
    finalizada: boolean
}

// Interface para dados do gráfico por área
export interface DesempenhoArea {
    area: string
    entrega: number
    cultura: number
    feedbacks: number
}

// Buscar avaliação ativa
export async function getAvaliacaoAtiva(): Promise<AvaliacaoAtiva | null> {
    const avaliacao = await prisma.avaliacao.findFirst({
        where: { finalizada: false },
        include: {
            participantes: true,
        },
        orderBy: { dataInicio: "desc" },
    })

    if (!avaliacao) return null

    // Total de membros ativos
    const totalMembros = await prisma.membro.count({
        where: { isAtivo: true },
    })

    // Membros que completaram
    const membrosAvaliaram = avaliacao.participantes.filter(
        (p) => p.respondeuAvaliacao
    ).length

    // Calcular dias restantes (estimando 6 dias após início)
    const dataFimEstimada = new Date(avaliacao.dataInicio)
    dataFimEstimada.setDate(dataFimEstimada.getDate() + 6)
    const hoje = new Date()
    const diffTime = dataFimEstimada.getTime() - hoje.getTime()
    const diasRestantes = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))

    return {
        id: avaliacao.id,
        nome: avaliacao.nome,
        dataInicio: avaliacao.dataInicio,
        diasRestantes,
        progressoPercent: totalMembros > 0 ? Math.round((membrosAvaliaram / totalMembros) * 100) : 0,
        membrosAvaliaram,
        totalMembros,
    }
}

// Buscar histórico de avaliações (finalizadas)
export async function getAvaliacaoHistorico(): Promise<AvaliacaoHistorico[]> {
    const avaliacoes = await prisma.avaliacao.findMany({
        where: { finalizada: true },
        orderBy: { dataInicio: "desc" },
        include: {
            participantes: true,
        },
        take: 10,
    })

    return avaliacoes.map((av) => ({
        id: av.id,
        nome: av.nome,
        dataInicio: av.dataInicio,
        dataFim: av.dataFim,
        totalParticipantes: av.participantes.length,
        finalizada: av.finalizada,
    }))
}

// Buscar dados de desempenho por área para o gráfico
export async function getDesempenhoPorArea(avaliacaoId?: number): Promise<DesempenhoArea[]> {
    // Buscar avaliação ativa ou específica
    let avaliacaoIdToUse = avaliacaoId
    if (!avaliacaoIdToUse) {
        const avaliacaoAtiva = await prisma.avaliacao.findFirst({
            where: { finalizada: false },
            select: { id: true },
        })
        if (!avaliacaoAtiva) return []
        avaliacaoIdToUse = avaliacaoAtiva.id
    }

    // Buscar todas as áreas
    const areas = await prisma.area.findMany({
        include: {
            membros: {
                where: { isAtivo: true },
                include: {
                    avaliacoesRecebidas: {
                        where: { avaliacaoId: avaliacaoIdToUse, finalizada: true },
                    },
                },
            },
        },
    })

    return areas.map((area) => {
        const todasRespostas = area.membros.flatMap((m) => m.avaliacoesRecebidas)
        const total = todasRespostas.length

        if (total === 0) {
            return {
                area: area.nome,
                entrega: 0,
                cultura: 0,
                feedbacks: 0,
            }
        }

        const somaEntrega = todasRespostas.reduce((acc, r) => acc + r.notaEntrega, 0)
        const somaCultura = todasRespostas.reduce((acc, r) => acc + r.notaCultura, 0)

        return {
            area: area.nome,
            entrega: Number((somaEntrega / total).toFixed(1)),
            cultura: Number((somaCultura / total).toFixed(1)),
            feedbacks: total,
        }
    })
}

// Interface para dados históricos (evolução ao longo do tempo)
export interface EvolucaoDesempenho {
    avaliacao: string
    entrega: number
    cultura: number
    feedbacks: number
}

// Buscar evolução de desempenho ao longo das avaliações
export async function getEvolucaoDesempenho(areaId?: number): Promise<EvolucaoDesempenho[]> {
    // Buscar todas as avaliações finalizadas + a ativa
    const avaliacoes = await prisma.avaliacao.findMany({
        orderBy: { dataInicio: "asc" },
        take: 10,
    })

    if (avaliacoes.length === 0) return []

    const resultado: EvolucaoDesempenho[] = []

    for (const avaliacao of avaliacoes) {
        // Buscar respostas finalizadas dessa avaliação
        let whereCondition: { avaliacaoId: number; finalizada: boolean; avaliado?: { areaId: number } } = {
            avaliacaoId: avaliacao.id,
            finalizada: true,
        }

        if (areaId) {
            whereCondition = {
                ...whereCondition,
                avaliado: { areaId },
            }
        }

        const respostas = await prisma.respostaAvaliacao.findMany({
            where: whereCondition,
        })

        const total = respostas.length
        if (total === 0) {
            resultado.push({
                avaliacao: avaliacao.nome,
                entrega: 0,
                cultura: 0,
                feedbacks: 0,
            })
        } else {
            const somaEntrega = respostas.reduce((acc, r) => acc + r.notaEntrega, 0)
            const somaCultura = respostas.reduce((acc, r) => acc + r.notaCultura, 0)

            resultado.push({
                avaliacao: avaliacao.nome,
                entrega: Number((somaEntrega / total).toFixed(1)),
                cultura: Number((somaCultura / total).toFixed(1)),
                feedbacks: total,
            })
        }
    }

    return resultado
}

// Criar nova avaliação
export async function criarAvaliacao(
    nome: string,
    coordenadorId: number
): Promise<{ success: boolean; error?: string }> {
    try {
        // Verificar se já existe avaliação ativa
        const avaliacaoAtiva = await prisma.avaliacao.findFirst({
            where: { finalizada: false },
        })

        if (avaliacaoAtiva) {
            return { success: false, error: "Já existe uma avaliação em andamento" }
        }

        const dataInicio = new Date()
        const dataFim = new Date(dataInicio)
        dataFim.setDate(dataFim.getDate() + 6)

        await prisma.avaliacao.create({
            data: {
                nome,
                dataInicio,
                createdById: coordenadorId,
                dataFim,
            },
        })

        revalidatePath("/coord/avaliacoes")
        return { success: true }
    } catch (error) {
        console.error("Erro ao criar avaliação:", error)
        return { success: false, error: "Erro ao criar avaliação" }
    }
}

// Finalizar avaliação ativa
export async function finalizarAvaliacao(
    avaliacaoId: number
): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.avaliacao.update({
            where: { id: avaliacaoId },
            data: {
                finalizada: true,
                dataFim: new Date(),
            },
        })

        revalidatePath("/coord/avaliacoes")
        return { success: true }
    } catch (error) {
        console.error("Erro ao finalizar avaliação:", error)
        return { success: false, error: "Erro ao finalizar avaliação" }
    }
}

// Interface para preview de avaliações
export interface PreviewMembroAvalia {
    id: number
    nome: string
    area: string
    fotoUrl: string | null
}

export interface PreviewMembro {
    id: number
    nome: string
    area: string
    fotoUrl: string | null
    isCoordenador: boolean
    avaliaQuem: PreviewMembroAvalia[]
}

// Gerar preview de quem avalia quem
export async function getPreviewAvaliacoes(): Promise<PreviewMembro[]> {
    // Buscar todos os membros ativos
    const membrosAtivos = await prisma.membro.findMany({
        where: { isAtivo: true },
        include: { area: true },
        orderBy: [{ area: { nome: "asc" } }, { nome: "asc" }],
    })

    const resultado: PreviewMembro[] = []

    for (const membro of membrosAtivos) {
        // Buscar demandas em que o membro está alocado
        const demandasDoMembro = await prisma.alocacaoDemanda.findMany({
            where: { membroId: membro.id },
            select: { demandaId: true },
        })

        const demandaIds = demandasDoMembro.map((d) => d.demandaId)

        // Buscar membros que compartilham pelo menos uma demanda
        const membrosComDemandaCompartilhada = await prisma.alocacaoDemanda.findMany({
            where: {
                demandaId: { in: demandaIds },
                membroId: { not: membro.id },
            },
            select: { membroId: true },
            distinct: ["membroId"],
        })

        let membrosAvaliadosIds = membrosComDemandaCompartilhada.map((a) => a.membroId)

        // Adicionar coordenadores obrigatórios
        const coordenadoresObrigatorios = await prisma.membro.findMany({
            where: {
                isCoordenador: true,
                isAtivo: true,
                id: { not: membro.id },
                OR: [
                    { areaId: membro.areaId },
                    { area: { nome: "Organização Interna" } },
                    { area: { nome: "Coordenação Geral" } },
                ],
            },
            select: { id: true },
        })

        const coordenadorIds = coordenadoresObrigatorios.map((c) => c.id)
        membrosAvaliadosIds = [...new Set([...membrosAvaliadosIds, ...coordenadorIds])]

        // Se o membro é coordenador, adicionar líderes de demandas da sua área
        if (membro.isCoordenador) {
            const lideresDemandasDaArea = await prisma.alocacaoDemanda.findMany({
                where: {
                    isLider: true,
                    membroId: { not: membro.id },
                    demanda: {
                        idArea: membro.areaId,
                        finalizada: false
                    },
                    membro: { isAtivo: true }
                },
                select: { membroId: true },
                distinct: ['membroId']
            })
            const liderIds = lideresDemandasDaArea.map((l) => l.membroId)
            membrosAvaliadosIds = [...new Set([...membrosAvaliadosIds, ...liderIds])]
        }

        // Buscar dados dos membros a avaliar
        const membrosAvaliar = await prisma.membro.findMany({
            where: {
                id: { in: membrosAvaliadosIds },
                isAtivo: true,
            },
            include: { area: true },
            orderBy: [{ isCoordenador: "desc" }, { area: { nome: "asc" } }, { nome: "asc" }],
        })

        resultado.push({
            id: membro.id,
            nome: membro.nome,
            area: membro.area.nome,
            fotoUrl: membro.fotoUrl,
            isCoordenador: membro.isCoordenador,
            avaliaQuem: membrosAvaliar.map((m) => ({
                id: m.id,
                nome: m.nome,
                area: m.area.nome,
                fotoUrl: m.fotoUrl,
            })),
        })
    }

    return resultado
}

// Interface para participante com status detalhado
export interface ParticipanteDetalhe {
    id: number
    nome: string
    fotoUrl: string | null
    area: string
    respondeuAvaliacao: boolean
    avaliouFeedbacks: boolean
}

// Interface para detalhe completo da avaliação
export interface DetalheAvaliacao {
    id: number
    nome: string
    dataInicio: Date
    dataFim: Date | null
    finalizada: boolean
    participantes: ParticipanteDetalhe[]
}

// Ordem padrão das áreas
const AREA_ORDER: Record<string, number> = {
    "Coordenação Geral": 0,
    "Organização Interna": 1,
    "Academia de Preparação": 2,
    "Escola de Negócios": 3,
    "Fábrica de Consultores": 4,
}

// Buscar detalhes completos de uma avaliação
export async function getDetalheAvaliacao(avaliacaoId: number): Promise<DetalheAvaliacao | null> {
    const avaliacao = await prisma.avaliacao.findUnique({
        where: { id: avaliacaoId },
        include: {
            participantes: {
                include: {
                    membro: {
                        include: { area: true },
                    },
                },
            },
        },
    })

    if (!avaliacao) return null

    // Buscar membros que podiam participar dessa avaliação
    // (criados antes ou na data de início da avaliação E que estavam ativos)
    const membrosParticipantes = await prisma.membro.findMany({
        where: {
            createdAt: { lte: avaliacao.dataInicio },
        },
        include: { area: true },
    })

    // Criar mapa de participações
    const participacoesMap = new Map(
        avaliacao.participantes.map((p) => [p.membroId, p])
    )

    // Montar lista de participantes com status e ordenar por área
    const participantes: ParticipanteDetalhe[] = membrosParticipantes
        .map((membro) => {
            const participacao = participacoesMap.get(membro.id)
            return {
                id: membro.id,
                nome: membro.nome,
                fotoUrl: membro.fotoUrl,
                area: membro.area.nome,
                respondeuAvaliacao: participacao?.respondeuAvaliacao ?? false,
                avaliouFeedbacks: participacao?.avaliouFeedbacks ?? false,
            }
        })
        .sort((a, b) => {
            const orderA = AREA_ORDER[a.area] ?? 999
            const orderB = AREA_ORDER[b.area] ?? 999
            if (orderA !== orderB) return orderA - orderB
            return a.nome.localeCompare(b.nome)
        })

    return {
        id: avaliacao.id,
        nome: avaliacao.nome,
        dataInicio: avaliacao.dataInicio,
        dataFim: avaliacao.dataFim,
        finalizada: avaliacao.finalizada,
        participantes,
    }
}

// Excluir avaliação do histórico
export async function deleteAvaliacao(avaliacaoId: number): Promise<{ success: boolean; error?: string }> {
    try {
        // Buscar todas as respostas dessa avaliação para deletar dependências
        const respostas = await prisma.respostaAvaliacao.findMany({
            where: { avaliacaoId },
            select: { id: true }
        })
        const respostaIds = respostas.map(r => r.id)

        // Deletar em ordem de dependência
        // 1. Planos de ação
        await prisma.planoAcao.deleteMany({
            where: { respostaAvaliacaoId: { in: respostaIds } }
        })

        // 2. Feedbacks de avaliação
        await prisma.avaliacaoFeedback.deleteMany({
            where: { respostaAvaliacaoId: { in: respostaIds } }
        })

        // 3. Respostas de avaliação
        await prisma.respostaAvaliacao.deleteMany({
            where: { avaliacaoId }
        })

        // 4. Participações
        await prisma.participacaoAvaliacao.deleteMany({
            where: { avaliacaoId }
        })

        // 5. Avaliação
        await prisma.avaliacao.delete({
            where: { id: avaliacaoId }
        })

        revalidatePath("/coord/avaliacoes")
        return { success: true }
    } catch (error) {
        console.error("Erro ao excluir avaliação:", error)
        return { success: false, error: "Erro ao excluir avaliação" }
    }
}
