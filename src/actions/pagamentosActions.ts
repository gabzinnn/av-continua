"use server"

import prisma from "@/src/lib/prisma"
import { revalidatePath } from "next/cache"
import { StatusPagamento, Prisma } from "@/src/generated/prisma/client"



// Types
export interface PagamentoCompleto {
    id: number
    nome: string
    descricao: string | null
    valor: number
    notaFiscal: string | null
    pdfUrl: string | null
    status: StatusPagamento
    createdAt: Date
    updatedAt: Date
    demanda: {
        id: number
        nome: string
    } | null
    area: {
        id: number
        nome: string
    } | null
    responsavel: {
        id: number
        nome: string
    } | null
}

export interface PagamentoFiltros {
    dataInicio?: Date
    dataFim?: Date
    demandaId?: number
    areaId?: number
    status?: StatusPagamento
    busca?: string
}

// Buscar todos os pagamentos com filtros
export async function getAllPagamentos(filtros?: PagamentoFiltros): Promise<PagamentoCompleto[]> {
    const where: {
        createdAt?: { gte?: Date; lte?: Date }
        demandaId?: number
        areaId?: number
        status?: StatusPagamento
        OR?: { nome: { contains: string; mode: "insensitive" } }[]
    } = {}

    if (filtros?.dataInicio || filtros?.dataFim) {
        where.createdAt = {}
        if (filtros.dataInicio) where.createdAt.gte = filtros.dataInicio
        if (filtros.dataFim) where.createdAt.lte = filtros.dataFim
    }

    if (filtros?.demandaId) {
        where.demandaId = filtros.demandaId
    }

    if (filtros?.areaId) {
        where.areaId = filtros.areaId
    }

    if (filtros?.status) {
        where.status = filtros.status
    }

    if (filtros?.busca && filtros.busca.trim() !== "") {
        where.OR = [
            { nome: { contains: filtros.busca, mode: "insensitive" } },
        ]
    }

    const pagamentos = await prisma.pagamento.findMany({
        where,
        include: {
            demanda: {
                select: { id: true, nome: true }
            },
            area: {
                select: { id: true, nome: true }
            },
            responsavel: {
                select: { id: true, nome: true }
            }
        },
        orderBy: { createdAt: "desc" }
    })

    return pagamentos.map(p => ({
        id: p.id,
        nome: p.nome,
        descricao: p.descricao,
        valor: Number(p.valor),
        notaFiscal: p.notaFiscal,
        pdfUrl: p.pdfUrl,
        status: p.status,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        demanda: p.demanda,
        area: p.area,
        responsavel: p.responsavel,
    }))
}

// Buscar pagamento por ID
export async function getPagamentoById(id: number): Promise<PagamentoCompleto | null> {
    const pagamento = await prisma.pagamento.findUnique({
        where: { id },
        include: {
            demanda: { select: { id: true, nome: true } },
            area: { select: { id: true, nome: true } },
            responsavel: { select: { id: true, nome: true } }
        }
    })

    if (!pagamento) return null

    return {
        id: pagamento.id,
        nome: pagamento.nome,
        descricao: pagamento.descricao,
        valor: Number(pagamento.valor),
        notaFiscal: pagamento.notaFiscal,
        pdfUrl: pagamento.pdfUrl,
        status: pagamento.status,
        createdAt: pagamento.createdAt,
        updatedAt: pagamento.updatedAt,
        demanda: pagamento.demanda,
        area: pagamento.area,
        responsavel: pagamento.responsavel,
    }
}

// Criar pagamento
export interface CreatePagamentoInput {
    nome: string
    descricao?: string
    valor: number
    notaFiscal?: string
    pdfUrl?: string
    demandaId?: number
    areaId?: number
    responsavelId?: number
}

export async function createPagamento(data: CreatePagamentoInput): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.pagamento.create({
            data: {
                nome: data.nome,
                descricao: data.descricao || null,
                valor: data.valor,
                notaFiscal: data.notaFiscal || null,
                pdfUrl: data.pdfUrl || null,
                demandaId: data.demandaId || null,
                areaId: data.areaId || null,
                responsavelId: data.responsavelId || null,
                status: "ABERTO",
            }
        })
        revalidatePath("/coord/pagamentos")
        return { success: true }
    } catch (error) {
        console.error("Erro ao criar pagamento:", error)
        return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido ao criar pagamento" }
    }
}

// Atualizar pagamento
export interface UpdatePagamentoInput {
    id: number
    nome: string
    descricao?: string
    valor: number
    notaFiscal?: string
    pdfUrl?: string
    demandaId?: number
    areaId?: number
    responsavelId?: number
    status?: StatusPagamento
    createdAt?: Date
}

export async function updatePagamento(data: UpdatePagamentoInput): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.pagamento.update({
            where: { id: data.id },
            data: {
                nome: data.nome,
                descricao: data.descricao || null,
                valor: data.valor,
                notaFiscal: data.notaFiscal || null,
                pdfUrl: data.pdfUrl || null,
                demandaId: data.demandaId || null,
                areaId: data.areaId || null,
                responsavelId: data.responsavelId || null,
                status: data.status,
                createdAt: data.createdAt
            }
        })
        revalidatePath("/coord/pagamentos")
        return { success: true }
    } catch (error) {
        console.error("Erro ao atualizar pagamento:", error)
        return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido ao atualizar pagamento" }
    }
}

// Excluir pagamento
export async function deletePagamento(id: number): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.pagamento.delete({ where: { id } })
        revalidatePath("/coord/pagamentos")
        return { success: true }
    } catch (error) {
        console.error("Erro ao excluir pagamento:", error)
        return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido ao excluir pagamento" }
    }
}

// Alternar status do pagamento
export async function toggleStatusPagamento(id: number): Promise<{ success: boolean; error?: string }> {
    try {
        const pagamento = await prisma.pagamento.findUnique({ where: { id } })
        if (!pagamento) {
            return { success: false, error: "Pagamento não encontrado" }
        }

        const novoStatus: StatusPagamento = pagamento.status === "ABERTO" ? "CONCLUIDO" : "ABERTO"

        await prisma.pagamento.update({
            where: { id },
            data: { status: novoStatus }
        })
        revalidatePath("/coord/pagamentos")
        return { success: true }
    } catch (error) {
        console.error("Erro ao alterar status:", error)
        return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido ao alterar status" }
    }
}

// Estatísticas para o dashboard
export interface PagamentoStats {
    totalGasto: number
    mediaMensal: number
    maiorGasto: { valor: number; nome: string } | null
    totalPorStatus: { abertos: number; concluidos: number }
}

export async function getPagamentoStats(filtros?: Pick<PagamentoFiltros, "dataInicio" | "dataFim" | "areaId" | "demandaId">): Promise<PagamentoStats> {
    const where: { createdAt?: { gte?: Date; lte?: Date }; areaId?: number; demandaId?: number } = {}

    if (filtros?.dataInicio || filtros?.dataFim) {
        where.createdAt = {}
        if (filtros.dataInicio) where.createdAt.gte = filtros.dataInicio
        if (filtros.dataFim) where.createdAt.lte = filtros.dataFim
    }

    if (filtros?.areaId) {
        where.areaId = filtros.areaId
    }

    if (filtros?.demandaId) {
        where.demandaId = filtros.demandaId
    }

    const pagamentos = await prisma.pagamento.findMany({
        where,
        select: {
            valor: true,
            nome: true,
            status: true,
            createdAt: true
        }
    })

    const valores = pagamentos.map(p => Number(p.valor))
    const totalGasto = valores.reduce((acc, v) => acc + v, 0)

    // Calcular média mensal (baseado nos meses únicos)
    const mesesUnicos = new Set(pagamentos.map(p =>
        `${p.createdAt.getFullYear()}-${p.createdAt.getMonth()}`
    ))
    const mediaMensal = mesesUnicos.size > 0 ? totalGasto / mesesUnicos.size : 0

    // Maior gasto
    let maiorGasto: { valor: number; nome: string } | null = null
    if (pagamentos.length > 0) {
        const maior = pagamentos.reduce((max, p) =>
            Number(p.valor) > Number(max.valor) ? p : max
        )
        maiorGasto = { valor: Number(maior.valor), nome: maior.nome }
    }

    // Contagem por status
    const abertos = pagamentos.filter(p => p.status === "ABERTO").length
    const concluidos = pagamentos.filter(p => p.status === "CONCLUIDO").length

    return {
        totalGasto,
        mediaMensal,
        maiorGasto,
        totalPorStatus: { abertos, concluidos }
    }
}

// Dados para gráfico de evolução mensal
export interface DadosEvolucaoMensal {
    mes: string
    valor: number
}

export async function getEvolucaoMensal(ano: number, filtros?: Pick<PagamentoFiltros, "areaId" | "demandaId">): Promise<DadosEvolucaoMensal[]> {
    const dataInicio = new Date(ano, 0, 1)
    const dataFim = new Date(ano, 11, 31, 23, 59, 59)

    const where: { createdAt: { gte: Date; lte: Date }; areaId?: number; demandaId?: number } = {
        createdAt: {
            gte: dataInicio,
            lte: dataFim
        }
    }

    if (filtros?.areaId) {
        where.areaId = filtros.areaId
    }

    if (filtros?.demandaId) {
        where.demandaId = filtros.demandaId
    }

    const pagamentos = await prisma.pagamento.findMany({
        where,
        select: {
            valor: true,
            createdAt: true
        }
    })

    // Agrupar por mês
    const meses = [
        "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
        "Jul", "Ago", "Set", "Out", "Nov", "Dez"
    ]

    const resultado: DadosEvolucaoMensal[] = meses.map((mes, index) => {
        const valorMes = pagamentos
            .filter(p => p.createdAt.getMonth() === index)
            .reduce((acc, p) => acc + Number(p.valor), 0)
        return { mes, valor: valorMes }
    })

    return resultado
}
