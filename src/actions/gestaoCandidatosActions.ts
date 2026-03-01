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

        // Contar candidatos únicos (aprovados) - considera aprovado APENAS quem passou na Capacitação (etapa final)
        const aprovadosIds = new Set(todosResultados.filter(r =>
            r.candidato.aprovadoCapacitacao === true
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
        r.candidato.aprovadoCapacitacao === true
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

function calcularStatusProva(aprovadoProva: boolean | null, status: string | null): StatusEtapa {
    if (!status || status === "PENDENTE") return "AGUARDANDO"
    if (status === "CORRIGIDA") {
        if (aprovadoProva === true) return "APROVADO"
        if (aprovadoProva === false) return "REPROVADO"
        return "PENDENTE" // Corrigido mas sem decisão de aprovação ainda
    }
    return "PENDENTE"
}

function calcularStatusEscala(nota: string | null, etapaAnteriorAprovada: boolean, aprovadoManual: boolean | null): StatusEtapa {
    if (!etapaAnteriorAprovada) return "BLOQUEADO"

    // Prioridade total para a decisão manual
    if (aprovadoManual === true) return "APROVADO"
    if (aprovadoManual === false) return "REPROVADO"

    // Se tem nota mas não tem decisão, está em andamento (aguardando decisão)
    if (nota) return "EM_ANDAMENTO"

    return "PENDENTE"
}

function calcularStatusCapacitacao(
    notaArtigo: number | null,
    apresArtigo: number | null,
    notaCase: string | null,
    entrevistaAprovada: boolean,
    aprovadoManual: boolean | null
): { status: StatusEtapa; progresso: number } {
    if (!entrevistaAprovada) return { status: "BLOQUEADO", progresso: 0 }

    // Prioridade total para a decisão manual
    if (aprovadoManual === true) return { status: "APROVADO", progresso: 100 }
    if (aprovadoManual === false) return { status: "REPROVADO", progresso: 100 }

    let completados = 0
    if (notaArtigo !== null) completados++
    if (apresArtigo !== null) completados++
    if (notaCase !== null) completados++

    const progresso = Math.round((completados / 3) * 100)

    if (completados > 0) return { status: "EM_ANDAMENTO", progresso }

    return { status: "PENDENTE", progresso: 0 }
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
                    provaId: { in: provaIds },
                    aprovadoProva: true // Filtrar apenas candidatos aprovados na prova
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
            resultado?.aprovadoProva ?? null,
            resultado?.status || null
        )
        const provaAprovada = provaStatus === "APROVADO"

        // Calcular status da dinâmica
        const dinamicaStatus = calcularStatusEscala(
            c.notaDinamica,
            provaAprovada,
            c.aprovadoDinamica
        )
        const dinamicaAprovada = dinamicaStatus === "APROVADO"

        // Calcular status da entrevista
        const entrevistaStatus = calcularStatusEscala(
            c.notaEntrevista,
            provaAprovada && dinamicaAprovada,
            c.aprovadoEntrevista
        )
        const entrevistaAprovada = entrevistaStatus === "APROVADO"

        // Calcular status da capacitação
        const capacitacaoResult = calcularStatusCapacitacao(
            c.notaArtigo !== null ? Number(c.notaArtigo) : null,
            c.apresArtigo !== null ? Number(c.apresArtigo) : null,
            c.notaCase,
            entrevistaAprovada,
            c.aprovadoCapacitacao
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
            observacao: c.observacao,
            prova: {
                status: provaStatus,
                notaFinal: resultado?.notaFinal ? Number(resultado.notaFinal) : null,
                provaId: resultado?.prova.id || null,
                provaTitulo: resultado?.prova.titulo || null
            },
            dinamica: {
                status: dinamicaStatus,
                nota: c.notaDinamica,
                notaLabel: getEscalaNotasLabel(c.notaDinamica),
                aprovado: c.aprovadoDinamica
            },
            entrevista: {
                status: entrevistaStatus,
                nota: c.notaEntrevista,
                notaLabel: getEscalaNotasLabel(c.notaEntrevista),
                aprovado: c.aprovadoEntrevista
            },
            capacitacao: {
                status: capacitacaoResult.status,
                progresso: capacitacaoResult.progresso,
                notaArtigo: c.notaArtigo !== null ? Number(c.notaArtigo) : null,
                apresArtigo: c.apresArtigo !== null ? Number(c.apresArtigo) : null,
                notaCase: c.notaCase,
                notaCaseLabel: getEscalaNotasLabel(c.notaCase),
                aprovado: c.aprovadoCapacitacao
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

// ==========================================
// AÇÕES DE GESTÃO DE CANDIDATOS
// ==========================================

/**
 * Reprova um candidato na etapa atual.
 * Define a nota da etapa como "R" (Reprovado).
 */
export async function reprovarCandidato(
    candidatoId: number,
    etapa: number
): Promise<{ success: boolean; error?: string }> {
    try {
        const updateData: Record<string, unknown> = {}

        switch (etapa) {
            case 2: // Dinâmica
                updateData.notaDinamica = "R"
                break
            case 3: // Entrevista
                updateData.notaEntrevista = "R"
                break
            case 4: // Capacitação - reprova no case
                updateData.notaCase = "R"
                break
            default:
                return { success: false, error: "Etapa inválida para reprovação direta. A prova é corrigida automaticamente." }
        }

        await prisma.candidato.update({
            where: { id: candidatoId },
            data: updateData
        })

        return { success: true }
    } catch {
        return { success: false, error: "Erro ao reprovar candidato" }
    }
}

/**
 * Avança o candidato na etapa atual com a nota informada.
 */
export async function avancarEtapaCandidato(
    candidatoId: number,
    etapa: number,
    nota: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const updateData: Record<string, unknown> = {}

        switch (etapa) {
            case 2: // Dinâmica
                updateData.notaDinamica = nota
                break
            case 3: // Entrevista
                updateData.notaEntrevista = nota
                break
            default:
                return { success: false, error: "Etapa inválida. Use a aba de notas para editar capacitação." }
        }

        await prisma.candidato.update({
            where: { id: candidatoId },
            data: updateData
        })

        return { success: true }
    } catch {
        return { success: false, error: "Erro ao avançar candidato na etapa" }
    }
}

/**
 * Atualiza a observação de um candidato.
 */
export async function atualizarObservacaoCandidato(
    candidatoId: number,
    observacao: string
): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.candidato.update({
            where: { id: candidatoId },
            data: { observacao }
        })

        return { success: true }
    } catch {
        return { success: false, error: "Erro ao atualizar observação" }
    }
}

/**
 * Aprova ou reprova um candidato em uma etapa específica.
 * Isso é separado da atribuição de nota - pode ser feito em momentos diferentes.
 */
export async function aprovarEtapaCandidato(
    candidatoId: number,
    etapa: number,
    aprovado: boolean
): Promise<{ success: boolean; error?: string }> {
    try {
        const updateData: Record<string, unknown> = {}

        switch (etapa) {
            case 2: // Dinâmica
                updateData.aprovadoDinamica = aprovado
                break
            case 3: // Entrevista
                updateData.aprovadoEntrevista = aprovado
                break
            case 4: // Capacitação
                updateData.aprovadoCapacitacao = aprovado
                break
            default:
                return { success: false, error: "Etapa inválida. Use a correção de prova para aprovar na etapa 1." }
        }

        await prisma.candidato.update({
            where: { id: candidatoId },
            data: updateData
        })

        return { success: true }
    } catch {
        return { success: false, error: "Erro ao atualizar status de aprovação" }
    }
}

/**
 * Salva as notas da etapa de capacitação.
 */
export async function salvarNotasCapacitacao(
    candidatoId: number,
    dados: {
        notaArtigo: number | null
        apresArtigo: number | null
        notaCase: string | null
    }
): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.candidato.update({
            where: { id: candidatoId },
            data: {
                notaArtigo: dados.notaArtigo,
                apresArtigo: dados.apresArtigo,
                notaCase: dados.notaCase ? (dados.notaCase as any) : null
            }
        })

        return { success: true }
    } catch {
        return { success: false, error: "Erro ao salvar notas da capacitação" }
    }
}

/**
 * Exclui um candidato e todos os seus dados relacionados (resultados e respostas).
 * Usa uma transação para garantir atomicidade.
 */
export async function excluirCandidato(
    candidatoId: number
): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.$transaction(async (tx) => {
            // 1. Buscar todos os resultados do candidato
            const resultados = await tx.resultadoProva.findMany({
                where: { candidatoId },
                select: { id: true }
            })

            const resultadoIds = resultados.map(r => r.id)

            // 2. Deletar todas as respostas dos resultados
            if (resultadoIds.length > 0) {
                await tx.respostaQuestao.deleteMany({
                    where: { resultadoId: { in: resultadoIds } }
                })
            }

            // 3. Deletar todos os resultados do candidato
            await tx.resultadoProva.deleteMany({
                where: { candidatoId }
            })

            // 4. Deletar o candidato
            await tx.candidato.delete({
                where: { id: candidatoId }
            })
        })

        return { success: true }
    } catch {
        return { success: false, error: "Erro ao excluir candidato. Verifique se não há dados dependentes." }
    }
}
