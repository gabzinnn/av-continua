"use server"

import prisma from "@/src/lib/prisma"

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
    // Conta total de membros ativos
    const totalMembros = await prisma.membro.count({
        where: { isAtivo: true }
    })

    // Busca membros com área
    const membrosDb = await prisma.membro.findMany({
        where: { isAtivo: true },
        include: { area: true },
        orderBy: { nome: "asc" },
        take: 10,
    })

    const membros: MembroResumo[] = membrosDb.map(m => ({
        id: m.id,
        nome: m.nome,
        area: m.area.nome,
        dre: m.dre,
        fotoUrl: m.fotoUrl,
        isAtivo: m.isAtivo,
    }))

    // Busca demandas com área
    const demandasDb = await prisma.demanda.findMany({
        where: { finalizada: false },
        include: { area: true },
        orderBy: { createdAt: "desc" },
        take: 10,
    })

    const demandas: DemandaResumo[] = demandasDb.map(d => ({
        id: d.id,
        nome: d.nome,
        descricao: d.descricao || "",
        area: d.area?.nome || "Sem área",
    }))

    const totalDemandas = await prisma.demanda.count({
        where: { finalizada: false }
    })

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
