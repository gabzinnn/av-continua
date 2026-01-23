"use server"

import prisma from "@/src/lib/prisma"

// Interface para evolução das notas ao longo das avaliações
export interface EvolucaoNotasCiclo {
    avaliacao: string
    dataInicio: Date
    mediaEntrega: number
    mediaCultura: number
    mediaFeedback: number
}

// Interface para histórico detalhado do membro
export interface HistoricoMembroDetalhado {
    avaliacao: string
    mediaEntrega: number
    mediaCultura: number
    mediaFeedback: number
}

// Interface para membro dentro do relatório
export interface MembroRelatorio {
    id: number
    nome: string
    fotoUrl: string | null
    mediaEntrega: number | null
    mediaCultura: number | null
    mediaFeedback: number | null
    desvioPadraoEntrega: number
    desvioPadraoCultura: number
    totalAvaliacoesRecebidas: number
    historico: HistoricoMembroDetalhado[]
}

// Interface para dados por área
export interface AreaRelatorio {
    nome: string
    mediaEntrega: number
    mediaCultura: number
    mediaFeedback: number
    evolucao: EvolucaoNotasCiclo[]
    membros: MembroRelatorio[]
}

// Helper para desvio padrão
function calculateSD(values: number[]): number {
    if (values.length <= 1) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
}

// Interface completa do relatório
export interface RelatorioCiclo {
    cicloNome: string
    totalAvaliacoes: number
    totalMembros: number
    mediaGeralEntrega: number
    mediaGeralCultura: number
    mediaGeralFeedback: number
    evolucao: EvolucaoNotasCiclo[]
    areas: AreaRelatorio[]
}

// Buscar dados completos do relatório de um ciclo
export async function getRelatorioCiclo(cicloId: number): Promise<RelatorioCiclo | null> {
    // Buscar ciclo
    const ciclo = await prisma.ciclo.findUnique({
        where: { id: cicloId },
    })
    if (!ciclo) return null

    // Buscar avaliações do ciclo
    const avaliacoes = await prisma.avaliacao.findMany({
        where: { idCiclo: cicloId },
        orderBy: { dataInicio: "asc" },
        include: {
            respostas: {
                where: { finalizada: true },
                include: {
                    avaliado: {
                        include: { area: true }
                    },
                    avaliador: {
                        include: { area: true }
                    },
                    avaliacaoFeedback: true,
                }
            }
        }
    })

    if (avaliacoes.length === 0) {
        return {
            cicloNome: ciclo.nome,
            totalAvaliacoes: 0,
            totalMembros: 0,
            mediaGeralEntrega: 0,
            mediaGeralCultura: 0,
            mediaGeralFeedback: 0,
            evolucao: [],
            areas: [],
        }
    }

    // Calcular evolução das notas GERAL por avaliação
    const evolucaoGeral: EvolucaoNotasCiclo[] = avaliacoes.map(av => {
        const respostas = av.respostas
        const totalRespostas = respostas.length

        const somaEntrega = respostas.reduce((acc, r) => acc + r.notaEntrega, 0)
        const somaCultura = respostas.reduce((acc, r) => acc + r.notaCultura, 0)
        const feedbacks = respostas.filter(r => r.avaliacaoFeedback).map(r => r.avaliacaoFeedback!.notaFeedback)
        const somaFeedback = feedbacks.reduce((acc, f) => acc + f, 0)

        return {
            avaliacao: av.nome,
            dataInicio: av.dataInicio,
            mediaEntrega: totalRespostas > 0 ? somaEntrega / totalRespostas : 0,
            mediaCultura: totalRespostas > 0 ? somaCultura / totalRespostas : 0,
            mediaFeedback: feedbacks.length > 0 ? somaFeedback / feedbacks.length : 0,
        }
    })

    // Agrupar respostas por membro para histórico individual e totais
    const membroMap = new Map<number, {
        nome: string
        fotoUrl: string | null
        area: string
        entregaNotas: number[]
        culturaNotas: number[]
        feedbackSum: number
        feedbackCount: number
        count: number // Count de avaliações RECEBIDAS (para entrega/cultura)
    }>()

    // Auxiliar para histórico por avaliação de cada membro
    const membroHistoricoMap = new Map<number, Map<string, {
        entregaSum: number, culturaSum: number, feedbackSum: number, count: number, feedbackCount: number
    }>>()

    // Função auxiliar para inicializar membro no map
    const initMembro = (membro: any) => {
        if (!membroMap.has(membro.id)) {
            membroMap.set(membro.id, {
                nome: membro.nome,
                fotoUrl: membro.fotoUrl,
                area: membro.area.nome,
                entregaNotas: [],
                culturaNotas: [],
                feedbackSum: 0,
                feedbackCount: 0,
                count: 0,
            })
            membroHistoricoMap.set(membro.id, new Map())
        }
    }

    // Inicializar mapa com todos os membros encontrados (tanto avaliados quanto avaliadores)
    for (const av of avaliacoes) {
        for (const resposta of av.respostas) {
            initMembro(resposta.avaliado)
            initMembro(resposta.avaliador)
        }
    }

    // Preencher dados agregados e histórico
    for (const av of avaliacoes) {
        for (const resposta of av.respostas) {
            const receiverId = resposta.avaliado.id
            const writerId = resposta.avaliador.id

            // --- Processar RECEBEDOR (Entrega/Cultura) ---
            const receiverData = membroMap.get(receiverId)!
            const receiverHistMap = membroHistoricoMap.get(receiverId)!

            // Dados agregados
            receiverData.entregaNotas.push(resposta.notaEntrega)
            receiverData.culturaNotas.push(resposta.notaCultura)
            receiverData.count += 1

            // Histórico
            if (!receiverHistMap.has(av.nome)) {
                receiverHistMap.set(av.nome, { entregaSum: 0, culturaSum: 0, feedbackSum: 0, count: 0, feedbackCount: 0 })
            }
            const rStats = receiverHistMap.get(av.nome)!
            rStats.entregaSum += resposta.notaEntrega
            rStats.culturaSum += resposta.notaCultura
            rStats.count += 1

            // --- Processar ESCRITOR (Feedback) ---
            if (resposta.avaliacaoFeedback) {
                const writerData = membroMap.get(writerId)!
                const writerHistMap = membroHistoricoMap.get(writerId)!

                // Dados agregados
                writerData.feedbackSum += resposta.avaliacaoFeedback.notaFeedback
                writerData.feedbackCount += 1

                // Histórico
                if (!writerHistMap.has(av.nome)) {
                    writerHistMap.set(av.nome, { entregaSum: 0, culturaSum: 0, feedbackSum: 0, count: 0, feedbackCount: 0 })
                }
                const wStats = writerHistMap.get(av.nome)!
                wStats.feedbackSum += resposta.avaliacaoFeedback.notaFeedback
                wStats.feedbackCount += 1
            }
        }
    }

    // Agrupar por Área
    const areaMap = new Map<string, {
        membros: MembroRelatorio[],
        respostasPorAvaliacao: Map<string, {
            entregaSum: number,
            culturaSum: number,
            feedbackSum: number,
            count: number,
            feedbackCount: number,
            dataInicio: Date
        }>
    }>()

    let totalGlobalEntrega = 0
    let totalGlobalCultura = 0
    let totalGlobalFeedback = 0
    let countGlobalFeedback = 0
    let countGlobal = 0

    // Processar membros finais
    for (const [id, data] of membroMap.entries()) {
        const entregaSum = data.entregaNotas.reduce((a, b) => a + b, 0)
        const culturaSum = data.culturaNotas.reduce((a, b) => a + b, 0)

        // Construir histórico detalhado
        const histMap = membroHistoricoMap.get(id)!
        const historicoDetalhado: HistoricoMembroDetalhado[] = avaliacoes.map(av => {
            const h = histMap.get(av.nome)
            if (!h || h.count === 0) {
                return { avaliacao: av.nome, mediaEntrega: 0, mediaCultura: 0, mediaFeedback: 0 }
            }
            return {
                avaliacao: av.nome,
                mediaEntrega: h.entregaSum / h.count,
                mediaCultura: h.culturaSum / h.count,
                mediaFeedback: h.feedbackCount > 0 ? h.feedbackSum / h.feedbackCount : 0
            }
        })

        const membro: MembroRelatorio = {
            id,
            nome: data.nome,
            fotoUrl: data.fotoUrl,
            mediaEntrega: data.count > 0 ? entregaSum / data.count : null,
            mediaCultura: data.count > 0 ? culturaSum / data.count : null,
            mediaFeedback: data.feedbackCount > 0 ? data.feedbackSum / data.feedbackCount : null,
            desvioPadraoEntrega: calculateSD(data.entregaNotas),
            desvioPadraoCultura: calculateSD(data.culturaNotas),
            totalAvaliacoesRecebidas: data.count,
            historico: historicoDetalhado,
        }

        totalGlobalEntrega += entregaSum
        totalGlobalCultura += culturaSum
        totalGlobalFeedback += data.feedbackSum
        countGlobalFeedback += data.feedbackCount
        countGlobal += data.count

        if (!areaMap.has(data.area)) {
            areaMap.set(data.area, {
                membros: [],
                respostasPorAvaliacao: new Map()
            })
        }
        areaMap.get(data.area)!.membros.push(membro)
    }

    // Calcular evolução por área
    // Iteramos novamente sobre as avaliações para garantir filtro correto por área
    for (const av of avaliacoes) {
        for (const resposta of av.respostas) {
            const areaNome = resposta.avaliado.area.nome
            const areaData = areaMap.get(areaNome)

            if (areaData) {
                if (!areaData.respostasPorAvaliacao.has(av.nome)) {
                    areaData.respostasPorAvaliacao.set(av.nome, {
                        entregaSum: 0, culturaSum: 0, feedbackSum: 0, count: 0, feedbackCount: 0, dataInicio: av.dataInicio
                    })
                }
                const avData = areaData.respostasPorAvaliacao.get(av.nome)!
                avData.entregaSum += resposta.notaEntrega
                avData.culturaSum += resposta.notaCultura
                avData.count += 1
                if (resposta.avaliacaoFeedback) {
                    avData.feedbackSum += resposta.avaliacaoFeedback.notaFeedback
                    avData.feedbackCount += 1
                }
            }
        }
    }

    // Finalizar objetos de área
    const areas: AreaRelatorio[] = Array.from(areaMap.entries()).map(([nome, data]) => {
        const membros = data.membros
        const totalMembros = membros.length

        // Médias gerais da área
        const mediaEntrega = membros.reduce((acc, m) => acc + (m.mediaEntrega ?? 0), 0) / totalMembros
        const mediaCultura = membros.reduce((acc, m) => acc + (m.mediaCultura ?? 0), 0) / totalMembros
        const membrosComFeedback = membros.filter(m => m.mediaFeedback !== null)
        const mediaFeedback = membrosComFeedback.length > 0
            ? membrosComFeedback.reduce((acc, m) => acc + (m.mediaFeedback ?? 0), 0) / membrosComFeedback.length
            : 0

        // Ordenar membros por nota
        membros.sort((a, b) => {
            const avgA = ((a.mediaEntrega ?? 0) + (a.mediaCultura ?? 0)) / 2
            const avgB = ((b.mediaEntrega ?? 0) + (b.mediaCultura ?? 0)) / 2
            return avgB - avgA
        })

        // Construir array de evolução da área
        // Garantir que todas as avaliações do ciclo apareçam, mesmo se vazio para a área (opcional, mas bom pra gráfico consistente)
        const evolucaoArea: EvolucaoNotasCiclo[] = avaliacoes.map(av => {
            const d = data.respostasPorAvaliacao.get(av.nome)
            if (!d || d.count === 0) {
                return {
                    avaliacao: av.nome,
                    dataInicio: av.dataInicio,
                    mediaEntrega: 0,
                    mediaCultura: 0,
                    mediaFeedback: 0
                }
            }
            return {
                avaliacao: av.nome,
                dataInicio: d.dataInicio,
                mediaEntrega: d.entregaSum / d.count,
                mediaCultura: d.culturaSum / d.count,
                mediaFeedback: d.feedbackCount > 0 ? d.feedbackSum / d.feedbackCount : 0
            }
        })

        return {
            nome,
            mediaEntrega,
            mediaCultura,
            mediaFeedback,
            membros,
            evolucao: evolucaoArea
        }
    })

    // Ordenar áreas por ordem definida
    const AREA_ORDER: Record<string, number> = {
        "Coordenação Geral": 0,
        "Organização Interna": 1,
        "Academia de Preparação": 2,
        "Escola de Negócios": 3,
        "Fábrica de Consultores": 4,
    }
    areas.sort((a, b) => (AREA_ORDER[a.nome] ?? 99) - (AREA_ORDER[b.nome] ?? 99))

    return {
        cicloNome: ciclo.nome,
        totalAvaliacoes: avaliacoes.length,
        totalMembros: membroMap.size,
        mediaGeralEntrega: countGlobal > 0 ? totalGlobalEntrega / countGlobal : 0,
        mediaGeralCultura: countGlobal > 0 ? totalGlobalCultura / countGlobal : 0,
        mediaGeralFeedback: countGlobalFeedback > 0 ? totalGlobalFeedback / countGlobalFeedback : 0,
        evolucao: evolucaoGeral,
        areas,
    }
}
