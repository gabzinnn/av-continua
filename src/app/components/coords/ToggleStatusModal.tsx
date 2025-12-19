"use client"

import { useState } from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/src/app/components/Button"
import { toggleMembroStatus, MembroCompleto } from "@/src/actions/membrosActions"

interface ToggleStatusModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    membro: MembroCompleto | null
}

export function ToggleStatusModal({ isOpen, onClose, onSuccess, membro }: ToggleStatusModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    const handleConfirm = async () => {
        if (!membro) return

        setIsLoading(true)
        setError("")

        const result = await toggleMembroStatus(membro.id)
        
        if (result.success) {
            onSuccess()
            onClose()
        } else {
            setError(result.error || "Erro ao alterar status")
        }
        setIsLoading(false)
    }

    if (!isOpen || !membro) return null

    const isDeactivating = membro.isAtivo

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-bg-card rounded-xl shadow-xl w-full max-w-md mx-4">
                <div className="p-6 flex flex-col items-center text-center gap-4">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                        isDeactivating ? "bg-red-100" : "bg-green-100"
                    }`}>
                        <AlertTriangle size={28} className={isDeactivating ? "text-red-600" : "text-green-600"} />
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-text-main mb-2">
                            {isDeactivating ? "Desativar Membro" : "Reativar Membro"}
                        </h2>
                        <p className="text-gray-600">
                            {isDeactivating 
                                ? `Tem certeza que deseja desativar "${membro.nome}"? O membro não poderá mais participar de avaliações.`
                                : `Tem certeza que deseja reativar "${membro.nome}"? O membro voltará a participar de avaliações.`
                            }
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
                            className={`flex-1 ${isDeactivating ? "!bg-red-600 hover:!bg-red-700" : "!bg-green-600 hover:!bg-green-700"}`}
                            onClick={handleConfirm}
                            isLoading={isLoading}
                        >
                            {isDeactivating ? "Desativar" : "Reativar"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
