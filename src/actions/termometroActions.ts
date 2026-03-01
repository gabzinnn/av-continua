"use server"

import prisma from "@/src/lib/prisma"

// ==========================================
// MEMBER-SIDE: RESPONDER TERMÔMETRO
// ==========================================

export interface TermometroParaResponder {
    id: number
    nome: string
    dataFinal: Date
    perguntas: { id: number; texto: string }[]
    respostasExistentes: number[]
    totalRespondidas: number
}

export async function getTermometroAtivoParaMembro(membroId: number): Promise<TermometroParaResponder | null> {
    const termometro = await prisma.termometro.findFirst({
        where: { ativo: true },
        include: {
            perguntas: { orderBy: { id: 'asc' } },
            respostas: { where: { idMembro: membroId } }
        }
    })

    if (!termometro) return null

    return {
        id: termometro.id,
        nome: termometro.nome,
        dataFinal: termometro.dataFinal,
        perguntas: termometro.perguntas.map(p => ({ id: p.id, texto: p.texto })),
        respostasExistentes: termometro.respostas.map(r => r.nota),
        totalRespondidas: termometro.respostas.length,
    }
}

export interface SubmitRespostaInput {
    membroId: number
    termometroId: number
    notas: number[]
}

export async function enviarRespostasTermometro(input: SubmitRespostaInput): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.respostaTermometro.deleteMany({
            where: { idMembro: input.membroId, idTermometro: input.termometroId }
        })

        await prisma.respostaTermometro.createMany({
            data: input.notas.map(nota => ({
                idMembro: input.membroId,
                idTermometro: input.termometroId,
                nota
            }))
        })

        return { success: true }
    } catch (error) {
        console.error("Erro ao enviar respostas:", error)
        return { success: false, error: "Erro ao enviar respostas" }
    }
}

// ==========================================
// COORD-SIDE: PÁGINA PRINCIPAL
// ==========================================

export interface TermometroResumo {
    id: number
    nome: string
    dataInicial: Date
    dataFinal: Date
    ativo: boolean
    totalRespostas: number
    totalMembros: number
    mediaNotas: number
}

export interface ChartDataPoint {
    mes: string
    media: number
}

export interface TermometroPageData {
    termometroAtivo: TermometroResumo | null
    historico: TermometroResumo[]
    chartData: ChartDataPoint[]
}

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

export async function getTermometroPageData(): Promise<TermometroPageData> {
    const totalMembros = await prisma.membro.count({ where: { isAtivo: true } })

    // Buscar todos os termometros
    const termometros = await prisma.termometro.findMany({
        include: {
            respostas: true,
            perguntas: true,
        },
        orderBy: { createdAt: "desc" },
    })

    const mapTermometro = (t: typeof termometros[0]): TermometroResumo => {
        const respostas = t.respostas
        const totalRespostas = new Set(respostas.map(r => r.idMembro)).size
        const mediaNotas = respostas.length > 0
            ? respostas.reduce((sum, r) => sum + r.nota, 0) / respostas.length
            : 0

        return {
            id: t.id,
            nome: t.nome,
            dataInicial: t.dataInicial,
            dataFinal: t.dataFinal,
            ativo: t.ativo,
            totalRespostas,
            totalMembros,
            mediaNotas: Math.round(mediaNotas * 10) / 10,
        }
    }

    const termometroAtivo = termometros.find(t => t.ativo)
    const historico = termometros.filter(t => !t.ativo)

    // Calcular médias quinzenais para o gráfico (últimas 8 quinzenas = 4 meses)
    const chartData = calcularMediasQuinzenais(termometros)

    return {
        termometroAtivo: termometroAtivo ? mapTermometro(termometroAtivo) : null,
        historico: historico.map(mapTermometro),
        chartData,
    }
}

type TermometroComRelacoes = Awaited<ReturnType<typeof getTermometrosComRelacoes>>[0]

async function getTermometrosComRelacoes() {
    return prisma.termometro.findMany({
        include: {
            respostas: true,
            perguntas: true,
        },
        orderBy: { createdAt: "desc" },
    })
}

function calcularMediasQuinzenais(termometros: TermometroComRelacoes[]): ChartDataPoint[] {
    const hoje = new Date()
    const resultado: ChartDataPoint[] = []

    // Últimas 8 quinzenas (aproximadamente 4 meses)
    for (let i = 7; i >= 0; i--) {
        // Cada quinzena = 14 dias
        const dataFimQuinzena = new Date(hoje.getTime() - i * 14 * 24 * 60 * 60 * 1000)
        const dataInicioQuinzena = new Date(dataFimQuinzena.getTime() - 14 * 24 * 60 * 60 * 1000)

        // Filtrar termômetros que terminaram nesta quinzena
        const termometrosDoIntervalo = termometros.filter(t => {
            const dataFinal = new Date(t.dataFinal)
            return dataFinal >= dataInicioQuinzena && dataFinal < dataFimQuinzena && !t.ativo
        })

        // Calcular média das notas de todos os termômetros da quinzena
        let somaNotas = 0
        let totalNotas = 0

        termometrosDoIntervalo.forEach(t => {
            t.respostas.forEach(r => {
                somaNotas += r.nota
                totalNotas++
            })
        })

        const media = totalNotas > 0 ? somaNotas / totalNotas : 0

        // Formato do label: "1ª Dez" ou "2ª Dez"
        const mes = dataFimQuinzena.getMonth()
        const dia = dataFimQuinzena.getDate()
        const quinzena = dia <= 15 ? "1ª" : "2ª"

        resultado.push({
            mes: `${quinzena} ${MESES[mes]}`,
            media: Math.round(media * 10) / 10,
        })
    }

    return resultado
}

export async function encerrarTermometro(id: number): Promise<void> {
    await prisma.termometro.update({
        where: { id },
        data: { ativo: false },
    })
}

export interface CreateTermometroInput {
    nome: string
    perguntas: string[]
    duracaoDias: number
    idCiclo?: number | null
}

export async function criarTermometro(input: CreateTermometroInput): Promise<{ success: boolean; error?: string }> {
    try {
        const hoje = new Date()
        const dataFinal = new Date(hoje.getTime() + input.duracaoDias * 24 * 60 * 60 * 1000)

        await prisma.termometro.create({
            data: {
                nome: input.nome,
                dataInicial: hoje,
                dataFinal: dataFinal,
                ativo: true,
                idCiclo: input.idCiclo ?? null,
                perguntas: {
                    create: input.perguntas.map((texto) => ({ texto })),
                },
            },
        })

        return { success: true }
    } catch (error) {
        console.error("Erro ao criar termômetro:", error)
        return { success: false, error: "Erro ao criar termômetro" }
    }
}

// ==========================================
// DETALHES DO TERMÔMETRO
// ==========================================

export interface RespostaMembro {
    membroId: number
    membroNome: string
    membroFoto: string | null
    membroArea: string
    notas: number[]
    total: number
    media: number
}

export interface TermometroDetalhes {
    id: number
    nome: string
    dataInicial: Date
    dataFinal: Date
    ativo: boolean
    ciclo: { id: number; nome: string } | null
    perguntas: { id: number; texto: string }[]
    respostasPorMembro: RespostaMembro[]
    mediaPorPergunta: number[]
    mediaGeral: number
    totalRespostas: number
    melhorDemanda: { nome: string; media: number } | null
    piorDemanda: { nome: string; media: number } | null
    demandasComDesempenho: { id: number; nome: string; membros: RespostaMembro[]; media: number }[]
}

export async function getTermometroDetalhes(id: number): Promise<TermometroDetalhes | null> {
    const termometro = await prisma.termometro.findUnique({
        where: { id },
        include: {
            ciclo: true,
            perguntas: { orderBy: { id: 'asc' } },
            respostas: {
                include: {
                    membro: {
                        include: {
                            area: true,
                            alocacoes: {
                                include: {
                                    demanda: true
                                }
                            }
                        }
                    }
                }
            }
        }
    })

    if (!termometro) return null

    const perguntas = termometro.perguntas.map(p => ({ id: p.id, texto: p.texto }))
    const numPerguntas = perguntas.length

    // Agrupar respostas por membro
    const respostasPorMembroMap = new Map<number, { membro: typeof termometro.respostas[0]['membro'], notas: number[] }>()

    termometro.respostas.forEach(r => {
        if (!respostasPorMembroMap.has(r.idMembro)) {
            respostasPorMembroMap.set(r.idMembro, { membro: r.membro, notas: [] })
        }
        respostasPorMembroMap.get(r.idMembro)!.notas.push(r.nota)
    })

    const respostasPorMembro: RespostaMembro[] = Array.from(respostasPorMembroMap.values()).map(({ membro, notas }) => {
        const total = notas.reduce((a, b) => a + b, 0)
        const media = notas.length > 0 ? total / notas.length : 0
        return {
            membroId: membro.id,
            membroNome: membro.nome,
            membroFoto: membro.fotoUrl,
            membroArea: membro.area.nome,
            notas,
            total,
            media: Math.round(media * 10) / 10,
        }
    }).sort((a, b) => b.media - a.media)

    // Calcular média por pergunta
    const mediaPorPergunta: number[] = []
    for (let i = 0; i < numPerguntas; i++) {
        const notasDaPergunta = respostasPorMembro.map(r => r.notas[i] || 0).filter(n => n > 0)
        const mediaPergunta = notasDaPergunta.length > 0
            ? notasDaPergunta.reduce((a, b) => a + b, 0) / notasDaPergunta.length
            : 0
        mediaPorPergunta.push(Math.round(mediaPergunta * 10) / 10)
    }

    // Calcular média geral
    const todasNotas = termometro.respostas.map(r => r.nota)
    const mediaGeral = todasNotas.length > 0
        ? todasNotas.reduce((a, b) => a + b, 0) / todasNotas.length
        : 0

    // Calcular desempenho por demanda
    const demandasMap = new Map<number, { id: number; nome: string; membrosIds: Set<number> }>()

    termometro.respostas.forEach(r => {
        r.membro.alocacoes.forEach(alocacao => {
            if (!demandasMap.has(alocacao.demandaId)) {
                demandasMap.set(alocacao.demandaId, {
                    id: alocacao.demandaId,
                    nome: alocacao.demanda.nome,
                    membrosIds: new Set()
                })
            }
            demandasMap.get(alocacao.demandaId)!.membrosIds.add(r.idMembro)
        })
    })

    const demandasComDesempenho = Array.from(demandasMap.values()).map(demanda => {
        const membros = respostasPorMembro.filter(r => demanda.membrosIds.has(r.membroId))
        const mediasDemanda = membros.map(m => m.media)
        const media = mediasDemanda.length > 0
            ? mediasDemanda.reduce((a, b) => a + b, 0) / mediasDemanda.length
            : 0
        return {
            id: demanda.id,
            nome: demanda.nome,
            membros,
            media: Math.round(media * 10) / 10,
        }
    }).sort((a, b) => b.media - a.media)

    return {
        id: termometro.id,
        nome: termometro.nome,
        dataInicial: termometro.dataInicial,
        dataFinal: termometro.dataFinal,
        ativo: termometro.ativo,
        ciclo: termometro.ciclo ? { id: termometro.ciclo.id, nome: termometro.ciclo.nome } : null,
        perguntas,
        respostasPorMembro,
        mediaPorPergunta,
        mediaGeral: Math.round(mediaGeral * 10) / 10,
        totalRespostas: respostasPorMembro.length,
        melhorDemanda: demandasComDesempenho[0] || null,
        piorDemanda: demandasComDesempenho[demandasComDesempenho.length - 1] || null,
        demandasComDesempenho,
    }
}

export interface EditTermometroInput {
    id: number
    nome: string
    perguntas: { id?: number; texto: string }[]
    idCiclo?: number | null
}

export async function editarTermometro(input: EditTermometroInput): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.termometro.update({
            where: { id: input.id },
            data: {
                nome: input.nome,
                idCiclo: input.idCiclo ?? null
            }
        })

        await prisma.perguntaTermometro.deleteMany({ where: { termometroId: input.id } })
        await prisma.perguntaTermometro.createMany({
            data: input.perguntas.map(p => ({ termometroId: input.id, texto: p.texto }))
        })

        return { success: true }
    } catch (error) {
        console.error("Erro ao editar termômetro:", error)
        return { success: false, error: "Erro ao editar termômetro" }
    }
}

export async function exportarRespostas(termometroId: number): Promise<{ headers: string[]; rows: string[][] }> {
    const detalhes = await getTermometroDetalhes(termometroId)
    if (!detalhes) return { headers: [], rows: [] }

    const headers = ['Membro', 'Área', ...detalhes.perguntas.map((_, i) => `Q${i + 1}`), 'Total', 'Média']
    const rows = detalhes.respostasPorMembro.map(r => [
        r.membroNome,
        r.membroArea,
        ...r.notas.map(n => n.toString()),
        r.total.toString(),
        r.media.toString()
    ])

    return { headers, rows }
}

// ==========================================
// MEMBER-SIDE: HISTÓRICO DE TERMÔMETROS
// ==========================================

export interface TermometroHistoricoEntry {
    id: number
    nome: string
    dataInicial: Date
    dataFinal: Date
    perguntas: string[]
    minhasNotas: number[]
    minhaMedia: number
    mediaGeral: number
}

export interface TermometroHistoricoData {
    termometros: TermometroHistoricoEntry[]
    evolucao: { nome: string; minhaMedia: number }[]
}

export async function getHistoricoTermometro(membroId: number): Promise<TermometroHistoricoData> {
    // Buscar todos os termômetros onde o membro respondeu
    const termometros = await prisma.termometro.findMany({
        where: {
            ativo: false,
            respostas: { some: { idMembro: membroId } }
        },
        include: {
            perguntas: { orderBy: { id: "asc" } },
            respostas: true,
        },
        orderBy: { dataFinal: "asc" },
    })

    const entries: TermometroHistoricoEntry[] = termometros.map(t => {
        const minhasRespostas = t.respostas.filter(r => r.idMembro === membroId)
        const minhaMedia = minhasRespostas.length > 0
            ? minhasRespostas.reduce((sum, r) => sum + r.nota, 0) / minhasRespostas.length
            : 0

        const mediaGeral = t.respostas.length > 0
            ? t.respostas.reduce((sum, r) => sum + r.nota, 0) / t.respostas.length
            : 0

        return {
            id: t.id,
            nome: t.nome,
            dataInicial: t.dataInicial,
            dataFinal: t.dataFinal,
            perguntas: t.perguntas.map(p => p.texto),
            minhasNotas: minhasRespostas.map(r => r.nota),
            minhaMedia: Math.round(minhaMedia * 10) / 10,
            mediaGeral: Math.round(mediaGeral * 10) / 10,
        }
    })

    const evolucao = entries.map(e => ({
        nome: e.nome,
        minhaMedia: e.minhaMedia,
    }))

    return { termometros: entries, evolucao }
}
