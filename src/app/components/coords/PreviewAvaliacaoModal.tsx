"use client"

import { useState } from "react"
import { X, ChevronDown, ChevronRight, Users, ArrowRight, Loader2 } from "lucide-react"
import Image from "next/image"
import { Button } from "@/src/app/components/Button"
import { PreviewMembro } from "@/src/actions/controleAvaliacoesActions"
import { AREA_ORDER } from "@/src/utils/areaOrder"

interface PreviewAvaliacaoModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    isCreating: boolean
    previewData: PreviewMembro[]
    nomeAvaliacao: string
}

export function PreviewAvaliacaoModal({
    isOpen,
    onClose,
    onConfirm,
    isCreating,
    previewData,
    nomeAvaliacao,
}: PreviewAvaliacaoModalProps) {
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

    if (!isOpen) return null

    // Agrupar por área
    const areaGroups: Record<string, PreviewMembro[]> = {}
    for (const membro of previewData) {
        if (!areaGroups[membro.area]) {
            areaGroups[membro.area] = []
        }
        areaGroups[membro.area].push(membro)
    }

    const toggleExpand = (id: number) => {
        const newSet = new Set(expandedIds)
        if (newSet.has(id)) {
            newSet.delete(id)
        } else {
            newSet.add(id)
        }
        setExpandedIds(newSet)
    }

    const expandAll = () => {
        setExpandedIds(new Set(previewData.map((m) => m.id)))
    }

    const collapseAll = () => {
        setExpandedIds(new Set())
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-bg-card rounded-xl shadow-xl w-full max-w-3xl mx-4 max-h-[85vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-text-main">Preview da Avaliação</h2>
                        <p className="text-sm text-text-muted mt-1">
                            <span className="font-medium">{nomeAvaliacao}</span> • {previewData.length} membros
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between px-6 py-3 bg-bg-main border-b border-border shrink-0">
                    <div className="flex items-center gap-2 text-sm text-text-muted">
                        <Users size={16} />
                        <span>Quem avalia quem nesta avaliação</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={expandAll}
                            className="text-xs text-primary hover:underline cursor-pointer"
                        >
                            Expandir tudo
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                            onClick={collapseAll}
                            className="text-xs text-primary hover:underline cursor-pointer"
                        >
                            Recolher tudo
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-6">
                        {Object.entries(areaGroups).sort((a, b) => AREA_ORDER[a[0]] - AREA_ORDER[b[0]]).map(([area, membros]) => (
                            <div key={area}>
                                <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
                                    {area}
                                </h3>
                                <div className="space-y-2">
                                    {membros.map((membro) => (
                                        <div
                                            key={membro.id}
                                            className="bg-bg-main border border-border rounded-lg overflow-hidden"
                                        >
                                            {/* Membro Header */}
                                            <button
                                                onClick={() => toggleExpand(membro.id)}
                                                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                                            >
                                                <div className="flex items-center gap-3">
                                                    {membro.fotoUrl ? (
                                                        <Image
                                                            src={membro.fotoUrl}
                                                            alt={membro.nome}
                                                            width={32}
                                                            height={32}
                                                            className="w-8 h-8 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                                                            {membro.nome.charAt(0)}
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-text-main">
                                                            {membro.nome}
                                                        </span>
                                                        {membro.isCoordenador && (
                                                            <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                                                                Coord
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-text-muted">
                                                    <span>Avalia {membro.avaliaQuem.length}</span>
                                                    {expandedIds.has(membro.id) ? (
                                                        <ChevronDown size={16} />
                                                    ) : (
                                                        <ChevronRight size={16} />
                                                    )}
                                                </div>
                                            </button>

                                            {/* Expanded Content */}
                                            {expandedIds.has(membro.id) && (
                                                <div className="px-3 pb-3 pt-0">
                                                    <div className="border-t border-border pt-3">
                                                        {membro.avaliaQuem.length === 0 ? (
                                                            <p className="text-sm text-text-muted italic">
                                                                Nenhum membro para avaliar
                                                            </p>
                                                        ) : (
                                                            <div className="flex flex-wrap gap-2">
                                                                {membro.avaliaQuem.map((avaliado) => (
                                                                    <div
                                                                        key={avaliado.id}
                                                                        className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3 py-1.5"
                                                                    >
                                                                        <ArrowRight size={12} className="text-gray-400" />
                                                                        {avaliado.fotoUrl ? (
                                                                            <Image
                                                                                src={avaliado.fotoUrl}
                                                                                alt={avaliado.nome}
                                                                                width={20}
                                                                                height={20}
                                                                                className="w-5 h-5 rounded-full object-cover"
                                                                            />
                                                                        ) : (
                                                                            <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-medium text-gray-600">
                                                                                {avaliado.nome.charAt(0)}
                                                                            </div>
                                                                        )}
                                                                        <span className="text-sm text-text-main">
                                                                            {avaliado.nome}
                                                                        </span>
                                                                        <span className="text-xs text-text-muted">
                                                                            ({avaliado.area})
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 border-t border-border shrink-0">
                    <Button variant="secondary" className="flex-1" onClick={onClose}>
                        Voltar
                    </Button>
                    <Button
                        className="flex-1"
                        onClick={onConfirm}
                        isLoading={isCreating}
                        icon={isCreating ? <Loader2 className="animate-spin" size={18} /> : undefined}
                    >
                        Confirmar e Criar
                    </Button>
                </div>
            </div>
        </div>
    )
}
