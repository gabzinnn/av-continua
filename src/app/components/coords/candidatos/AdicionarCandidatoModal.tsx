import { useState } from "react"
import { X } from "lucide-react"

// Lista de cursos caso queira um select ou pode ser texto livre
// Vamos tentar importar de @/src/utils/cursosUFRJ se existir, se não a gente cria um fallback ou volta pra text.
import { cursosUFRJ } from "@/src/utils/cursosUFRJ"

interface AdicionarCandidatoModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (dados: { nome: string; email: string; curso: string; periodo: string; dre: string }) => Promise<void>
    isLoading?: boolean
}

export function AdicionarCandidatoModal({ 
    isOpen, 
    onClose, 
    onConfirm, 
    isLoading = false 
}: AdicionarCandidatoModalProps) {
    const [nome, setNome] = useState("")
    const [email, setEmail] = useState("")
    const [curso, setCurso] = useState("")
    const [periodo, setPeriodo] = useState("")
    const [dre, setDre] = useState("")

    const [submitting, setSubmitting] = useState(false)

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            await onConfirm({
                nome,
                email,
                curso,
                periodo,
                dre
            })
            // Reset fields
            setNome("")
            setEmail("")
            setCurso("")
            setPeriodo("")
            setDre("")
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
                    className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
                        <h3 className="text-lg font-bold text-text-main">
                            Adicionar Candidato
                        </h3>
                        <button 
                            onClick={handleClose}
                            disabled={loading}
                            type="button"
                            className="text-text-muted hover:text-text-main transition-colors cursor-pointer p-1 disabled:opacity-50"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    
                    {/* Body */}
                    <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden min-h-0">
                        <div className="px-6 py-5 space-y-4 overflow-y-auto">
                            <p className="text-sm text-text-muted">
                                Preencha os dados do candidato a ser adicionado manualmente ao processo seletivo.
                                Ele constará como "Aprovado na Prova".
                            </p>
                            
                            <div>
                                <label className="block text-sm font-semibold text-text-main mb-2">Nome Completo</label>
                                <input
                                    required
                                    type="text"
                                    value={nome}
                                    onChange={(e) => setNome(e.target.value)}
                                    disabled={loading}
                                    className="w-full rounded-lg border border-border bg-gray-50 px-4 py-3 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-text-main mb-2">E-mail</label>
                                <input
                                    required
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading}
                                    className="w-full rounded-lg border border-border bg-gray-50 px-4 py-3 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-text-main mb-2">DRE</label>
                                    <input
                                        required
                                        type="text"
                                        value={dre}
                                        onChange={(e) => setDre(e.target.value.replace(/\D/g, ''))}
                                        disabled={loading}
                                        maxLength={9}
                                        placeholder="Somente números"
                                        className="w-full rounded-lg border border-border bg-gray-50 px-4 py-3 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-text-main mb-2">Período</label>
                                    <input
                                        required
                                        type="text"
                                        value={periodo}
                                        onChange={(e) => setPeriodo(e.target.value)}
                                        disabled={loading}
                                        placeholder="Ex: 5"
                                        className="w-full rounded-lg border border-border bg-gray-50 px-4 py-3 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-text-main mb-2">Curso</label>
                                <select
                                    required
                                    value={curso}
                                    onChange={(e) => setCurso(e.target.value)}
                                    disabled={loading}
                                    className="w-full rounded-lg border border-border bg-gray-50 px-4 py-3 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="">Selecione o curso</option>
                                    {cursosUFRJ.map(c => (
                                        <option key={c.value} value={c.value}>{c.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-border flex gap-3 shrink-0">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={loading}
                                className="flex-1 py-2.5 px-4 rounded-lg border border-border text-text-muted font-semibold hover:bg-gray-50 transition-colors text-sm cursor-pointer disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 py-2.5 px-4 rounded-lg bg-primary text-text-main font-bold hover:bg-primary-hover shadow-md hover:shadow-lg transition-all text-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                    {loading ? (
                                        <>
                                            <span className="animate-spin h-4 w-4 border-2 border-text-main/30 border-t-text-main rounded-full"></span>
                                            Adicionando...
                                        </>
                                    ) : (
                                        "Adicionar Candidato"
                                    )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    )
}
