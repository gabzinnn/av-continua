"use server"

import prisma from "@/src/lib/prisma"

export interface EvolucaoData {
    mes: string
    entrega: number
    cultura: number
    feedback: number
}

export interface PlanoAcaoHistorico {
    id: number
    descricao: string
    concluido: boolean
    dataRecebido: string
}

export interface HistoricoData {
    evolucaoDesempenho: EvolucaoData[]
    planosAcao: PlanoAcaoHistorico[]
}

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

export async function getHistoricoData(membroId: number): Promise<HistoricoData> {
    // 1. Buscar avaliações recebidas para o gráfico de evolução
    const avaliacoesRecebidas = await prisma.respostaAvaliacao.findMany({
        where: { avaliadoId: membroId },
        include: {
            avaliacao: true,
        },
        orderBy: { createdAt: "desc" }
    })

    // 2. Buscar feedbacks para a linha de feedbacks
    const feedbacksRecebidos = await prisma.avaliacaoFeedback.findMany({
        where: { avaliadoId: membroId },
        include: { respostaAvaliacao: { include: { avaliacao: true } } }
    })

    // 3. Estrutura para armazenar dados por mês
    interface DadosMes {
        somaEntrega: number
        countEntrega: number
        somaCultura: number
        countCultura: number
        somaFeedback: number
        countFeedback: number
    }

    const dadosPorMes = new Map<string, DadosMes>()

    const getOrCreateMes = (chave: string): DadosMes => {
        const existing = dadosPorMes.get(chave)
        if (existing) return existing
        const novo: DadosMes = {
            somaEntrega: 0, countEntrega: 0,
            somaCultura: 0, countCultura: 0,
            somaFeedback: 0, countFeedback: 0
        }
        dadosPorMes.set(chave, novo)
        return novo
    }

    // Agregar notas de entrega e cultura
    avaliacoesRecebidas.forEach(r => {
        const data = r.avaliacao.dataInicio
        const chave = `${data.getFullYear()}-${String(data.getMonth()).padStart(2, "0")}`
        const registro = getOrCreateMes(chave)
        registro.somaEntrega += r.notaEntrega
        registro.countEntrega += 1
        registro.somaCultura += r.notaCultura
        registro.countCultura += 1
    })

    // Agregar notas de feedback
    feedbacksRecebidos.forEach(f => {
        const data = f.respostaAvaliacao.avaliacao.dataInicio
        const chave = `${data.getFullYear()}-${String(data.getMonth()).padStart(2, "0")}`
        const registro = getOrCreateMes(chave)
        registro.somaFeedback += f.notaFeedback
        registro.countFeedback += 1
    })

    // Ordenar e converter para EvolucaoData (últimos 6 meses)
    const chavesOrdenadas = Array.from(dadosPorMes.keys()).sort().slice(-6)

    const evolucaoDesempenho: EvolucaoData[] = chavesOrdenadas.map(chave => {
        const [, mesIndex] = chave.split("-").map(Number)
        const registro = dadosPorMes.get(chave)!
        return {
            mes: MESES[mesIndex],
            entrega: registro.countEntrega > 0 ? registro.somaEntrega / registro.countEntrega : 0,
            cultura: registro.countCultura > 0 ? registro.somaCultura / registro.countCultura : 0,
            feedback: registro.countFeedback > 0 ? registro.somaFeedback / registro.countFeedback : 0,
        }
    })

    // 4. Buscar planos de ação onde o membro é responsável
    const planosAcaoDb = await prisma.planoAcao.findMany({
        where: { responsavelId: membroId },
        include: {
            respostaAvaliacao: true,
        },
        orderBy: { createdAt: "desc" }
    })

    const planosAcao: PlanoAcaoHistorico[] = planosAcaoDb.map(plano => ({
        id: plano.id,
        descricao: plano.descricao,
        concluido: plano.concluido,
        dataRecebido: plano.createdAt.toLocaleDateString("pt-BR"),
    }))

    return {
        evolucaoDesempenho,
        planosAcao,
    }
}

export async function togglePlanoAcao(
    planoId: number,
    concluido: boolean
): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.planoAcao.update({
            where: { id: planoId },
            data: { concluido },
        })
        return { success: true }
    } catch (error) {
        console.error("Erro ao atualizar plano de ação:", error)
        return { success: false, error: "Erro ao atualizar plano de ação" }
    }
}
