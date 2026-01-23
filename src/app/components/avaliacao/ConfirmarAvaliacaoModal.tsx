"use client"

import { AlertTriangle, X } from "lucide-react"
import { Button } from "../Button"

interface ConfirmarAvaliacaoModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    membroNome: string
    isLoading: boolean
}

export function ConfirmarAvaliacaoModal({
    isOpen,
    onClose,
    onConfirm,
    membroNome,
    isLoading
}: ConfirmarAvaliacaoModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-bg-card rounded-xl shadow-xl w-full max-w-md mx-4">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-bold text-text-main">Finalizar Avaliação</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6 flex flex-col gap-4">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-amber-100 rounded-full shrink-0">
                            <AlertTriangle size={24} className="text-amber-600" />
                        </div>
                        <div>
                            <p className="text-text-main font-medium">
                                Tem certeza que deseja finalizar a avaliação de {membroNome}?
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                                Após finalizar, a avaliação será enviada e <strong>não poderá ser editada</strong> depois que o destinatário avaliar o feedback.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-2">
                        <Button
                            type="button"
                            variant="secondary"
                            className="flex-1"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            className="flex-1"
                            onClick={onConfirm}
                            isLoading={isLoading}
                        >
                            Confirmar
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
