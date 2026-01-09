"use client"

import { useState } from "react"
import { X, AlertTriangle } from "lucide-react"
import { Button } from "@/src/app/components/Button"
import { encerrarTermometro } from "@/src/actions/termometroActions"
import { TermometroResumo } from "@/src/actions/termometroActions"

interface EncerrarTermometroModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    termometro: TermometroResumo
}

export function EncerrarTermometroModal({ isOpen, onClose, onSuccess, termometro }: EncerrarTermometroModalProps) {
    const [isLoading, setIsLoading] = useState(false)

    const handleEncerrar = async () => {
        setIsLoading(true)
        try {
            await encerrarTermometro(termometro.id)
            onSuccess()
            onClose()
        } catch (error) {
            console.error("Erro ao encerrar termômetro:", error)
        } finally {
            setIsLoading(false)
        }
    }

    if (!isOpen) return null

    const percentRespondido = termometro.totalMembros > 0
        ? Math.round((termometro.totalRespostas / termometro.totalMembros) * 100)
        : 0

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-bg-card rounded-xl shadow-xl w-full max-w-md mx-4">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-bold text-text-main">Encerrar Termômetro</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6 flex flex-col gap-5">
                    <div className="flex items-start gap-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <AlertTriangle size={24} className="text-amber-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-amber-800 font-medium mb-1">Atenção</p>
                            <p className="text-amber-700 text-sm">
                                Ao encerrar o termômetro, nenhum membro poderá mais enviar respostas.
                                Esta ação não pode ser desfeita.
                            </p>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-bold text-text-main mb-2">{termometro.nome}</h4>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Respostas recebidas:</span>
                            <span className="font-medium text-text-main">
                                {termometro.totalRespostas} de {termometro.totalMembros} ({percentRespondido}%)
                            </span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                            <span className="text-gray-500">Média atual:</span>
                            <span className="font-medium text-text-main">{termometro.mediaNotas.toFixed(1)} / 5.0</span>
                        </div>
                    </div>

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
                            onClick={handleEncerrar}
                            isLoading={isLoading}
                        >
                            Encerrar
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
