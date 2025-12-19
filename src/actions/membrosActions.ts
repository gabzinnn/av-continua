"use server"

import prisma from "@/src/lib/prisma"
import { revalidatePath } from "next/cache"

export interface MembroCompleto {
    id: number
    nome: string
    fotoUrl: string | null
    dre: string
    periodo: string
    isAtivo: boolean
    isCoordenador: boolean
    area: {
        id: number
        nome: string
    }
}

export interface AreaOption {
    id: number
    nome: string
}

// Buscar todos os membros com busca por relevância
export async function getAllMembros(busca?: string): Promise<MembroCompleto[]> {
    const membros = await prisma.membro.findMany({
        include: { area: true },
        orderBy: { nome: "asc" },
    })

    if (!busca || busca.trim() === "") {
        return membros.map(m => ({
            id: m.id,
            nome: m.nome,
            fotoUrl: m.fotoUrl,
            dre: m.dre,
            periodo: m.periodo,
            isAtivo: m.isAtivo,
            isCoordenador: m.isCoordenador,
            area: {
                id: m.area.id,
                nome: m.area.nome,
            },
        }))
    }

    // Busca por relevância: prioriza nome > DRE > área
    const buscaLower = busca.toLowerCase().trim()

    const membrosComRelevancia = membros.map(m => {
        let relevancia = 0
        const nomeLower = m.nome.toLowerCase()
        const dreLower = m.dre.toLowerCase()
        const areaLower = m.area.nome.toLowerCase()

        // Match exato no início do nome: alta relevância
        if (nomeLower.startsWith(buscaLower)) {
            relevancia += 100
        } else if (nomeLower.includes(buscaLower)) {
            relevancia += 50
        }

        // Match no DRE
        if (dreLower.includes(buscaLower)) {
            relevancia += 30
        }

        // Match na área
        if (areaLower.includes(buscaLower)) {
            relevancia += 20
        }

        return {
            membro: m,
            relevancia,
        }
    })

    return membrosComRelevancia
        .filter(m => m.relevancia > 0)
        .sort((a, b) => b.relevancia - a.relevancia)
        .map(m => ({
            id: m.membro.id,
            nome: m.membro.nome,
            fotoUrl: m.membro.fotoUrl,
            dre: m.membro.dre,
            periodo: m.membro.periodo,
            isAtivo: m.membro.isAtivo,
            isCoordenador: m.membro.isCoordenador,
            area: {
                id: m.membro.area.id,
                nome: m.membro.area.nome,
            },
        }))
}

// Buscar todas as áreas
export async function getAllAreas(): Promise<AreaOption[]> {
    const areas = await prisma.area.findMany({
        orderBy: { nome: "asc" },
    })
    return areas.map(a => ({ id: a.id, nome: a.nome }))
}

// Criar novo membro
export interface CreateMembroInput {
    nome: string
    dre: string
    periodo: string
    areaId: number
    fotoUrl?: string
    isCoordenador?: boolean
}

export async function createMembro(data: CreateMembroInput): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.membro.create({
            data: {
                nome: data.nome,
                dre: data.dre,
                periodo: data.periodo,
                areaId: data.areaId,
                fotoUrl: data.fotoUrl || null,
                isCoordenador: data.isCoordenador || false,
                isAtivo: true,
            },
        })
        revalidatePath("/coord/membros")
        return { success: true }
    } catch (error) {
        console.error("Erro ao criar membro:", error)
        return { success: false, error: "Erro ao criar membro" }
    }
}

// Atualizar membro existente
export interface UpdateMembroInput {
    id: number
    nome: string
    dre: string
    periodo: string
    areaId: number
    fotoUrl?: string
    isCoordenador?: boolean
}

export async function updateMembro(data: UpdateMembroInput): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.membro.update({
            where: { id: data.id },
            data: {
                nome: data.nome,
                dre: data.dre,
                periodo: data.periodo,
                areaId: data.areaId,
                fotoUrl: data.fotoUrl || null,
                isCoordenador: data.isCoordenador || false,
            },
        })
        revalidatePath("/coord/membros")
        return { success: true }
    } catch (error) {
        console.error("Erro ao atualizar membro:", error)
        return { success: false, error: "Erro ao atualizar membro" }
    }
}

// Alternar status ativo/inativo
export async function toggleMembroStatus(id: number): Promise<{ success: boolean; error?: string }> {
    try {
        const membro = await prisma.membro.findUnique({ where: { id } })
        if (!membro) {
            return { success: false, error: "Membro não encontrado" }
        }

        await prisma.membro.update({
            where: { id },
            data: { isAtivo: !membro.isAtivo },
        })
        revalidatePath("/coord/membros")
        return { success: true }
    } catch (error) {
        console.error("Erro ao alterar status:", error)
        return { success: false, error: "Erro ao alterar status" }
    }
}
