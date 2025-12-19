"use server"

import prisma from "@/src/lib/prisma"
import { revalidatePath } from "next/cache"

// Types
export interface DemandaCompleta {
    id: number
    nome: string
    descricao: string | null
    finalizada: boolean
    creditoMembro: number
    creditoLider: number
    area: {
        id: number
        nome: string
    } | null
    alocacoes: {
        id: number
        isLider: boolean
        membro: {
            id: number
            nome: string
            fotoUrl: string | null
        }
    }[]
}

export interface MembroParaAlocacao {
    id: number
    nome: string
    fotoUrl: string | null
    area: string
}

// Ordem das áreas para ordenação
const AREA_ORDER: Record<string, number> = {
    "Coordenação Geral": 0,
    "Organização Interna": 1,
    "Academia de Preparação": 2,
    "Escola de Negócios": 3,
    "Fábrica de Consultores": 4,
}

function getAreaOrder(areaNome: string | null | undefined): number {
    if (!areaNome) return 999 // Sem área vai pro final
    return AREA_ORDER[areaNome] ?? 999
}

// Buscar todas as demandas com busca por relevância
export async function getAllDemandas(busca?: string): Promise<DemandaCompleta[]> {
    const demandas = await prisma.demanda.findMany({
        include: {
            area: true,
            alocacoes: {
                include: {
                    membro: {
                        select: {
                            id: true,
                            nome: true,
                            fotoUrl: true,
                        }
                    }
                }
            }
        },
        orderBy: { createdAt: "desc" },
    })

    const mapDemanda = (d: typeof demandas[0]): DemandaCompleta => ({
        id: d.id,
        nome: d.nome,
        descricao: d.descricao,
        finalizada: d.finalizada,
        creditoMembro: d.creditoMembro,
        creditoLider: d.creditoLider,
        area: d.area ? { id: d.area.id, nome: d.area.nome } : null,
        alocacoes: d.alocacoes.map(a => ({
            id: a.id,
            isLider: a.isLider,
            membro: {
                id: a.membro.id,
                nome: a.membro.nome,
                fotoUrl: a.membro.fotoUrl,
            }
        })),
    })

    if (!busca || busca.trim() === "") {
        return demandas
            .map(mapDemanda)
            .sort((a, b) => getAreaOrder(a.area?.nome) - getAreaOrder(b.area?.nome))
    }

    // Busca por relevância
    const buscaLower = busca.toLowerCase().trim()

    const demandasComRelevancia = demandas.map(d => {
        let relevancia = 0
        const nomeLower = d.nome.toLowerCase()
        const descricaoLower = (d.descricao || "").toLowerCase()
        const areaLower = (d.area?.nome || "").toLowerCase()

        if (nomeLower.startsWith(buscaLower)) {
            relevancia += 100
        } else if (nomeLower.includes(buscaLower)) {
            relevancia += 50
        }

        if (descricaoLower.includes(buscaLower)) {
            relevancia += 30
        }

        if (areaLower.includes(buscaLower)) {
            relevancia += 20
        }

        // Busca por nome de membro alocado
        d.alocacoes.forEach(a => {
            if (a.membro.nome.toLowerCase().includes(buscaLower)) {
                relevancia += 15
            }
        })

        return { demanda: d, relevancia }
    })

    return demandasComRelevancia
        .filter(d => d.relevancia > 0)
        .sort((a, b) => b.relevancia - a.relevancia)
        .map(d => ({
            id: d.demanda.id,
            nome: d.demanda.nome,
            descricao: d.demanda.descricao,
            finalizada: d.demanda.finalizada,
            creditoMembro: d.demanda.creditoMembro,
            creditoLider: d.demanda.creditoLider,
            area: d.demanda.area ? { id: d.demanda.area.id, nome: d.demanda.area.nome } : null,
            alocacoes: d.demanda.alocacoes.map(a => ({
                id: a.id,
                isLider: a.isLider,
                membro: {
                    id: a.membro.id,
                    nome: a.membro.nome,
                    fotoUrl: a.membro.fotoUrl,
                }
            })),
        }))
}

// Buscar membros ativos para alocação
export async function getMembrosParaAlocacao(): Promise<MembroParaAlocacao[]> {
    const membros = await prisma.membro.findMany({
        where: { isAtivo: true },
        include: { area: true },
        orderBy: { nome: "asc" },
    })

    return membros.map(m => ({
        id: m.id,
        nome: m.nome,
        fotoUrl: m.fotoUrl,
        area: m.area.nome,
    }))
}

// Criar demanda
export interface CreateDemandaInput {
    nome: string
    descricao?: string
    idArea?: number
    creditoMembro?: number
    creditoLider?: number
}

export async function createDemanda(data: CreateDemandaInput): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.demanda.create({
            data: {
                nome: data.nome,
                descricao: data.descricao || null,
                idArea: data.idArea || null,
                creditoMembro: data.creditoMembro || 0,
                creditoLider: data.creditoLider || 0,
                finalizada: false,
            },
        })
        revalidatePath("/coord/demandas")
        return { success: true }
    } catch (error) {
        console.error("Erro ao criar demanda:", error)
        return { success: false, error: "Erro ao criar demanda" }
    }
}

// Atualizar demanda
export interface UpdateDemandaInput {
    id: number
    nome: string
    descricao?: string
    idArea?: number
    creditoMembro?: number
    creditoLider?: number
    finalizada?: boolean
}

export async function updateDemanda(data: UpdateDemandaInput): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.demanda.update({
            where: { id: data.id },
            data: {
                nome: data.nome,
                descricao: data.descricao || null,
                idArea: data.idArea || null,
                creditoMembro: data.creditoMembro ?? 0,
                creditoLider: data.creditoLider ?? 0,
                finalizada: data.finalizada ?? false,
            },
        })
        revalidatePath("/coord/demandas")
        return { success: true }
    } catch (error) {
        console.error("Erro ao atualizar demanda:", error)
        return { success: false, error: "Erro ao atualizar demanda" }
    }
}

// Excluir demanda
export async function deleteDemanda(id: number): Promise<{ success: boolean; error?: string }> {
    try {
        // Primeiro remove as alocações
        await prisma.alocacaoDemanda.deleteMany({
            where: { demandaId: id },
        })

        // Depois remove a demanda
        await prisma.demanda.delete({
            where: { id },
        })
        revalidatePath("/coord/demandas")
        return { success: true }
    } catch (error) {
        console.error("Erro ao excluir demanda:", error)
        return { success: false, error: "Erro ao excluir demanda" }
    }
}

// Alocar membro em demanda
export async function alocarMembro(demandaId: number, membroId: number, isLider: boolean = false): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.alocacaoDemanda.create({
            data: {
                demandaId,
                membroId,
                isLider,
            },
        })
        revalidatePath("/coord/demandas")
        return { success: true }
    } catch (error) {
        console.error("Erro ao alocar membro:", error)
        return { success: false, error: "Erro ao alocar membro" }
    }
}

// Desalocar membro de demanda
export async function desalocarMembro(alocacaoId: number): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.alocacaoDemanda.delete({
            where: { id: alocacaoId },
        })
        revalidatePath("/coord/demandas")
        return { success: true }
    } catch (error) {
        console.error("Erro ao desalocar membro:", error)
        return { success: false, error: "Erro ao desalocar membro" }
    }
}

// Atualizar líder
export async function toggleLider(alocacaoId: number): Promise<{ success: boolean; error?: string }> {
    try {
        const alocacao = await prisma.alocacaoDemanda.findUnique({ where: { id: alocacaoId } })
        if (!alocacao) {
            return { success: false, error: "Alocação não encontrada" }
        }

        await prisma.alocacaoDemanda.update({
            where: { id: alocacaoId },
            data: { isLider: !alocacao.isLider },
        })
        revalidatePath("/coord/demandas")
        return { success: true }
    } catch (error) {
        console.error("Erro ao alterar líder:", error)
        return { success: false, error: "Erro ao alterar líder" }
    }
}
