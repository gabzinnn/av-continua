"use server"

import prisma from '../lib/prisma'

interface MembroParaAvaliar {
    id: number
    nome: string
    fotoUrl: string | null
    area: string
    status: 'pendente' | 'rascunho' | 'concluido'
    isCoordenador: boolean
    feedbackAvaliado: boolean // Se o destinatário já avaliou o feedback
}

interface AvaliacaoAtualData {
    avaliacaoId: number | null
    nome: string | null
    membrosParaAvaliar: MembroParaAvaliar[]
    totalMembros: number
    avaliadosCount: number
}

interface RespostaExistente {
    id: number
    notaEntrega: number
    notaCultura: number
    feedbackTexto: string
    planosAcao: string[]
    oneOnOneFeito: boolean
    finalizada: boolean
    notaFeedbackRecebida: number | null // Nota que o destinatário deu para este feedback
}

// Busca a avaliação ativa e lista de membros para avaliar
export async function getAvaliacaoAtual(membroId: number): Promise<AvaliacaoAtualData> {
    // Buscar avaliação ativa (não finalizada)
    const avaliacao = await prisma.avaliacao.findFirst({
        where: { finalizada: false },
        orderBy: { dataInicio: 'desc' }
    })

    if (!avaliacao) {
        return {
            avaliacaoId: null,
            nome: null,
            membrosParaAvaliar: [],
            totalMembros: 0,
            avaliadosCount: 0
        }
    }

    // Buscar dados do avaliador para saber sua área e subárea
    const avaliador = await prisma.membro.findUnique({
        where: { id: membroId },
        include: {
            area: true,
            subarea: true
        }
    })

    if (!avaliador) {
        return {
            avaliacaoId: null,
            nome: null,
            membrosParaAvaliar: [],
            totalMembros: 0,
            avaliadosCount: 0
        }
    }


    // Buscar demandas em que o avaliador está alocado
    const demandasDoAvaliador = await prisma.alocacaoDemanda.findMany({
        where: { membroId },
        include: {
            demanda: {
                select: { idSubarea: true }
            }
        }
    })

    const demandaIds = demandasDoAvaliador.map(d => d.demandaId)

    // Buscar membros que compartilham pelo menos uma demanda com o avaliador
    const membrosComDemandaCompartilhada = await prisma.alocacaoDemanda.findMany({
        where: {
            demandaId: { in: demandaIds }
        },
        select: { membroId: true },
        distinct: ['membroId']
    })

    // Incluir o próprio membro para autoavaliação
    let membrosIds = [...new Set([...membrosComDemandaCompartilhada.map(a => a.membroId), membroId])]

    // Adicionar coordenadores obrigatórios:
    // 1. Coordenador da área do avaliador
    // 2. Coordenador da Organização Interna
    // 3. Coordenador da Coordenação Geral
    const coordenadoresObrigatorios = await prisma.membro.findMany({
        where: {
            isCoordenador: true,
            isAtivo: true,
            id: { not: membroId }, // Não incluir o próprio avaliador
            OR: [
                { areaId: avaliador.areaId }, // Coordenador da própria área
                { area: { nome: "Organização Interna" } },
                { area: { nome: "Coordenação Geral" } }
            ]
        },
        select: { id: true }
    })

    // Merge sem duplicatas
    const coordenadorIds = coordenadoresObrigatorios.map(c => c.id)
    membrosIds = [...new Set([...membrosIds, ...coordenadorIds])]

    // ============================================
    // LÓGICA HÍBRIDA: Depende se CADA DEMANDA tem subárea
    // - Demandas COM subárea: líder de subárea ↔ líder de demanda
    // - Demandas SEM subárea: coordenador ↔ líder de demanda  
    // ============================================

    // Se o avaliador é COORDENADOR
    if (avaliador.isCoordenador) {
        // 1. Coordenador avalia líderes de subárea da sua área (se existirem)
        const lideresSubareasDaArea = await prisma.membro.findMany({
            where: {
                areaId: avaliador.areaId,
                isLiderSubarea: true,
                isAtivo: true,
                id: { not: membroId }
            },
            select: { id: true }
        })
        const liderSubareaIds = lideresSubareasDaArea.map(l => l.id)
        membrosIds = [...new Set([...membrosIds, ...liderSubareaIds])]

        // 2. Coordenador avalia líderes de demandas SEM SUBÁREA da sua área
        const lideresDemandasSemSubarea = await prisma.alocacaoDemanda.findMany({
            where: {
                isLider: true,
                membroId: { not: membroId },
                demanda: {
                    idArea: avaliador.areaId,
                    idSubarea: null, // Apenas demandas SEM subárea
                    finalizada: false
                },
                membro: { isAtivo: true }
            },
            select: { membroId: true },
            distinct: ['membroId']
        })
        const liderSemSubareaIds = lideresDemandasSemSubarea.map(l => l.membroId)
        membrosIds = [...new Set([...membrosIds, ...liderSemSubareaIds])]

        // 3. Coordenadores também avaliam outros coordenadores
        const outrosCoordenadores = await prisma.membro.findMany({
            where: {
                isCoordenador: true,
                isAtivo: true,
                id: { not: membroId }
            },
            select: { id: true }
        })
        const outrosCoordenadoresIds = outrosCoordenadores.map(c => c.id)
        membrosIds = [...new Set([...membrosIds, ...outrosCoordenadoresIds])]
    }

    // Se o avaliador é LÍDER DE SUBÁREA
    if (avaliador.isLiderSubarea && avaliador.subareaId) {
        // Líder de subárea avalia o coordenador da área (já adicionado acima nos obrigatórios)

        // Líder de subárea avalia líderes de demandas DA SUA SUBÁREA (apenas demandas COM subárea)
        const lideresDemandaDaSubarea = await prisma.alocacaoDemanda.findMany({
            where: {
                isLider: true,
                membroId: { not: membroId },
                demanda: {
                    idSubarea: avaliador.subareaId, // Apenas demandas DESTA subárea
                    finalizada: false
                },
                membro: { isAtivo: true }
            },
            select: { membroId: true },
            distinct: ['membroId']
        })
        const liderDemandaIds = lideresDemandaDaSubarea.map(l => l.membroId)
        membrosIds = [...new Set([...membrosIds, ...liderDemandaIds])]
    }

    // Se o avaliador é LÍDER DE DEMANDA
    const demandasOndeEhLider = demandasDoAvaliador.filter(d => d.isLider)
    if (demandasOndeEhLider.length > 0) {
        // Para demandas COM subárea: líder de demanda avalia líder de subárea
        const demandasComSubarea = demandasOndeEhLider.filter(d => d.demanda.idSubarea)
        if (demandasComSubarea.length > 0) {
            const subareaIds = demandasComSubarea.map(d => d.demanda.idSubarea).filter((id): id is number => id !== null)

            const lideresSubareasParaAvaliar = await prisma.membro.findMany({
                where: {
                    subareaId: { in: subareaIds },
                    isLiderSubarea: true,
                    isAtivo: true,
                    id: { not: membroId }
                },
                select: { id: true }
            })
            const liderSubareaIds = lideresSubareasParaAvaliar.map(l => l.id)
            membrosIds = [...new Set([...membrosIds, ...liderSubareaIds])]
        }

        // Para demandas SEM subárea: líder de demanda avalia coordenador da área
        // (já está incluído nos coordenadores obrigatórios)
    }

    // Buscar dados completos desses membros (apenas ativos)
    const membros = await prisma.membro.findMany({
        where: {
            id: { in: membrosIds },
            isAtivo: true,
        },
        include: { area: true }
    })

    // Buscar respostas já feitas pelo avaliador nesta avaliação (com info de feedback)
    const respostasFeitas = await prisma.respostaAvaliacao.findMany({
        where: {
            avaliacaoId: avaliacao.id,
            avaliadorId: membroId
        },
        select: {
            avaliadoId: true,
            finalizada: true,
            avaliacaoFeedback: {
                select: { id: true }
            }
        }
    })

    // Mapeia avaliadoId para status e feedbackAvaliado
    const respostasMap = new Map(respostasFeitas.map(r => [
        r.avaliadoId,
        { finalizada: r.finalizada, feedbackAvaliado: r.avaliacaoFeedback !== null }
    ]))

    const membrosParaAvaliar: MembroParaAvaliar[] = membros.map(m => {
        const resposta = respostasMap.get(m.id)
        let status: 'pendente' | 'rascunho' | 'concluido' = 'pendente'
        let feedbackAvaliado = false
        if (resposta !== undefined) {
            status = resposta.finalizada ? 'concluido' : 'rascunho'
            feedbackAvaliado = resposta.feedbackAvaliado
        }
        return {
            id: m.id,
            nome: m.nome,
            fotoUrl: m.fotoUrl,
            area: m.area.nome,
            status,
            isCoordenador: m.isCoordenador,
            feedbackAvaliado
        }
    })
    const avaliacoesCompletas = membrosParaAvaliar.filter(m => m.status === 'concluido')
    // Ordenar: coordenadores primeiro, depois por área, depois alfabeticamente
    membrosParaAvaliar.sort((a, b) => {
        if (a.isCoordenador !== b.isCoordenador) {
            return a.isCoordenador ? -1 : 1
        }
        const areaCompare = a.area.localeCompare(b.area)
        if (areaCompare !== 0) return areaCompare
        return a.nome.localeCompare(b.nome)
    })

    return {
        avaliacaoId: avaliacao.id,
        nome: avaliacao.nome,
        membrosParaAvaliar,
        totalMembros: membros.length,
        avaliadosCount: avaliacoesCompletas.length
    }
}

// Busca resposta existente para um membro específico
export async function getRespostaExistente(
    avaliacaoId: number,
    avaliadorId: number,
    avaliadoId: number
): Promise<RespostaExistente | null> {
    const resposta = await prisma.respostaAvaliacao.findUnique({
        where: {
            avaliacaoId_avaliadorId_avaliadoId: {
                avaliacaoId,
                avaliadorId,
                avaliadoId
            }
        },
        include: {
            planosAcao: {
                select: { descricao: true }
            },
            avaliacaoFeedback: {
                select: { notaFeedback: true }
            }
        }
    })

    if (!resposta) return null

    return {
        id: resposta.id,
        notaEntrega: resposta.notaEntrega,
        notaCultura: resposta.notaCultura,
        feedbackTexto: resposta.feedbackTexto,
        planosAcao: resposta.planosAcao.map(p => p.descricao),
        oneOnOneFeito: resposta.oneOnOneFeito,
        finalizada: resposta.finalizada,
        notaFeedbackRecebida: resposta.avaliacaoFeedback?.notaFeedback ?? null
    }
}

interface SalvarRespostaInput {
    avaliacaoId: number
    avaliadorId: number
    avaliadoId: number
    notaEntrega: number
    notaCultura: number
    feedbackTexto: string
    planosAcao: string[] // Um plano por linha
    finalizada: boolean // true = concluído, false = rascunho
    oneOnOneFeito?: boolean // Opcional, só é salvo se o avaliador tem permissão
}

// Salva ou atualiza uma resposta de avaliação com planos de ação
export async function salvarResposta(data: SalvarRespostaInput) {
    const { avaliacaoId, avaliadorId, avaliadoId, notaEntrega, notaCultura, feedbackTexto, planosAcao, finalizada, oneOnOneFeito } = data

    // Upsert da resposta
    const resposta = await prisma.respostaAvaliacao.upsert({
        where: {
            avaliacaoId_avaliadorId_avaliadoId: {
                avaliacaoId,
                avaliadorId,
                avaliadoId
            }
        },
        create: {
            avaliacaoId,
            avaliadorId,
            avaliadoId,
            notaEntrega,
            notaCultura,
            feedbackTexto,
            finalizada,
            oneOnOneFeito: oneOnOneFeito ?? false
        },
        update: {
            notaEntrega,
            notaCultura,
            feedbackTexto,
            finalizada,
            ...(oneOnOneFeito !== undefined && { oneOnOneFeito })
        }
    })

    // Deletar planos de ação antigos e criar novos
    await prisma.planoAcao.deleteMany({
        where: { respostaAvaliacaoId: resposta.id }
    })

    // Criar novos planos de ação (filtra linhas vazias)
    const planosValidos = planosAcao.filter(p => p.trim().length > 0)

    if (planosValidos.length > 0) {
        await prisma.planoAcao.createMany({
            data: planosValidos.map(descricao => ({
                respostaAvaliacaoId: resposta.id,
                responsavelId: avaliadoId, // O avaliado é o responsável pelo plano
                descricao: descricao.trim()
            }))
        })
    }

    // Verificar se avaliou todos os membros e atualizar ParticipacaoAvaliacao
    await verificarEAtualizarParticipacao(avaliacaoId, avaliadorId)

    return { success: true, respostaId: resposta.id }
}

// Verifica se o membro avaliou todos (que compartilham demanda + coordenadores) e atualiza a participação
async function verificarEAtualizarParticipacao(avaliacaoId: number, membroId: number) {
    // Buscar dados do avaliador para saber sua área e subárea
    const avaliador = await prisma.membro.findUnique({
        where: { id: membroId },
        include: {
            area: true,
            subarea: true
        }
    })

    if (!avaliador) return

    // Buscar demandas em que o avaliador está alocado
    const demandasDoAvaliador = await prisma.alocacaoDemanda.findMany({
        where: { membroId },
        include: {
            demanda: {
                select: { idSubarea: true }
            }
        }
    })

    const demandaIds = demandasDoAvaliador.map(d => d.demandaId)

    // Contar membros que compartilham demandas (ativos)
    const membrosComDemandaCompartilhada = await prisma.alocacaoDemanda.findMany({
        where: {
            demandaId: { in: demandaIds },
            membro: { isAtivo: true }
        },
        select: { membroId: true },
        distinct: ['membroId']
    })

    // Incluir o próprio membro para autoavaliação
    let membrosIds = [...new Set([...membrosComDemandaCompartilhada.map(a => a.membroId), membroId])]

    // Adicionar coordenadores obrigatórios
    const coordenadoresObrigatorios = await prisma.membro.findMany({
        where: {
            isCoordenador: true,
            isAtivo: true,
            id: { not: membroId },
            OR: [
                { areaId: avaliador.areaId },
                { area: { nome: "Organização Interna" } },
                { area: { nome: "Coordenação Geral" } }
            ]
        },
        select: { id: true }
    })

    // Merge sem duplicatas
    const coordenadorIds = coordenadoresObrigatorios.map(c => c.id)
    membrosIds = [...new Set([...membrosIds, ...coordenadorIds])]

    // ============================================
    // LÓGICA HÍBRIDA: Depende se CADA DEMANDA tem subárea
    // ============================================

    // Se o avaliador é COORDENADOR
    if (avaliador.isCoordenador) {
        // 1. Coordenador avalia líderes de subárea da sua área (se existirem)
        const lideresSubareasDaArea = await prisma.membro.findMany({
            where: {
                areaId: avaliador.areaId,
                isLiderSubarea: true,
                isAtivo: true,
                id: { not: membroId }
            },
            select: { id: true }
        })
        const liderSubareaIds = lideresSubareasDaArea.map(l => l.id)
        membrosIds = [...new Set([...membrosIds, ...liderSubareaIds])]

        // 2. Coordenador avalia líderes de demandas SEM SUBÁREA da sua área
        const lideresDemandasSemSubarea = await prisma.alocacaoDemanda.findMany({
            where: {
                isLider: true,
                membroId: { not: membroId },
                demanda: {
                    idArea: avaliador.areaId,
                    idSubarea: null,
                    finalizada: false
                },
                membro: { isAtivo: true }
            },
            select: { membroId: true },
            distinct: ['membroId']
        })
        const liderSemSubareaIds = lideresDemandasSemSubarea.map(l => l.membroId)
        membrosIds = [...new Set([...membrosIds, ...liderSemSubareaIds])]

        // 3. Coordenadores também avaliam outros coordenadores
        const outrosCoordenadores = await prisma.membro.findMany({
            where: {
                isCoordenador: true,
                isAtivo: true,
                id: { not: membroId }
            },
            select: { id: true }
        })
        const outrosCoordenadoresIds = outrosCoordenadores.map(c => c.id)
        membrosIds = [...new Set([...membrosIds, ...outrosCoordenadoresIds])]
    }

    // Se o avaliador é LÍDER DE SUBÁREA
    if (avaliador.isLiderSubarea && avaliador.subareaId) {
        const lideresDemandaDaSubarea = await prisma.alocacaoDemanda.findMany({
            where: {
                isLider: true,
                membroId: { not: membroId },
                demanda: {
                    idSubarea: avaliador.subareaId,
                    finalizada: false
                },
                membro: { isAtivo: true }
            },
            select: { membroId: true },
            distinct: ['membroId']
        })
        const liderDemandaIds = lideresDemandaDaSubarea.map(l => l.membroId)
        membrosIds = [...new Set([...membrosIds, ...liderDemandaIds])]
    }

    // Se o avaliador é LÍDER DE DEMANDA
    const demandasOndeEhLider = demandasDoAvaliador.filter(d => d.isLider)
    if (demandasOndeEhLider.length > 0) {
        // Para demandas COM subárea: líder de demanda avalia líder de subárea
        const demandasComSubarea = demandasOndeEhLider.filter(d => d.demanda.idSubarea)
        if (demandasComSubarea.length > 0) {
            const subareaIds = demandasComSubarea.map(d => d.demanda.idSubarea).filter((id): id is number => id !== null)

            const lideresSubareasParaAvaliar = await prisma.membro.findMany({
                where: {
                    subareaId: { in: subareaIds },
                    isLiderSubarea: true,
                    isAtivo: true,
                    id: { not: membroId }
                },
                select: { id: true }
            })
            const liderSubareaIds = lideresSubareasParaAvaliar.map(l => l.id)
            membrosIds = [...new Set([...membrosIds, ...liderSubareaIds])]
        }
    }

    const totalMembros = membrosIds.length

    // Contar apenas avaliações FINALIZADAS (não rascunhos)
    const avaliacoesFinalizadas = await prisma.respostaAvaliacao.count({
        where: {
            avaliacaoId,
            avaliadorId: membroId,
            finalizada: true
        }
    })

    // Se finalizou todas as avaliações, marcar participação como concluída
    if (avaliacoesFinalizadas >= totalMembros && totalMembros > 0) {
        await prisma.participacaoAvaliacao.upsert({
            where: {
                avaliacaoId_membroId: {
                    avaliacaoId,
                    membroId
                }
            },
            create: {
                avaliacaoId,
                membroId,
                respondeuAvaliacao: true,
                avaliouFeedbacks: false
            },
            update: {
                respondeuAvaliacao: true
            }
        })
    } else {
        // Se ainda não finalizou todas, garantir que respondeuAvaliacao seja false
        await prisma.participacaoAvaliacao.upsert({
            where: {
                avaliacaoId_membroId: {
                    avaliacaoId,
                    membroId
                }
            },
            create: {
                avaliacaoId,
                membroId,
                respondeuAvaliacao: false,
                avaliouFeedbacks: false
            },
            update: {
                respondeuAvaliacao: false
            }
        })
    }
}

// Busca dados completos de um membro para exibir no header
export async function getMembroDetalhes(membroId: number) {
    const membro = await prisma.membro.findUnique({
        where: { id: membroId },
        include: { area: true }
    })

    if (!membro) return null

    return {
        id: membro.id,
        nome: membro.nome,
        fotoUrl: membro.fotoUrl,
        area: membro.area.nome,
        periodo: membro.periodo
    }
}

// Verifica se o avaliador pode marcar 1:1 para o avaliado
// Regras (por DEMANDA):
// - Coordenadores podem marcar 1:1 para líderes de subárea da sua área
// - Coordenadores podem marcar 1:1 para líderes de demandas SEM SUBÁREA da sua área
// - Líderes de subárea podem marcar 1:1 para líderes de demandas da sua subárea
// - Líderes de demandas podem marcar 1:1 para membros das suas demandas
export async function podeMarcar1on1(avaliadorId: number, avaliadoId: number): Promise<boolean> {
    // Buscar dados do avaliador
    const avaliador = await prisma.membro.findUnique({
        where: { id: avaliadorId },
        include: {
            area: true,
            subarea: true
        }
    })

    if (!avaliador) return false

    // Caso 1: Coordenador
    if (avaliador.isCoordenador) {
        // Coordenador pode marcar 1:1 para líderes de subárea da sua área
        const avaliadoEhLiderSubarea = await prisma.membro.findFirst({
            where: {
                id: avaliadoId,
                areaId: avaliador.areaId,
                isLiderSubarea: true,
                isAtivo: true
            }
        })
        if (avaliadoEhLiderSubarea) return true

        // Coordenador pode marcar 1:1 para líderes de demandas SEM SUBÁREA da sua área
        const avaliadoEhLiderDemandaSemSubarea = await prisma.alocacaoDemanda.findFirst({
            where: {
                membroId: avaliadoId,
                isLider: true,
                demanda: {
                    idArea: avaliador.areaId,
                    idSubarea: null, // Apenas demandas SEM subárea
                    finalizada: false
                }
            }
        })
        if (avaliadoEhLiderDemandaSemSubarea) return true
    }

    // Caso 2: Líder de subárea avaliando líder de demanda da sua subárea
    if (avaliador.isLiderSubarea && avaliador.subareaId) {
        const avaliadoEhLiderDemandaNaSubarea = await prisma.alocacaoDemanda.findFirst({
            where: {
                membroId: avaliadoId,
                isLider: true,
                demanda: {
                    idSubarea: avaliador.subareaId,
                    finalizada: false
                }
            }
        })
        if (avaliadoEhLiderDemandaNaSubarea) return true
    }

    // Caso 3: Líder de demanda avaliando membro da sua demanda
    // Buscar demandas onde o avaliador é líder
    const demandasOndeEhLider = await prisma.alocacaoDemanda.findMany({
        where: {
            membroId: avaliadorId,
            isLider: true,
            demanda: { finalizada: false }
        },
        select: { demandaId: true }
    })

    if (demandasOndeEhLider.length > 0) {
        const demandaIds = demandasOndeEhLider.map(d => d.demandaId)

        // Verificar se o avaliado está em alguma dessas demandas (e não é líder dela)
        const avaliadoNaDemanda = await prisma.alocacaoDemanda.findFirst({
            where: {
                membroId: avaliadoId,
                demandaId: { in: demandaIds },
                isLider: false // Só membros, não outros líderes
            }
        })
        if (avaliadoNaDemanda) return true
    }

    return false
}

// Marca ou desmarca 1:1 como feito
export async function marcar1on1(
    respostaId: number,
    avaliadorId: number,
    feito: boolean
): Promise<{ success: boolean; error?: string }> {
    try {
        // Buscar a resposta para verificar permissões
        const resposta = await prisma.respostaAvaliacao.findUnique({
            where: { id: respostaId }
        })

        if (!resposta) {
            return { success: false, error: "Resposta não encontrada" }
        }

        // Verificar se o avaliador é quem fez a avaliação
        if (resposta.avaliadorId !== avaliadorId) {
            return { success: false, error: "Você não tem permissão para alterar esta avaliação" }
        }

        // Verificar se pode marcar 1:1 para este avaliado
        const podemarcar = await podeMarcar1on1(avaliadorId, resposta.avaliadoId)
        if (!podemarcar) {
            return { success: false, error: "Você não tem permissão para marcar 1:1 para este membro" }
        }

        // Atualizar o campo oneOnOneFeito
        await prisma.respostaAvaliacao.update({
            where: { id: respostaId },
            data: { oneOnOneFeito: feito }
        })

        return { success: true }
    } catch (error) {
        console.error("Erro ao marcar 1:1:", error)
        return { success: false, error: "Erro ao atualizar status do 1:1" }
    }
}
