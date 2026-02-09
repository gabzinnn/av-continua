import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { ESCALA_NOTAS_MAP } from "@/src/types/candidatos"

interface AvaliarEtapaModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (data: any) => Promise<void>
    etapaNome: string
    etapaAtual: number
    valoresAtuais?: {
        notaDinamica?: string | null
        notaEntrevista?: string | null
        notaArtigo?: number | null
        apresArtigo?: number | null
        notaCase?: string | null
    }
    isLoading?: boolean
}

// Todas as notas da escala
const TODAS_NOTAS = ["A", "P_MAIS", "P_ALTO", "P", "P_BAIXO", "P_MENOS", "R"]

export function AvaliarEtapaModal({ 
    isOpen, 
    onClose, 
    onConfirm, 
    etapaNome,
    etapaAtual,
    valoresAtuais,
    isLoading = false 
}: AvaliarEtapaModalProps) {
    // Estados para Dinâmica/Entrevista
    const [notaSelecionada, setNotaSelecionada] = useState<string>("")
    
    // Estados para Capacitação
    const [notaArtigo, setNotaArtigo] = useState<string>("")
    const [apresArtigo, setApresArtigo] = useState<string>("")
    const [notaCase, setNotaCase] = useState<string>("")

    const [submitting, setSubmitting] = useState(false)

    // Carregar valores iniciais
    useEffect(() => {
        if (isOpen && valoresAtuais) {
            if (etapaAtual === 2) setNotaSelecionada(valoresAtuais.notaDinamica || "")
            if (etapaAtual === 3) setNotaSelecionada(valoresAtuais.notaEntrevista || "")
            if (etapaAtual === 4) {
                setNotaArtigo(valoresAtuais.notaArtigo?.toString() || "")
                setApresArtigo(valoresAtuais.apresArtigo?.toString() || "")
                setNotaCase(valoresAtuais.notaCase || "")
            }
        }
    }, [isOpen, valoresAtuais, etapaAtual])

    if (!isOpen) return null

    const handleSubmit = async () => {
        setSubmitting(true)
        try {
            if (etapaAtual === 4) {
                await onConfirm({
                    notaArtigo: notaArtigo ? parseFloat(notaArtigo) : null,
                    apresArtigo: apresArtigo ? parseFloat(apresArtigo) : null,
                    notaCase
                })
            } else {
                if (!notaSelecionada) return
                await onConfirm(notaSelecionada)
            }
            onClose()
        } finally {
            setSubmitting(false)
        }
    }

    const handleClose = () => {
        if (!submitting) {
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
                            Atribua a(s) nota(s) do candidato na etapa de <strong>{etapaNome}</strong>.
                            <br/>
                            <span className="text-xs text-text-muted italic">
                                Estas notas são apenas para classificação e não aprovam/reprovam automaticamente.
                            </span>
                        </p>
                        
                        {etapaAtual === 4 ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-text-main mb-2">Nota do Artigo (0-5)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="5"
                                        value={notaArtigo}
                                        onChange={(e) => setNotaArtigo(e.target.value)}
                                        disabled={loading}
                                        className="w-full rounded-lg border border-border bg-gray-50 px-4 py-3 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-text-main mb-2">Apresentação do Artigo (0-5)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="5"
                                        value={apresArtigo}
                                        onChange={(e) => setApresArtigo(e.target.value)}
                                        disabled={loading}
                                        className="w-full rounded-lg border border-border bg-gray-50 px-4 py-3 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-text-main mb-2">Nota do Case</label>
                                    <select
                                        value={notaCase}
                                        onChange={(e) => setNotaCase(e.target.value)}
                                        disabled={loading}
                                        className="w-full appearance-none rounded-lg border border-border bg-gray-50 px-4 py-3 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                                    >
                                        <option value="">Selecione...</option>
                                        {TODAS_NOTAS.map(key => {
                                            const nota = ESCALA_NOTAS_MAP[key]
                                            return <option key={key} value={key}>{nota.valor} - {nota.label}</option>
                                        })}
                                    </select>
                                </div>
                            </div>
                        ) : (
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
                            </div>
                        )}
                        
                        {etapaAtual !== 4 && (
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
                        )}
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
                            disabled={loading || (etapaAtual !== 4 && !notaSelecionada)}
                            className="flex-1 py-2.5 px-4 rounded-lg bg-primary text-text-main font-bold hover:bg-primary-hover shadow-md hover:shadow-lg transition-all text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <span className="animate-spin h-4 w-4 border-2 border-text-main/30 border-t-text-main rounded-full"></span>
                                    Salvando...
                                </>
                            ) : (
                                "Salvar Notas"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
