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

// ==========================================
// CANDIDATOS DETALHADOS (GESTÃO POR PS)
// ==========================================

import type {
    StatusEtapa,
    StatusCandidato,
    EscalaNotasLabel,
    CandidatoDetalhado
} from "@/src/types/candidatos"
import { cursosUFRJ } from "../utils/cursosUFRJ"

export type { StatusEtapa, StatusCandidato, EscalaNotasLabel, CandidatoDetalhado }

// Mapa local para uso interno (não pode ser exportado de "use server")
const ESCALA_NOTAS_MAP: Record<string, EscalaNotasLabel> = {
    "A": { valor: "A", label: "Aprovado", cor: "green" },
    "P_MAIS": { valor: "P+", label: "Passar+", cor: "green" },
    "P_ALTO": { valor: "P↑", label: "Passar Alto", cor: "green" },
    "P": { valor: "P", label: "Passar", cor: "yellow" },
    "P_BAIXO": { valor: "P↓", label: "Passar Baixo", cor: "yellow" },
    "P_MENOS": { valor: "P-", label: "Passar-", cor: "yellow" },
    "R": { valor: "R", label: "Reprovado", cor: "red" }
}

function getEscalaNotasLabel(valor: string | null): EscalaNotasLabel | null {
    if (!valor) return null
    return ESCALA_NOTAS_MAP[valor] || null
}

function calcularStatusProva(notaFinal: number | null, status: string | null): StatusEtapa {
    if (!status || status === "PENDENTE") return "AGUARDANDO"
    if (status === "CORRIGIDA" && notaFinal !== null) {
        return notaFinal >= 6 ? "APROVADO" : "REPROVADO"
    }
    return "PENDENTE"
}

function calcularStatusEscala(nota: string | null, etapaAnteriorAprovada: boolean): StatusEtapa {
    if (!etapaAnteriorAprovada) return "BLOQUEADO"
    if (!nota) return "PENDENTE"
    const label = ESCALA_NOTAS_MAP[nota]
    if (label?.cor === "red") return "REPROVADO"
    return "APROVADO"
}

function calcularStatusCapacitacao(
    notaArtigo: number | null,
    apresArtigo: number | null,
    notaCase: string | null,
    entrevistaAprovada: boolean
): { status: StatusEtapa; progresso: number } {
    if (!entrevistaAprovada) return { status: "BLOQUEADO", progresso: 0 }

    let completados = 0
    if (notaArtigo !== null) completados++
    if (apresArtigo !== null) completados++
    if (notaCase !== null) completados++

    const progresso = Math.round((completados / 3) * 100)

    if (completados === 0) return { status: "PENDENTE", progresso: 0 }
    if (completados < 3) return { status: "EM_ANDAMENTO", progresso }

    // Verificar se foi reprovado no case
    if (notaCase && ESCALA_NOTAS_MAP[notaCase]?.cor === "red") {
        return { status: "REPROVADO", progresso: 100 }
    }

    return { status: "APROVADO", progresso: 100 }
}

function calcularStatusGeral(candidato: {
    provaStatus: StatusEtapa
    dinamicaStatus: StatusEtapa
    entrevistaStatus: StatusEtapa
    capacitacaoStatus: StatusEtapa
}): StatusCandidato {
    if (candidato.provaStatus === "REPROVADO" ||
        candidato.dinamicaStatus === "REPROVADO" ||
        candidato.entrevistaStatus === "REPROVADO" ||
        candidato.capacitacaoStatus === "REPROVADO") {
        return "REPROVADO"
    }

    if (candidato.capacitacaoStatus === "APROVADO") {
        return "APROVADO"
    }

    return "ATIVO"
}

function calcularEtapaAtual(candidato: {
    provaStatus: StatusEtapa
    dinamicaStatus: StatusEtapa
    entrevistaStatus: StatusEtapa
    capacitacaoStatus: StatusEtapa
}): number {
    if (candidato.capacitacaoStatus !== "BLOQUEADO") return 4
    if (candidato.entrevistaStatus !== "BLOQUEADO") return 3
    if (candidato.dinamicaStatus !== "BLOQUEADO") return 2
    return 1
}

export async function getCandidatosDetalhados(processoId: number): Promise<CandidatoDetalhado[]> {
    const processo = await prisma.processoSeletivo.findUnique({
        where: { id: processoId },
        include: {
            provas: {
                select: { id: true, titulo: true }
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

    return candidatos.map(c => {
        // Pegar o primeiro resultado de prova (assumindo uma prova por PS)
        const resultado = c.resultados[0]

        // Calcular status da prova
        const provaStatus = calcularStatusProva(
            resultado?.notaFinal ? Number(resultado.notaFinal) : null,
            resultado?.status || null
        )
        const provaAprovada = provaStatus === "APROVADO"

        // Calcular status da dinâmica
        const dinamicaStatus = calcularStatusEscala(c.notaDinamica, provaAprovada)
        const dinamicaAprovada = dinamicaStatus === "APROVADO"

        // Calcular status da entrevista
        const entrevistaStatus = calcularStatusEscala(
            c.notaEntrevista,
            provaAprovada && dinamicaAprovada
        )
        const entrevistaAprovada = entrevistaStatus === "APROVADO"

        // Calcular status da capacitação
        const capacitacaoResult = calcularStatusCapacitacao(
            c.notaArtigo ? Number(c.notaArtigo) : null,
            c.apresArtigo ? Number(c.apresArtigo) : null,
            c.notaCase,
            entrevistaAprovada
        )

        const statusGeral = calcularStatusGeral({
            provaStatus,
            dinamicaStatus,
            entrevistaStatus,
            capacitacaoStatus: capacitacaoResult.status
        })

        const etapaAtual = calcularEtapaAtual({
            provaStatus,
            dinamicaStatus,
            entrevistaStatus,
            capacitacaoStatus: capacitacaoResult.status
        })
        
        const curso = cursosUFRJ.find(curso => curso.value === c.curso)?.label

        return {
            id: c.id,
            nome: c.nome,
            email: c.email,
            curso: curso || c.curso,
            periodo: c.periodo,
            dre: c.dre,
            createdAt: c.createdAt,
            prova: {
                status: provaStatus,
                notaFinal: resultado?.notaFinal ? Number(resultado.notaFinal) : null,
                provaId: resultado?.prova.id || null,
                provaTitulo: resultado?.prova.titulo || null
            },
            dinamica: {
                status: dinamicaStatus,
                nota: c.notaDinamica,
                notaLabel: getEscalaNotasLabel(c.notaDinamica)
            },
            entrevista: {
                status: entrevistaStatus,
                nota: c.notaEntrevista,
                notaLabel: getEscalaNotasLabel(c.notaEntrevista)
            },
            capacitacao: {
                status: capacitacaoResult.status,
                progresso: capacitacaoResult.progresso,
                notaArtigo: c.notaArtigo ? Number(c.notaArtigo) : null,
                apresArtigo: c.apresArtigo ? Number(c.apresArtigo) : null,
                notaCase: c.notaCase,
                notaCaseLabel: getEscalaNotasLabel(c.notaCase)
            },
            statusGeral,
            etapaAtual
        }
    })
}

export async function atualizarNotaCandidato(
    candidatoId: number,
    campo: "notaDinamica" | "notaEntrevista" | "notaArtigo" | "apresArtigo" | "notaCase",
    valor: string | number | null
): Promise<{ success: boolean; error?: string }> {
    try {
        const updateData: Record<string, unknown> = {}

        if (campo === "notaArtigo" || campo === "apresArtigo") {
            updateData[campo] = valor !== null ? Number(valor) : null
        } else {
            updateData[campo] = valor
        }

        await prisma.candidato.update({
            where: { id: candidatoId },
            data: updateData
        })

        return { success: true }
    } catch {
        return { success: false, error: "Erro ao atualizar nota do candidato" }
    }
}

export async function getProcessoSeletivoInfo(id: number): Promise<{
    id: number
    nome: string
    ativo: boolean
} | null> {
    const processo = await prisma.processoSeletivo.findUnique({
        where: { id },
        select: {
            id: true,
            nome: true,
            ativo: true
        }
    })
    return processo
}
