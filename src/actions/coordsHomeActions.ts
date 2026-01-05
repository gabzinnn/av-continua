"use server"

import prisma from "@/src/lib/prisma"

// Ordem padrão das áreas (mesma ordem de membrosActions.ts e demandasActions.ts)
const AREA_ORDER: Record<string, number> = {
    "Coordenação Geral": 0,
    "Organização Interna": 1,
    "Academia de Preparação": 2,
    "Escola de Negócios": 3,
    "Fábrica de Consultores": 4,
}

export interface MembroResumo {
    id: number
    nome: string
    area: string
    dre: string
    fotoUrl: string | null
    isAtivo: boolean
}

export interface DemandaResumo {
    id: number
    nome: string
    descricao: string
    area: string
}

export interface CoordsHomeData {
    totalMembros: number
    totalDemandas: number
    membros: MembroResumo[]
    demandas: DemandaResumo[]
}

export async function getCoordsHomeData(): Promise<CoordsHomeData> {
    // Buscar todos os dados em paralelo para melhor performance
    const [totalMembros, totalDemandas, membrosDb, demandasDb] = await Promise.all([
        prisma.membro.count({ where: { isAtivo: true } }),
        prisma.demanda.count({ where: { finalizada: false } }),
        prisma.membro.findMany({
            where: { isAtivo: true },
            include: { area: true },
        }),
        prisma.demanda.findMany({
            where: { finalizada: false },
            include: { area: true },
        }),
    ])

    // Ordenar membros por área (ordem padrão) e depois alfabeticamente por nome
    membrosDb.sort((a, b) => {
        const orderA = AREA_ORDER[a.area.nome] ?? 999
        const orderB = AREA_ORDER[b.area.nome] ?? 999
        if (orderA !== orderB) return orderA - orderB
        return a.nome.localeCompare(b.nome)
    })

    const membros: MembroResumo[] = membrosDb.map(m => ({
        id: m.id,
        nome: m.nome,
        area: m.area.nome,
        dre: m.dre,
        fotoUrl: m.fotoUrl,
        isAtivo: m.isAtivo,
    }))

    // Ordenar demandas por área (ordem padrão)
    demandasDb.sort((a, b) => {
        const orderA = AREA_ORDER[a.area?.nome ?? ""] ?? 999
        const orderB = AREA_ORDER[b.area?.nome ?? ""] ?? 999
        return orderA - orderB
    })

    const demandas: DemandaResumo[] = demandasDb.map(d => ({
        id: d.id,
        nome: d.nome,
        descricao: d.descricao || "",
        area: d.area?.nome || "Sem área",
    }))

    return {
        totalMembros,
        totalDemandas,
        membros,
        demandas,
    }
}

export async function getMembrosPage(page: number, pageSize: number = 4): Promise<{
    membros: MembroResumo[]
    total: number
}> {
    const total = await prisma.membro.count({ where: { isAtivo: true } })

    const membrosDb = await prisma.membro.findMany({
        where: { isAtivo: true },
        include: { area: true },
        orderBy: { nome: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
    })

    const membros: MembroResumo[] = membrosDb.map(m => ({
        id: m.id,
        nome: m.nome,
        area: m.area.nome,
        dre: m.dre,
        fotoUrl: m.fotoUrl,
        isAtivo: m.isAtivo,
    }))

    return { membros, total }
}
