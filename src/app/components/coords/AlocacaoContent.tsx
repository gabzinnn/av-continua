"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { Star } from "lucide-react"
import { getAlocacaoOverview, AlocacaoOverviewData } from "@/src/actions/alocacaoActions"
import coresAreas from "@/src/utils/coresAreas"

function getInitials(nome: string): string {
    const parts = nome.split(" ")
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return nome.substring(0, 2).toUpperCase()
}

export function AlocacaoContent() {
    const [data, setData] = useState<AlocacaoOverviewData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [selectedArea, setSelectedArea] = useState<number | undefined>(undefined)
    const [filtroMembros, setFiltroMembros] = useState(true)
    const [filtroDemandas, setFiltroDemandas] = useState(true)

    const loadData = useCallback(async () => {
        setIsLoading(true)
        // Se tem área selecionada, aplicar filtros individuais
        // Se filtro está marcado, filtra pela área; se desmarcado, mostra todas
        const membrosFilter = selectedArea && filtroMembros ? selectedArea : undefined
        const demandasFilter = selectedArea && filtroDemandas ? selectedArea : undefined
        
        const result = await getAlocacaoOverview(undefined, membrosFilter, demandasFilter)
        setData(result)
        setIsLoading(false)
    }, [selectedArea, filtroMembros, filtroDemandas])

    useEffect(() => {
        loadData()
    }, [loadData])

    // Agrupar membros por área para exibição
    const membrosPorArea = data?.membros.reduce((acc, membro) => {
        const areaNome = membro.area.nome
        if (!acc[areaNome]) {
            acc[areaNome] = []
        }
        acc[areaNome].push(membro)
        return acc
    }, {} as Record<string, typeof data.membros>) || {}

    return (
        <div className="flex-1 overflow-y-auto">
            {/* Header */}
            <div className="bg-bg-main border-b border-border">
                <div className="px-8 py-6 max-w-[1600px] mx-auto w-full flex flex-col gap-5">
                    {/* Breadcrumbs */}
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="text-text-muted">Home</span>
                        <span className="text-text-muted">/</span>
                        <span className="text-text-main font-semibold">Overview de Alocação</span>
                    </div>

                    {/* Title */}
                    <div className="flex flex-col gap-1">
                        <h2 className="text-text-main text-3xl font-bold tracking-tight">Overview de Alocação</h2>
                        <p className="text-text-muted">Visualize a distribuição de demandas e membros alocados.</p>
                    </div>

                    {/* Area Filters */}
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={() => setSelectedArea(undefined)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                                selectedArea === undefined
                                    ? "bg-primary text-text-main"
                                    : "bg-bg-card border border-border text-text-muted hover:bg-gray-100"
                            }`}
                        >
                            Todas as Áreas
                        </button>
                        {data?.areas.map((area) => (
                            <button
                                key={area.id}
                                onClick={() => setSelectedArea(area.id)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                                    selectedArea === area.id
                                        ? "bg-primary text-text-main"
                                        : "bg-bg-card border border-border text-text-muted hover:bg-gray-100"
                                }`}
                            >
                                {area.nome}
                            </button>
                        ))}
                    </div>

                    {/* Filter Toggles - only show when an area is selected */}
                    {selectedArea && (
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-text-muted">Filtrar por:</span>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={filtroMembros}
                                    onChange={(e) => setFiltroMembros(e.target.checked)}
                                    className="w-4 h-4 rounded border-border cursor-pointer accent-primary"
                                />
                                <span className="text-sm text-text-main">Membros da área</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={filtroDemandas}
                                    onChange={(e) => setFiltroDemandas(e.target.checked)}
                                    className="w-4 h-4 rounded border-border cursor-pointer accent-primary"
                                />
                                <span className="text-sm text-text-main">Demandas da área</span>
                            </label>
                        </div>
                    )}

                    {/* Legend */}
                    <div className="flex items-center gap-6 text-sm text-text-muted">
                        <div className="flex items-center gap-2">
                            <Star size={16} className="text-primary fill-primary" />
                            <span>Líder</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-secondary/50 border border-secondary"></div>
                            <span>Alocado</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Matrix Table */}
            <div className="px-8 pb-8 pt-6">
                <div className="max-w-[1600px] mx-auto w-full">
                    {isLoading ? (
                        <div className="bg-bg-card rounded-xl border border-border p-12 text-center text-text-muted">
                            Carregando...
                        </div>
                    ) : !data || data.membros.length === 0 ? (
                        <div className="bg-bg-card rounded-xl border border-border p-12 text-center text-text-muted">
                            Nenhum membro encontrado
                        </div>
                    ) : data.demandas.length === 0 ? (
                        <div className="bg-bg-card rounded-xl border border-border p-12 text-center text-text-muted">
                            Nenhuma demanda ativa encontrada
                        </div>
                    ) : (
                        <div className="bg-bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse min-w-[800px]">
                                    <thead>
                                        <tr className="bg-[#fcfbf8] border-b border-border">
                                            {/* Sticky First Column */}
                                            <th className="sticky left-0 z-20 bg-[#fcfbf8] px-6 py-4 text-left w-[280px] border-r border-border shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">
                                                <span className="text-xs uppercase tracking-wider font-bold text-text-muted">
                                                    Membro / Demanda
                                                </span>
                                            </th>
                                            {/* Demand Columns */}
                                            {data.demandas.map((demanda) => (
                                                <th key={demanda.id} className="px-4 py-4 text-left min-w-[140px]">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-sm font-bold text-text-main line-clamp-2">
                                                            {demanda.nome}
                                                        </span>
                                                        {demanda.area && (
                                                            <span 
                                                                className="inline-flex items-center text-center px-2 py-0.5 rounded-full text-[10px] font-medium text-text-main w-fit whitespace-nowrap"
                                                                style={{ backgroundColor: coresAreas(demanda.area) }}
                                                            >
                                                                {demanda.area}
                                                            </span>
                                                        )}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {Object.entries(membrosPorArea).map(([areaNome, membros]) => (
                                            <>
                                                {/* Area Header Row */}
                                                <tr key={`area-${areaNome}`} className="bg-gray-50">
                                                    <td 
                                                        className="sticky left-0 z-10 bg-gray-50 px-6 py-1 border-r border-border shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]"
                                                    >
                                                        <span 
                                                            className="inline-flex items-center text-center px-2 py-0.5 rounded-full text-[10px] font-bold text-text-main w-fit whitespace-nowrap"
                                                            style={{ backgroundColor: coresAreas(areaNome) }}
                                                        >
                                                            {areaNome}
                                                        </span>
                                                    </td>
                                                    <td colSpan={data.demandas.length} className="bg-gray-50"></td>
                                                </tr>
                                                {/* Member Rows */}
                                                {membros.map((membro) => (
                                                    <tr 
                                                        key={membro.id} 
                                                        className="group hover:bg-gray-50 transition-colors"
                                                    >
                                                        {/* Sticky Member Cell */}
                                                        <td className="sticky left-0 z-10 bg-bg-card group-hover:bg-gray-50 border-r border-border px-6 py-4 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.03)]">
                                                            <div className="flex items-center gap-3">
                                                                {membro.fotoUrl ? (
                                                                    <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white shadow-sm">
                                                                        <Image
                                                                            src={membro.fotoUrl}
                                                                            alt={membro.nome}
                                                                            width={40}
                                                                            height={40}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-10 h-10 rounded-full bg-secondary/40 flex items-center justify-center text-sm font-bold text-text-main ring-2 ring-white shadow-sm">
                                                                        {getInitials(membro.nome)}
                                                                    </div>
                                                                )}
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-bold text-text-main">{membro.nome}</span>
                                                                    <span className="text-xs text-text-muted">
                                                                        {membro.totalCreditos.toFixed(1)} créditos
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        {/* Allocation Cells */}
                                                        {data.demandas.map((demanda) => {
                                                            const alocacao = membro.alocacoes.find(a => a.demandaId === demanda.id)
                                                            
                                                            if (!alocacao) {
                                                                return (
                                                                    <td key={demanda.id} className="px-4 py-3 text-center">
                                                                        <span className="text-gray-300 text-xl font-light">—</span>
                                                                    </td>
                                                                )
                                                            }

                                                            if (alocacao.isLider) {
                                                                return (
                                                                    <td key={demanda.id} className="px-4 py-3">
                                                                        <div className="bg-primary/20 border border-primary/40 rounded-lg p-3 min-h-[60px] flex flex-col justify-between">
                                                                            <div className="flex justify-between items-start">
                                                                                <span className="text-xs font-bold text-text-main uppercase tracking-tight">Líder</span>
                                                                                <Star size={16} className="text-primary fill-primary" />
                                                                            </div>
                                                                            <span className="text-sm font-medium text-text-main mt-2">
                                                                                +{demanda.creditoLider.toFixed(1)}
                                                                            </span>
                                                                        </div>
                                                                    </td>
                                                                )
                                                            }

                                                            return (
                                                                <td key={demanda.id} className="px-4 py-3">
                                                                    <div className="bg-secondary/30 border border-secondary rounded-lg p-3 min-h-[60px] flex flex-col justify-between">
                                                                        <span className="text-xs font-medium text-text-muted">Membro</span>
                                                                        <span className="text-sm font-medium text-text-main mt-2">
                                                                            +{demanda.creditoMembro.toFixed(1)}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                            )
                                                        })}
                                                    </tr>
                                                ))}
                                            </>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Footer */}
                            <div className="bg-[#fcfbf8] border-t border-border px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-6 text-sm text-text-muted">
                                    <span className="font-semibold uppercase tracking-wide text-xs">Legenda:</span>
                                    <div className="flex items-center gap-2">
                                        <Star size={14} className="text-primary fill-primary" />
                                        <span>Líder da Demanda</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded bg-secondary/30 border border-secondary"></div>
                                        <span>Membro Alocado</span>
                                    </div>
                                </div>
                                <span className="text-xs text-text-muted">
                                    {data.membros.length} membros · {data.demandas.length} demandas ativas
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
