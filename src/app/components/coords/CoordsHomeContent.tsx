"use client"

import { useEffect, useState } from "react"
import { getCoordsHomeData, CoordsHomeData } from "@/src/actions/coordsHomeActions"
import { StatCard } from "./StatCard"
import { MembrosTable } from "./MembrosTable"
import { DemandasTable } from "./DemandasTable"
import { Users, CheckSquare } from "lucide-react"

export function CoordsHomeContent() {
    const [data, setData] = useState<CoordsHomeData | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            try {
                const result = await getCoordsHomeData()
                setData(result)
            } catch (error) {
                console.error("Erro ao carregar dados:", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [])

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-text-muted">Carregando...</div>
            </div>
        )
    }

    if (!data) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-text-muted">Erro ao carregar dados</div>
            </div>
        )
    }

    return (
        <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-[1200px] mx-auto flex flex-col gap-8 pb-12">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h2 className="text-text-main tracking-tight text-[32px] font-bold leading-tight">
                            Painel Principal
                        </h2>
                        <p className="text-gray-500 text-base mt-1">
                            Visão geral da equipe e demandas prioritárias.
                        </p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <StatCard
                        title="Quantidade de Membros"
                        value={data.totalMembros}
                        icon={Users}
                    />
                    <StatCard
                        title="Demandas em Andamento"
                        value={data.totalDemandas}
                        icon={CheckSquare}
                    />
                </div>

                {/* Membros Table */}
                <MembrosTable 
                    membrosIniciais={data.membros} 
                    total={data.totalMembros} 
                />

                {/* Demandas Table */}
                <DemandasTable 
                    demandas={data.demandas} 
                    total={data.totalDemandas} 
                />
            </div>
        </div>
    )
}
