"use client"

import { useMember } from "@/src/context/memberContext"
import { useEffect, useState } from "react"
import { getHistoricoTermometro, TermometroHistoricoData } from "@/src/actions/termometroActions"
import { Card } from "../Card"
import { TermometroHistoricoChart } from "../membro/TermometroHistoricoChart"
import { TermometroHistoricoCard } from "../membro/TermometroHistoricoCard"

export function HistoricoTermometroContent() {
    const { selectedMember, isLoading: isMemberLoading } = useMember()
    const [data, setData] = useState<TermometroHistoricoData | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            if (!selectedMember?.id) return

            setIsLoading(true)
            try {
                const result = await getHistoricoTermometro(Number(selectedMember.id))
                setData(result)
            } catch (error) {
                console.error("Erro ao carregar histórico de termômetros:", error)
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
            {/* Header */}
            <header className="w-full px-8 py-6 bg-bg-main md:sticky md:top-0 z-10">
                <div className="max-w-[1200px] mx-auto flex flex-col gap-2">
                    <h1 className="text-text-main text-3xl font-black leading-tight tracking-tight">
                        Histórico de Termômetros
                    </h1>
                    <p className="text-text-muted text-base font-normal">
                        Acompanhe sua evolução nos termômetros de bem-estar e produtividade ao longo do tempo.
                    </p>
                </div>
            </header>

            {/* Content */}
            <div className="px-8 pb-10">
                <div className="max-w-[1200px] mx-auto flex flex-col gap-8">
                    {/* Gráfico de Evolução */}
                    <Card className="overflow-hidden">
                        <div className="p-6 border-b border-border">
                            <h2 className="text-lg font-bold text-text-main">Evolução das Médias</h2>
                            <p className="text-sm text-text-muted">
                                Visualize como suas médias evoluíram nos últimos termômetros
                            </p>
                        </div>
                        <div className="md:p-6">
                            {data && data.evolucao.length > 1 ? (
                                <TermometroHistoricoChart data={data.evolucao} />
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <span className="material-symbols-outlined text-5xl text-gray-300 mb-3">
                                        show_chart
                                    </span>
                                    <h3 className="text-base font-semibold text-text-main mb-1">
                                        Dados insuficientes para o gráfico
                                    </h3>
                                    <p className="text-text-muted text-sm max-w-sm">
                                        O gráfico de evolução aparecerá quando você tiver respondido a pelo menos dois termômetros.
                                    </p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Lista de Termômetros */}
                    <div className="flex flex-col gap-2">
                        <h2 className="text-lg font-bold text-text-main">Termômetros Respondidos</h2>
                        <p className="text-sm text-text-muted mb-2">
                            Clique em um termômetro para ver os detalhes das suas respostas.
                        </p>
                    </div>

                    {data && data.termometros.length > 0 ? (
                        <div className="flex flex-col gap-4">
                            {[...data.termometros].reverse().map((t) => (
                                <TermometroHistoricoCard
                                    key={t.id}
                                    nome={t.nome}
                                    dataInicial={t.dataInicial}
                                    dataFinal={t.dataFinal}
                                    perguntas={t.perguntas}
                                    minhasNotas={t.minhasNotas}
                                    minhaMedia={t.minhaMedia}
                                    mediaGeral={t.mediaGeral}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">
                                thermostat
                            </span>
                            <h3 className="text-lg font-semibold text-text-main mb-2">
                                Nenhum termômetro respondido
                            </h3>
                            <p className="text-text-muted max-w-md">
                                Quando você responder termômetros e eles forem encerrados, o histórico aparecerá aqui.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
