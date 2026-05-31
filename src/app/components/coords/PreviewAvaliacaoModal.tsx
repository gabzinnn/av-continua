"use client"

import { useState, useEffect, useRef } from "react"
import { X, ChevronDown, ChevronRight, Users, ArrowRight, Loader2, Plus, Search } from "lucide-react"
import Image from "next/image"
import { Button } from "@/src/app/components/Button"
import { AREA_ORDER } from "@/src/utils/areaOrder"

export interface PreviewMembro {
    id: number
    nome: string
    area: string
    fotoUrl: string | null
    isCoordenador: boolean
    avaliaQuem: { id: number; nome: string; area: string; fotoUrl: string | null }[]
}

interface MembroBasico {
    id: number
    nome: string
    fotoUrl: string | null
    area: string
}

interface PreviewAvaliacaoModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (pares: Array<{avaliadorId: number, avaliadoId: number}>) => void
    isCreating: boolean
    previewData: PreviewMembro[]
    nomeAvaliacao: string
    membrosAtivos?: MembroBasico[]
}

const EMPTY_MEMBROS: MembroBasico[] = []

export function PreviewAvaliacaoModal({
    isOpen,
    onClose,
    onConfirm,
    isCreating,
    previewData,
    nomeAvaliacao,
    membrosAtivos = EMPTY_MEMBROS,
}: PreviewAvaliacaoModalProps) {
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
    const [paresEditaveis, setParesEditaveis] = useState<PreviewMembro[]>([])
    const [addingForId, setAddingForId] = useState<number | null>(null)
    const [busca, setBusca] = useState("")
    const searchRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (!isOpen) return
        if (membrosAtivos.length > 0) {
            const previewMap = new Map(previewData.map(m => [m.id, m]))
            const todos = membrosAtivos.map(m => {
                const existente = previewMap.get(m.id)
                return existente ?? {
                    id: m.id,
                    nome: m.nome,
                    area: m.area,
                    fotoUrl: m.fotoUrl,
                    isCoordenador: false,
                    avaliaQuem: []
                }
            })
            setParesEditaveis(todos)
        } else {
            setParesEditaveis(previewData)
        }
    }, [isOpen, previewData, membrosAtivos])

    useEffect(() => {
        if (addingForId !== null) {
            setBusca("")
            setTimeout(() => searchRef.current?.focus(), 50)
        }
    }, [addingForId])

    if (!isOpen) return null

    const removerPar = (avaliadorId: number, avaliadoId: number) => {
        setParesEditaveis(prev => prev.map(m =>
            m.id === avaliadorId
                ? { ...m, avaliaQuem: m.avaliaQuem.filter(a => a.id !== avaliadoId) }
                : m
        ))
    }

    const adicionarPar = (avaliadorId: number, avaliado: MembroBasico) => {
        setParesEditaveis(prev => prev.map(m => {
            if (m.id !== avaliadorId) return m
            if (m.avaliaQuem.some(a => a.id === avaliado.id)) return m
            return {
                ...m,
                avaliaQuem: [...m.avaliaQuem, { id: avaliado.id, nome: avaliado.nome, area: avaliado.area, fotoUrl: avaliado.fotoUrl }]
            }
        }))
        setAddingForId(null)
    }

    const totalPares = paresEditaveis.reduce((acc, m) => acc + m.avaliaQuem.length, 0)

    const handleConfirm = () => {
        const pares: Array<{avaliadorId: number, avaliadoId: number}> = []
        for (const m of paresEditaveis) {
            for (const avaliado of m.avaliaQuem) {
                pares.push({ avaliadorId: m.id, avaliadoId: avaliado.id })
            }
        }
        onConfirm(pares)
    }

    const toggleExpand = (id: number) => {
        const newSet = new Set(expandedIds)
        if (newSet.has(id)) newSet.delete(id)
        else newSet.add(id)
        setExpandedIds(newSet)
    }

    const expandAll = () => setExpandedIds(new Set(paresEditaveis.map(m => m.id)))
    const collapseAll = () => setExpandedIds(new Set())

    // Agrupar por área
    const areaGroups: Record<string, PreviewMembro[]> = {}
    for (const membro of paresEditaveis) {
        if (!areaGroups[membro.area]) areaGroups[membro.area] = []
        areaGroups[membro.area].push(membro)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-bg-card rounded-xl shadow-xl w-full max-w-3xl mx-4 max-h-[85vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-text-main">Configurar Pares de Avaliação</h2>
                        <p className="text-sm text-text-muted mt-1">
                            <span className="font-medium">{nomeAvaliacao}</span> • {totalPares} pares • Edite quem avalia quem antes de ativar
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
                        <span>Gerado das demandas — você pode adicionar ou remover pares</span>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={expandAll} className="text-xs text-primary hover:underline cursor-pointer">Expandir tudo</button>
                        <span className="text-gray-300">|</span>
                        <button onClick={collapseAll} className="text-xs text-primary hover:underline cursor-pointer">Recolher tudo</button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-6">
                        {Object.entries(areaGroups)
                            .sort((a, b) => (AREA_ORDER[a[0]] ?? 99) - (AREA_ORDER[b[0]] ?? 99))
                            .map(([area, membros]) => (
                                <div key={area}>
                                    <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">{area}</h3>
                                    <div className="space-y-2">
                                        {membros.map((membro) => {
                                            const jaLista = new Set(membro.avaliaQuem.map(a => a.id))
                                            const disponiveis = membrosAtivos.filter(m =>
                                                m.id !== membro.id &&
                                                !jaLista.has(m.id) &&
                                                m.nome.toLowerCase().includes(busca.toLowerCase())
                                            )

                                            return (
                                                <div key={membro.id} className="bg-bg-main border border-border rounded-lg overflow-hidden">
                                                    {/* Membro Header */}
                                                    <button
                                                        onClick={() => toggleExpand(membro.id)}
                                                        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            {membro.fotoUrl ? (
                                                                <Image src={membro.fotoUrl} alt={membro.nome} width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
                                                            ) : (
                                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                                                                    {membro.nome.charAt(0)}
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium text-text-main">{membro.nome}</span>
                                                                {membro.isCoordenador && (
                                                                    <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">Coord</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-text-muted">
                                                            <span>Avalia {membro.avaliaQuem.length}</span>
                                                            {expandedIds.has(membro.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                        </div>
                                                    </button>

                                                    {/* Expanded Content */}
                                                    {expandedIds.has(membro.id) && (
                                                        <div className="px-3 pb-3 pt-0">
                                                            <div className="border-t border-border pt-3 space-y-3">
                                                                {/* Chips de avaliados */}
                                                                <div className="flex flex-wrap gap-2">
                                                                    {membro.avaliaQuem.length === 0 && (
                                                                        <p className="text-sm text-text-muted italic">Nenhum par definido</p>
                                                                    )}
                                                                    {membro.avaliaQuem.map((avaliado) => (
                                                                        <div key={avaliado.id} className="flex items-center gap-2 bg-white border border-gray-200 rounded-full pl-3 pr-1.5 py-1.5 group">
                                                                            <ArrowRight size={12} className="text-gray-400 shrink-0" />
                                                                            {avaliado.fotoUrl ? (
                                                                                <Image src={avaliado.fotoUrl} alt={avaliado.nome} width={20} height={20} className="w-5 h-5 rounded-full object-cover" />
                                                                            ) : (
                                                                                <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-medium text-gray-600">
                                                                                    {avaliado.nome.charAt(0)}
                                                                                </div>
                                                                            )}
                                                                            <span className="text-sm text-text-main">{avaliado.nome}</span>
                                                                            <span className="text-xs text-text-muted">({avaliado.area})</span>
                                                                            <button
                                                                                onClick={() => removerPar(membro.id, avaliado.id)}
                                                                                className="ml-1 w-5 h-5 rounded-full bg-gray-100 hover:bg-red-100 hover:text-red-500 flex items-center justify-center text-gray-400 transition-colors cursor-pointer"
                                                                                title="Remover par"
                                                                            >
                                                                                <X size={11} />
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                </div>

                                                                {/* Adicionar pessoa */}
                                                                {addingForId === membro.id ? (
                                                                    <div className="flex flex-col gap-2">
                                                                        <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 bg-white">
                                                                            <Search size={14} className="text-gray-400 shrink-0" />
                                                                            <input
                                                                                ref={searchRef}
                                                                                type="text"
                                                                                placeholder="Buscar membro..."
                                                                                value={busca}
                                                                                onChange={(e) => setBusca(e.target.value)}
                                                                                className="flex-1 text-sm outline-none bg-transparent"
                                                                            />
                                                                            <button onClick={() => setAddingForId(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                                                                                <X size={14} />
                                                                            </button>
                                                                        </div>
                                                                        <div className="max-h-40 overflow-y-auto border border-border rounded-lg bg-white">
                                                                            {disponiveis.length === 0 ? (
                                                                                <p className="text-sm text-text-muted p-3 text-center">Nenhum membro disponível</p>
                                                                            ) : (
                                                                                disponiveis.map(m => (
                                                                                    <button
                                                                                        key={m.id}
                                                                                        onClick={() => adicionarPar(membro.id, m)}
                                                                                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors text-left cursor-pointer"
                                                                                    >
                                                                                        {m.fotoUrl ? (
                                                                                            <Image src={m.fotoUrl} alt={m.nome} width={24} height={24} className="w-6 h-6 rounded-full object-cover" />
                                                                                        ) : (
                                                                                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-medium text-gray-600">
                                                                                                {m.nome.charAt(0)}
                                                                                            </div>
                                                                                        )}
                                                                                        <div>
                                                                                            <span className="text-sm font-medium text-text-main">{m.nome}</span>
                                                                                            <span className="text-xs text-text-muted ml-2">({m.area})</span>
                                                                                        </div>
                                                                                    </button>
                                                                                ))
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => setAddingForId(membro.id)}
                                                                        className="flex items-center gap-1.5 text-xs text-primary hover:underline cursor-pointer font-medium"
                                                                    >
                                                                        <Plus size={13} />
                                                                        Adicionar pessoa
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 border-t border-border shrink-0">
                    <Button variant="secondary" className="flex-1" onClick={onClose}>Voltar</Button>
                    <Button
                        className="flex-1"
                        onClick={handleConfirm}
                        isLoading={isCreating}
                        icon={isCreating ? <Loader2 className="animate-spin" size={18} /> : undefined}
                    >
                        Confirmar e Ativar
                    </Button>
                </div>
            </div>
        </div>
    )
}
