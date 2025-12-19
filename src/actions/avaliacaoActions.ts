"use server"

import prisma from '../lib/prisma'

interface MembroParaAvaliar {
    id: number
    nome: string
    fotoUrl: string | null
    area: string
    status: 'pendente' | 'rascunho' | 'concluido'
    isCoordenador: boolean
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

    // Buscar demandas em que o avaliador está alocado
    const demandasDoAvaliador = await prisma.alocacaoDemanda.findMany({
        where: { membroId },
        select: { demandaId: true }
    })

    const demandaIds = demandasDoAvaliador.map(d => d.demandaId)

    // Buscar membros que compartilham pelo menos uma demanda com o avaliador
    const membrosComDemandaCompartilhada = await prisma.alocacaoDemanda.findMany({
        where: {
            demandaId: { in: demandaIds },
            membroId: { not: membroId }
        },
        select: { membroId: true },
        distinct: ['membroId']
    })

    const membrosIds = membrosComDemandaCompartilhada.map(a => a.membroId)

    // Buscar dados completos desses membros (apenas ativos)
    const membros = await prisma.membro.findMany({
        where: {
            id: { in: membrosIds },
            isAtivo: true,
        },
        include: { area: true }
    })

    // Buscar respostas já feitas pelo avaliador nesta avaliação
    const respostasFeitas = await prisma.respostaAvaliacao.findMany({
        where: {
            avaliacaoId: avaliacao.id,
            avaliadorId: membroId
        },
        select: { avaliadoId: true, finalizada: true }
    })

    // Mapeia avaliadoId para status baseado em finalizada
    const respostasMap = new Map(respostasFeitas.map(r => [r.avaliadoId, r.finalizada]))

    const membrosParaAvaliar: MembroParaAvaliar[] = membros.map(m => {
        const resposta = respostasMap.get(m.id)
        let status: 'pendente' | 'rascunho' | 'concluido' = 'pendente'
        if (resposta !== undefined) {
            status = resposta ? 'concluido' : 'rascunho'
        }
        return {
            id: m.id,
            nome: m.nome,
            fotoUrl: m.fotoUrl,
            area: m.area.nome,
            status,
            isCoordenador: m.isCoordenador
        }
    })
    const avaliacoesCompletas = membrosParaAvaliar.filter(m => m.status === 'concluido')
    // Ordenar: pendentes primeiro, depois concluídos
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
            }
        }
    })

    if (!resposta) return null

    return {
        id: resposta.id,
        notaEntrega: resposta.notaEntrega,
        notaCultura: resposta.notaCultura,
        feedbackTexto: resposta.feedbackTexto,
        planosAcao: resposta.planosAcao.map(p => p.descricao)
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
}

// Salva ou atualiza uma resposta de avaliação com planos de ação
export async function salvarResposta(data: SalvarRespostaInput) {
    const { avaliacaoId, avaliadorId, avaliadoId, notaEntrega, notaCultura, feedbackTexto, planosAcao, finalizada } = data

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
            finalizada
        },
        update: {
            notaEntrega,
            notaCultura,
            feedbackTexto,
            finalizada
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

// Verifica se o membro avaliou todos (que compartilham demanda) e atualiza a participação
async function verificarEAtualizarParticipacao(avaliacaoId: number, membroId: number) {
    // Buscar demandas em que o avaliador está alocado
    const demandasDoAvaliador = await prisma.alocacaoDemanda.findMany({
        where: { membroId },
        select: { demandaId: true }
    })

    const demandaIds = demandasDoAvaliador.map(d => d.demandaId)

    // Contar membros que compartilham demandas (ativos)
    const membrosComDemandaCompartilhada = await prisma.alocacaoDemanda.findMany({
        where: {
            demandaId: { in: demandaIds },
            membroId: { not: membroId },
            membro: { isAtivo: true }
        },
        select: { membroId: true },
        distinct: ['membroId']
    })

    const totalMembros = membrosComDemandaCompartilhada.length

    // Contar avaliações feitas
    const avaliacoesFeitas = await prisma.respostaAvaliacao.count({
        where: {
            avaliacaoId,
            avaliadorId: membroId
        }
    })

    // Se avaliou todos, marcar participação como concluída
    if (avaliacoesFeitas >= totalMembros && totalMembros > 0) {
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
