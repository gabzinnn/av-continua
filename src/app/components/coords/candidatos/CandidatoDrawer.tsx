"use client"

import { CandidatoDetalhado, ESCALA_NOTAS_MAP, EscalaNotasLabel } from "@/src/types/candidatos"
import { StatusBadge } from "./StatusBadge"
import { AvaliarEtapaModal } from "./AvaliarEtapaModal"
import { X, Mail, School, AlertTriangle, CheckCircle, XCircle, Trash2 } from "lucide-react"
import { useState } from "react"
import { avancarEtapaCandidato, atualizarObservacaoCandidato, aprovarEtapaCandidato, salvarNotasCapacitacao, excluirCandidato } from "@/src/actions/gestaoCandidatosActions"

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
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    
    if (!candidato) return null

    // Inicializa o estado da observação quando o candidato muda
    if (candidato.observacao !== candidateObs && !isSavingObs) {
        setCandidateObs(candidato.observacao)
    }
    
    // Determina se as ações devem estar disponíveis (permite editar reprovados para correção)
    const podeAgir = (candidato.statusGeral === "ATIVO" || candidato.statusGeral === "REPROVADO") && candidato.etapaAtual >= 2
    const etapaNome = candidato.etapaAtual === 2 ? "Dinâmica" : 
                      candidato.etapaAtual === 3 ? "Entrevista" : 
                      candidato.etapaAtual === 4 ? "Capacitação" : "Prova"
    
    const handleAtribuirNota = async (data: any) => {
        setIsLoading(true)
        setError(null)
        try {
            let result;
            if (candidato.etapaAtual === 4) {
                 result = await salvarNotasCapacitacao(candidato.id, data)
            } else {
                 result = await avancarEtapaCandidato(candidato.id, candidato.etapaAtual, data)
            }

            if (result.success) {
                onCandidatoAtualizado?.()
                setIsAvaliarModalOpen(false)
            } else {
                setError(result.error || "Erro ao atribuir nota")
            }
        } catch {
            setError("Erro inesperado ao atribuir nota")
        } finally {
            setIsLoading(false)
        }
    }
    
    const handleAprovar = async (aprovado: boolean) => {
        setIsLoading(true)
        setError(null)
        try {
            const result = await aprovarEtapaCandidato(candidato.id, candidato.etapaAtual, aprovado)
            if (result.success) {
                onCandidatoAtualizado?.()
                onClose()
            } else {
                setError(result.error || "Erro ao atualizar aprovação")
            }
        } catch {
            setError("Erro inesperado ao atualizar aprovação")
        } finally {
            setIsLoading(false)
        }
    }
    
    const handleExcluir = async () => {
        setIsDeleting(true)
        setError(null)
        try {
            const result = await excluirCandidato(candidato.id)
            if (result.success) {
                setIsDeleteModalOpen(false)
                onCandidatoAtualizado?.()
                onClose()
            } else {
                setError(result.error || "Erro ao excluir candidato")
                setIsDeleteModalOpen(false)
            }
        } catch {
            setError("Erro inesperado ao excluir candidato")
            setIsDeleteModalOpen(false)
        } finally {
            setIsDeleting(false)
        }
    }

    // Obter status de aprovação da etapa atual
    const getAprovacaoAtual = (): boolean | null => {
        switch (candidato.etapaAtual) {
            case 2: return candidato.dinamica.aprovado
            case 3: return candidato.entrevista.aprovado
            case 4: return candidato.capacitacao.aprovado
            default: return null
        }
    }
    const aprovacaoAtual = getAprovacaoAtual()
    
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
                    {(["resumo", "notas", "dados", "observacoes"] as TabType[]).map((tab) => (
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
                                        details={
                                            (candidato.capacitacao.notaArtigo !== null || candidato.capacitacao.apresArtigo !== null || candidato.capacitacao.notaCase !== null) ? (
                                                <div className="flex flex-col gap-1.5 mt-1.5 pt-1">
                                                    {candidato.capacitacao.notaArtigo !== null && (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-text-muted">Artigo:</span>
                                                            <span className="font-semibold text-text-main">{candidato.capacitacao.notaArtigo.toFixed(1)} <span className="text-[10px] text-text-muted font-normal">/ 5.0</span></span>
                                                        </div>
                                                    )}
                                                    {candidato.capacitacao.apresArtigo !== null && (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-text-muted">Apres.:</span>
                                                            <span className="font-semibold text-text-main">{candidato.capacitacao.apresArtigo.toFixed(1)} <span className="text-[10px] text-text-muted font-normal">/ 5.0</span></span>
                                                        </div>
                                                    )}
                                                    {candidato.capacitacao.notaCase !== null && (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-text-muted">Case:</span>
                                                            <span className={`font-bold ${candidato.capacitacao.notaCaseLabel?.cor === "red" ? "text-red-600" : "text-green-600"}`}>
                                                                {candidato.capacitacao.notaCaseLabel?.valor || candidato.capacitacao.notaCase}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : null
                                        }
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
                            
                            {/* Zona de Perigo */}
                            <div className="mt-8 pt-6 border-t border-red-200">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-red-500 mb-3">Zona de Perigo</h4>
                                <button
                                    onClick={() => setIsDeleteModalOpen(true)}
                                    className="w-full py-3 px-4 rounded-lg border-2 border-red-300 text-red-600 font-bold hover:bg-red-50 transition-all text-sm cursor-pointer flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={16} />
                                    Excluir Candidato
                                </button>
                                <p className="text-xs text-text-muted mt-2">
                                    Esta ação é irreversível. Todos os dados, notas e resultados do candidato serão removidos permanentemente.
                                </p>
                            </div>
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
                    
                    {/* Botão de atribuir nota */}
                    <button
                        onClick={() => setIsAvaliarModalOpen(true)}
                        disabled={!podeAgir || isLoading}
                        className="w-full py-3 px-4 rounded-lg bg-primary text-text-main font-bold hover:bg-primary-hover shadow-md hover:shadow-lg transition-all text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">edit_note</span>
                        Atribuir Nota da Etapa
                    </button>
                    
                    {/* Seção de Aprovação - separada do botão de nota */}
                    {podeAgir && (
                        <div className="pt-3 border-t border-border flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                                    Decisão de Aprovação
                                </span>
                                {aprovacaoAtual === null ? (
                                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                                        Aguardando
                                    </span>
                                ) : aprovacaoAtual ? (
                                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                                        Aprovado
                                    </span>
                                ) : (
                                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                                        Reprovado
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleAprovar(false)}
                                    disabled={isLoading}
                                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                                        aprovacaoAtual === false
                                            ? "bg-red-600 text-white"
                                            : "border border-red-300 text-red-600 hover:bg-red-50"
                                    }`}
                                >
                                    <XCircle size={16} />
                                    Reprovar
                                </button>
                                <button
                                    onClick={() => handleAprovar(true)}
                                    disabled={isLoading}
                                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                                        aprovacaoAtual === true
                                            ? "bg-green-600 text-white"
                                            : "border border-green-300 text-green-600 hover:bg-green-50"
                                    }`}
                                >
                                    <CheckCircle size={16} />
                                    Aprovar
                                </button>
                            </div>
                        </div>
                    )}
                    
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
                etapaAtual={candidato.etapaAtual}
                valoresAtuais={{
                    notaDinamica: candidato.dinamica.nota,
                    notaEntrevista: candidato.entrevista.nota,
                    notaArtigo: candidato.capacitacao.notaArtigo,
                    apresArtigo: candidato.capacitacao.apresArtigo,
                    notaCase: candidato.capacitacao.notaCase
                }}
                isLoading={isLoading}
            />

            {/* Modal de confirmação de exclusão */}
            {isDeleteModalOpen && (
                <>
                    <div 
                        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
                        onClick={() => !isDeleting && setIsDeleteModalOpen(false)}
                    />
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                                    <AlertTriangle size={20} className="text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-text-main">Excluir Candidato</h3>
                                    <p className="text-xs text-text-muted">Ação irreversível</p>
                                </div>
                            </div>
                            
                            <p className="text-sm text-text-muted">
                                Tem certeza de que deseja excluir <strong className="text-text-main">{candidato.nome}</strong>? 
                                Todos os dados, resultados de provas e notas serão removidos permanentemente.
                            </p>
                            
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    disabled={isDeleting}
                                    className="flex-1 py-2.5 px-4 rounded-lg border border-border text-sm font-medium text-text-muted hover:bg-gray-50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleExcluir}
                                    disabled={isDeleting}
                                    className="flex-1 py-2.5 px-4 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isDeleting ? (
                                        <span className="animate-pulse">Excluindo...</span>
                                    ) : (
                                        <>
                                            <Trash2 size={14} />
                                            Excluir
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
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
    notaSuffix,
    details
}: { 
    title: string
    status: string
    etapaAtual: boolean
    nota: string | null
    notaLabel?: string
    notaSuffix?: string
    details?: React.ReactNode
}) {
    const dotColor = status === "APROVADO" ? "bg-green-500" :
                     status === "REPROVADO" ? "bg-red-500" :
                     status === "BLOQUEADO" ? "bg-gray-300" :
                     etapaAtual ? "bg-primary animate-pulse" : "bg-yellow-500"
    
    return (
        <div className="relative">
            <div className={`absolute -left-[25px] top-0.5 h-4 w-4 rounded-full ${dotColor} border-2 border-white`} />
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
            {details && (
                <div className="mt-2 text-xs text-text-muted pl-1 border-l-2 border-gray-100">
                    {details}
                </div>
            )}
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
