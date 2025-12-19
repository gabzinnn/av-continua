"use client"

import { useState } from "react"
import { X, Crown, Trash2 } from "lucide-react"
import Image from "next/image"
import { Button } from "@/src/app/components/Button"
import { 
    DemandaCompleta, 
    MembroParaAlocacao, 
    alocarMembro, 
    desalocarMembro,
    toggleLider 
} from "@/src/actions/demandasActions"

interface AlocarMembrosModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    demanda: DemandaCompleta | null
    membrosDisponiveis: MembroParaAlocacao[]
}

function getInitials(nome: string): string {
    const parts = nome.split(" ")
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return nome.substring(0, 2).toUpperCase()
}

export function AlocarMembrosModal({ isOpen, onClose, onSuccess, demanda, membrosDisponiveis }: AlocarMembrosModalProps) {
    const [isLoading, setIsLoading] = useState<number | null>(null)
    const [busca, setBusca] = useState("")
    const [error, setError] = useState("")

    if (!isOpen || !demanda) return null

    const alocadosIds = demanda.alocacoes.map(a => a.membro.id)
    const membrosNaoAlocados = membrosDisponiveis.filter(m => !alocadosIds.includes(m.id))

    const membrosFiltrados = busca.trim() 
        ? membrosNaoAlocados.filter(m => 
            m.nome.toLowerCase().includes(busca.toLowerCase()) ||
            m.area.toLowerCase().includes(busca.toLowerCase())
          )
        : membrosNaoAlocados

    const handleAlocar = async (membroId: number) => {
        setIsLoading(membroId)
        setError("")
        const result = await alocarMembro(demanda.id, membroId, false)
        if (!result.success) {
            setError(result.error || "Erro ao alocar membro")
        } else {
            onSuccess()
        }
        setIsLoading(null)
    }

    const handleDesalocar = async (alocacaoId: number) => {
        setIsLoading(alocacaoId)
        setError("")
        const result = await desalocarMembro(alocacaoId)
        if (!result.success) {
            setError(result.error || "Erro ao desalocar membro")
        } else {
            onSuccess()
        }
        setIsLoading(null)
    }

    const handleToggleLider = async (alocacaoId: number) => {
        setIsLoading(alocacaoId)
        setError("")
        const result = await toggleLider(alocacaoId)
        if (!result.success) {
            setError(result.error || "Erro ao alterar líder")
        } else {
            onSuccess()
        }
        setIsLoading(null)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-bg-card rounded-xl shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-text-main">Alocar Membros</h2>
                        <p className="text-sm text-gray-500">{demanda.nome}</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mb-4">{error}</div>
                    )}

                    {/* Membros Alocados */}
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-text-main mb-3 uppercase tracking-wider">
                            Membros Alocados ({demanda.alocacoes.length})
                        </h3>
                        {demanda.alocacoes.length === 0 ? (
                            <p className="text-gray-500 text-sm bg-gray-50 rounded-lg p-4 text-center">
                                Nenhum membro alocado nesta demanda
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {demanda.alocacoes.map((alocacao) => (
                                    <div 
                                        key={alocacao.id}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            {alocacao.membro.fotoUrl ? (
                                                <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200">
                                                    <Image
                                                        src={alocacao.membro.fotoUrl}
                                                        alt={alocacao.membro.nome}
                                                        width={40}
                                                        height={40}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-secondary/40 flex items-center justify-center text-sm font-bold text-text-main">
                                                    {getInitials(alocacao.membro.nome)}
                                                </div>
                                            )}
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-text-main">{alocacao.membro.nome}</span>
                                                    {alocacao.isLider && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary">
                                                            <Crown size={12} />
                                                            Líder
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleToggleLider(alocacao.id)}
                                                disabled={isLoading === alocacao.id}
                                                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                                                    alocacao.isLider 
                                                        ? "bg-primary/20 text-primary hover:bg-primary/30" 
                                                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                                }`}
                                                title={alocacao.isLider ? "Remover líder" : "Tornar líder"}
                                            >
                                                <Crown size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDesalocar(alocacao.id)}
                                                disabled={isLoading === alocacao.id}
                                                className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                                                title="Remover da demanda"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Adicionar Membros */}
                    <div>
                        <h3 className="text-sm font-semibold text-text-main mb-3 uppercase tracking-wider">
                            Adicionar Membros
                        </h3>
                        
                        <input
                            type="text"
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            placeholder="Buscar por nome ou área..."
                            className="w-full px-4 py-2.5 border border-border rounded-lg bg-bg-main focus:outline-none focus:border-primary mb-3"
                        />

                        {membrosFiltrados.length === 0 ? (
                            <p className="text-gray-500 text-sm bg-gray-50 rounded-lg p-4 text-center">
                                {busca ? "Nenhum membro encontrado" : "Todos os membros já estão alocados"}
                            </p>
                        ) : (
                            <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                {membrosFiltrados.map((membro) => (
                                    <div 
                                        key={membro.id}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            {membro.fotoUrl ? (
                                                <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200">
                                                    <Image
                                                        src={membro.fotoUrl}
                                                        alt={membro.nome}
                                                        width={40}
                                                        height={40}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-secondary/40 flex items-center justify-center text-sm font-bold text-text-main">
                                                    {getInitials(membro.nome)}
                                                </div>
                                            )}
                                            <div>
                                                <span className="text-sm font-medium text-text-main block">{membro.nome}</span>
                                                <span className="text-xs text-gray-500">{membro.area}</span>
                                            </div>
                                        </div>
                                        <Button
                                            onClick={() => handleAlocar(membro.id)}
                                            size="sm"
                                            disabled={isLoading === membro.id}
                                            isLoading={isLoading === membro.id}
                                        >
                                            Alocar
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-border flex-shrink-0">
                    <Button
                        variant="secondary"
                        className="w-full"
                        onClick={onClose}
                    >
                        Fechar
                    </Button>
                </div>
            </div>
        </div>
    )
}
