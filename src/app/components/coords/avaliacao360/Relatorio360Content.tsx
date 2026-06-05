"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getRelatorio360Geral, getRelatorio360PorAvaliado, salvarRelatorioAV360, getRelatorioAV360, gerarRelatorioAV360Xlsx, getAvaliadores360Status, type Avaliador360Status } from "@/src/actions/avaliacao360Actions"
import { Card } from "../../Card"
import { Button } from "../../Button"
import { ArrowLeft, Download, Users, BarChart3, TrendingUp, Star, Edit3, X, Save, CheckCircle, XCircle } from "lucide-react"
import Image from "next/image"
import dynamic from "next/dynamic"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

export function Relatorio360Content({ id }: { id: number }) {
    const router = useRouter()
    const [tab, setTab] = useState<"geral" | "individual">("geral")
    const [relatorioGeral, setRelatorioGeral] = useState<any>(null)
    const [relatorioIndividual, setRelatorioIndividual] = useState<any>(null)
    const [membroSelecionado, setMembroSelecionado] = useState<number | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isGenerating, setIsGenerating] = useState(false)
    const [isGeneratingXlsx, setIsGeneratingXlsx] = useState(false)
    const [avaliadores, setAvaliadores] = useState<Avaliador360Status[]>([])

    // Edit modal state
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [editData, setEditData] = useState({
        capaTitulo: "",
        objetivo: "",
        conclusao: "",
    })

    useEffect(() => {
        Promise.all([
            getRelatorio360Geral(id),
            getAvaliadores360Status(id)
        ]).then(([data, avs]) => {
            setRelatorioGeral(data)
            if (data && data.ranking && data.ranking.length > 0) {
                setMembroSelecionado(data.ranking[0].membroId)
            }
            setAvaliadores(avs)
            setIsLoading(false)
        })
    }, [id])

    useEffect(() => {
        if (membroSelecionado) {
            getRelatorio360PorAvaliado(id, membroSelecionado).then(data => {
                setRelatorioIndividual(data)
            })
        }
    }, [membroSelecionado, id])

    const handleDownloadPDF = async () => {
        if (isGenerating) return
        setIsGenerating(true)
        try {
            const { pdf } = await import("@react-pdf/renderer")
            const { AV360Report } = await import("@/src/lib/reports/av360/AV360Report")
            const dados = await getRelatorioAV360(id)
            if (!dados) throw new Error("Avaliação 360 não encontrada. Verifique se a avaliação existe e possui feedbacks finalizados.")
            const blob = await pdf(<AV360Report data={dados} />).toBlob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `av360_${dados.nome.replace(/\s+/g, "_")}.pdf`
            a.click()
            URL.revokeObjectURL(url)
        } catch (err) {
            console.error(err)
            alert(err instanceof Error ? err.message : "Erro inesperado ao gerar o PDF. Tente novamente.")
        } finally {
            setIsGenerating(false)
        }
    }

    const handleDownloadXlsx = async () => {
        if (isGeneratingXlsx) return
        setIsGeneratingXlsx(true)
        try {
            const result = await gerarRelatorioAV360Xlsx(id)
            if (!result) throw new Error("Avaliação 360 não encontrada ou sem dados suficientes.")
            const blob = new Blob([new Uint8Array(result.bytes)], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `av360_${result.nome.replace(/\s+/g, "_")}.xlsx`
            a.click()
            URL.revokeObjectURL(url)
        } catch (err) {
            console.error(err)
            alert(err instanceof Error ? err.message : "Erro ao gerar planilha. Tente novamente.")
        } finally {
            setIsGeneratingXlsx(false)
        }
    }

    const handleSaveEdit = async () => {
        setIsSaving(true)
        try {
            const result = await salvarRelatorioAV360(id, {
                meta: {
                    capaTitulo: editData.capaTitulo || undefined,
                    objetivo: editData.objetivo || undefined,
                    conclusao: editData.conclusao || undefined,
                },
            })
            if (!result.success) {
                alert(result.error || "Erro ao salvar")
            } else {
                setEditModalOpen(false)
            }
        } catch (err) {
            console.error(err)
            alert("Erro ao salvar relatório")
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading || !relatorioGeral) return <div className="p-8 text-center">Carregando relatório...</div>

    const dimensoesNumericas = (relatorioIndividual?.dimensoes ?? []).filter(
        (d: any) => d.temNotasNumericas
    )

    const radarOptions: ApexCharts.ApexOptions = {
        chart: {
            type: "radar",
            toolbar: { show: false },
            fontFamily: "inherit",
        },
        labels: dimensoesNumericas.map((d: any) => d.dimensao),
        yaxis: {
            min: 0,
            max: 10,
            tickAmount: 5,
        },
        fill: {
            opacity: 0.2,
            colors: ["#fad419"]
        },
        stroke: {
            show: true,
            width: 2,
            colors: ["#fad419"]
        },
        markers: {
            size: 4,
            colors: ["#fff"],
            strokeColors: "#fad419",
            strokeWidth: 2,
        }
    }

    const radarSeries = [{
        name: "Média",
        data: dimensoesNumericas.map((d: any) => d.mediaSimples)
    }]

    // Bar Chart Data (Visão Geral)
    const barOptions: ApexCharts.ApexOptions = {
        chart: {
            type: "bar",
            toolbar: { show: false }
        },
        plotOptions: {
            bar: { borderRadius: 4, horizontal: true }
        },
        colors: ["#fad419"],
        xaxis: {
            categories: relatorioGeral.dimensoesGlobais.map((d: any) => d.titulo),
            min: 0,
            max: 10
        }
    }

    const barSeries = [{
        name: "Média Global",
        data: relatorioGeral.dimensoesGlobais.map((d: any) => d.mediaGlobal)
    }]

    return (
        <div className="flex-1 bg-[#f8f8f5] flex flex-col min-h-screen">
            <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-20 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Button variant="secondary" onClick={() => router.back()} icon={<ArrowLeft size={18} />} iconPosition="left">
                        Voltar
                    </Button>
                    <h1 className="text-xl font-bold text-gray-900">Relatório da Avaliação 360</h1>
                </div>
                <div className="flex gap-4">
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all cursor-pointer ${tab === "geral" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"}`}
                            onClick={() => setTab("geral")}
                        >
                            Visão Geral
                        </button>
                        <button
                            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all cursor-pointer ${tab === "individual" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"}`}
                            onClick={() => setTab("individual")}
                        >
                            Por Avaliado
                        </button>
                    </div>
                    <Button
                        variant="secondary"
                        onClick={() => setEditModalOpen(true)}
                        icon={<Edit3 size={18} />}
                        iconPosition="left"
                    >
                        Editar relatório
                    </Button>
                    <Button variant="secondary" onClick={handleDownloadXlsx} isLoading={isGeneratingXlsx} icon={<Download size={18} />} iconPosition="left">
                        Baixar Planilha
                    </Button>
                    <Button onClick={handleDownloadPDF} isLoading={isGenerating} icon={<Download size={18} />} iconPosition="left" className="bg-[#fad419] hover:bg-[#eac416] text-[#1c1a0d]">
                        Exportar PDF
                    </Button>
                </div>
            </header>

            <div className="flex-1 p-8 overflow-y-auto w-full">
                <div className="max-w-[1200px] mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-200 min-h-[800px]">
                    <div className="text-center mb-8 pb-6 border-b border-gray-200">
                        <h2 className="text-3xl font-black text-gray-900 mb-2">Resultados: Avaliação 360</h2>
                        <p className="text-gray-500">Média Global: <span className="font-bold text-[#fad419] text-xl">{relatorioGeral.scoreGlobalMedia?.toFixed(2) || '0.00'}</span> / 10</p>
                    </div>

                    {tab === "geral" && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="p-6">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><BarChart3 size={20} className="text-[#fad419]" /> Médias por Dimensão</h3>
                                    <div className="h-[300px]">
                                        <Chart options={barOptions} series={barSeries} type="bar" height="100%" />
                                    </div>
                                </Card>
                                <Card className="p-6 overflow-hidden flex flex-col">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><TrendingUp size={20} className="text-[#fad419]" /> Ranking de Score Geral</h3>
                                    <div className="flex-1 overflow-y-auto space-y-3">
                                        {relatorioGeral.ranking.map((r: any, idx: number) => (
                                            <div key={r.membroId} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                                                        {idx + 1}
                                                    </div>
                                                    {r.fotoUrl ? (
                                                        <Image src={r.fotoUrl} alt={r.nome} width={32} height={32} className="rounded-full object-cover w-8 h-8" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xs">{r.nome.charAt(0)}</div>
                                                    )}
                                                    <span className="font-bold text-sm text-gray-700">{r.nome}</span>
                                                </div>
                                                <span className="font-black text-gray-900 bg-white px-3 py-1 rounded-md border border-gray-200">{r.scoreGeral}</span>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        </div>
                    )}

                    {tab === "individual" && relatorioIndividual && (
                        <div className="flex gap-8 animate-in fade-in duration-300">
                            {/* Sidebar membros */}
                            <div className="w-72 flex flex-col gap-2 overflow-y-auto max-h-[600px] pr-2">
                                <h3 className="font-bold text-gray-500 text-xs uppercase mb-2">Selecione o membro</h3>
                                {relatorioGeral.ranking.map((r: any) => (
                                    <button
                                        key={r.membroId}
                                        onClick={() => setMembroSelecionado(r.membroId)}
                                        className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all cursor-pointer
                                            ${membroSelecionado === r.membroId ? 'bg-primary/10 border-primary shadow-sm' : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
                                        `}
                                    >
                                        {r.fotoUrl ? (
                                            <Image src={r.fotoUrl} alt={r.nome} width={32} height={32} className="rounded-full object-cover w-8 h-8 shrink-0" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500 text-xs shrink-0">{r.nome.charAt(0)}</div>
                                        )}
                                        <div className="overflow-hidden">
                                            <p className="font-bold text-sm text-gray-900 truncate">{r.nome}</p>
                                            <p className="text-xs text-gray-500">Score: {r.scoreGeral}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Detalhes do membro */}
                            <div className="flex-1 flex flex-col gap-6">
                                <div className="flex items-center justify-between bg-gray-50 p-6 rounded-xl border border-gray-200">
                                    <div>
                                        <h3 className="text-2xl font-black text-gray-900">
                                            {relatorioGeral.ranking.find((r:any) => r.membroId === membroSelecionado)?.nome}
                                        </h3>
                                        <p className="text-gray-500 mt-1 flex items-center gap-2">
                                            <Users size={16} /> {relatorioIndividual.numRespondentes} avaliadores anônimos
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs uppercase font-bold text-gray-500">Score Geral</p>
                                        <p className="text-4xl font-black text-[#fad419]">{relatorioIndividual.scoreGeral?.toFixed(2) || '0.00'}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card className="p-6">
                                        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Star size={18} className="text-[#fad419]" /> Mapa de Competências</h4>
                                        <div className="h-[300px]">
                                            <Chart options={radarOptions} series={radarSeries} type="radar" height="100%" />
                                        </div>
                                    </Card>

                                    <Card className="p-6 overflow-y-auto max-h-[400px]">
                                        <h4 className="font-bold text-gray-900 mb-4">Notas por Dimensão</h4>
                                        <div className="space-y-4">
                                            {relatorioIndividual.dimensoes.filter((d: any) => d.temNotasNumericas).map((d: any, i: number) => (
                                                <div key={i} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="font-medium text-sm text-gray-700">{d.dimensao}</span>
                                                        <span className="font-bold text-sm text-gray-900">{d.mediaSimples}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {(() => {
                                                            const totalNotas = Object.values(d.distribuicao as Record<string, number>).reduce((s, v) => s + v, 0)
                                                            return [1,2,3,4,5,6,7,8,9,10].map(n => {
                                                                const pct = totalNotas > 0 ? d.distribuicao[n] / totalNotas : 0
                                                                return (
                                                                    <div
                                                                        key={n}
                                                                        className="h-1.5 flex-1 rounded-full"
                                                                        style={{ backgroundColor: `rgba(250, 212, 25, ${pct === 0 ? 0 : Math.max(pct, 0.4)})` }}
                                                                    />
                                                                )
                                                            })
                                                        })()}
                                                    </div>
                                                    <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                                                        <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span><span>10</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                </div>

                                {/* Comentários Abertos */}
                                {relatorioIndividual.comentarios.length > 0 && (
                                    <Card className="p-6">
                                        <h4 className="font-bold text-gray-900 mb-4">Feedback Descritivo (Anônimo)</h4>
                                        <div className="space-y-6">
                                            {relatorioIndividual.comentarios.map((c: any, i: number) => (
                                                <div key={i}>
                                                    <p className="font-semibold text-sm text-gray-700 mb-3">{c.pergunta}</p>
                                                    <div className="space-y-2">
                                                        {c.respostas.map((r: string, j: number) => (
                                                            <div key={j} className="bg-[#fcfbf8] p-3 rounded-lg border border-[#e9e4ce] text-sm text-gray-600 italic">
                                                                "{r}"
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Avaliadores - Quem Preencheu */}
                {avaliadores.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-gray-200 flex flex-col gap-4">
                        <h2 className="text-xl font-bold text-gray-900">Lista de Avaliadores</h2>
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0">
                                {avaliadores.map((a) => (
                                    <div
                                        key={a.membroId}
                                        className="flex items-center justify-between px-5 py-3 border-b border-r border-gray-100 last:border-b-0"
                                    >
                                        <div>
                                            <span className="text-sm font-medium text-gray-900">{a.nome}</span>
                                            <span className="text-xs text-gray-400 ml-2">{a.area}</span>
                                        </div>
                                        {a.concluiu ? (
                                            <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
                                                <CheckCircle size={14} />
                                                Concluiu
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-xs font-semibold text-gray-400">
                                                <XCircle size={14} />
                                                {a.paresFinalizados}/{a.totalPares}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 flex flex-col">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900">Editar relatório AV360</h2>
                            <button
                                onClick={() => setEditModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 flex flex-col gap-4 overflow-y-auto">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                    Título da capa
                                </label>
                                <textarea
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-[#fad419] focus:border-transparent"
                                    rows={2}
                                    placeholder="Título que aparecerá na capa do PDF..."
                                    value={editData.capaTitulo}
                                    onChange={(e) => setEditData(prev => ({ ...prev, capaTitulo: e.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                    Objetivo
                                </label>
                                <textarea
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-[#fad419] focus:border-transparent"
                                    rows={3}
                                    placeholder="Objetivo da avaliação 360..."
                                    value={editData.objetivo}
                                    onChange={(e) => setEditData(prev => ({ ...prev, objetivo: e.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                    Conclusão
                                </label>
                                <textarea
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-[#fad419] focus:border-transparent"
                                    rows={5}
                                    placeholder="Conclusão e considerações finais do relatório..."
                                    value={editData.conclusao}
                                    onChange={(e) => setEditData(prev => ({ ...prev, conclusao: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                            <Button
                                variant="secondary"
                                onClick={() => setEditModalOpen(false)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSaveEdit}
                                isLoading={isSaving}
                                icon={<Save size={16} />}
                                iconPosition="left"
                                className="bg-[#fad419] hover:bg-[#eac416] text-[#1c1a0d]"
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
