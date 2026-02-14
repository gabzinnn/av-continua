"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Download, ChevronRight, Users, BarChart2, MessageSquare, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/src/app/components/Button"
import { getPCODetalhes, exportarRespostasPCO, PCODetalhes, PerguntaDetalhes, DistribuicaoGrupo } from "@/src/actions/pcoActions"

interface PCODetalhesContentProps {
    pcoId: number
}

export function PCODetalhesContent({ pcoId }: PCODetalhesContentProps) {
    const [data, setData] = useState<PCODetalhes | null>(null)
    const [isLoading, setIsLoading] = useState(true)

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
                    <nav className="flex items-center gap-2 text-sm text-gray-500">
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
                        <div className="flex gap-2">
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
        <div className="bg-bg-card rounded-xl border border-border shadow-sm overflow-hidden">
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
    const total = dist.concordo + dist.concordoParcial + dist.discordoParcial + dist.discordo
    if (total === 0) return null

    const pctConcordo = (dist.concordo / total) * 100
    const pctConcordoP = (dist.concordoParcial / total) * 100
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
        <div className="bg-bg-card rounded-xl border border-border shadow-sm overflow-hidden">
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
