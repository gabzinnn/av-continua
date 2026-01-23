"use server"

import prisma from "@/src/lib/prisma"
import { revalidatePath } from "next/cache"

export interface Ciclo {
    id: number
    nome: string
    ativo: boolean
}

// Buscar todos os ciclos
export async function getCiclos(): Promise<Ciclo[]> {
    const ciclos = await prisma.ciclo.findMany({
        orderBy: { nome: "desc" },
    })
    return ciclos.map(c => ({
        id: c.id,
        nome: c.nome,
        ativo: c.ativo,
    }))
}

// Buscar ciclo ativo
export async function getCicloAtivo(): Promise<Ciclo | null> {
    const ciclo = await prisma.ciclo.findFirst({
        where: { ativo: true },
        orderBy: { nome: "desc" },
    })
    if (!ciclo) return null
    return {
        id: ciclo.id,
        nome: ciclo.nome,
        ativo: ciclo.ativo,
    }
}

// Criar novo ciclo
export async function criarCiclo(nome: string): Promise<{ success: boolean; error?: string; ciclo?: Ciclo }> {
    try {
        // Validar formato (YYYY.S onde S é 1 ou 2)
        const regex = /^\d{4}\.[12]$/
        if (!regex.test(nome)) {
            return { success: false, error: "Formato inválido. Use YYYY.1 ou YYYY.2 (ex: 2026.1)" }
        }

        // Verificar se já existe
        const existente = await prisma.ciclo.findFirst({
            where: { nome },
        })
        if (existente) {
            return { success: false, error: "Este ciclo já existe" }
        }

        // Desativar outros ciclos
        await prisma.ciclo.updateMany({
            data: { ativo: false },
        })

        // Criar novo ciclo como ativo
        const ciclo = await prisma.ciclo.create({
            data: { nome, ativo: true },
        })

        revalidatePath("/coord/avaliacoes")
        return {
            success: true,
            ciclo: { id: ciclo.id, nome: ciclo.nome, ativo: ciclo.ativo }
        }
    } catch (error) {
        console.error("Erro ao criar ciclo:", error)
        return { success: false, error: "Erro ao criar ciclo" }
    }
}

// Ativar um ciclo (e desativar os outros)
export async function ativarCiclo(cicloId: number): Promise<{ success: boolean; error?: string }> {
    try {
        // Desativar todos
        await prisma.ciclo.updateMany({
            data: { ativo: false },
        })

        // Ativar o selecionado
        await prisma.ciclo.update({
            where: { id: cicloId },
            data: { ativo: true },
        })

        revalidatePath("/coord/avaliacoes")
        return { success: true }
    } catch (error) {
        console.error("Erro ao ativar ciclo:", error)
        return { success: false, error: "Erro ao ativar ciclo" }
    }
}
