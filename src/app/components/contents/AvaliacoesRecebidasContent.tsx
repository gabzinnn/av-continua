"use client"

import { useMember } from "@/src/context/memberContext"
import { useEffect, useState } from "react"
import { getAvaliacoesRecebidas, AvaliacaoRecebida } from "@/src/actions/avaliacoesRecebidasActions"
import { AvaliacaoCard } from "../avaliacao/AvaliacaoCard"

export function AvaliacoesRecebidasContent() {
    const { selectedMember, isLoading: isMemberLoading } = useMember()
    const [avaliacoes, setAvaliacoes] = useState<AvaliacaoRecebida[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            if (!selectedMember?.id) return

            setIsLoading(true)
            try {
                const data = await getAvaliacoesRecebidas(Number(selectedMember.id))

                setAvaliacoes(data)
            } catch (error) {
                console.error("Erro ao carregar avaliações:", error)
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
            <header className="w-full px-8 py-6 bg-bg-main sticky top-0 z-10">
                <div className="max-w-[1200px] mx-auto flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-text-main text-3xl font-black leading-tight tracking-tight">
                            Minhas Avaliações Recebidas
                        </h1>
                        <p className="text-text-muted text-base font-normal">
                            Veja o feedback detalhado e a classificação qualitativa que você recebeu de outros membros.
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-between items-center gap-4 py-2 border-b border-border">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-text-main">Ordenar por:</span>
                            <div className="relative group">
                                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-card border border-border text-sm font-medium shadow-sm hover:border-primary transition-colors">
                                    Mais recentes
                                    <span className="material-symbols-outlined text-[18px]">expand_more</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="px-8 pb-10">
                <div className="max-w-[1200px] mx-auto flex flex-col gap-6">
                    {avaliacoes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">inbox</span>
                            <h3 className="text-lg font-semibold text-text-main mb-2">
                                Nenhuma avaliação recebida ainda
                            </h3>
                            <p className="text-text-muted max-w-md">
                                Quando outros membros finalizarem suas avaliações sobre você, elas aparecerão aqui.
                            </p>
                        </div>
                    ) : (
                        avaliacoes.map((avaliacao) => (
                            <AvaliacaoCard
                                key={avaliacao.id}
                                avaliacao={avaliacao}
                                membroId={Number(selectedMember?.id)}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
