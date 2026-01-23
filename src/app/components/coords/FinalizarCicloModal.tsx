"use client"

import { AlertTriangle, X } from "lucide-react"
import { Button } from "@/src/app/components/Button"

interface FinalizarCicloModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    avaliacaoNome: string
    isLoading: boolean
    progressoPercent: number
    membrosAvaliaram: number
    totalMembros: number
}

export function FinalizarCicloModal({
    isOpen,
    onClose,
    onConfirm,
    avaliacaoNome,
    isLoading,
    progressoPercent,
    membrosAvaliaram,
    totalMembros
}: FinalizarCicloModalProps) {
    if (!isOpen) return null

    const membrosFaltando = totalMembros - membrosAvaliaram

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-bg-card rounded-xl shadow-xl w-full max-w-md mx-4">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-bold text-text-main">Finalizar Ciclo de Avaliação</h2>
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
                                Tem certeza que deseja finalizar &ldquo;{avaliacaoNome}&rdquo;?
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                                Esta ação é <strong>irreversível</strong>. Após finalizar:
                            </p>
                            <ul className="text-sm text-gray-500 mt-2 list-disc list-inside space-y-1">
                                <li>Membros não poderão mais enviar avaliações</li>
                                <li>O ciclo será movido para o histórico</li>
                                <li>Os dados serão consolidados</li>
                            </ul>
                        </div>
                    </div>

                    {/* Status do progresso */}
                    <div className="bg-bg-main rounded-lg p-4 border border-border">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-text-main">Progresso atual</span>
                            <span className="text-lg font-bold text-primary">{progressoPercent}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                            <div 
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${progressoPercent}%` }}
                            />
                        </div>
                        <p className="text-xs text-text-muted">
                            {membrosAvaliaram} de {totalMembros} membros completaram
                            {membrosFaltando > 0 && (
                                <span className="text-amber-600 font-medium"> ({membrosFaltando} pendentes)</span>
                            )}
                        </p>
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
                            Finalizar Ciclo
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
