"use client"

import { useState, useRef } from "react"
import { X, Upload, Loader2 } from "lucide-react"
import Image from "next/image"
import { Button } from "@/src/app/components/Button"
import { createMembro, CreateMembroInput, AreaOption } from "@/src/actions/membrosActions"
import { uploadToCloudinary } from "@/src/actions/uploadActions"

interface AddMembroModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    areas: AreaOption[]
}

export function AddMembroModal({ isOpen, onClose, onSuccess, areas }: AddMembroModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState("")
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    
    const [formData, setFormData] = useState<CreateMembroInput>({
        nome: "",
        dre: "",
        periodo: "",
        areaId: 0,
        fotoUrl: "",
        isCoordenador: false,
    })

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Preview local
        const localUrl = URL.createObjectURL(file)
        setPreviewUrl(localUrl)

        // Upload to Cloudinary
        setIsUploading(true)
        setError("")

        const uploadFormData = new FormData()
        uploadFormData.append("file", file)

        const result = await uploadToCloudinary(uploadFormData)

        if (result.success && result.url) {
            setFormData({ ...formData, fotoUrl: result.url })
        } else {
            setError(result.error || "Erro ao fazer upload")
            setPreviewUrl(null)
        }
        setIsUploading(false)
    }

    const handleRemovePhoto = () => {
        setPreviewUrl(null)
        setFormData({ ...formData, fotoUrl: "" })
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (!formData.nome || !formData.dre || !formData.periodo || !formData.areaId) {
            setError("Preencha todos os campos obrigatórios")
            return
        }

        setIsLoading(true)
        const result = await createMembro(formData)
        
        if (result.success) {
            setFormData({ nome: "", dre: "", periodo: "", areaId: 0, fotoUrl: "", isCoordenador: false })
            setPreviewUrl(null)
            onSuccess()
            onClose()
        } else {
            setError(result.error || "Erro ao criar membro")
        }
        setIsLoading(false)
    }

    const handleClose = () => {
        setPreviewUrl(null)
        setFormData({ nome: "", dre: "", periodo: "", areaId: 0, fotoUrl: "", isCoordenador: false })
        setError("")
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
            <div className="relative bg-bg-card rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-bold text-text-main">Criar Novo Membro</h2>
                    <button onClick={handleClose} className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
                    {/* Photo Upload */}
                    <div>
                        <label className="block text-sm font-medium text-text-main mb-2">Foto do Membro</label>
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                {previewUrl || formData.fotoUrl ? (
                                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary shadow-sm">
                                        <Image
                                            src={previewUrl || formData.fotoUrl || ""}
                                            alt="Preview"
                                            width={80}
                                            height={80}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                                        <Upload size={24} className="text-gray-400" />
                                    </div>
                                )}
                                {isUploading && (
                                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                                        <Loader2 size={24} className="text-white animate-spin" />
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col gap-2">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="photo-upload"
                                />
                                <label
                                    htmlFor="photo-upload"
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-text-main text-sm font-medium rounded-lg cursor-pointer transition-colors"
                                >
                                    {previewUrl ? "Trocar foto" : "Selecionar foto"}
                                </label>
                                {(previewUrl || formData.fotoUrl) && (
                                    <button
                                        type="button"
                                        onClick={handleRemovePhoto}
                                        className="text-xs text-red-600 hover:underline cursor-pointer"
                                    >
                                        Remover foto
                                    </button>
                                )}
                                <span className="text-xs text-gray-500">JPG, PNG, WebP ou GIF. Máx 5MB.</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-main mb-1">Nome *</label>
                        <input
                            type="text"
                            value={formData.nome}
                            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                            className="w-full px-4 py-2.5 border border-border rounded-lg bg-bg-main focus:outline-none focus:border-primary"
                            placeholder="Nome completo"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-main mb-1">DRE *</label>
                            <input
                                type="text"
                                value={formData.dre}
                                onChange={(e) => setFormData({ ...formData, dre: e.target.value })}
                                className="w-full px-4 py-2.5 border border-border rounded-lg bg-bg-main focus:outline-none focus:border-primary"
                                placeholder="Ex: 123456789"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-main mb-1">Período *</label>
                            <input
                                type="text"
                                value={formData.periodo}
                                onChange={(e) => setFormData({ ...formData, periodo: e.target.value })}
                                className="w-full px-4 py-2.5 border border-border rounded-lg bg-bg-main focus:outline-none focus:border-primary"
                                placeholder="Ex: 5º Período"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-main mb-1">Área *</label>
                        <select
                            value={formData.areaId}
                            onChange={(e) => setFormData({ ...formData, areaId: Number(e.target.value) })}
                            className="w-full px-4 py-2.5 border border-border rounded-lg bg-bg-main focus:outline-none focus:border-primary cursor-pointer"
                        >
                            <option value={0}>Selecione uma área</option>
                            {areas.map((area) => (
                                <option key={area.id} value={area.id}>{area.nome}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isCoordenador"
                            checked={formData.isCoordenador}
                            onChange={(e) => setFormData({ ...formData, isCoordenador: e.target.checked })}
                            className="w-4 h-4 rounded border-border cursor-pointer"
                        />
                        <label htmlFor="isCoordenador" className="text-sm text-text-main cursor-pointer">
                            É coordenador de área
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
                            onClick={handleClose}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1"
                            isLoading={isLoading}
                            disabled={isUploading}
                        >
                            Criar Membro
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
