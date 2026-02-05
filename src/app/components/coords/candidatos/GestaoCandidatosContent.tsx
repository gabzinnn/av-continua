"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { Button } from "@/src/app/components/Button"
import { EdicaoCard } from "./EdicaoCard"
import { StatsResumo } from "./StatsResumo"
import { getProcessosSeletivosComStats, ProcessoSeletivoComStats } from "@/src/actions/gestaoCandidatosActions"

export function GestaoCandidatosContent() {
    const [processos, setProcessos] = useState<ProcessoSeletivoComStats[]>([])
    const [selectedId, setSelectedId] = useState<number | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    const loadData = useCallback(async () => {
        setIsLoading(true)
        const data = await getProcessosSeletivosComStats()
        setProcessos(data)
        
        // Auto-select first active process or first process
        if (data.length > 0 && selectedId === null) {
            const activeProcess = data.find(p => p.ativo)
            setSelectedId(activeProcess?.id ?? data[0].id)
        }
        
        setIsLoading(false)
    }, [selectedId])

    useEffect(() => {
        loadData()
    }, [loadData])

    const selectedProcesso = processos.find(p => p.id === selectedId)

    const handleVerCandidatos = () => {
        if (selectedId) {
            router.push(`/coord/processo-seletivo/candidatos/${selectedId}`)
        }
    }

    return (
        <div className="flex-1 overflow-y-auto">
            {/* Header & Controls */}
            <div className="bg-bg-main border-b border-border">
                <div className="px-8 py-6 max-w-[1400px] mx-auto w-full flex flex-col gap-6">
                    {/* Breadcrumbs */}
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="text-text-muted">Home</span>
                        <span className="text-text-muted">/</span>
                        <span className="text-text-muted">Processo Seletivo</span>
                        <span className="text-text-muted">/</span>
                        <span className="text-text-main font-semibold">Gestão de Candidatos</span>
                    </div>

                    {/* Title & Primary Action */}
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div className="flex flex-col gap-1 max-w-2xl">
                            <h2 className="text-text-main text-3xl font-bold tracking-tight">Seleção de Edição</h2>
                            <p className="text-text-muted">
                                Selecione uma edição abaixo para visualizar o painel de métricas detalhadas e gerenciar os candidatos inscritos.
                            </p>
                        </div>
                        <Button
                            onClick={handleVerCandidatos}
                            disabled={!selectedId}
                            icon={<ArrowRight size={20} />}
                        >
                            Ver candidatos
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-8 pb-8 pt-6">
                <div className="max-w-[1400px] mx-auto w-full flex flex-col gap-8">
                    {isLoading ? (
                        <div className="py-12 text-center text-text-muted">Carregando...</div>
                    ) : processos.length === 0 ? (
                        <div className="py-12 text-center text-text-muted">
                            <p className="text-lg font-medium">Nenhum processo seletivo encontrado</p>
                            <p className="text-sm mt-2">Crie um processo seletivo para começar a gerenciar candidatos.</p>
                        </div>
                    ) : (
                        <>
                            {/* Edition Selection Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {processos.map((processo) => (
                                    <EdicaoCard
                                        key={processo.id}
                                        id={processo.id}
                                        nome={processo.nome}
                                        descricao={processo.descricao}
                                        ativo={processo.ativo}
                                        createdAt={processo.createdAt}
                                        stats={processo.stats}
                                        isSelected={selectedId === processo.id}
                                        onClick={() => setSelectedId(processo.id)}
                                    />
                                ))}
                            </div>

                            {/* Stats Bar */}
                            {selectedProcesso && (
                                <StatsResumo
                                    processoNome={selectedProcesso.nome}
                                    stats={selectedProcesso.stats}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
