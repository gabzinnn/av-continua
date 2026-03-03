"use server"

import prisma from "@/src/lib/prisma"
import { revalidatePath } from "next/cache"
import { StatusAvaliacao360, TipoPergunta360 } from "@/src/generated/prisma/client"

// Tipos para Retorno e View
export type Avaliacao360Resumo = {
    id: number
    nome: string
    status: StatusAvaliacao360
    dataInicio: Date | null
    dataFim: Date | null
    totalParticipantes: number
    totalRespostas: number
    taxaResposta: number
    createdAt: Date
}

export type Avaliacao360PageData = {
    avaliacoes: Avaliacao360Resumo[]
    cicloAtivo: {
        id: number
        nome: string
        diasRestantes: number | null
        progresso: number
    } | null
    metricas: {
        mediaGlobal: number
        engajamentoGlobal: number
        variacaoEngajamento: number // Comparado ao ciclo anterior
    }
}

/**
 * Pega os dados para renderizar a tabela e os cards superiores da página de Coordenadoria
 */
export async function getAvaliacoes360PageData(): Promise<Avaliacao360PageData> {
    try {
        const avaliacoes = await prisma.avaliacao360.findMany({
            include: {
                feedbacks: true,
                ciclo: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        const resumos = avaliacoes.map(av => {
            const feedbacks = av.feedbacks
            const totalParticipantes = feedbacks.length
            const feedbacksFinalizados = feedbacks.filter(f => f.finalizado).length
            const taxaResposta = totalParticipantes > 0
                ? Math.round((feedbacksFinalizados / totalParticipantes) * 100)
                : 0

            return {
                id: av.id,
                nome: av.nome,
                status: av.status,
                dataInicio: av.dataInicio,
                dataFim: av.dataFim,
                totalParticipantes,
                totalRespostas: feedbacksFinalizados,
                taxaResposta,
                createdAt: av.createdAt
            }
        })

        // TODO: Métrica simplificada pro teste real (Média simulada)
        return {
            avaliacoes: resumos,
            cicloAtivo: null,
            metricas: {
                mediaGlobal: 0,
                engajamentoGlobal: 0,
                variacaoEngajamento: 0
            }
        }
    } catch (error) {
        console.error("Erro ao carregar dados da página de avaliação 360", error)
        throw new Error("Não foi possível carregar os dados")
    }
}

export async function criarAvaliacao360(data: { nome: string, idCiclo?: number }) {
    try {
        const nova = await prisma.avaliacao360.create({
            data: {
                nome: data.nome,
                idCiclo: data.idCiclo,
                status: StatusAvaliacao360.RASCUNHO
            }
        })
        revalidatePath('/coord/avaliacoes-360')
        return { success: true, data: nova }
    } catch (error) {
        console.error(error)
        return { success: false, error: "Erro ao criar avaliação" }
    }
}

export async function deletarAvaliacao360(id: number) {
    try {
        await prisma.avaliacao360.delete({
            where: { id }
        })
        revalidatePath('/coord/avaliacoes-360')
        return { success: true }
    } catch (error) {
        console.error(error)
        return { success: false, error: "Erro ao deletar" }
    }
}

export async function getAvaliacao360ById(id: number) {
    try {
        const avaliacao = await prisma.avaliacao360.findUnique({
            where: { id },
            include: {
                dimensoes: {
                    include: {
                        perguntas: {
                            orderBy: { ordem: 'asc' }
                        }
                    },
                    orderBy: { ordem: 'asc' }
                }
            }
        })
        return avaliacao
    } catch (error) {
        console.error(error)
        return null
    }
}

export async function ativarAvaliacao360(id: number) {
    try {
        await prisma.avaliacao360.update({
            where: { id },
            data: { status: StatusAvaliacao360.ATIVA, dataInicio: new Date() }
        })
        revalidatePath('/coord/avaliacoes-360')
        revalidatePath('/coord/avaliacoes-360/[id]', 'page')
        return { success: true }
    } catch (error) {
        console.error(error)
        return { success: false, error: "Erro ao ativar" }
    }
}

export async function encerrarAvaliacao360(id: number) {
    try {
        await prisma.avaliacao360.update({
            where: { id },
            data: { status: StatusAvaliacao360.ENCERRADA, dataFim: new Date() }
        })
        revalidatePath('/coord/avaliacoes-360')
        revalidatePath('/coord/avaliacoes-360/[id]', 'page')
        return { success: true }
    } catch (error) {
        console.error(error)
        return { success: false, error: "Erro ao encerrar" }
    }
}

// Tipo usado para receber o form inteiro da tela de edição
export type SaveAvaliacaoFullPayload = {
    nome: string;
    pesoGeralCalculado?: number;
    dimensoes: Array<{
        id?: number;
        titulo: string;
        peso: number;
        perguntas: Array<{
            id?: number;
            texto: string;
            tipo: TipoPergunta360;
            obrigatoria: boolean;
        }>
    }>
}

/**
 * Salva todo o rascunho de Avaliação 360 e suas dimensões e perguntas via Transaction.
 */
export async function salvarRascunhoAvaliacao360(avaliacaoId: number, data: SaveAvaliacaoFullPayload) {
    try {
        await prisma.$transaction(async (tx) => {
            // 1. Atualizar Título
            await tx.avaliacao360.update({
                where: { id: avaliacaoId },
                data: { nome: data.nome }
            })

            // 2. Apagar dimensões e perguntas existentes (Clean-slate pra simplificar UI)
            await tx.dimensao360.deleteMany({
                where: { avaliacaoId }
            })

            // 3. Recriar com a nova ordem
            for (let i = 0; i < data.dimensoes.length; i++) {
                const dim = data.dimensoes[i]

                const createdDim = await tx.dimensao360.create({
                    data: {
                        avaliacaoId,
                        titulo: dim.titulo,
                        peso: dim.peso,
                        ordem: i,
                    }
                })

                if (dim.perguntas && dim.perguntas.length > 0) {
                    await tx.pergunta360.createMany({
                        data: dim.perguntas.map((perg, j) => ({
                            dimensaoId: createdDim.id,
                            texto: perg.texto,
                            tipo: perg.tipo,
                            obrigatoria: perg.obrigatoria,
                            ordem: j
                        }))
                    })
                }
            }
        })

        revalidatePath('/coord/avaliacoes-360/[id]/editar', 'page')
        return { success: true }
    } catch (error) {
        console.error(error)
        return { success: false, error: "Erro ao salvar rascunho completo" }
    }
}
