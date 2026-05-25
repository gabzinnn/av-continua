"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { getRelatorio360Geral, getRelatorio360PorAvaliado } from "@/src/actions/avaliacao360Actions"
import { Card } from "../../Card"
import { Button } from "../../Button"
import { ArrowLeft, Download, Users, BarChart3, TrendingUp, Star } from "lucide-react"
import Image from "next/image"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
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
    const reportRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        getRelatorio360Geral(id).then(data => {
            setRelatorioGeral(data)
            if (data && data.ranking && data.ranking.length > 0) {
                setMembroSelecionado(data.ranking[0].membroId)
            }
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
        if (!reportRef.current || isGenerating) return
        setIsGenerating(true)
        
        try {
            const canvas = await html2canvas(reportRef.current, {
                // @ts-ignore
                scale: 2,
                useCORS: true, 
                logging: false,
                backgroundColor: "#ffffff"
            });
            const imgData = canvas.toDataURL("image/jpeg", 0.8);
            const pdf = new jsPDF({ 
                orientation: "portrait", 
                unit: "mm", 
                format: "a4",
                compress: true 
            });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = pdfWidth / imgWidth; 
            const imgHeightInPdfUnits = imgHeight * ratio;
            let totalPages = Math.ceil(imgHeightInPdfUnits / pdfHeight);
            
            if (totalPages > 1) {
                const lastPageContentHeight = imgHeightInPdfUnits % pdfHeight;
                if (lastPageContentHeight > 0 && lastPageContentHeight < 5) {
                    totalPages--;
                }
            }

            for (let i = 0; i < totalPages; i++) {
                if (i > 0) pdf.addPage();
                const destY = -(i * pdfHeight);
                pdf.addImage(imgData, "JPEG", 0, destY, pdfWidth, imgHeight * ratio);
            }
            
            pdf.save(`relatorio-360-${id}.pdf`);
        } catch (error) {
            console.error(error);
            alert("Erro ao gerar PDF");
        } finally {
            setIsGenerating(false);
        }
    }

    if (isLoading || !relatorioGeral) return <div className="p-8 text-center">Carregando relatório...</div>

    // Radar Chart Data
    const radarOptions: ApexCharts.ApexOptions = {
        chart: {
            type: "radar",
            toolbar: { show: false },
            fontFamily: "inherit",
        },
        labels: relatorioIndividual?.dimensoes?.map((d: any) => d.dimensao) || [],
        yaxis: {
            min: 0,
            max: 10,
            tickAmount: 5,
        },
        fill: {
            opacity: 0.2,
            colors: ["#fad519"]
        },
        stroke: {
            show: true,
            width: 2,
            colors: ["#fad519"]
        },
        markers: {
            size: 4,
            colors: ["#fff"],
            strokeColors: "#fad519",
            strokeWidth: 2,
        }
    }

    const radarSeries = [{
        name: "Média",
        data: relatorioIndividual?.dimensoes?.map((d: any) => d.mediaSimples) || []
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
        colors: ["#fad519"],
        xaxis: {
            categories: relatorioGeral.dimensoesGlobais.map((d: any) => d.titulo),
            min: 0,
            max: 5
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
                    <Button onClick={handleDownloadPDF} isLoading={isGenerating} icon={<Download size={18} />} iconPosition="left" className="bg-[#fad519] hover:bg-[#eac416] text-[#1c1a0d]">
                        Exportar PDF
                    </Button>
                </div>
            </header>

            <div className="flex-1 p-8 overflow-y-auto w-full">
                <div ref={reportRef} className="max-w-[1200px] mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-200 min-h-[800px]">
                    <div className="text-center mb-8 pb-6 border-b border-gray-200">
                        <h2 className="text-3xl font-black text-gray-900 mb-2">Resultados: Avaliação 360</h2>
                        <p className="text-gray-500">Média Global: <span className="font-bold text-[#fad519] text-xl">{relatorioGeral.scoreGlobalMedia?.toFixed(2) || '0.00'}</span> / 10</p>
                    </div>

                    {tab === "geral" && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="p-6">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><BarChart3 size={20} className="text-[#fad519]" /> Médias por Dimensão</h3>
                                    <div className="h-[300px]">
                                        <Chart options={barOptions} series={barSeries} type="bar" height="100%" />
                                    </div>
                                </Card>
                                <Card className="p-6 overflow-hidden flex flex-col">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><TrendingUp size={20} className="text-[#fad519]" /> Ranking de Score Geral</h3>
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
                                        <p className="text-4xl font-black text-[#fad519]">{relatorioIndividual.scoreGeral?.toFixed(2) || '0.00'}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card className="p-6">
                                        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Star size={18} className="text-[#fad519]" /> Mapa de Competências</h4>
                                        <div className="h-[300px]">
                                            <Chart options={radarOptions} series={radarSeries} type="radar" height="100%" />
                                        </div>
                                    </Card>

                                    <Card className="p-6 overflow-y-auto max-h-[400px]">
                                        <h4 className="font-bold text-gray-900 mb-4">Notas por Dimensão</h4>
                                        <div className="space-y-4">
                                            {relatorioIndividual.dimensoes.map((d: any, i: number) => (
                                                <div key={i} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="font-medium text-sm text-gray-700">{d.dimensao}</span>
                                                        <span className="font-bold text-sm text-gray-900">{d.mediaSimples}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {[1,2,3,4,5,6,7,8,9,10].map(n => (
                                                            <div key={n} className="h-1.5 flex-1 bg-gray-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-[#fad519]"
                                                                    style={{ width: `${relatorioIndividual.numRespondentes > 0 ? (d.distribuicao[n] / relatorioIndividual.numRespondentes) * 100 : 0}%` }}
                                                                />
                                                            </div>
                                                        ))}
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
            </div>
        </div>
    )
}
