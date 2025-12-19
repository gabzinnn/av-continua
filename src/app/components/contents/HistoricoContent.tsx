"use client"

import { useMember } from "@/src/context/memberContext"
import { useEffect, useState } from "react"
import { getHistoricoData, EvolucaoData, PlanoAcaoHistorico } from "@/src/actions/historicoActions"
import { Card } from "../Card"
import { HistoricoChart } from "../HistoricoChart"
import { PlanoAcaoList } from "../historico/PlanoAcaoList"

interface HistoricoData {
    evolucaoDesempenho: EvolucaoData[]
    planosAcao: PlanoAcaoHistorico[]
}

export function HistoricoContent() {
    const { selectedMember, isLoading: isMemberLoading } = useMember()
    const [data, setData] = useState<HistoricoData | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            if (!selectedMember?.id) return

            setIsLoading(true)
            try {
                const historicoData = await getHistoricoData(Number(selectedMember.id))
                setData(historicoData)
            } catch (error) {
                console.error("Erro ao carregar histórico:", error)
            } finally {
                setIsLoading(false)
            }
        }

        if (!isMemberLoading) {
            fetchData()
        }
    }, [selectedMember?.id, isMemberLoading])

    if (isMemberLoading || isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-text-muted">Carregando...</div>
            </div>
        )
    }

    return (
        <div className="flex-1 overflow-y-auto">
            {/* Header - sticky only on desktop */}
            <header className="w-full px-8 py-6 bg-bg-main md:sticky md:top-0 z-10">
                <div className="max-w-[1200px] mx-auto flex flex-col gap-2">
                    <h1 className="text-text-main text-3xl font-black leading-tight tracking-tight">
                        Histórico de Desempenho
                    </h1>
                    <p className="text-text-muted text-base font-normal">
                        Visualize sua evolução ao longo do tempo e acompanhe seus planos de ação.
                    </p>
                </div>
            </header>

            {/* Content */}
            <div className="px-8 pb-10">
                <div className="max-w-[1200px] mx-auto flex flex-col gap-8">
                    {/* Gráfico de Evolução */}
                    <Card className="overflow-hidden">
                        <div className="p-6 border-b border-border">
                            <h2 className="text-lg font-bold text-text-main">Evolução de Métricas</h2>
                            <p className="text-sm text-text-muted">
                                Visualize o progresso nos últimos meses
                            </p>
                        </div>
                        <div className="md:p-6">
                            {data && data.evolucaoDesempenho.length > 0 ? (
                                <HistoricoChart data={data.evolucaoDesempenho} />
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <span className="material-symbols-outlined text-5xl text-gray-300 mb-3">
                                        show_chart
                                    </span>
                                    <h3 className="text-base font-semibold text-text-main mb-1">
                                        Sem dados de evolução ainda
                                    </h3>
                                    <p className="text-text-muted text-sm max-w-sm">
                                        O gráfico aparecerá quando você receber avaliações.
                                    </p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Planos de Ação */}
                    {data && <PlanoAcaoList planos={data.planosAcao} />}
                </div>
            </div>
        </div>
    )
}
