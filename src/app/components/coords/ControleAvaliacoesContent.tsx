"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, Calendar, Users, ChevronRight, Plus, Eye } from "lucide-react"
import { Button } from "@/src/app/components/Button"
import { DesempenhoChart } from "./DesempenhoChart"
import {
    getAvaliacaoAtiva,
    getAvaliacaoHistorico,
    getEvolucaoDesempenho,
    criarAvaliacao,
    finalizarAvaliacao,
    getPreviewAvaliacoes,
    AvaliacaoAtiva,
    AvaliacaoHistorico,
    EvolucaoDesempenho,
    PreviewMembro,
} from "@/src/actions/controleAvaliacoesActions"
import { getAllAreas } from "@/src/actions/membrosActions"
import { PreviewAvaliacaoModal } from "./PreviewAvaliacaoModal"
import { DeleteAvaliacaoModal } from "./DeleteAvaliacaoModal"
import { useAuth } from "@/src/context/authContext"


function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    })
}

export function ControleAvaliacoesContent() {
    const router = useRouter()
    const { coordenador } = useAuth()
    const [avaliacaoAtiva, setAvaliacaoAtiva] = useState<AvaliacaoAtiva | null>(null)
    const [historico, setHistorico] = useState<AvaliacaoHistorico[]>([])
    const [evolucao, setEvolucao] = useState<EvolucaoDesempenho[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [areaFilter, setAreaFilter] = useState<number | undefined>(undefined)
    const [areas, setAreas] = useState<{ id: number; nome: string }[]>([])
    const [showNovaModal, setShowNovaModal] = useState(false)
    const [showPreviewModal, setShowPreviewModal] = useState(false)
    const [nomeNovaAvaliacao, setNomeNovaAvaliacao] = useState("")
    const [isCreating, setIsCreating] = useState(false)
    const [isLoadingPreview, setIsLoadingPreview] = useState(false)
    const [isFinalizing, setIsFinalizing] = useState(false)
    const [previewData, setPreviewData] = useState<PreviewMembro[]>([])
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [avaliacaoToDelete, setAvaliacaoToDelete] = useState<{ id: number; nome: string } | null>(null)

    const loadData = useCallback(async () => {
        setIsLoading(true)
        const [ativa, hist, areasData, evol] = await Promise.all([
            getAvaliacaoAtiva(),
            getAvaliacaoHistorico(),
            getAllAreas(),
            getEvolucaoDesempenho(areaFilter),
        ])
        setAvaliacaoAtiva(ativa)
        setHistorico(hist)
        setAreas(areasData)
        setEvolucao(evol)
        setIsLoading(false)
    }, [areaFilter])

    useEffect(() => {
        loadData()
    }, [loadData])

    const handleAbrirPreview = async () => {
        if (!nomeNovaAvaliacao.trim()) return
        setIsLoadingPreview(true)
        const preview = await getPreviewAvaliacoes()
        setPreviewData(preview)
        setShowNovaModal(false)
        setShowPreviewModal(true)
        setIsLoadingPreview(false)
    }

    const handleCriarAvaliacao = async () => {
        if (!nomeNovaAvaliacao.trim() || !coordenador) return
        setIsCreating(true)
        const result = await criarAvaliacao(nomeNovaAvaliacao, coordenador.id)
        if (result.success) {
            setShowPreviewModal(false)
            setNomeNovaAvaliacao("")
            await loadData()
        }
        setIsCreating(false)
    }

    const handleVoltarParaNome = () => {
        setShowPreviewModal(false)
        setShowNovaModal(true)
    }

    const handleFinalizarAvaliacao = async () => {
        if (!avaliacaoAtiva) return
        setIsFinalizing(true)
        const result = await finalizarAvaliacao(avaliacaoAtiva.id)
        if (result.success) {
            await loadData()
        }
        setIsFinalizing(false)
    }

    const handleHistoricoClick = (avaliacaoId: number) => {
        router.push(`/coord/avaliacoes/${avaliacaoId}`)
    }

    const handleVerDetalhes = () => {
        if (avaliacaoAtiva) {
            router.push(`/coord/avaliacoes/${avaliacaoAtiva.id}`)
        }
    }

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-text-muted">Carregando...</div>
            </div>
        )
    }

    return (
        <div className="flex-1 overflow-y-auto">
            {/* Header */}
            <div className="bg-bg-main border-b border-border">
                <div className="px-8 py-6 max-w-[1200px] mx-auto w-full flex flex-col gap-2">
                    <h2 className="text-text-main text-3xl font-bold tracking-tight">Controle de Avaliações</h2>
                    <p className="text-text-muted">Gerencie ciclos ativos, analise o desempenho e acesse o histórico.</p>
                </div>
            </div>

            {/* Content */}
            <div className="px-8 py-8 max-w-[1200px] mx-auto w-full flex flex-col gap-8">
                {/* Section 1: Hero Card - Avaliação Ativa ou Criar Nova */}
                <section className="w-full">
                    <div className="bg-bg-card rounded-xl shadow-sm border border-border overflow-hidden relative">
                        {/* Top accent */}
                        <div className="h-1 w-full bg-linear-to-r from-primary to-secondary" />
                        
                        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
                            {avaliacaoAtiva ? (
                                <>
                                    {/* Left: Status Info */}
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                                                </span>
                                                Em andamento
                                            </span>
                                            <span className="text-sm text-text-muted">
                                                {avaliacaoAtiva.diasRestantes > 0 
                                                    ? `Termina em ${avaliacaoAtiva.diasRestantes} dias`
                                                    : "Prazo encerrado"}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-text-main mb-1">{avaliacaoAtiva.nome}</h3>
                                            <p className="text-text-muted text-sm">
                                                Iniciada em {formatDate(avaliacaoAtiva.dataInicio)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Middle: Progress */}
                                    <div className="flex-1 w-full md:max-w-sm bg-bg-main rounded-lg p-4 border border-border">
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-sm font-medium text-text-main">Progresso Geral</span>
                                            <span className="text-2xl font-bold text-primary">{avaliacaoAtiva.progressoPercent}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                                            <div 
                                                className="bg-primary h-2.5 rounded-full transition-all"
                                                style={{ width: `${avaliacaoAtiva.progressoPercent}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-text-muted text-right">
                                            {avaliacaoAtiva.membrosAvaliaram} de {avaliacaoAtiva.totalMembros} membros avaliaram
                                        </p>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex flex-col gap-3 w-full md:w-auto">
                                        <Button
                                            onClick={handleVerDetalhes}
                                            variant="secondary"
                                            icon={<Eye size={18} />}
                                            iconPosition="left"
                                        >
                                            Ver Detalhes
                                        </Button>
                                        <Button
                                            onClick={handleFinalizarAvaliacao}
                                            isLoading={isFinalizing}
                                            icon={<CheckCircle size={18} />}
                                            iconPosition="left"
                                        >
                                            Finalizar Avaliação
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                /* Nenhuma avaliação ativa - Criar nova */
                                <div className="flex flex-col md:flex-row items-center gap-6 w-full">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Calendar className="text-text-muted" size={20} />
                                            <span className="text-sm text-text-muted">Nenhuma avaliação ativa</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-text-main mb-1">
                                            Inicie um novo ciclo de avaliação
                                        </h3>
                                        <p className="text-text-muted text-sm">
                                            Crie uma nova avaliação para que os membros possam avaliar seus colegas.
                                        </p>
                                    </div>
                                    <Button
                                        onClick={() => setShowNovaModal(true)}
                                        icon={<Plus size={18} />}
                                        iconPosition="left"
                                    >
                                        Nova Avaliação
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Section 2: Gráfico de Desempenho */}
                <section className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h2 className="text-lg font-bold text-text-main">Desempenho Geral</h2>
                        
                        {/* Filters */}
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Dropdown Area */}
                            <div className="relative">
                                <select
                                    value={areaFilter ?? ""}
                                    onChange={(e) => setAreaFilter(e.target.value ? Number(e.target.value) : undefined)}
                                    className="appearance-none bg-bg-card border border-border text-text-main py-2 pl-3 pr-8 rounded-lg text-sm font-medium shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer min-w-[160px]"
                                >
                                    <option value="">Todas as Áreas</option>
                                    {areas.map((area) => (
                                        <option key={area.id} value={area.id}>{area.nome}</option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                    <ChevronRight size={16} className="rotate-90" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chart Card */}
                    <div className="bg-bg-card rounded-xl p-6 shadow-sm border border-border h-[400px]">
                        <DesempenhoChart data={evolucao} />
                    </div>
                </section>

                {/* Section 3: Histórico */}
                <section className="flex flex-col gap-4 pb-12">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-text-main">Histórico de Avaliações</h2>
                    </div>

                    {historico.length === 0 ? (
                        <div className="bg-bg-card rounded-xl border border-border p-8 text-center text-text-muted">
                            Nenhuma avaliação finalizada ainda
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {historico.map((av) => (
                                <div
                                    key={av.id}
                                    onClick={() => handleHistoricoClick(av.id)}
                                    className="group bg-bg-card rounded-lg p-4 border border-border shadow-sm hover:shadow-md hover:border-primary/50 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-primary group-hover:text-text-main transition-colors">
                                            <Calendar size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-text-main group-hover:text-primary transition-colors">
                                                {av.nome}
                                            </h3>
                                            <p className="text-sm text-text-muted">
                                                {formatDate(av.dataInicio)}
                                                {av.dataFim && ` - ${formatDate(av.dataFim)}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 sm:justify-end flex-1">
                                        <div className="flex items-center gap-2 text-sm text-text-main">
                                            <Users size={16} className="text-text-muted" />
                                            <span>{av.totalParticipantes} Participantes</span>
                                        </div>
                                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                            Finalizada
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setAvaliacaoToDelete({ id: av.id, nome: av.nome })
                                                setShowDeleteModal(true)
                                            }}
                                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                                            title="Excluir avaliação"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                                            </svg>
                                        </button>
                                        <ChevronRight size={20} className="text-gray-400 group-hover:text-primary hidden sm:block" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {/* Modal Nova Avaliação */}
            {showNovaModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowNovaModal(false)} />
                    <div className="relative bg-bg-card rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
                        <h2 className="text-xl font-bold text-text-main mb-4">Nova Avaliação</h2>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-text-main mb-1">Nome da Avaliação *</label>
                            <input
                                type="text"
                                value={nomeNovaAvaliacao}
                                onChange={(e) => setNomeNovaAvaliacao(e.target.value)}
                                className="w-full px-4 py-2.5 border border-border rounded-lg bg-bg-main focus:outline-none focus:border-primary"
                                placeholder="Ex: Avaliação Q1 2024"
                            />
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="secondary"
                                className="flex-1"
                                onClick={() => setShowNovaModal(false)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                className="flex-1"
                                onClick={handleAbrirPreview}
                                isLoading={isLoadingPreview}
                                disabled={!nomeNovaAvaliacao.trim()}
                            >
                                Ver Preview
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Preview */}
            <PreviewAvaliacaoModal
                isOpen={showPreviewModal}
                onClose={handleVoltarParaNome}
                onConfirm={handleCriarAvaliacao}
                isCreating={isCreating}
                previewData={previewData}
                nomeAvaliacao={nomeNovaAvaliacao}
            />

            {/* Modal Delete Avaliação */}
            {avaliacaoToDelete && (
                <DeleteAvaliacaoModal
                    isOpen={showDeleteModal}
                    onClose={() => {
                        setShowDeleteModal(false)
                        setAvaliacaoToDelete(null)
                    }}
                    onSuccess={loadData}
                    avaliacaoId={avaliacaoToDelete.id}
                    avaliacaoNome={avaliacaoToDelete.nome}
                />
            )}
        </div>
    )
}
