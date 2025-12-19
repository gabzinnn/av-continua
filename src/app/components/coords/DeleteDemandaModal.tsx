"use client"

import { useState } from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/src/app/components/Button"
import { deleteDemanda, DemandaCompleta } from "@/src/actions/demandasActions"

interface DeleteDemandaModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    demanda: DemandaCompleta | null
}

export function DeleteDemandaModal({ isOpen, onClose, onSuccess, demanda }: DeleteDemandaModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    const handleConfirm = async () => {
        if (!demanda) return

        setIsLoading(true)
        setError("")

        const result = await deleteDemanda(demanda.id)
        
        if (result.success) {
            onSuccess()
            onClose()
        } else {
            setError(result.error || "Erro ao excluir demanda")
        }
        setIsLoading(false)
    }

    if (!isOpen || !demanda) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-bg-card rounded-xl shadow-xl w-full max-w-md mx-4">
                <div className="p-6 flex flex-col items-center text-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                        <AlertTriangle size={28} className="text-red-600" />
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-text-main mb-2">Excluir Demanda</h2>
                        <p className="text-gray-600">
                            Tem certeza que deseja excluir &quot;{demanda.nome}&quot;? Esta ação não poderá ser desfeita e todas as alocações serão removidas.
                        </p>
                    </div>

                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg w-full">{error}</div>
                    )}

                    <div className="flex gap-3 w-full mt-2">
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
                            className="flex-1 bg-red-600 hover:bg-red-700"
                            onClick={handleConfirm}
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
