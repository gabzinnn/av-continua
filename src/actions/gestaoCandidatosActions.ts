"use server"

import prisma from "@/src/lib/prisma"

// ==========================================
// TYPES
// ==========================================

export type ProcessoSeletivoComStats = {
    id: number
    nome: string
    descricao: string | null
    ativo: boolean
    createdAt: Date
    updatedAt: Date
    _count: {
        provas: number
    }
    stats: {
        totalInscritos: number
        totalAprovados: number
        taxaConversao: number
    }
}

export type CandidatoResumido = {
    id: number
    nome: string
    email: string
    curso: string | null
    periodo: string | null
    dre: string
    notaDinamica: string | null
    resultados: {
        id: number
        status: string
        notaFinal: number | null
        finalizadoEm: Date | null
        prova: {
            id: number
            titulo: string
        }
    }[]
}

// ==========================================
// PROCESSO SELETIVO
// ==========================================

export async function getProcessosSeletivosComStats(): Promise<ProcessoSeletivoComStats[]> {
    const processos = await prisma.processoSeletivo.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            _count: {
                select: { provas: true }
            },
            provas: {
                include: {
                    resultados: {
                        include: {
                            candidato: true
                        }
                    }
                }
            }
        }
    })

    return processos.map(processo => {
        // Calcular estatísticas
        const todosResultados = processo.provas.flatMap(p => p.resultados)

        // Contar candidatos únicos (inscritos)
        const inscritosIds = new Set(todosResultados.map(r => r.candidato.id))
        const totalInscritos = inscritosIds.size

        // Contar candidatos únicos (aprovados) - considera aprovado se tiver pelo menos uma nota >= 6
        const aprovadosIds = new Set(todosResultados.filter(r =>
            r.status === "CORRIGIDA" && r.notaFinal !== null && Number(r.notaFinal) >= 6
        ).map(r => r.candidato.id))
        const totalAprovados = aprovadosIds.size

        const taxaConversao = totalInscritos > 0 ? Math.round((totalAprovados / totalInscritos) * 100) : 0



        return {
            id: processo.id,
            nome: processo.nome,
            descricao: processo.descricao,
            ativo: processo.ativo,
            createdAt: processo.createdAt,
            updatedAt: processo.updatedAt,
            _count: {
                provas: processo._count.provas
            },
            stats: {
                totalInscritos,
                totalAprovados,
                taxaConversao
            }
        }
    })
}

export async function getProcessoSeletivoDetalhes(id: number) {
    const processo = await prisma.processoSeletivo.findUnique({
        where: { id },
        include: {
            provas: {
                include: {
                    resultados: {
                        include: {
                            candidato: true,
                            respostas: true
                        }
                    },
                    questoes: true
                }
            }
        }
    })

    if (!processo) return null

    const todosResultados = processo.provas.flatMap(p => p.resultados)

    // Conjuntos de IDs únicos para métricas de PESSOAS
    const inscritosIds = new Set(todosResultados.map(r => r.candidato.id))
    const finalizadosIds = new Set(todosResultados.filter(r => r.finalizadoEm !== null).map(r => r.candidato.id))
    const corrigidosIds = new Set(todosResultados.filter(r => r.status === "CORRIGIDA").map(r => r.candidato.id))
    const aprovadosIds = new Set(todosResultados.filter(r =>
        r.status === "CORRIGIDA" && r.notaFinal !== null && Number(r.notaFinal) >= 6
    ).map(r => r.candidato.id))

    return {
        ...processo,
        stats: {
            totalInscritos: inscritosIds.size,
            totalFinalizados: finalizadosIds.size,
            totalCorrigidos: corrigidosIds.size,
            totalAprovados: aprovadosIds.size,
            taxaConversao: inscritosIds.size > 0 ? Math.round((aprovadosIds.size / inscritosIds.size) * 100) : 0
        }
    }
}

export async function getCandidatosPorProcesso(processoId: number): Promise<CandidatoResumido[]> {
    const processo = await prisma.processoSeletivo.findUnique({
        where: { id: processoId },
        include: {
            provas: {
                select: { id: true }
            }
        }
    })

    if (!processo) return []

    const provaIds = processo.provas.map(p => p.id)

    const candidatos = await prisma.candidato.findMany({
        where: {
            resultados: {
                some: {
                    provaId: { in: provaIds }
                }
            }
        },
        include: {
            resultados: {
                where: {
                    provaId: { in: provaIds }
                },
                include: {
                    prova: {
                        select: {
                            id: true,
                            titulo: true
                        }
                    }
                }
            }
        },
        orderBy: { nome: 'asc' }
    })

    return candidatos.map(c => ({
        id: c.id,
        nome: c.nome,
        email: c.email,
        curso: c.curso,
        periodo: c.periodo,
        dre: c.dre,
        notaDinamica: c.notaDinamica,
        resultados: c.resultados.map(r => ({
            id: r.id,
            status: r.status,
            notaFinal: r.notaFinal ? Number(r.notaFinal) : null,
            finalizadoEm: r.finalizadoEm,
            prova: r.prova
        }))
    }))
}
