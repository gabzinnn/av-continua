"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/src/app/components/Button"
import { createDemanda, CreateDemandaInput } from "@/src/actions/demandasActions"
import { AreaOption } from "@/src/actions/membrosActions"
import { getSubareasByArea, SubareaOption } from "@/src/actions/subareaActions"
import { Ciclo } from "@/src/actions/cicloActions"

interface AddDemandaModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    areas: AreaOption[]
    ciclos: Ciclo[]
}

export function AddDemandaModal({ isOpen, onClose, onSuccess, areas, ciclos }: AddDemandaModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [subareas, setSubareas] = useState<SubareaOption[]>([])
    const [loadingSubareas, setLoadingSubareas] = useState(false)
    const [formData, setFormData] = useState<CreateDemandaInput>({
        nome: "",
        descricao: "",
        idArea: undefined,
        idSubarea: null,
        idCiclo: null,
        creditoMembro: 0,
        creditoLider: 0,
    })

    // Buscar subáreas quando a área mudar
    useEffect(() => {
        async function fetchSubareas() {
            if (formData.idArea && formData.idArea > 0) {
                setLoadingSubareas(true)
                const result = await getSubareasByArea(formData.idArea)
                setSubareas(result)
                setLoadingSubareas(false)
            } else {
                setSubareas([])
            }
            // Reset subarea when area changes
            setFormData(prev => ({ ...prev, idSubarea: null }))
        }
        fetchSubareas()
    }, [formData.idArea])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (!formData.nome) {
            setError("O nome da demanda é obrigatório")
            return
        }

        setIsLoading(true)
        const result = await createDemanda(formData)
        
        if (result.success) {
            setFormData({ nome: "", descricao: "", idArea: undefined, idSubarea: null, idCiclo: null, creditoMembro: 0, creditoLider: 0 })
            setSubareas([])
            onSuccess()
            onClose()
        } else {
            setError(result.error || "Erro ao criar demanda")
        }
        setIsLoading(false)
    }

    const handleClose = () => {
        setFormData({ nome: "", descricao: "", idArea: undefined, idSubarea: null, idCiclo: null, creditoMembro: 0, creditoLider: 0 })
        setSubareas([])
        setError("")
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
            <div className="relative bg-bg-card rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-bold text-text-main">Criar Nova Demanda</h2>
                    <button onClick={handleClose} className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer">
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

                    {/* Subárea - só aparece se a área tiver subáreas */}
                    {subareas.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-text-main mb-1">Subárea</label>
                            <select
                                value={formData.idSubarea || ""}
                                onChange={(e) => setFormData({ ...formData, idSubarea: e.target.value ? Number(e.target.value) : null })}
                                className="w-full px-4 py-2.5 border border-border rounded-lg bg-bg-main focus:outline-none focus:border-primary cursor-pointer"
                                disabled={loadingSubareas}
                            >
                                <option value="">Sem subárea específica</option>
                                {subareas.map((subarea) => (
                                    <option key={subarea.id} value={subarea.id}>{subarea.nome}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Ciclo */}
                    <div>
                        <label className="block text-sm font-medium text-text-main mb-1">Ciclo</label>
                        <select
                            value={formData.idCiclo || ""}
                            onChange={(e) => setFormData({ ...formData, idCiclo: e.target.value ? Number(e.target.value) : null })}
                            className="w-full px-4 py-2.5 border border-border rounded-lg bg-bg-main focus:outline-none focus:border-primary cursor-pointer"
                        >
                            <option value="">Sem ciclo específico</option>
                            {ciclos.map((ciclo) => (
                                <option key={ciclo.id} value={ciclo.id}>{ciclo.nome}</option>
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

                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>
                    )}

                    <div className="flex gap-3 mt-2">
                        <Button
                            type="button"
                            variant="secondary"
                            className="flex-1"
                            onClick={handleClose}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1"
                            isLoading={isLoading}
                        >
                            Criar Demanda
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
