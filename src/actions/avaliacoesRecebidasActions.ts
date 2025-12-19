"use server"

import prisma from "@/src/lib/prisma"

export interface AvaliacaoRecebida {
    id: number
    avaliadorNome: string
    avaliadorFoto: string | null
    data: string
    notaEntrega: number
    notaCultura: number
    feedbackTexto: string
    notaFeedback: number | null // null se não foi avaliado ainda
}

export async function getAvaliacoesRecebidas(membroId: number): Promise<AvaliacaoRecebida[]> {
    const respostas = await prisma.respostaAvaliacao.findMany({
        where: {
            avaliadoId: membroId,
            finalizada: true,
            avaliacao: {
                finalizada: false
            }
        },
        include: {
            avaliador: {
                select: {
                    nome: true,
                    fotoUrl: true,
                }
            },
            avaliacaoFeedback: {
                select: {
                    notaFeedback: true,
                }
            },
        },
        orderBy: {
            createdAt: "desc",
        }
    })

    return respostas.map(resposta => ({
        id: resposta.id,
        avaliadorNome: resposta.avaliador.nome,
        avaliadorFoto: resposta.avaliador.fotoUrl,
        data: resposta.createdAt.toLocaleDateString("pt-BR"),
        notaEntrega: resposta.notaEntrega,
        notaCultura: resposta.notaCultura,
        feedbackTexto: resposta.feedbackTexto,
        notaFeedback: resposta.avaliacaoFeedback?.notaFeedback ?? null,
    }))
}

export async function salvarAvaliacaoFeedback(
    respostaAvaliacaoId: number,
    avaliadoId: number,
    notaFeedback: number
): Promise<{ success: boolean; error?: string }> {
    try {
        // Salva a avaliação do feedback
        await prisma.avaliacaoFeedback.upsert({
            where: {
                respostaAvaliacaoId: respostaAvaliacaoId,
            },
            update: {
                notaFeedback: notaFeedback,
            },
            create: {
                respostaAvaliacaoId: respostaAvaliacaoId,
                avaliadoId: avaliadoId,
                notaFeedback: notaFeedback,
            },
        })

        // Busca a resposta para pegar o avaliacaoId
        const resposta = await prisma.respostaAvaliacao.findUnique({
            where: { id: respostaAvaliacaoId },
            select: { avaliacaoId: true }
        })

        if (resposta) {
            // Verifica se todos os feedbacks recebidos na avaliação atual foram avaliados
            await verificarEAtualizarParticipacao(avaliadoId, resposta.avaliacaoId)
        }

        return { success: true }
    } catch (error) {
        console.error("Erro ao salvar avaliação de feedback:", error)
        return { success: false, error: "Erro ao salvar avaliação" }
    }
}

// Verifica se o membro avaliou todos os feedbacks recebidos e atualiza ParticipacaoAvaliacao
async function verificarEAtualizarParticipacao(membroId: number, avaliacaoId: number) {
    // Conta todas as respostas finalizadas que o membro recebeu nesta avaliação
    const totalFeedbacksRecebidos = await prisma.respostaAvaliacao.count({
        where: {
            avaliadoId: membroId,
            avaliacaoId: avaliacaoId,
            finalizada: true,
        }
    })

    // Conta quantos feedbacks o membro já avaliou nesta avaliação
    const feedbacksAvaliados = await prisma.avaliacaoFeedback.count({
        where: {
            avaliadoId: membroId,
            respostaAvaliacao: {
                avaliacaoId: avaliacaoId,
                finalizada: true,
            }
        }
    })

    // Se todos foram avaliados, marca avaliouFeedbacks como true
    if (totalFeedbacksRecebidos > 0 && feedbacksAvaliados >= totalFeedbacksRecebidos) {
        await prisma.participacaoAvaliacao.updateMany({
            where: {
                membroId: membroId,
                avaliacaoId: avaliacaoId,
            },
            data: {
                avaliouFeedbacks: true,
            }
        })
    }
}
