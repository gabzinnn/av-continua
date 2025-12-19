"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/src/app/components/Button"
import { updateDemanda, UpdateDemandaInput, DemandaCompleta } from "@/src/actions/demandasActions"
import { AreaOption } from "@/src/actions/membrosActions"

interface EditDemandaModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    areas: AreaOption[]
    demanda: DemandaCompleta | null
}

export function EditDemandaModal({ isOpen, onClose, onSuccess, areas, demanda }: EditDemandaModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [formData, setFormData] = useState<UpdateDemandaInput>({
        id: 0,
        nome: "",
        descricao: "",
        idArea: undefined,
        creditoMembro: 0,
        creditoLider: 0,
        finalizada: false,
    })

    useEffect(() => {
        if (demanda) {
            setFormData({
                id: demanda.id,
                nome: demanda.nome,
                descricao: demanda.descricao || "",
                idArea: demanda.area?.id,
                creditoMembro: demanda.creditoMembro,
                creditoLider: demanda.creditoLider,
                finalizada: demanda.finalizada,
            })
        }
    }, [demanda])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (!formData.nome) {
            setError("O nome da demanda é obrigatório")
            return
        }

        setIsLoading(true)
        const result = await updateDemanda(formData)
        
        if (result.success) {
            onSuccess()
            onClose()
        } else {
            setError(result.error || "Erro ao atualizar demanda")
        }
        setIsLoading(false)
    }

    if (!isOpen || !demanda) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-bg-card rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-bold text-text-main">Editar Demanda</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
                    <div>
                        <label className="block text-sm font-medium text-text-main mb-1">Nome *</label>
                        <input
                            type="text"
                            value={formData.nome}
                            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                            className="w-full px-4 py-2.5 border border-border rounded-lg bg-bg-main focus:outline-none focus:border-primary"
                            placeholder="Nome da demanda"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-main mb-1">Descrição</label>
                        <textarea
                            value={formData.descricao || ""}
                            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                            className="w-full px-4 py-2.5 border border-border rounded-lg bg-bg-main focus:outline-none focus:border-primary resize-none"
                            placeholder="Descrição da demanda"
                            rows={3}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-main mb-1">Área</label>
                        <select
                            value={formData.idArea || ""}
                            onChange={(e) => setFormData({ ...formData, idArea: e.target.value ? Number(e.target.value) : undefined })}
                            className="w-full px-4 py-2.5 border border-border rounded-lg bg-bg-main focus:outline-none focus:border-primary cursor-pointer"
                        >
                            <option value="">Sem área específica</option>
                            {areas.map((area) => (
                                <option key={area.id} value={area.id}>{area.nome}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-main mb-1">Crédito Membro</label>
                            <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={formData.creditoMembro || 0}
                                onChange={(e) => setFormData({ ...formData, creditoMembro: parseFloat(e.target.value) || 0 })}
                                className="w-full px-4 py-2.5 border border-border rounded-lg bg-bg-main focus:outline-none focus:border-primary"
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-main mb-1">Crédito Líder</label>
                            <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={formData.creditoLider || 0}
                                onChange={(e) => setFormData({ ...formData, creditoLider: parseFloat(e.target.value) || 0 })}
                                className="w-full px-4 py-2.5 border border-border rounded-lg bg-bg-main focus:outline-none focus:border-primary"
                                placeholder="0"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="finalizada"
                            checked={formData.finalizada}
                            onChange={(e) => setFormData({ ...formData, finalizada: e.target.checked })}
                            className="w-4 h-4 rounded border-border cursor-pointer"
                        />
                        <label htmlFor="finalizada" className="text-sm text-text-main cursor-pointer">
                            Demanda finalizada
                        </label>
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
                            type="submit"
                            className="flex-1"
                            isLoading={isLoading}
                        >
                            Salvar Alterações
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
