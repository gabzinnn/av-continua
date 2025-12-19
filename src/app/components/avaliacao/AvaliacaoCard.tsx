"use client"

import { useState } from "react"
import { Card } from "../Card"
import { notaParaTexto, getNotaBorderColor, FEEDBACK_OPTIONS } from "@/src/utils/notas"
import { salvarAvaliacaoFeedback, AvaliacaoRecebida } from "@/src/actions/avaliacoesRecebidasActions"

interface AvaliacaoCardProps {
    avaliacao: AvaliacaoRecebida
    membroId: number
    onFeedbackSaved?: () => void
}

export function AvaliacaoCard({ avaliacao, membroId, onFeedbackSaved }: AvaliacaoCardProps) {
    const [notaFeedback, setNotaFeedback] = useState<number | null>(avaliacao.notaFeedback)
    const [isSaving, setIsSaving] = useState(false)

    const handleFeedbackChange = async (value: string) => {
        const nota = Number(value)
        setIsSaving(true)
        
        const result = await salvarAvaliacaoFeedback(avaliacao.id, avaliacao.avaliadorId, nota)
        
        if (result.success) {
            setNotaFeedback(nota)
            onFeedbackSaved?.()
        }
        
        setIsSaving(false)
    }

    const getFeedbackLabel = (nota: number): string => {
        const option = FEEDBACK_OPTIONS.find(opt => Number(opt.value) === nota)
        return option?.label || "Avaliado"
    }

    return (
        <Card className="flex flex-col gap-6 p-6">
            {/* Header: Avaliador info */}
            <div className="flex justify-between items-start gap-4">
                <div className="flex items-center gap-4">
                    <div
                        className="bg-center bg-no-repeat bg-cover rounded-full size-14 shadow-sm ring-4 ring-primary/10 bg-gray-200"
                        style={{
                            backgroundImage: avaliacao.avaliadorFoto 
                                ? `url("${avaliacao.avaliadorFoto}")` 
                                : undefined
                        }}
                    >
                        {!avaliacao.avaliadorFoto && (
                            <div className="size-14 flex items-center justify-center">
                                <span className="material-symbols-outlined text-gray-400 text-2xl">person</span>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-0.5">
                            Quem avaliou
                        </span>
                        <h3 className="text-lg font-bold text-text-main">{avaliacao.avaliadorNome}</h3>
                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                            <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                            <span>{avaliacao.data}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Competências */}
            <div className="bg-bg-main rounded-xl p-5 border border-border">
                <h4 className="text-sm font-semibold text-text-main mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">analytics</span>
                    Avaliação de Competências
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`flex flex-col gap-1 border-l-2 ${getNotaBorderColor(avaliacao.notaEntrega)} pl-3`}>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Entrega</span>
                        <span className="font-bold text-gray-900">{notaParaTexto(avaliacao.notaEntrega)}</span>
                    </div>
                    <div className={`flex flex-col gap-1 border-l-2 ${getNotaBorderColor(avaliacao.notaCultura)} pl-3`}>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Alinhamento Cultural</span>
                        <span className="font-bold text-gray-900">{notaParaTexto(avaliacao.notaCultura)}</span>
                    </div>
                </div>
            </div>

            {/* Feedback Textual */}
            <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Feedback Textual
                </span>
                <p className="text-text-main text-base font-normal leading-relaxed">
                    {avaliacao.feedbackTexto}
                </p>
            </div>

            {/* Planos de ação */}
            <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Planos de ação
                </span>
                <p className="text-text-main text-base font-normal leading-relaxed whitespace-pre-line">
                    {avaliacao.planosAcao}
                </p>
            </div>

            {/* Avaliação de Utilidade */}
            <div className="flex items-center justify-end pt-4 border-t border-border mt-2">
                {notaFeedback !== null ? (
                    <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-green-700">
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        <span className="text-sm font-medium">
                            Feedback avaliado como {getFeedbackLabel(notaFeedback).toLowerCase()}
                        </span>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 w-full justify-between sm:justify-end">
                        <span className="text-sm font-medium text-text-muted">Avaliar qualidade:</span>
                        <div className="relative w-full sm:w-56">
                            <select
                                className="w-full appearance-none bg-bg-card border border-gray-300 text-text-main py-2 pl-3 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer font-medium text-sm hover:border-primary/50 transition-colors disabled:opacity-50"
                                onChange={(e) => handleFeedbackChange(e.target.value)}
                                disabled={isSaving}
                                defaultValue=""
                            >
                                <option disabled value="">
                                    {isSaving ? "Salvando..." : "Selecione..."}
                                </option>
                                {FEEDBACK_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-main">
                                <span className="material-symbols-outlined">expand_more</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    )
}
