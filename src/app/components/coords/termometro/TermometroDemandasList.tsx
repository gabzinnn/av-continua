"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import Image from "next/image"
import { TermometroDetalhes, RespostaMembro } from "@/src/actions/termometroActions"

interface TermometroDemandasListProps {
    data: TermometroDetalhes
}

function getInitials(nome: string): string {
    const parts = nome.split(" ")
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return nome.substring(0, 2).toUpperCase()
}

function getNotaColor(nota: number): string {
    if (nota >= 4.5) return "bg-primary/70 text-text-main font-medium"
    if (nota >= 3.5) return "bg-primary/30 text-gray-700"
    if (nota >= 2.5) return "bg-gray-100 text-gray-500"
    return "bg-gray-100 text-gray-400"
}

export function TermometroDemandasList({ data }: TermometroDemandasListProps) {
    const [expandedDemandas, setExpandedDemandas] = useState<Set<number>>(new Set())

    const toggleDemanda = (id: number) => {
        setExpandedDemandas(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    if (data.demandasComDesempenho.length === 0) {
        return null
    }

    return (
        <section>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4 px-1">
                Desempenho por Demanda
            </h3>
            <div className="flex flex-col gap-3">
                {data.demandasComDesempenho.map((demanda) => (
                    <div
                        key={demanda.id}
                        className="bg-bg-card rounded-xl border border-border shadow-sm overflow-hidden"
                    >
                        {/* Header */}
                        <button
                            onClick={() => toggleDemanda(demanda.id)}
                            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center gap-4">
                                {expandedDemandas.has(demanda.id) ? (
                                    <ChevronDown size={20} className="text-gray-400" />
                                ) : (
                                    <ChevronRight size={20} className="text-gray-400" />
                                )}
                                <div>
                                    <h4 className="font-bold text-text-main text-left">{demanda.nome}</h4>
                                    <p className="text-sm text-gray-500">{demanda.membros.length} membros</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <span className="text-xs font-medium text-gray-500 uppercase">Média</span>
                                    <div className="text-2xl font-bold text-text-main">{demanda.media.toFixed(1)}</div>
                                </div>
                            </div>
                        </button>

                        {/* Expanded Content */}
                        {expandedDemandas.has(demanda.id) && (
                            <div className="border-t border-border">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 border-b border-border">
                                            <tr>
                                                <th className="px-4 py-3 font-semibold text-gray-600 w-[200px]">Membro</th>
                                                {data.perguntas.map((_, i) => (
                                                    <th key={i} className="px-2 py-3 font-medium text-gray-500 text-center">Q{i + 1}</th>
                                                ))}
                                                <th className="px-3 py-3 font-semibold text-gray-600 text-right">Total</th>
                                                <th className="px-4 py-3 font-semibold text-primary text-right">Média</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {demanda.membros.map((membro) => (
                                                <tr key={membro.membroId} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            {membro.membroFoto ? (
                                                                <div className="w-7 h-7 rounded-full overflow-hidden shrink-0">
                                                                    <Image
                                                                        src={membro.membroFoto}
                                                                        alt={membro.membroNome}
                                                                        width={28}
                                                                        height={28}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <div className="w-7 h-7 rounded-full bg-secondary/40 flex items-center justify-center text-xs font-bold text-text-main shrink-0">
                                                                    {getInitials(membro.membroNome)}
                                                                </div>
                                                            )}
                                                            <span className="text-text-main text-sm">{membro.membroNome}</span>
                                                        </div>
                                                    </td>
                                                    {membro.notas.map((nota, i) => (
                                                        <td key={i} className="px-2 py-3 text-center">
                                                            <span className={`inline-block rounded py-0.5 px-1.5 text-xs ${getNotaColor(nota)}`}>
                                                                {nota.toFixed(1)}
                                                            </span>
                                                        </td>
                                                    ))}
                                                    <td className="px-3 py-3 text-right font-medium text-text-main">
                                                        {membro.total.toFixed(1)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-bold text-text-main">
                                                        {membro.media.toFixed(1)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </section>
    )
}
