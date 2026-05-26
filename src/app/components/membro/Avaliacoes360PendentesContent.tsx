"use client"

import { useEffect, useState } from "react"
import { useMember } from "@/src/context/memberContext"
import { getMinhas360Pendentes, getAv360HistoricoMembro, getAv360RespostasForMembro, Av360HistoricoItem, Av360RespostasView } from "@/src/actions/avaliacao360Actions"
import { Card } from "../Card"
import Link from "next/link"
import { ClipboardCheck, CheckCircle, Eye, ArrowLeft, ChevronRight, User } from "lucide-react"

const ESCALA_LABELS: Record<number, string> = {
    1: "Insuficiente",
    2: "Abaixo do esperado",
    3: "Adequado",
    4: "Acima do esperado",
    5: "Excepcional",
}

export function Avaliacoes360PendentesContent() {
    const { selectedMember } = useMember()
    const [feedbacks, setFeedbacks] = useState<any[]>([])
    const [historico, setHistorico] = useState<Av360HistoricoItem[]>([])
    const [loading, setLoading] = useState(true)

    // estados de view de respostas
    const [respostasAv360, setRespostasAv360] = useState<Av360RespostasView | null>(null)
    const [loadingRespostas, setLoadingRespostas] = useState(false)
    const [feedbackSelecionado, setFeedbackSelecionado] = useState<number | null>(null)

    useEffect(() => {
        if (selectedMember) {
            Promise.all([
                getMinhas360Pendentes(Number(selectedMember.id)),
                getAv360HistoricoMembro(Number(selectedMember.id)),
            ]).then(([pendentes, hist]) => {
                setFeedbacks(pendentes)
                setHistorico(hist)
                setLoading(false)
            }).catch(() => setLoading(false))
        }
    }, [selectedMember])

    const handleVerDetalhes = async (avaliacaoId: number) => {
        if (!selectedMember) return
        setLoadingRespostas(true)
        setFeedbackSelecionado(null)
        try {
            const data = await getAv360RespostasForMembro(Number(selectedMember.id), avaliacaoId)
            setRespostasAv360(data)
        } finally {
            setLoadingRespostas(false)
        }
    }

    const handleVoltarParaLista = () => {
        setRespostasAv360(null)
        setFeedbackSelecionado(null)
    }

    const handleVoltarParaAvaliados = () => {
        setFeedbackSelecionado(null)
    }

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Carregando...</div>
    }

    // =============== VIEW: RESPOSTAS DE UM AVALIADO ===============
    if (respostasAv360 && feedbackSelecionado !== null) {
        const avaliado = respostasAv360.avaliados.find(a => a.feedbackId === feedbackSelecionado)
        if (!avaliado) return null

        return (
            <div className="flex-1 overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-bg-main border-b border-border px-6 py-4">
                    <button
                        onClick={handleVoltarParaAvaliados}
                        className="flex items-center gap-2 text-sm text-text-muted hover:text-primary transition-colors cursor-pointer mb-3"
                    >
                        <ArrowLeft size={16} />
                        Voltar para {respostasAv360.avaliacaoNome}
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                            <User size={18} className="text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-text-muted font-medium">Avaliando</p>
                            <h2 className="text-xl font-bold text-text-main">{avaliado.avaliadoNome}</h2>
                        </div>
                    </div>
                </div>

                {/* Dimensões e Perguntas */}
                <div className="p-6 max-w-3xl mx-auto space-y-6 pb-16">
                    {avaliado.dimensoes.map((dim) => (
                        <div key={dim.id} className="bg-bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                            {/* Dimension header */}
                            <div className="px-6 py-4 bg-[#fcfbf8] border-b border-border">
                                <h3 className="font-bold text-primary">{dim.titulo}</h3>
                            </div>

                            {/* Perguntas */}
                            <div className="divide-y divide-border">
                                {dim.perguntas.map((pergunta, pIdx) => (
                                    <div key={pergunta.id} className="px-6 py-5">
                                        <p className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-1">
                                            Pergunta {pIdx + 1}
                                        </p>
                                        <p className="text-base font-medium text-text-main mb-4">{pergunta.texto}</p>

                                        {/* ESCALA 1-5 */}
                                        {pergunta.tipo === "ESCALA" && (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    {[1, 2, 3, 4, 5].map((n) => {
                                                        const selected = pergunta.resposta?.nota === n
                                                        return (
                                                            <div
                                                                key={n}
                                                                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold select-none transition-none ${
                                                                    selected
                                                                        ? "bg-primary text-text-main shadow-sm"
                                                                        : "bg-gray-100 text-gray-400"
                                                                }`}
                                                            >
                                                                {n}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                                {pergunta.resposta?.nota ? (
                                                    <p className="text-xs text-text-muted">
                                                        {pergunta.resposta.nota} — <span className="font-medium">{ESCALA_LABELS[pergunta.resposta.nota]}</span>
                                                    </p>
                                                ) : (
                                                    <p className="text-gray-400 italic text-sm">— Não respondida</p>
                                                )}
                                            </div>
                                        )}

                                        {/* TEXTO_ABERTO */}
                                        {pergunta.tipo === "TEXTO_ABERTO" && (
                                            <div>
                                                {pergunta.resposta?.texto ? (
                                                    <div className="bg-gray-50 rounded-lg border border-border p-4">
                                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{pergunta.resposta.texto}</p>
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-400 italic text-sm">— Não respondida</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    // =============== VIEW: LISTA DE AVALIADOS ===============
    if (respostasAv360) {
        return (
            <div className="flex-1 overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-bg-main border-b border-border px-6 py-4">
                    <button
                        onClick={handleVoltarParaLista}
                        className="flex items-center gap-2 text-sm text-text-muted hover:text-primary transition-colors cursor-pointer mb-3"
                    >
                        <ArrowLeft size={16} />
                        Voltar ao histórico
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-text-main">{respostasAv360.avaliacaoNome}</h2>
                        <p className="text-sm text-text-muted mt-0.5">
                            Selecione um membro para ver suas respostas
                        </p>
                    </div>
                </div>

                <div className="p-6 max-w-2xl mx-auto space-y-3 pb-16">
                    {respostasAv360.avaliados.map((av) => (
                        <button
                            key={av.feedbackId}
                            onClick={() => setFeedbackSelecionado(av.feedbackId)}
                            className="w-full bg-bg-card rounded-xl p-5 border border-border hover:border-primary hover:shadow-md transition-all text-left group cursor-pointer"
                        >
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                                        <User size={18} className="text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-text-main group-hover:text-primary transition-colors">
                                            {av.avaliadoNome}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-green-600">
                                            <CheckCircle size={12} />
                                            <span>Avaliação concluída</span>
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="text-gray-400 group-hover:text-primary transition-colors shrink-0" />
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        )
    }

    // =============== LISTA PRINCIPAL ===============
    const agrupado = feedbacks.reduce((acc: any, f) => {
        if (!acc[f.avaliacaoId]) {
            acc[f.avaliacaoId] = { avaliacaoId: f.avaliacaoId, avaliacaoNome: f.avaliacaoNome, feedbacks: [] }
        }
        acc[f.avaliacaoId].feedbacks.push(f)
        return acc
    }, {})

    const avaliacoesPendentes = Object.values(agrupado) as any[]

    return (
        <div className="p-8 max-w-5xl mx-auto w-full flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Avaliações 360</h1>

            {/* Pendentes */}
            {avaliacoesPendentes.length > 0 ? (
                <div className="mb-8">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">
                        Pendentes ({avaliacoesPendentes.length})
                    </h2>
                    <div className="grid gap-6">
                        {avaliacoesPendentes.map((av) => (
                            <Card key={av.avaliacaoId} className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 mb-2">{av.avaliacaoNome}</h2>
                                        <p className="text-sm text-gray-500">
                                            Você tem {av.feedbacks.length} membro(s) para avaliar nesta etapa.
                                        </p>
                                        <div className="flex flex-wrap gap-2 mt-4">
                                            {av.feedbacks.map((f: any) => (
                                                <div key={f.id} className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full text-xs">
                                                    <div className="w-2 h-2 rounded-full bg-[#fad419]" />
                                                    {f.avaliadoNome} ({f.progresso}%)
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <Link
                                        href={`/avaliacoes-360/${av.avaliacaoId}`}
                                        className="bg-[#fad419] hover:bg-[#eac416] text-[#1c1a0d] px-6 py-2 rounded-lg font-bold text-sm text-center shadow-sm transition-colors whitespace-nowrap"
                                    >
                                        Responder
                                    </Link>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            ) : (
                <Card className="p-8 flex flex-col items-center justify-center text-center bg-gray-50/50 mb-8">
                    <ClipboardCheck className="w-12 h-12 text-gray-300 mb-3" />
                    <h3 className="text-base font-medium text-gray-900 mb-1">Nenhuma avaliação pendente</h3>
                    <p className="text-sm text-gray-500">Você será avisado quando uma nova avaliação for iniciada.</p>
                </Card>
            )}

            {/* Histórico */}
            {historico.length > 0 && (
                <div>
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">
                        Histórico ({historico.length})
                    </h2>
                    <div className="grid gap-3">
                        {historico.map((av) => (
                            <div
                                key={av.avaliacaoId}
                                className="bg-white rounded-xl p-5 border border-border hover:border-primary/30 hover:shadow-md transition-all"
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{av.avaliacaoNome}</h3>
                                        <div className="flex items-center gap-4 mt-1.5">
                                            <div className="flex items-center gap-1.5 text-xs text-green-600">
                                                <CheckCircle size={13} />
                                                <span>{av.totalAvaliados} avaliado(s) concluído(s)</span>
                                            </div>
                                            {av.dataFim && (
                                                <span className="text-xs text-gray-400">
                                                    Encerrada em {new Date(av.dataFim).toLocaleDateString("pt-BR")}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleVerDetalhes(av.avaliacaoId)}
                                        disabled={loadingRespostas}
                                        className="shrink-0 flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer disabled:opacity-50"
                                    >
                                        <Eye size={16} />
                                        <span className="hidden sm:inline">Ver detalhes</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
