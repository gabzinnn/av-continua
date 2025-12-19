"use server"

import prisma from "@/src/lib/prisma"

// Ordem das áreas
const AREA_ORDER: Record<string, number> = {
    "Coordenação Geral": 0,
    "Organização Interna": 1,
    "Academia de Preparação": 2,
    "Escola de Negócios": 3,
    "Fábrica de Consultores": 4,
}

export interface MembroAlocacao {
    id: number
    nome: string
    fotoUrl: string | null
    area: {
        id: number
        nome: string
    }
    totalCreditos: number
    alocacoes: {
        demandaId: number
        isLider: boolean
    }[]
}

export interface DemandaHeader {
    id: number
    nome: string
    area: string | null
    creditoMembro: number
    creditoLider: number
}

export interface AlocacaoOverviewData {
    membros: MembroAlocacao[]
    demandas: DemandaHeader[]
    areas: { id: number; nome: string }[]
}

export async function getAlocacaoOverview(areaId?: number): Promise<AlocacaoOverviewData> {
    // Buscar todas as áreas
    const areas = await prisma.area.findMany({
        orderBy: { nome: "asc" },
    })

    // Buscar demandas ativas (não finalizadas), ordenadas por área
    const demandas = await prisma.demanda.findMany({
        where: {
            finalizada: false,
            ...(areaId ? { idArea: areaId } : {}),
        },
        include: {
            area: true,
            alocacoes: true,
        },
        orderBy: { createdAt: "desc" },
    })

    // Ordenar demandas por área
    const demandasOrdenadas = demandas.sort((a, b) => {
        const orderA = AREA_ORDER[a.area?.nome || ""] ?? 999
        const orderB = AREA_ORDER[b.area?.nome || ""] ?? 999
        return orderA - orderB
    })

    // Buscar membros ativos
    const membrosQuery = areaId
        ? { isAtivo: true, areaId }
        : { isAtivo: true }

    const membros = await prisma.membro.findMany({
        where: membrosQuery,
        include: {
            area: true,
            alocacoes: {
                include: {
                    demanda: true,
                }
            },
        },
    })

    // Processar membros com créditos
    const membrosProcessados: MembroAlocacao[] = membros.map(m => {
        // Calcular total de créditos
        let totalCreditos = 0
        m.alocacoes.forEach(a => {
            if (!a.demanda.finalizada) {
                if (a.isLider) {
                    totalCreditos += a.demanda.creditoLider
                } else {
                    totalCreditos += a.demanda.creditoMembro
                }
            }
        })

        return {
            id: m.id,
            nome: m.nome,
            fotoUrl: m.fotoUrl,
            area: {
                id: m.area.id,
                nome: m.area.nome,
            },
            totalCreditos,
            alocacoes: m.alocacoes
                .filter(a => !a.demanda.finalizada)
                .map(a => ({
                    demandaId: a.demandaId,
                    isLider: a.isLider,
                })),
        }
    })

    // Ordenar membros por área (na ordem definida) e depois alfabeticamente
    const membrosOrdenados = membrosProcessados.sort((a, b) => {
        const orderA = AREA_ORDER[a.area.nome] ?? 999
        const orderB = AREA_ORDER[b.area.nome] ?? 999
        if (orderA !== orderB) return orderA - orderB
        return a.nome.localeCompare(b.nome)
    })

    return {
        membros: membrosOrdenados,
        demandas: demandasOrdenadas.map(d => ({
            id: d.id,
            nome: d.nome,
            area: d.area?.nome || null,
            creditoMembro: d.creditoMembro,
            creditoLider: d.creditoLider,
        })),
        areas: areas.map(a => ({ id: a.id, nome: a.nome })),
    }
}
