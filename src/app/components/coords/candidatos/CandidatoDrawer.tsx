"use client"

import { CandidatoDetalhado, ESCALA_NOTAS_MAP, EscalaNotasLabel } from "@/src/types/candidatos"
import { StatusBadge } from "./StatusBadge"
import { AvaliarEtapaModal } from "./AvaliarEtapaModal"
import { X, Mail, School, AlertTriangle } from "lucide-react"
import { useState } from "react"
import { avancarEtapaCandidato, atualizarObservacaoCandidato } from "@/src/actions/gestaoCandidatosActions"

interface CandidatoDrawerProps {
    candidato: CandidatoDetalhado | null
    isOpen: boolean
    onClose: () => void
    onCandidatoAtualizado?: () => void
}

function getInitials(nome: string): string {
    const parts = nome.split(" ")
    if (parts.length >= 2) {
        return parts[0][0] + parts[parts.length - 1][0]
    }
    return nome.substring(0, 2).toUpperCase()
}

function getStatusGeralLabel(status: string): { label: string; classes: string } {
    switch (status) {
        case "APROVADO": return { label: "Aprovado", classes: "bg-green-100 text-green-800" }
        case "REPROVADO": return { label: "Reprovado", classes: "bg-red-100 text-red-800" }
        case "DESISTENTE": return { label: "Desistente", classes: "bg-gray-100 text-gray-600" }
        default: return { label: "Em Processo", classes: "bg-primary text-text-main" }
    }
}

type TabType = "resumo" | "dados" | "notas" | "observacoes"

export function CandidatoDrawer({ candidato, isOpen, onClose, onCandidatoAtualizado }: CandidatoDrawerProps) {
    const [activeTab, setActiveTab] = useState<TabType>("resumo")
    const [isAvaliarModalOpen, setIsAvaliarModalOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isSavingObs, setIsSavingObs] = useState(false)
    const [candidateObs, setCandidateObs] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    
    if (!candidato) return null

    // Inicializa o estado da observação quando o candidato muda
    if (candidato.observacao !== candidateObs && !isSavingObs) {
        setCandidateObs(candidato.observacao)
    }
    
    // Determina se as ações devem estar disponíveis
    const podeAgir = candidato.statusGeral === "ATIVO" && candidato.etapaAtual >= 2
    const etapaNome = candidato.etapaAtual === 2 ? "Dinâmica" : 
                      candidato.etapaAtual === 3 ? "Entrevista" : 
                      candidato.etapaAtual === 4 ? "Capacitação" : "Prova"
    
    const handleAtribuirNota = async (nota: string) => {
        setIsLoading(true)
        setError(null)
        try {
            const result = await avancarEtapaCandidato(candidato.id, candidato.etapaAtual, nota)
            if (result.success) {
                onCandidatoAtualizado?.()
                onClose()
            } else {
                setError(result.error || "Erro ao atribuir nota")
            }
        } catch {
            setError("Erro inesperado ao atribuir nota")
        } finally {
            setIsLoading(false)
        }
    }
    
    const statusGeral = getStatusGeralLabel(candidato.statusGeral)
    
    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div 
                    className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />
            )}
            
            {/* Drawer */}
            <div className={`
                fixed inset-y-0 right-0 z-50 w-full max-w-md
                bg-white shadow-2xl border-l border-border
                transform transition-transform duration-300 ease-in-out
                ${isOpen ? "translate-x-0" : "translate-x-full"}
                flex flex-col
            `}>
                {/* Header */}
                <div className="p-6 border-b border-border bg-gray-50/50 flex items-start justify-between">
                    <div className="flex gap-4">
                        <div className="h-14 w-14 rounded-xl bg-primary/20 text-text-main flex items-center justify-center font-bold text-xl border-2 border-white shadow-sm">
                            {getInitials(candidato.nome)}
                        </div>
                        <div className="flex flex-col">
                            <h3 className="text-lg font-bold text-text-main">{candidato.nome}</h3>
                            <p className="text-sm text-text-muted">{candidato.curso} • {candidato.periodo}</p>
                            <div className="flex gap-2 mt-1.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${statusGeral.classes}`}>
                                    {statusGeral.label}
                                </span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-gray-200 text-gray-600">
                                    ID: #{candidato.id}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-text-muted hover:text-text-main transition-colors cursor-pointer p-1"
                    >
                        <X size={20} />
                    </button>
                </div>
                
                {/* Tabs */}
                <div className="flex border-b border-border px-6">
                    {(["resumo", "dados", "notas", "observacoes"] as TabType[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-3 text-sm font-medium transition-colors capitalize cursor-pointer ${
                                activeTab === tab 
                                    ? "text-primary border-b-2 border-primary"
                                    : "text-text-muted hover:text-text-main"
                            }`}
                        >
                            {tab === "observacoes" ? "Observações" : tab}
                        </button>
                    ))}
                </div>
                
                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {activeTab === "resumo" && (
                        <>
                            {/* Contact Info */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-lg bg-gray-50 border border-border">
                                    <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
                                        <Mail size={12} />
                                        Email
                                    </div>
                                    <p className="text-sm font-medium text-text-main truncate">{candidato.email}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-gray-50 border border-border">
                                    <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
                                        <School size={12} />
                                        DRE
                                    </div>
                                    <p className="text-sm font-medium text-text-main">{candidato.dre || "N/A"}</p>
                                </div>
                            </div>
                            
                            {/* Timeline */}
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-4">Linha do Tempo</h4>
                                <div className="relative pl-4 border-l-2 border-border space-y-5">
                                    {/* Etapa 1: Prova */}
                                    <TimelineItem 
                                        title="Prova Teórica"
                                        status={candidato.prova.status}
                                        etapaAtual={candidato.etapaAtual === 1}
                                        nota={candidato.prova.notaFinal?.toFixed(1) || null}
                                        notaSuffix="/10"
                                    />
                                    
                                    {/* Etapa 2: Dinâmica */}
                                    <TimelineItem 
                                        title="Dinâmica de Grupo"
                                        status={candidato.dinamica.status}
                                        etapaAtual={candidato.etapaAtual === 2}
                                        nota={candidato.dinamica.notaLabel?.valor || null}
                                        notaLabel={candidato.dinamica.notaLabel?.label}
                                    />
                                    
                                    {/* Etapa 3: Entrevista */}
                                    <TimelineItem 
                                        title="Entrevista Individual"
                                        status={candidato.entrevista.status}
                                        etapaAtual={candidato.etapaAtual === 3}
                                        nota={candidato.entrevista.notaLabel?.valor || null}
                                        notaLabel={candidato.entrevista.notaLabel?.label}
                                    />
                                    
                                    {/* Etapa 4: Capacitação */}
                                    <TimelineItem 
                                        title="Capacitação"
                                        status={candidato.capacitacao.status}
                                        etapaAtual={candidato.etapaAtual === 4}
                                        nota={candidato.capacitacao.progresso > 0 ? `${candidato.capacitacao.progresso}%` : null}
                                    />
                                </div>
                            </div>
                        </>
                    )}
                    
                    {activeTab === "notas" && (
                        <div className="space-y-6">
                            {/* Notas das Etapas */}
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">Etapas do PS</h4>
                                <div className="space-y-3">
                                    <NotaCard 
                                        label="Prova Teórica"
                                        valor={candidato.prova.notaFinal?.toFixed(1)}
                                        tipo="numero"
                                    />
                                    <NotaCard 
                                        label="Dinâmica de Grupo"
                                        valor={candidato.dinamica.notaLabel?.valor}
                                        valorLabel={candidato.dinamica.notaLabel?.label}
                                        tipo="escala"
                                        cor={candidato.dinamica.notaLabel?.cor}
                                    />
                                    <NotaCard 
                                        label="Entrevista"
                                        valor={candidato.entrevista.notaLabel?.valor}
                                        valorLabel={candidato.entrevista.notaLabel?.label}
                                        tipo="escala"
                                        cor={candidato.entrevista.notaLabel?.cor}
                                    />
                                </div>
                            </div>
                            
                            {/* Notas de Capacitação */}
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">Período de Capacitação</h4>
                                <div className="p-4 rounded-lg bg-linear-to-r from-primary/5 to-primary/10 border border-primary/20">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-sm font-bold text-text-main">Progresso Geral</span>
                                        <span className="text-lg font-black text-primary">{candidato.capacitacao.progresso}%</span>
                                    </div>
                                    <div className="w-full bg-white rounded-full h-2 mb-4">
                                        <div 
                                            className="bg-primary h-2 rounded-full transition-all" 
                                            style={{ width: `${candidato.capacitacao.progresso}%` }}
                                        />
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <NotaCard 
                                            label="Nota do Artigo"
                                            valor={candidato.capacitacao.notaArtigo?.toFixed(1)}
                                            tipo="numero"
                                            compact
                                        />
                                        <NotaCard 
                                            label="Apresentação do Artigo"
                                            valor={candidato.capacitacao.apresArtigo?.toFixed(1)}
                                            tipo="numero"
                                            compact
                                        />
                                        <NotaCard 
                                            label="Nota do Case"
                                            valor={candidato.capacitacao.notaCaseLabel?.valor}
                                            valorLabel={candidato.capacitacao.notaCaseLabel?.label}
                                            tipo="escala"
                                            cor={candidato.capacitacao.notaCaseLabel?.cor}
                                            compact
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Legenda Escala */}
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">Legenda da Escala</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(ESCALA_NOTAS_MAP).map(([key, item]) => (
                                        <div key={key} className="flex items-center gap-2 text-xs">
                                            <span className={`font-bold ${
                                                item.cor === "green" ? "text-green-600" :
                                                item.cor === "yellow" ? "text-yellow-600" :
                                                "text-red-600"
                                            }`}>
                                                {item.valor}
                                            </span>
                                            <span className="text-text-muted">-</span>
                                            <span className="text-text-main">{item.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === "dados" && (
                        <div className="space-y-4">
                            <DataRow label="Nome completo" value={candidato.nome} />
                            <DataRow label="Email" value={candidato.email} />
                            <DataRow label="DRE" value={candidato.dre || "N/A"} />
                            <DataRow label="Curso" value={candidato.curso || "N/A"} />
                            <DataRow label="Período" value={candidato.periodo || "N/A"} />
                            <DataRow label="Inscrito em" value={new Date(candidato.createdAt).toLocaleDateString("pt-BR")} />
                        </div>
                    )}
                    
                    {activeTab === "observacoes" && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-text-main">Observações do Candidato</h3>
                                {isSavingObs && <span className="text-xs text-text-muted animate-pulse">Salvando...</span>}
                            </div>
                            <textarea
                                className="w-full h-64 p-4 rounded-lg border border-border bg-gray-50 text-sm text-text-main focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow resize-none"
                                placeholder="Digite aqui observações importantes sobre o candidato..."
                                defaultValue={candidato.observacao || ""}
                                onBlur={async (e) => {
                                    const value = e.target.value
                                    if (value === candidateObs) return
                                    
                                    setIsSavingObs(true)
                                    try {
                                        await atualizarObservacaoCandidato(candidato.id, value)
                                        setCandidateObs(value)
                                        onCandidatoAtualizado?.()
                                    } catch {
                                        setError("Erro ao salvar observação")
                                    } finally {
                                        setIsSavingObs(false)
                                    }
                                }}
                            />
                            <p className="text-xs text-text-muted">
                                As alterações são salvas automaticamente ao sair do campo.
                            </p>
                        </div>
                    )}
                </div>
                
                {/* Footer */}
                <div className="p-6 border-t border-border bg-gray-50/50 flex flex-col gap-3">
                    {/* Error display */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                            <AlertTriangle size={16} />
                            {error}
                        </div>
                    )}
                    
                    <button
                        onClick={() => setIsAvaliarModalOpen(true)}
                        disabled={!podeAgir || isLoading}
                        className="w-full py-3 px-4 rounded-lg bg-primary text-text-main font-bold hover:bg-primary-hover shadow-md hover:shadow-lg transition-all text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">edit_note</span>
                        Atribuir Nota da Etapa
                    </button>
                    
                    {!podeAgir && (
                        <p className="text-xs text-text-muted text-center">
                            {candidato.statusGeral === "REPROVADO" ? "Candidato já reprovado." :
                             candidato.statusGeral === "APROVADO" ? "Candidato já aprovado no PS." :
                             candidato.etapaAtual === 1 ? "A prova é corrigida automaticamente." :
                             ""}
                        </p>
                    )}
                </div>
            </div>
            
            {/* Modal de avaliação */}
            <AvaliarEtapaModal
                isOpen={isAvaliarModalOpen}
                onClose={() => setIsAvaliarModalOpen(false)}
                onConfirm={handleAtribuirNota}
                etapaNome={etapaNome}
                isLoading={isLoading}
            />
        </>
    )
}

// Helper components
function TimelineItem({ 
    title, 
    status, 
    etapaAtual, 
    nota, 
    notaLabel,
    notaSuffix 
}: { 
    title: string
    status: string
    etapaAtual: boolean
    nota: string | null
    notaLabel?: string
    notaSuffix?: string
}) {
    const dotColor = status === "APROVADO" ? "bg-green-500" :
                     status === "REPROVADO" ? "bg-red-500" :
                     status === "BLOQUEADO" ? "bg-gray-300" :
                     etapaAtual ? "bg-primary animate-pulse" : "bg-yellow-500"
    
    return (
        <div className="relative">
            <div className={`absolute -left-[21px] top-0 h-4 w-4 rounded-full ${dotColor} border-2 border-white`} />
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-bold text-text-main">{title}</p>
                    {status !== "BLOQUEADO" && (
                        <p className="text-xs text-text-muted mt-0.5">
                            {status === "APROVADO" ? "Concluído" :
                             status === "REPROVADO" ? "Reprovado" :
                             status === "PENDENTE" ? "Pendente" :
                             status === "EM_ANDAMENTO" ? "Em andamento" : "Aguardando"}
                        </p>
                    )}
                </div>
                {nota && (
                    <div className="text-right">
                        <span className="text-sm font-bold text-text-main">{nota}{notaSuffix}</span>
                        {notaLabel && <p className="text-xs text-text-muted">{notaLabel}</p>}
                    </div>
                )}
            </div>
        </div>
    )
}

function NotaCard({ 
    label, 
    valor, 
    valorLabel, 
    tipo, 
    cor,
    compact 
}: { 
    label: string
    valor?: string | null
    valorLabel?: string
    tipo: "numero" | "escala"
    cor?: "green" | "yellow" | "red" | "gray"
    compact?: boolean
}) {
    const corClass = cor === "green" ? "text-green-600 bg-green-50" :
                     cor === "yellow" ? "text-yellow-600 bg-yellow-50" :
                     cor === "red" ? "text-red-600 bg-red-50" : "text-gray-600 bg-gray-50"
    
    return (
        <div className={`flex items-center justify-between p-3 rounded-lg bg-white border border-border ${compact ? "py-2" : ""}`}>
            <span className="text-sm text-text-muted">{label}</span>
            {valor ? (
                <div className="flex items-center gap-2">
                    <span className={`font-bold ${tipo === "escala" ? `px-2 py-0.5 rounded ${corClass}` : "text-text-main"}`}>
                        {valor}
                    </span>
                    {valorLabel && (
                        <span className="text-xs text-text-muted">{valorLabel}</span>
                    )}
                </div>
            ) : (
                <span className="text-sm text-text-muted italic">Não avaliado</span>
            )}
        </div>
    )
}

function DataRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between py-2 border-b border-border last:border-0">
            <span className="text-sm text-text-muted">{label}</span>
            <span className="text-sm font-medium text-text-main">{value}</span>
        </div>
    )
}
