"use client"

import { useState, useRef } from "react"
import { X, Upload, FileText } from "lucide-react"
import { Button } from "@/src/app/components/Button"
import { createPagamento, CreatePagamentoInput } from "@/src/actions/pagamentosActions"
import { uploadPdfToCloudinary } from "@/src/actions/uploadActions"
import { AreaOption } from "@/src/actions/membrosActions"
import { DemandaCompleta } from "@/src/actions/demandasActions"

interface AddPagamentoModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    areas: AreaOption[]
    demandas: DemandaCompleta[]
    coordenadores: { id: number; nome: string }[]
}

export function AddPagamentoModal({ isOpen, onClose, onSuccess, areas, demandas, coordenadores }: AddPagamentoModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [pdfFile, setPdfFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    
    const [formData, setFormData] = useState<CreatePagamentoInput>({
        nome: "",
        descricao: "",
        valor: 0,
        notaFiscal: "",
        areaId: undefined,
        demandaId: undefined,
        responsavelId: undefined,
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (!formData.nome) {
            setError("O nome do gasto é obrigatório")
            return
        }

        if (formData.valor <= 0) {
            setError("O valor deve ser maior que zero")
            return
        }

        setIsLoading(true)

        try {
            let pdfUrl: string | undefined = undefined

            // Upload PDF if exists
            if (pdfFile) {
                const pdfFormData = new FormData()
                pdfFormData.append("file", pdfFile)
                const uploadResult = await uploadPdfToCloudinary(pdfFormData)
                
                if (!uploadResult.success) {
                    setError(uploadResult.error || "Erro ao fazer upload do PDF")
                    setIsLoading(false)
                    return
                }
                pdfUrl = uploadResult.url
            }

            const result = await createPagamento({
                ...formData,
                pdfUrl,
            })

            if (result.success) {
                resetForm()
                onSuccess()
                onClose()
            } else {
                setError(result.error || "Erro ao criar gasto")
            }
        } catch {
            setError("Erro ao processar solicitação")
        }

        setIsLoading(false)
    }

    const resetForm = () => {
        setFormData({
            nome: "",
            descricao: "",
            valor: 0,
            notaFiscal: "",
            areaId: undefined,
            demandaId: undefined,
            responsavelId: undefined,
        })
        setPdfFile(null)
        setError("")
    }

    const handleClose = () => {
        resetForm()
        onClose()
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.type !== "application/pdf") {
                setError("Apenas arquivos PDF são permitidos")
                return
            }
            if (file.size > 10 * 1024 * 1024) {
                setError("Arquivo muito grande. Máximo 10MB")
                return
            }
            setPdfFile(file)
            setError("")
        }
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
            <div className="relative bg-bg-card rounded-xl shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-bold text-text-main">Adicionar Novo Gasto</h2>
                    <button onClick={handleClose} className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Nome */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-text-main mb-1">Nome do Gasto *</label>
                            <input
                                type="text"
                                value={formData.nome}
                                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                className="w-full px-4 py-2.5 border border-border rounded-lg bg-bg-main focus:outline-none focus:border-primary"
                                placeholder="Ex: Almoço com cliente"
                            />
                        </div>

                        {/* Valor */}
                        <div>
                            <label className="block text-sm font-medium text-text-main mb-1">Valor (R$) *</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.valor || ""}
                                onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })}
                                className="w-full px-4 py-2.5 border border-border rounded-lg bg-bg-main focus:outline-none focus:border-primary"
                                placeholder="0,00"
                            />
                            {formData.valor > 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                    {formatCurrency(formData.valor)}
                                </p>
                            )}
                        </div>

                        {/* Nota Fiscal */}
                        <div>
                            <label className="block text-sm font-medium text-text-main mb-1">Número da Nota Fiscal</label>
                            <input
                                type="text"
                                value={formData.notaFiscal || ""}
                                onChange={(e) => setFormData({ ...formData, notaFiscal: e.target.value })}
                                className="w-full px-4 py-2.5 border border-border rounded-lg bg-bg-main focus:outline-none focus:border-primary"
                                placeholder="Ex: NF-20230048"
                            />
                        </div>
                    </div>

                    {/* Descrição */}
                    <div>
                        <label className="block text-sm font-medium text-text-main mb-1">Descrição</label>
                        <textarea
                            value={formData.descricao || ""}
                            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                            className="w-full px-4 py-2.5 border border-border rounded-lg bg-bg-main focus:outline-none focus:border-primary resize-none"
                            placeholder="Descrição detalhada do gasto"
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Área */}
                        <div>
                            <label className="block text-sm font-medium text-text-main mb-1">Área</label>
                            <select
                                value={formData.areaId || ""}
                                onChange={(e) => setFormData({ ...formData, areaId: e.target.value ? Number(e.target.value) : undefined })}
                                className="w-full px-4 py-2.5 border border-border rounded-lg bg-bg-main focus:outline-none focus:border-primary cursor-pointer"
                            >
                                <option value="">Selecione a área</option>
                                {areas.map((area) => (
                                    <option key={area.id} value={area.id}>{area.nome}</option>
                                ))}
                            </select>
                        </div>

                        {/* Demanda */}
                        <div>
                            <label className="block text-sm font-medium text-text-main mb-1">Demanda</label>
                            <select
                                value={formData.demandaId || ""}
                                onChange={(e) => setFormData({ ...formData, demandaId: e.target.value ? Number(e.target.value) : undefined })}
                                className="w-full px-4 py-2.5 border border-border rounded-lg bg-bg-main focus:outline-none focus:border-primary cursor-pointer"
                            >
                                <option value="">Selecione a demanda</option>
                                {demandas.map((demanda) => (
                                    <option key={demanda.id} value={demanda.id}>{demanda.nome}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Responsável */}
                    <div>
                        <label className="block text-sm font-medium text-text-main mb-1">Responsável (Coordenador)</label>
                        <select
                            value={formData.responsavelId || ""}
                            onChange={(e) => setFormData({ ...formData, responsavelId: e.target.value ? Number(e.target.value) : undefined })}
                            className="w-full px-4 py-2.5 border border-border rounded-lg bg-bg-main focus:outline-none focus:border-primary cursor-pointer"
                        >
                            <option value="">Selecione o responsável</option>
                            {coordenadores.map((coord) => (
                                <option key={coord.id} value={coord.id}>{coord.nome}</option>
                            ))}
                        </select>
                    </div>

                    {/* Upload PDF */}
                    <div>
                        <label className="block text-sm font-medium text-text-main mb-1">Anexar Nota Fiscal (PDF)</label>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={`
                                group relative flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed 
                                p-6 transition-all cursor-pointer
                                ${pdfFile 
                                    ? "border-primary bg-primary/5" 
                                    : "border-gray-300 bg-gray-50 hover:border-primary hover:bg-primary/5"
                                }
                            `}
                        >
                            {pdfFile ? (
                                <div className="flex items-center gap-3">
                                    <FileText size={24} className="text-primary" />
                                    <div>
                                        <p className="text-sm font-medium text-text-main">{pdfFile.name}</p>
                                        <p className="text-xs text-gray-500">
                                            {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setPdfFile(null)
                                        }}
                                        className="p-1 hover:bg-gray-200 rounded-full"
                                    >
                                        <X size={16} className="text-gray-500" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-center">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 group-hover:bg-white transition-colors">
                                        <Upload size={24} className="text-gray-400 group-hover:text-primary" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-gray-700">
                                            <span className="text-primary hover:underline">Clique para enviar</span> ou arraste e solte
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Apenas PDF (máx. 10MB)
                                        </p>
                                    </div>
                                </div>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,application/pdf"
                                onChange={handleFileChange}
                                className="hidden"
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
                            Salvar Gasto
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
