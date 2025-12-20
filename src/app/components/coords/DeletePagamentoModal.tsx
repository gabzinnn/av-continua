"use client"

import { useState } from "react"
import { X, AlertTriangle } from "lucide-react"
import { Button } from "@/src/app/components/Button"
import { deletePagamento, PagamentoCompleto } from "@/src/actions/pagamentosActions"

interface DeletePagamentoModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    pagamento: PagamentoCompleto | null
}

export function DeletePagamentoModal({ isOpen, onClose, onSuccess, pagamento }: DeletePagamentoModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    const handleDelete = async () => {
        if (!pagamento) return

        setIsLoading(true)
        setError("")

        const result = await deletePagamento(pagamento.id)

        if (result.success) {
            onSuccess()
            onClose()
        } else {
            setError(result.error || "Erro ao excluir gasto")
        }

        setIsLoading(false)
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value)
    }

    if (!isOpen || !pagamento) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-bg-card rounded-xl shadow-xl w-full max-w-md mx-4">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-bold text-text-main">Excluir Gasto</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6 flex flex-col gap-4">
                    <div className="flex items-start gap-4">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 shrink-0">
                            <AlertTriangle size={24} className="text-red-600" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <p className="text-text-main">
                                Tem certeza que deseja excluir o gasto <strong>&quot;{pagamento.nome}&quot;</strong>?
                            </p>
                            <p className="text-sm text-gray-500">
                                Valor: <strong>{formatCurrency(Number(pagamento.valor))}</strong>
                            </p>
                            <p className="text-sm text-gray-500">
                                Esta ação não pode ser desfeita.
                            </p>
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
                            className="flex-1 !bg-red-600 hover:!bg-red-700"
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
