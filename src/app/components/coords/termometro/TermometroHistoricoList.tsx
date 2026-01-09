"use client"

import { ChevronRight } from "lucide-react"
import { TermometroResumo } from "@/src/actions/termometroActions"

interface TermometroHistoricoListProps {
    historico: TermometroResumo[]
    onItemClick?: (id: number) => void
}

function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    })
}

export function TermometroHistoricoList({ historico, onItemClick }: TermometroHistoricoListProps) {
    if (historico.length === 0) {
        return (
            <div className="bg-white rounded-xl p-6 border border-border text-center">
                <p className="text-gray-500">Nenhum termômetro finalizado ainda.</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-3">
            {historico.map((termo) => (
                <div
                    key={termo.id}
                    onClick={() => onItemClick?.(termo.id)}
                    className="group bg-white p-4 rounded-lg border border-border shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all flex items-center gap-6 cursor-pointer"
                >
                    <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-secondary transition-colors">
                        <span className="material-symbols-outlined text-gray-500 group-hover:text-text-main">history_edu</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-text-main truncate">{termo.nome}</h4>
                        <p className="text-xs text-gray-500">
                            Finalizado em {formatDate(termo.dataFinal)} • {termo.totalRespostas} respostas
                        </p>
                    </div>
                    <div className="hidden sm:flex items-center gap-8">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold text-gray-500 uppercase mb-1">Status</span>
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-bold">Finalizado</span>
                        </div>
                        <div className="flex flex-col items-center min-w-[60px]">
                            <span className="text-[10px] font-bold text-gray-500 uppercase mb-1">Média</span>
                            <div className="w-10 h-10 bg-secondary text-text-main font-bold rounded-lg flex items-center justify-center text-sm border border-primary/20">
                                {termo.mediaNotas.toFixed(1)}
                            </div>
                        </div>
                    </div>
                    <ChevronRight className="text-gray-300 group-hover:text-primary transition-colors shrink-0" size={24} />
                </div>
            ))}
        </div>
    )
}
