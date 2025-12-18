"use server"

import prisma from '../lib/prisma'

interface EvolucaoData {
    mes: string
    entrega: number
    cultura: number
    feedback: number
}

interface Atividade {
    tipo: string
    data: string
    status: "concluido" | "pendente"
}

interface HomeData {
    mediaEntrega: number
    variacaoEntrega: number
    mediaAlinhamento: number
    variacaoAlinhamento: number
    avaliacaoPendente: boolean
    evolucaoDesempenho: EvolucaoData[]
    atividadesRecentes: Atividade[]
}

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

function formatarData(data: Date): string {
    const dia = data.getDate().toString().padStart(2, '0')
    const mes = MESES[data.getMonth()]
    const ano = data.getFullYear()
    return `${dia} ${mes}, ${ano}`
}

export async function getHomeData(membroId: number): Promise<HomeData> {
    // 1. Buscar todas as avaliações recebidas pelo membro
    const avaliacoesRecebidas = await prisma.respostaAvaliacao.findMany({
        where: { avaliadoId: membroId },
        include: {
            avaliacao: true,
        },
        orderBy: { createdAt: 'desc' }
    })

    // 2. Calcular médias de entrega e cultura
    let mediaEntrega = 0
    let mediaAlinhamento = 0
    let variacaoEntrega = 0
    let variacaoAlinhamento = 0

    if (avaliacoesRecebidas.length > 0) {
        const somaEntrega = avaliacoesRecebidas.reduce((acc, r) => acc + r.notaEntrega, 0)
        const somaCultura = avaliacoesRecebidas.reduce((acc, r) => acc + r.notaCultura, 0)
        mediaEntrega = somaEntrega / avaliacoesRecebidas.length
        mediaAlinhamento = somaCultura / avaliacoesRecebidas.length

        // 3. Calcular variação comparando com ciclo anterior
        // Agrupar por avaliação para comparar ciclos
        const avaliacoesPorCiclo = new Map<number, typeof avaliacoesRecebidas>()
        avaliacoesRecebidas.forEach(r => {
            const ciclo = avaliacoesPorCiclo.get(r.avaliacaoId) || []
            ciclo.push(r)
            avaliacoesPorCiclo.set(r.avaliacaoId, ciclo)
        })

        const ciclosIds = Array.from(avaliacoesPorCiclo.keys()).sort((a, b) => b - a)

        if (ciclosIds.length >= 2) {
            const cicloAtual = avaliacoesPorCiclo.get(ciclosIds[0])!
            const cicloAnterior = avaliacoesPorCiclo.get(ciclosIds[1])!

            const mediaEntregaAtual = cicloAtual.reduce((a, r) => a + r.notaEntrega, 0) / cicloAtual.length
            const mediaEntregaAnterior = cicloAnterior.reduce((a, r) => a + r.notaEntrega, 0) / cicloAnterior.length
            variacaoEntrega = mediaEntregaAnterior > 0
                ? ((mediaEntregaAtual - mediaEntregaAnterior) / mediaEntregaAnterior) * 100
                : 0

            const mediaCulturaAtual = cicloAtual.reduce((a, r) => a + r.notaCultura, 0) / cicloAtual.length
            const mediaCulturaAnterior = cicloAnterior.reduce((a, r) => a + r.notaCultura, 0) / cicloAnterior.length
            variacaoAlinhamento = mediaCulturaAnterior > 0
                ? ((mediaCulturaAtual - mediaCulturaAnterior) / mediaCulturaAnterior) * 100
                : 0
        }
    }

    // 4. Verificar se há avaliação pendente
    const participacaoPendente = await prisma.participacaoAvaliacao.findFirst({
        where: {
            membroId,
            respondeuAvaliacao: false,
            avaliacao: {
                finalizada: false,
            }
        }
    })
    const avaliacaoPendente = participacaoPendente !== null

    // 5. Evolução de desempenho - agrupar por mês com 3 séries
    // Buscar também os feedbacks recebidos
    const feedbacksRecebidos = await prisma.avaliacaoFeedback.findMany({
        where: { avaliadoId: membroId },
        include: { respostaAvaliacao: { include: { avaliacao: true } } }
    })

    // Estrutura para armazenar dados por mês
    interface DadosMes {
        somaEntrega: number
        countEntrega: number
        somaCultura: number
        countCultura: number
        somaFeedback: number
        countFeedback: number
    }

    const dadosPorMes = new Map<string, DadosMes>()

    // Função auxiliar para obter ou criar registro do mês
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
        const chave = `${data.getFullYear()}-${String(data.getMonth()).padStart(2, '0')}`
        const registro = getOrCreateMes(chave)
        registro.somaEntrega += r.notaEntrega
        registro.countEntrega += 1
        registro.somaCultura += r.notaCultura
        registro.countCultura += 1
    })

    // Agregar notas de feedback
    feedbacksRecebidos.forEach(f => {
        const data = f.respostaAvaliacao.avaliacao.dataInicio
        const chave = `${data.getFullYear()}-${String(data.getMonth()).padStart(2, '0')}`
        const registro = getOrCreateMes(chave)
        registro.somaFeedback += f.notaFeedback
        registro.countFeedback += 1
    })

    // Ordenar e converter para EvolucaoData (últimos 6 meses)
    const chavesOrdenadas = Array.from(dadosPorMes.keys()).sort().slice(-6)

    const evolucaoDesempenho: EvolucaoData[] = chavesOrdenadas.map(chave => {
        const [, mesIndex] = chave.split('-').map(Number)
        const registro = dadosPorMes.get(chave)!
        return {
            mes: MESES[mesIndex],
            entrega: registro.countEntrega > 0 ? registro.somaEntrega / registro.countEntrega : 0,
            cultura: registro.countCultura > 0 ? registro.somaCultura / registro.countCultura : 0,
            feedback: registro.countFeedback > 0 ? registro.somaFeedback / registro.countFeedback : 0,
        }
    })

    // 6. Atividades recentes - combinar avaliações feitas e recebidas
    const atividadesRecentes: Atividade[] = []

    // Avaliações que o membro realizou
    const avaliacoesFeitas = await prisma.respostaAvaliacao.findMany({
        where: { avaliadorId: membroId },
        include: { avaliacao: true },
        orderBy: { createdAt: 'desc' },
        take: 5
    })

    avaliacoesFeitas.forEach(r => {
        atividadesRecentes.push({
            tipo: `Avaliação: ${r.avaliacao.nome}`,
            data: formatarData(r.createdAt),
            status: 'concluido'
        })
    })

    // Feedbacks dados
    const feedbacksDados = await prisma.avaliacaoFeedback.findMany({
        where: { avaliadoId: membroId },
        orderBy: { createdAt: 'desc' },
        take: 3
    })

    feedbacksDados.forEach(f => {
        atividadesRecentes.push({
            tipo: 'Feedback Recebido',
            data: formatarData(f.createdAt),
            status: 'concluido'
        })
    })

    // Ordenar por data (mais recente primeiro) e limitar a 5
    atividadesRecentes.sort((a, b) => {
        // Comparar datas no formato "DD Mon, YYYY"
        return b.data.localeCompare(a.data)
    })

    // Se não houver dados, retorna fallback
    if (evolucaoDesempenho.length === 0) {
        // Sem dados ainda - retorna valores zerados
        return {
            mediaEntrega: 0,
            variacaoEntrega: 0,
            mediaAlinhamento: 0,
            variacaoAlinhamento: 0,
            avaliacaoPendente,
            evolucaoDesempenho: [],
            atividadesRecentes: atividadesRecentes.slice(0, 5)
        }
    }

    return {
        mediaEntrega: Number(mediaEntrega.toFixed(1)),
        variacaoEntrega: Number(variacaoEntrega.toFixed(1)),
        mediaAlinhamento: Number(mediaAlinhamento.toFixed(1)),
        variacaoAlinhamento: Number(variacaoAlinhamento.toFixed(1)),
        avaliacaoPendente,
        evolucaoDesempenho,
        atividadesRecentes: atividadesRecentes.slice(0, 5)
    }
}
