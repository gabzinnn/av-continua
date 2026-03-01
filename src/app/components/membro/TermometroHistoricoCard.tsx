"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Card } from "@/src/app/components/Card"

interface TermometroHistoricoCardProps {
    nome: string
    dataInicial: Date
    dataFinal: Date
    perguntas: string[]
    minhasNotas: number[]
    minhaMedia: number
    mediaGeral: number
}

function getMediaColor(media: number): string {
    if (media >= 8) return "text-green-600 bg-green-50 border-green-200"
    if (media >= 6) return "text-blue-600 bg-blue-50 border-blue-200"
    if (media >= 4) return "text-yellow-600 bg-yellow-50 border-yellow-200"
    return "text-red-600 bg-red-50 border-red-200"
}

function getNotaColor(nota: number): string {
    if (nota >= 8) return "bg-green-100 text-green-700"
    if (nota >= 6) return "bg-blue-100 text-blue-700"
    if (nota >= 4) return "bg-yellow-100 text-yellow-700"
    return "bg-red-100 text-red-700"
}

export function TermometroHistoricoCard({
    nome,
    dataInicial,
    dataFinal,
    perguntas,
    minhasNotas,
    minhaMedia,
    mediaGeral,
}: TermometroHistoricoCardProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    const formatDate = (date: Date) =>
        new Date(date).toLocaleDateString("pt-BR", {
            day: "numeric",
            month: "short",
            year: "numeric",
        })

    return (
        <Card className="p-0! overflow-hidden">
            {/* Header (always visible) */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-5 hover:bg-gray-50/50 transition-colors cursor-pointer"
            >
                <div className="flex items-center gap-4 min-w-0">
                    {/* Media Badge */}
                    <div
                        className={`flex items-center justify-center w-12 h-12 rounded-xl border font-bold text-lg shrink-0 ${getMediaColor(minhaMedia)}`}
                    >
                        {minhaMedia.toFixed(1)}
                    </div>

                    <div className="flex flex-col items-start min-w-0">
                        <h3 className="text-base font-bold text-text-main truncate max-w-full">
                            {nome}
                        </h3>
                        <span className="text-xs text-gray-500 mt-0.5">
                            {formatDate(dataInicial)} — {formatDate(dataFinal)}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    {/* Comparative badge */}
                    <div className="hidden sm:flex flex-col items-end">
                        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                            Média geral
                        </span>
                        <span className="text-sm font-semibold text-gray-600">
                            {mediaGeral.toFixed(1)}
                        </span>
                    </div>

                    {isExpanded ? (
                        <ChevronUp size={20} className="text-gray-400" />
                    ) : (
                        <ChevronDown size={20} className="text-gray-400" />
                    )}
                </div>
            </button>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="border-t border-border px-5 pb-5 pt-4">
                    {/* Mobile: media geral */}
                    <div className="sm:hidden flex items-center gap-2 mb-4 text-sm text-gray-500">
                        <span>Média geral do termômetro:</span>
                        <span className="font-semibold text-gray-700">
                            {mediaGeral.toFixed(1)}
                        </span>
                    </div>

                    {/* Questions with scores */}
                    <div className="flex flex-col gap-3">
                        {perguntas.map((pergunta, index) => (
                            <div
                                key={index}
                                className="flex items-start gap-3 text-sm"
                            >
                                <span
                                    className={`inline-flex items-center justify-center w-8 h-6 rounded-md text-xs font-bold shrink-0 ${getNotaColor(minhasNotas[index] || 0)}`}
                                >
                                    {minhasNotas[index] || "—"}
                                </span>
                                <span className="text-gray-600 leading-relaxed">
                                    {pergunta}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Summary row */}
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                            {minhasNotas.length} pergunta{minhasNotas.length !== 1 ? "s" : ""} respondida{minhasNotas.length !== 1 ? "s" : ""}
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500">Sua média:</span>
                            <span className={`font-bold ${minhaMedia >= 6 ? "text-green-600" : "text-yellow-600"}`}>
                                {minhaMedia.toFixed(1)}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    )
}
