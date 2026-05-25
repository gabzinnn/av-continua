"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Download, ChevronRight, Users, BarChart2, MessageSquare, CheckCircle, XCircle, Edit3 } from "lucide-react"
import { Button } from "@/src/app/components/Button"
import { getPCODetalhes, exportarRespostasPCO, getRelatorioPCO, salvarRelatorioPCO, PCODetalhes, PerguntaDetalhes, DistribuicaoGrupo } from "@/src/actions/pcoActions"

interface PCODetalhesContentProps {
    pcoId: number
}

export function PCODetalhesContent({ pcoId }: PCODetalhesContentProps) {
    const [data, setData] = useState<PCODetalhes | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isGenerating, setIsGenerating] = useState(false)
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [editData, setEditData] = useState<{
        capaTitulo: string;
        objetivo: string;
        conclusao: string;
        secoes: Array<{ secaoId: number; titulo: string; introducao: string; conclusao: string }>;
        perguntas: Array<{ perguntaId: number; texto: string; insightTexto: string; agrupamentos: Array<{ count: number; texto: string }>; hasDesvio: boolean }>;
    }>({
        capaTitulo: "",
        objetivo: "",
        conclusao: "",
        secoes: [],
        perguntas: [],
    })

    const fetchData = async () => {
        try {
            const result = await getPCODetalhes(pcoId)
            setData(result)
        } catch (error) {
            console.error("Erro ao carregar dados:", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [pcoId])

    useEffect(() => {
        if (data) {
            setEditData({
                capaTitulo: "",
                objetivo: "",
                conclusao: "",
                secoes: data.secoes.map(s => ({ secaoId: s.id, titulo: s.titulo, introducao: "", conclusao: "" })),
                perguntas: data.secoes
                    .flatMap(s => s.perguntas)
                    .filter(p => p.tipo === "ESCALA")
                    .map(p => ({ perguntaId: p.id, texto: p.texto, insightTexto: "", agrupamentos: [], hasDesvio: false })),
            })
        }
    }, [data])

    const handleExport = async () => {
        const { headers, rows } = await exportarRespostasPCO(pcoId)
        if (rows.length === 0) return

        const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `pco_${pcoId}_respostas.csv`
        link.click()
        URL.revokeObjectURL(url)
    }

    const handleDownloadPDF = async () => {
        if (isGenerating) return
        setIsGenerating(true)
        try {
            const { pdf } = await import("@react-pdf/renderer")
            const { PCOReport } = await import("@/src/lib/reports/pco/PCOReport")
            const dados = await getRelatorioPCO(pcoId)
            if (!dados) throw new Error("Dados não encontrados")
            const blob = await pdf(<PCOReport data={dados} />).toBlob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `pco_${dados.nome.replace(/\s+/g, "_")}.pdf`
            a.click()
            URL.revokeObjectURL(url)
        } catch (err) {
            console.error(err)
            alert("Erro ao gerar PDF")
        } finally {
            setIsGenerating(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-text-muted">Carregando...</div>
            </div>
        )
    }

    if (!data) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-text-muted">Pesquisa não encontrada</div>
            </div>
        )
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "ATIVA":
                return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-green-100 text-green-700">Ativa</span>
            case "RASCUNHO":
                return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/30 text-yellow-800">Rascunho</span>
            case "ENCERRADA":
                return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-600">Encerrada</span>
            default:
                return null
        }
    }

    const formatDate = (date: Date | null) => {
        if (!date) return "—"
        return new Date(date).toLocaleDateString("pt-BR")
    }

    // Compute totals
    const totalQuestions = data.secoes.reduce((acc, s) => acc + s.perguntas.length, 0)
    const totalEscala = data.secoes.reduce((acc, s) => acc + s.perguntas.filter(p => p.tipo === "ESCALA").length, 0)

    return (
        <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-[1200px] mx-auto flex flex-col gap-12 pb-12">
                {/* Breadcrumb & Header */}
                <div className="flex flex-col gap-6">
                    <nav className="flex items-center gap-2 text-sm text-gray-500" data-html2canvas-ignore>
                        <Link href="/coord/pco" className="hover:text-primary transition-colors">
                            Pesquisas de Clima
                        </Link>
                        <ChevronRight size={16} />
                        <span className="text-text-main font-semibold">{data.nome}</span>
                    </nav>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-text-main text-3xl md:text-4xl font-black tracking-tight leading-tight">
                                    {data.nome}
                                </h1>
                                {getStatusBadge(data.status)}
                            </div>
                            {data.descricao && (
                                <p className="text-gray-500 text-base mt-1 max-w-2xl">{data.descricao}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                                {data.dataInicio && <span>Início: {formatDate(data.dataInicio)}</span>}
                                {data.dataFim && <span>Fim: {formatDate(data.dataFim)}</span>}
                                <span>Criada em {formatDate(data.createdAt)}</span>
                            </div>
                        </div>
                        <div className="flex gap-2" data-html2canvas-ignore>
                            <Button
                                variant="secondary"
                                size="sm"
                                icon={<Download size={18} />}
                                iconPosition="left"
                                onClick={handleDownloadPDF}
                                isLoading={isGenerating}
                            >
                                Exportar PDF
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                icon={<Edit3 size={18} />}
                                iconPosition="left"
                                onClick={() => setEditModalOpen(true)}
                            >
                                Editar relatório
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                icon={<Download size={18} />}
                                iconPosition="left"
                                onClick={handleExport}
                            >
                                Exportar CSV
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Main Stats */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="relative flex flex-col gap-1 p-5 rounded-xl border border-border bg-bg-card shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Perguntas</p>
                            <BarChart2 size={20} className="text-primary" />
                        </div>
                        <div className="flex items-baseline gap-2 mt-2">
                            <p className="text-4xl font-bold text-text-main">{totalQuestions}</p>
                            <span className="text-sm font-medium text-gray-400">{totalEscala} escala</span>
                        </div>
                    </div>

                    <div className="relative flex flex-col gap-1 p-5 rounded-xl border border-border bg-bg-card shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Participantes</p>
                            <Users size={20} className="text-primary" />
                        </div>
                        <div className="mt-2">
                            <p className="text-4xl font-bold text-text-main">{data.totalParticipantes}</p>
                        </div>
                    </div>

                    <div className="relative flex flex-col gap-1 p-5 rounded-xl border border-border bg-bg-card shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Respostas</p>
                            <MessageSquare size={20} className="text-primary" />
                        </div>
                        <div className="flex items-baseline gap-2 mt-2">
                            <p className="text-4xl font-bold text-text-main">{data.totalRespostas}</p>
                            <span className="text-sm font-medium text-gray-400">de {data.totalParticipantes}</span>
                        </div>
                    </div>

                    <div className="relative flex flex-col gap-1 p-5 rounded-xl border border-border bg-bg-card shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Taxa de Resposta</p>
                        </div>
                        <div className="mt-2">
                            <p className="text-4xl font-bold text-text-main">{data.taxaResposta}%</p>
                            <div className="w-full h-2 bg-gray-100 rounded-full mt-2 overflow-hidden">
                                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${data.taxaResposta}%` }} />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ============================================================ */}
                {/* SECTIONS LOOP */}
                {/* ============================================================ */}
                {data.secoes.map((secao) => {
                    const perguntasEscala = secao.perguntas.filter(p => p.tipo === "ESCALA")
                    const perguntasOutras = secao.perguntas.filter(p => p.tipo !== "ESCALA")

                    return (
                        <section key={secao.id} className="flex flex-col gap-8 border-t border-border pt-8">
                            <div>
                                <h2 className="text-2xl font-bold text-text-main">{secao.titulo}</h2>
                                {secao.descricao && (
                                    <p className="text-gray-500 mt-1">{secao.descricao}</p>
                                )}
                            </div>

                            {/* Subsection: Scale Table */}
                            {perguntasEscala.length > 0 && (
                                <div className="flex flex-col gap-4">
                                    <h3 className="text-lg font-bold text-text-main">Visão Geral (Médias)</h3>
                                    <div className="bg-bg-card rounded-xl border border-border shadow-sm overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-border">
                                                    <th className="text-left px-4 py-3 font-semibold text-text-main min-w-[300px] sticky left-0 bg-bg-card z-10 shadow-sm md:shadow-none">
                                                        Perguntas
                                                    </th>
                                                    {data.grupos.map((grupo) => (
                                                        <th key={grupo} className="text-center px-3 py-3 font-semibold text-text-main whitespace-nowrap min-w-[80px]">
                                                            {grupo}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {perguntasEscala.map((p, i) => (
                                                    <tr key={p.id} className={i % 2 === 0 ? "bg-bg-card" : "bg-[#fcfbf8]"}>
                                                        <td className={`px-4 py-3 text-text-main font-medium sticky left-0 z-10 shadow-sm md:shadow-none ${i % 2 === 0 ? "bg-bg-card" : "bg-[#fcfbf8]"}`}>
                                                            <span className="text-xs font-bold text-primary mr-2">Q{p.ordem}.</span>
                                                            {p.texto}
                                                        </td>
                                                        {data.grupos.map((grupo) => {
                                                            const media = p.mediaPorGrupo[grupo] ?? 0
                                                            const color = getMediaColor(media)
                                                            return (
                                                                <td key={grupo} className="text-center px-3 py-3">
                                                                    <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold ${color}`}>
                                                                        {media !== 0 ? media.toFixed(1).replace(".", ",") : "—"}
                                                                    </span>
                                                                </td>
                                                            )
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Subsection: Detailed Scale Charts */}
                            {perguntasEscala.length > 0 && (
                                <div className="flex flex-col gap-6">
                                    <h3 className="text-lg font-bold text-text-main">Detalhes das Perguntas</h3>
                                    <div className="grid grid-cols-1 gap-6">
                                        {perguntasEscala.map((p) => (
                                            <EscalaPerguntaCard key={p.id} pergunta={p} grupos={data.grupos} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Subsection: Other Questions */}
                            {perguntasOutras.length > 0 && (
                                <div className="flex flex-col gap-6">
                                    <h3 className="text-lg font-bold text-text-main">Perguntas Abertas e Múltipla Escolha</h3>
                                    <div className="grid grid-cols-1 gap-6">
                                        {perguntasOutras.map((p) => (
                                            <OutraPerguntaCard key={p.id} pergunta={p} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </section>
                    )
                })}

                {/* Participantes List */}
                <div className="flex flex-col gap-4 border-t border-border pt-8">
                    <h2 className="text-xl font-bold text-text-main">Lista de Participantes</h2>
                    <div className="bg-bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0">
                            {data.participantes.map((p) => (
                                <div
                                    key={p.membroId}
                                    className="flex items-center justify-between px-5 py-3 border-b border-r border-border last:border-b-0"
                                >
                                    <div>
                                        <span className="text-sm font-medium text-text-main">{p.nome}</span>
                                        <span className="text-xs text-gray-400 ml-2">{p.area}</span>
                                    </div>
                                    {p.respondeu ? (
                                        <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
                                            <CheckCircle size={14} />
                                            Respondeu
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-xs font-semibold text-gray-400">
                                            <XCircle size={14} />
                                            Pendente
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Report Modal */}
            {editModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <h2 className="text-xl font-bold text-text-main">Editar Relatório PDF</h2>
                            <button onClick={() => setEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">✕</button>
                        </div>
                        {/* Scrollable body */}
                        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                            {/* Capa */}
                            <section className="flex flex-col gap-3">
                                <h3 className="font-bold text-text-main">Capa</h3>
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm text-gray-500">Título da capa (ex: PCO 2025.2)</label>
                                    <input
                                        className="border border-border rounded-lg px-3 py-2 text-sm"
                                        value={editData.capaTitulo}
                                        onChange={e => setEditData(d => ({ ...d, capaTitulo: e.target.value }))}
                                        placeholder="PCO 2025.2"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm text-gray-500">Objetivo</label>
                                    <textarea
                                        className="border border-border rounded-lg px-3 py-2 text-sm min-h-[80px] resize-none"
                                        value={editData.objetivo}
                                        onChange={e => setEditData(d => ({ ...d, objetivo: e.target.value }))}
                                        placeholder="Descreva o objetivo da PCO..."
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm text-gray-500">Conclusão geral</label>
                                    <textarea
                                        className="border border-border rounded-lg px-3 py-2 text-sm min-h-[80px] resize-none"
                                        value={editData.conclusao}
                                        onChange={e => setEditData(d => ({ ...d, conclusao: e.target.value }))}
                                        placeholder="Texto de conclusão..."
                                    />
                                </div>
                            </section>

                            {/* Perguntas escala */}
                            <section className="flex flex-col gap-4">
                                <h3 className="font-bold text-text-main">Insights por pergunta (escala)</h3>
                                {editData.perguntas.map((p, pi) => (
                                    <div key={p.perguntaId} className="border border-border rounded-xl p-4 flex flex-col gap-3">
                                        <p className="text-sm font-medium text-text-main">{p.texto}</p>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-gray-500">Frase-insight</label>
                                            <textarea
                                                className="border border-border rounded-lg px-3 py-2 text-sm min-h-[60px] resize-none"
                                                value={p.insightTexto}
                                                onChange={e => setEditData(d => ({
                                                    ...d,
                                                    perguntas: d.perguntas.map((pp, i) => i === pi ? { ...pp, insightTexto: e.target.value } : pp)
                                                }))}
                                                placeholder="Em sua maioria, os membros..."
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs text-gray-500">Agrupamentos (badges Nx)</label>
                                            {p.agrupamentos.map((ag, ai) => (
                                                <div key={ai} className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        className="w-16 border border-border rounded-lg px-2 py-1 text-sm"
                                                        value={ag.count}
                                                        onChange={e => setEditData(d => ({
                                                            ...d,
                                                            perguntas: d.perguntas.map((pp, i) => i !== pi ? pp : {
                                                                ...pp,
                                                                agrupamentos: pp.agrupamentos.map((a, j) => j === ai ? { ...a, count: Number(e.target.value) } : a)
                                                            })
                                                        }))}
                                                    />
                                                    <input
                                                        className="flex-1 border border-border rounded-lg px-2 py-1 text-sm"
                                                        value={ag.texto}
                                                        onChange={e => setEditData(d => ({
                                                            ...d,
                                                            perguntas: d.perguntas.map((pp, i) => i !== pi ? pp : {
                                                                ...pp,
                                                                agrupamentos: pp.agrupamentos.map((a, j) => j === ai ? { ...a, texto: e.target.value } : a)
                                                            })
                                                        }))}
                                                        placeholder="Texto do badge"
                                                    />
                                                    <button
                                                        className="text-red-400 text-xs hover:text-red-600 cursor-pointer"
                                                        onClick={() => setEditData(d => ({
                                                            ...d,
                                                            perguntas: d.perguntas.map((pp, i) => i !== pi ? pp : {
                                                                ...pp,
                                                                agrupamentos: pp.agrupamentos.filter((_, j) => j !== ai)
                                                            })
                                                        }))}
                                                    >✕</button>
                                                </div>
                                            ))}
                                            <button
                                                className="text-xs text-primary hover:underline text-left cursor-pointer"
                                                onClick={() => setEditData(d => ({
                                                    ...d,
                                                    perguntas: d.perguntas.map((pp, i) => i !== pi ? pp : {
                                                        ...pp,
                                                        agrupamentos: [...pp.agrupamentos, { count: 1, texto: "" }]
                                                    })
                                                }))}
                                            >+ Adicionar badge</button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id={`desvio-${pi}`}
                                                checked={p.hasDesvio}
                                                onChange={e => setEditData(d => ({
                                                    ...d,
                                                    perguntas: d.perguntas.map((pp, i) => i === pi ? { ...pp, hasDesvio: e.target.checked } : pp)
                                                }))}
                                            />
                                            <label htmlFor={`desvio-${pi}`} className="text-xs text-gray-500 cursor-pointer">
                                                Marcar "Alto desvio padrão"
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </section>
                        </div>
                        {/* Footer */}
                        <div className="p-6 border-t border-border flex justify-end gap-2">
                            <Button variant="secondary" size="sm" onClick={() => setEditModalOpen(false)}>Cancelar</Button>
                            <Button
                                size="sm"
                                isLoading={isSaving}
                                onClick={async () => {
                                    setIsSaving(true)
                                    try {
                                        const result = await salvarRelatorioPCO(pcoId, {
                                            meta: {
                                                capaTitulo: editData.capaTitulo || undefined,
                                                objetivo: editData.objetivo || undefined,
                                                conclusao: editData.conclusao || undefined,
                                            },
                                            perguntas: editData.perguntas.map(p => ({
                                                perguntaId: p.perguntaId,
                                                insightTexto: p.insightTexto || undefined,
                                                agrupamentos: p.agrupamentos.length > 0 ? p.agrupamentos : undefined,
                                                callouts: p.hasDesvio ? [{ tipo: "DESVIO" as const, texto: "Alto desvio padrão" }] : undefined,
                                            })),
                                        })
                                        if (result.success) {
                                            setEditModalOpen(false)
                                        } else {
                                            alert(result.error || "Erro ao salvar")
                                        }
                                    } finally {
                                        setIsSaving(false)
                                    }
                                }}
                            >
                                Salvar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// ==========================================
// Helper: color for media value
// ==========================================

function getMediaColor(value: number): string {
    if (value >= 1.5) return "bg-green-500 text-white"
    if (value >= 0.5) return "bg-green-300 text-green-900"
    if (value >= -0.5) return "bg-yellow-300 text-yellow-900"
    if (value >= -1.5) return "bg-orange-300 text-orange-900"
    return "bg-red-400 text-white"
}

// ==========================================
// Card: Pergunta Escala com gráfico por grupo
// ==========================================

function EscalaPerguntaCard({ pergunta, grupos }: { pergunta: PerguntaDetalhes; grupos: string[] }) {
    return (
        <div className="bg-bg-card rounded-xl border border-border shadow-sm overflow-hidden break-inside-avoid">
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-border">
                <div className="flex-1">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">
                        Q{pergunta.ordem}
                    </span>
                    <h3 className="text-base font-semibold text-text-main mt-1">{pergunta.texto}</h3>
                </div>
                <div className="text-right ml-4">
                    <p className="text-2xl font-bold text-text-main">
                        {(pergunta.mediaPorGrupo["Geral"] ?? 0) > 0 ? "+" : ""}
                        {(pergunta.mediaPorGrupo["Geral"] ?? 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">Média Geral</p>
                </div>
            </div>

            {/* Stacked bars per group */}
            <div className="p-6">
                {/* Legend */}
                <div className="flex flex-wrap items-center gap-4 mb-5 text-xs">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-500"></span>Concordo</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-300"></span>Concordo parcialmente</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-gray-300"></span>Não consigo responder</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-orange-300"></span>Discordo parcialmente</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-400"></span>Discordo</span>
                </div>

                <div className="flex flex-col gap-3">
                    {grupos.map((grupo) => {
                        const dist = pergunta.distribuicaoPorGrupo[grupo]
                        if (!dist || dist.total === 0) return null
                        return <StackedBar key={grupo} label={grupo} dist={dist} />
                    })}
                </div>

                {/* Justificativas */}
                {pergunta.justificativas.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-border">
                        <h4 className="text-sm font-bold text-text-main mb-3">
                            Justificativas ({pergunta.justificativas.length})
                        </h4>
                        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                            {pergunta.justificativas.map((j, i) => (
                                <div key={i} className="bg-[#fcfbf8] rounded-lg px-4 py-3 text-sm text-text-main">
                                    {j}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// ==========================================
// Stacked horizontal bar for one group
// ==========================================

function StackedBar({ label, dist }: { label: string; dist: DistribuicaoGrupo }) {
    const total = dist.concordo + dist.concordoParcial + dist.naoConsigo + dist.discordoParcial + dist.discordo
    if (total === 0) return null

    const pctConcordo = (dist.concordo / total) * 100
    const pctConcordoP = (dist.concordoParcial / total) * 100
    const pctNaoConsigo = (dist.naoConsigo / total) * 100
    const pctDiscordoP = (dist.discordoParcial / total) * 100
    const pctDiscordo = (dist.discordo / total) * 100

    return (
        <div className="flex items-center gap-3">
            <div className="w-36 shrink-0 text-right">
                <span className="text-sm font-medium text-text-main">{label}</span>
            </div>
            <div className="flex-1 h-7 rounded-md overflow-hidden flex">
                {pctConcordo > 0 && (
                    <div className="bg-green-500 h-full transition-all" style={{ width: `${pctConcordo}%` }} title={`Concordo: ${dist.concordo}`} />
                )}
                {pctConcordoP > 0 && (
                    <div className="bg-green-300 h-full transition-all" style={{ width: `${pctConcordoP}%` }} title={`Concordo parcialmente: ${dist.concordoParcial}`} />
                )}
                {pctNaoConsigo > 0 && (
                    <div className="bg-gray-300 h-full transition-all" style={{ width: `${pctNaoConsigo}%` }} title={`Não consigo responder: ${dist.naoConsigo}`} />
                )}
                {pctDiscordoP > 0 && (
                    <div className="bg-orange-300 h-full transition-all" style={{ width: `${pctDiscordoP}%` }} title={`Discordo parcialmente: ${dist.discordoParcial}`} />
                )}
                {pctDiscordo > 0 && (
                    <div className="bg-red-400 h-full transition-all" style={{ width: `${pctDiscordo}%` }} title={`Discordo: ${dist.discordo}`} />
                )}
            </div>
        </div>
    )
}

// ==========================================
// Card: Texto Livre / Múltipla Escolha
// ==========================================

function OutraPerguntaCard({ pergunta }: { pergunta: PerguntaDetalhes }) {
    const tipoLabel = pergunta.tipo === "MULTIPLA_ESCOLHA" ? "Múltipla Escolha" : "Texto Livre"

    return (
        <div className="bg-bg-card rounded-xl border border-border shadow-sm overflow-hidden break-inside-avoid">
            <div className="p-6 border-b border-border">
                <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">Q{pergunta.ordem}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{tipoLabel}</span>
                </div>
                <h3 className="text-base font-semibold text-text-main">{pergunta.texto}</h3>
            </div>

            <div className="p-6">
                {pergunta.tipo === "MULTIPLA_ESCOLHA" && (
                    <div className="flex flex-col gap-3">
                        {pergunta.distribuicaoOpcoes
                            .sort((a, b) => b.count - a.count)
                            .map((opcao, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <span className="text-2xl font-black text-primary w-12 shrink-0">{opcao.count}x</span>
                                    <div className="bg-[#fcfbf8] rounded-lg px-4 py-3 text-sm text-text-main flex-1">
                                        {opcao.texto}
                                    </div>
                                </div>
                            ))}
                    </div>
                )}

                {pergunta.tipo === "TEXTO_LIVRE" && (
                    <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
                        {pergunta.respostasTexto.length === 0 ? (
                            <p className="text-sm text-gray-400 italic">Nenhuma resposta recebida.</p>
                        ) : (
                            pergunta.respostasTexto.map((texto, i) => (
                                <div key={i} className="bg-[#fcfbf8] rounded-lg px-4 py-3 text-sm text-text-main">
                                    {texto}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
