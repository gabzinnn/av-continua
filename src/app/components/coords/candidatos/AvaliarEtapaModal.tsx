"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { ESCALA_NOTAS_MAP } from "@/src/types/candidatos"

interface AvaliarEtapaModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (nota: string) => Promise<void>
    etapaNome: string
    isLoading?: boolean
}

// Todas as notas da escala
const TODAS_NOTAS = ["A", "P_MAIS", "P_ALTO", "P", "P_BAIXO", "P_MENOS", "R"]

export function AvaliarEtapaModal({ 
    isOpen, 
    onClose, 
    onConfirm, 
    etapaNome,
    isLoading = false 
}: AvaliarEtapaModalProps) {
    const [notaSelecionada, setNotaSelecionada] = useState<string>("")
    const [submitting, setSubmitting] = useState(false)

    if (!isOpen) return null

    const handleSubmit = async () => {
        if (!notaSelecionada) return
        
        setSubmitting(true)
        try {
            await onConfirm(notaSelecionada)
            setNotaSelecionada("")
            onClose()
        } finally {
            setSubmitting(false)
        }
    }

    const handleClose = () => {
        if (!submitting) {
            setNotaSelecionada("")
            onClose()
        }
    }

    const loading = isLoading || submitting

    return (
        <>
            {/* Backdrop */}
            <div 
                className="fixed inset-0 z-60 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={handleClose}
            />
            
            {/* Modal */}
            <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
                <div 
                    className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                        <h3 className="text-lg font-bold text-text-main">
                            Avaliar {etapaNome}
                        </h3>
                        <button 
                            onClick={handleClose}
                            disabled={loading}
                            className="text-text-muted hover:text-text-main transition-colors cursor-pointer p-1 disabled:opacity-50"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    
                    {/* Body */}
                    <div className="px-6 py-5 space-y-4">
                        <p className="text-sm text-text-muted">
                            Atribua a nota do candidato na etapa de <strong>{etapaNome}</strong>.
                        </p>
                        
                        <div>
                            <label className="block text-sm font-semibold text-text-main mb-2">
                                Nota da Etapa
                            </label>
                            <select
                                value={notaSelecionada}
                                onChange={(e) => setNotaSelecionada(e.target.value)}
                                disabled={loading}
                                className="w-full appearance-none rounded-lg border border-border bg-gray-50 px-4 py-3 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow cursor-pointer disabled:opacity-50"
                            >
                                <option value="">Selecione uma nota...</option>
                                {TODAS_NOTAS.map(key => {
                                    const nota = ESCALA_NOTAS_MAP[key]
                                    return (
                                        <option key={key} value={key}>
                                            {nota.valor} - {nota.label}
                                        </option>
                                    )
                                })}
                            </select>
                            
                            {/* Indicador de resultado */}
                            {notaSelecionada && (
                                <div className={`mt-2 p-2 rounded-lg text-xs font-medium ${
                                    ESCALA_NOTAS_MAP[notaSelecionada]?.cor === "red" 
                                        ? "bg-red-50 text-red-700 border border-red-200" 
                                        : "bg-green-50 text-green-700 border border-green-200"
                                }`}>
                                    {ESCALA_NOTAS_MAP[notaSelecionada]?.cor === "red" 
                                        ? "⚠️ Esta nota resultará em REPROVAÇÃO do candidato"
                                        : "✓ Esta nota permitirá o candidato avançar para a próxima etapa"}
                                </div>
                            )}
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs font-semibold text-text-muted mb-2">Legenda da Escala:</p>
                            <div className="grid grid-cols-2 gap-1.5">
                                {TODAS_NOTAS.map(key => {
                                    const nota = ESCALA_NOTAS_MAP[key]
                                    return (
                                        <div key={key} className="flex items-center gap-1.5 text-xs">
                                            <span className={`font-bold ${
                                                nota.cor === "green" ? "text-green-600" : 
                                                nota.cor === "red" ? "text-red-600" : "text-yellow-600"
                                            }`}>
                                                {nota.valor}
                                            </span>
                                            <span className="text-text-muted">-</span>
                                            <span className="text-text-main">{nota.label}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                    
                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-border flex gap-3">
                        <button
                            onClick={handleClose}
                            disabled={loading}
                            className="flex-1 py-2.5 px-4 rounded-lg border border-border text-text-muted font-semibold hover:bg-gray-50 transition-colors text-sm cursor-pointer disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!notaSelecionada || loading}
                            className="flex-1 py-2.5 px-4 rounded-lg bg-primary text-text-main font-bold hover:bg-primary-hover shadow-md hover:shadow-lg transition-all text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <span className="animate-spin h-4 w-4 border-2 border-text-main/30 border-t-text-main rounded-full"></span>
                                    Salvando...
                                </>
                            ) : (
                                "Atribuir Nota"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
