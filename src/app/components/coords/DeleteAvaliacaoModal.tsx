"use client"

import { useState } from "react"
import { X, AlertTriangle } from "lucide-react"
import { Button } from "@/src/app/components/Button"
import { deleteAvaliacao } from "@/src/actions/controleAvaliacoesActions"

interface DeleteAvaliacaoModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    avaliacaoId: number
    avaliacaoNome: string
}

export function DeleteAvaliacaoModal({ isOpen, onClose, onSuccess, avaliacaoId, avaliacaoNome }: DeleteAvaliacaoModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    const handleDelete = async () => {
        setIsLoading(true)
        setError("")

        try {
            const result = await deleteAvaliacao(avaliacaoId)
            if (result.success) {
                onSuccess()
                onClose()
            } else {
                setError(result.error || "Erro ao excluir avaliação")
            }
        } catch {
            setError("Erro ao processar solicitação")
        }

        setIsLoading(false)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-bg-card rounded-xl shadow-xl w-full max-w-md mx-4">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-bold text-text-main">Excluir Avaliação</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6 flex flex-col gap-4">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-red-100 rounded-full shrink-0">
                            <AlertTriangle size={24} className="text-red-600" />
                        </div>
                        <div>
                            <p className="text-text-main font-medium">
                                Tem certeza que deseja excluir a avaliação &ldquo;{avaliacaoNome}&rdquo;?
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                                Esta ação é <strong>irreversível</strong> e excluirá permanentemente:
                            </p>
                            <ul className="text-sm text-gray-500 mt-2 list-disc list-inside space-y-1">
                                <li>Todas as respostas de avaliação</li>
                                <li>Todos os planos de ação</li>
                                <li>Todos os feedbacks</li>
                                <li>Todos os registros de participação</li>
                            </ul>
                        </div>
                    </div>

                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>
                    )}

                    <div className="flex gap-3 mt-2">
                        <Button
                            type="button"
                            variant="secondary"
                            className="flex-1"
                            onClick={onClose}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            variant="danger"
                            className="flex-1"
                            onClick={handleDelete}
                            isLoading={isLoading}
                        >
                            Excluir
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
