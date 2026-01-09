"use client"

import { TermometroDetalhes } from "@/src/actions/termometroActions"
import { BarChart2, ThumbsUp, ThumbsDown, Users } from "lucide-react"

interface TermometroStatsCardsProps {
    data: TermometroDetalhes
}

export function TermometroStatsCards({ data }: TermometroStatsCardsProps) {
    return (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Média Geral */}
            <div className="relative flex flex-col gap-1 p-5 rounded-xl border border-border bg-bg-card shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                    <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Média Geral</p>
                    <BarChart2 size={20} className="text-primary" />
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                    <p className="text-4xl font-bold text-text-main">{data.mediaGeral.toFixed(1)}</p>
                    <span className="text-sm font-medium text-gray-400">/ 5.0</span>
                </div>
            </div>

            {/* Melhor Demanda */}
            <div className="relative flex flex-col gap-1 p-5 rounded-xl border border-border bg-bg-card shadow-sm hover:shadow-md transition-shadow group">
                <div className="absolute left-0 top-4 bottom-4 w-1 bg-primary rounded-r"></div>
                <div className="flex justify-between items-start pl-3">
                    <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Melhor Demanda</p>
                    <ThumbsUp size={18} className="text-gray-300 group-hover:text-primary transition-colors" />
                </div>
                <div className="mt-2 pl-3">
                    <p className="text-2xl font-bold text-text-main truncate" title={data.melhorDemanda?.nome}>
                        {data.melhorDemanda?.nome || "N/A"}
                    </p>
                    <p className="text-sm font-medium text-primary mt-1">
                        {data.melhorDemanda ? `${data.melhorDemanda.media.toFixed(1)} Pontos` : "-"}
                    </p>
                </div>
            </div>

            {/* Pior Demanda */}
            <div className="relative flex flex-col gap-1 p-5 rounded-xl border border-border bg-bg-card shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                    <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Pior Demanda</p>
                    <ThumbsDown size={18} className="text-gray-300" />
                </div>
                <div className="mt-2">
                    <p className="text-2xl font-bold text-text-main truncate" title={data.piorDemanda?.nome}>
                        {data.piorDemanda?.nome || "N/A"}
                    </p>
                    <p className="text-sm font-medium text-red-500 mt-1">
                        {data.piorDemanda ? `${data.piorDemanda.media.toFixed(1)} Pontos` : "-"}
                    </p>
                </div>
            </div>

            {/* Total Respostas */}
            <div className="relative flex flex-col gap-1 p-5 rounded-xl border border-border bg-bg-card shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                    <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Total de Respostas</p>
                    <Users size={20} className="text-primary" />
                </div>
                <div className="mt-2">
                    <p className="text-4xl font-bold text-text-main">{data.totalRespostas}</p>
                </div>
            </div>
        </section>
    )
}
