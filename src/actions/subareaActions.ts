"use server"

import prisma from "@/src/lib/prisma"
import { revalidatePath } from "next/cache"

// Tipos
export interface SubareaCompleta {
    id: number
    nome: string
    areaId: number
    areaNome: string
}

export interface SubareaOption {
    id: number
    nome: string
    areaId: number
}

// Buscar todas as subáreas
export async function getAllSubareas(): Promise<SubareaCompleta[]> {
    const subareas = await prisma.subarea.findMany({
        include: { area: true },
        orderBy: [{ area: { nome: "asc" } }, { nome: "asc" }],
    })

    return subareas.map(s => ({
        id: s.id,
        nome: s.nome,
        areaId: s.areaId,
        areaNome: s.area.nome,
    }))
}

// Buscar subáreas de uma área específica
export async function getSubareasByArea(areaId: number): Promise<SubareaOption[]> {
    const subareas = await prisma.subarea.findMany({
        where: { areaId },
        orderBy: { nome: "asc" },
    })

    return subareas.map(s => ({
        id: s.id,
        nome: s.nome,
        areaId: s.areaId,
    }))
}

// Verificar se uma área tem subáreas
export async function areaTemSubareas(areaId: number): Promise<boolean> {
    const count = await prisma.subarea.count({
        where: { areaId },
    })
    return count > 0
}

// Criar nova subárea
export interface CreateSubareaInput {
    nome: string
    areaId: number
}

export async function createSubarea(data: CreateSubareaInput): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.subarea.create({
            data: {
                nome: data.nome,
                areaId: data.areaId,
            },
        })
        revalidatePath("/coord/membros")
        revalidatePath("/coord/demandas")
        return { success: true }
    } catch (error) {
        console.error("Erro ao criar subárea:", error)
        return { success: false, error: "Erro ao criar subárea" }
    }
}

// Atualizar subárea
export interface UpdateSubareaInput {
    id: number
    nome: string
    areaId: number
}

export async function updateSubarea(data: UpdateSubareaInput): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.subarea.update({
            where: { id: data.id },
            data: {
                nome: data.nome,
                areaId: data.areaId,
            },
        })
        revalidatePath("/coord/membros")
        revalidatePath("/coord/demandas")
        return { success: true }
    } catch (error) {
        console.error("Erro ao atualizar subárea:", error)
        return { success: false, error: "Erro ao atualizar subárea" }
    }
}

// Excluir subárea
export async function deleteSubarea(id: number): Promise<{ success: boolean; error?: string }> {
    try {
        // Verificar se há membros ou demandas vinculados
        const [membrosCount, demandasCount] = await Promise.all([
            prisma.membro.count({ where: { subareaId: id } }),
            prisma.demanda.count({ where: { idSubarea: id } }),
        ])

        if (membrosCount > 0) {
            return { success: false, error: `Existem ${membrosCount} membro(s) vinculado(s) a esta subárea` }
        }

        if (demandasCount > 0) {
            return { success: false, error: `Existem ${demandasCount} demanda(s) vinculada(s) a esta subárea` }
        }

        await prisma.subarea.delete({
            where: { id },
        })
        revalidatePath("/coord/membros")
        revalidatePath("/coord/demandas")
        return { success: true }
    } catch (error) {
        console.error("Erro ao excluir subárea:", error)
        return { success: false, error: "Erro ao excluir subárea" }
    }
}

// Buscar líderes de subárea de uma área
export async function getLideresSubareaByArea(areaId: number): Promise<{ id: number; nome: string; subareaId: number; subareaNome: string }[]> {
    const lideres = await prisma.membro.findMany({
        where: {
            areaId,
            isLiderSubarea: true,
            isAtivo: true,
            subareaId: { not: null },
        },
        include: { subarea: true },
        orderBy: { nome: "asc" },
    })

    return lideres.map(l => ({
        id: l.id,
        nome: l.nome,
        subareaId: l.subareaId!,
        subareaNome: l.subarea!.nome,
    }))
}

// Buscar líder de uma subárea específica
export async function getLiderSubarea(subareaId: number): Promise<{ id: number; nome: string } | null> {
    const lider = await prisma.membro.findFirst({
        where: {
            subareaId,
            isLiderSubarea: true,
            isAtivo: true,
        },
        select: { id: true, nome: true },
    })

    return lider
}
