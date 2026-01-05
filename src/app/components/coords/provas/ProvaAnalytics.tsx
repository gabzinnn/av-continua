"use client"

import dynamic from "next/dynamic"
import { TipoQuestao } from "@/src/generated/prisma/client"
import { MoreHorizontal } from "lucide-react"

// Dynamic import for ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

interface ProvaAnalyticsProps {
    distribuicao: number[] // [0-2, 2-4, 4-6, 6-8, 8-10]
    questoesStats: {
        id: number
        enunciado: string
        tipo: TipoQuestao
        taxaAcerto: number
    }[]
}

export function ProvaAnalytics({ distribuicao, questoesStats }: ProvaAnalyticsProps) {
    // --- Chart 1: Distribution Options ---
    const distributionOptions: ApexCharts.ApexOptions = {
        chart: {
            type: 'bar',
            toolbar: { show: false },
            fontFamily: 'Inter, sans-serif'
        },
        plotOptions: {
            bar: {
                borderRadius: 4,
                columnWidth: '60%',
                distributed: true,
                dataLabels: {
                    position: 'top', // top, center, bottom
                },
            }
        },
        dataLabels: {
            enabled: true,
            offsetY: -20,
            style: {
                fontSize: '12px',
                colors: ["#304758"]
            }
        },
        legend: {
            show: false
        },
        xaxis: {
            categories: ['0-2', '2-4', '4-6', '6-8', '8-10'],
            labels: {
                style: {
                    fontSize: '12px',
                    fontWeight: 500,
                }
            },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            show: false,
        },
        grid: {
            show: false,
            padding: {
                top: 20
            }
        },
        colors: [
            '#f87171', // Red 400 (0-2)
            '#fb923c', // Orange 400 (2-4)
            '#facc15', // Yellow 400 (4-6) - approximate match for primary/60
            '#f9d41a', // Primary (6-8)
            '#22c55e'  // Green 500 (8-10)
        ],
        tooltip: {
            y: {
                formatter: function (val) {
                    return val + " alunos"
                }
            }
        }
    }

    const distributionSeries = [{
        name: 'Alunos',
        data: distribuicao
    }]

    // --- Chart 2: Question Stats ---
    // Sort questions by "Hardest" first (lowest hit rate) as typically that's most interesting, 
    // or keep provided order. The design shows vertical list with bars. 
    // The design is CUSTOM HTML bars, not a standard chart. 
    // To match the design EXACTLY, we should use HTML/Tailwind for the question list 
    // instead of a canvas chart, because the design has custom labels/layout.
    
    // However, for the Distribution chart, ApexCharts is good.
    // For the Question Stats, I will replicate the HTML/Tailwind design directly as requested ("parecido com o que ja existe").

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Distribution */}
            <div className="bg-white rounded-xl border border-border shadow-sm p-6 flex flex-col h-full min-h-[350px]">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-bold text-text-main">Distribuição de Notas</h3>
                    <button className="text-primary hover:text-yellow-600">
                        <MoreHorizontal />
                    </button>
                </div>
                <div className="flex-1 w-full">
                    <Chart 
                        options={distributionOptions} 
                        series={distributionSeries} 
                        type="bar" 
                        height="100%" 
                        width="100%"
                    />
                </div>
            </div>

            {/* Chart 2: Question Hit Rate - Custom HTML Implementation */}
            <div className="bg-white rounded-xl border border-border shadow-sm p-6 flex flex-col h-full max-h-[400px]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-text-main">Taxa de Acertos por Questão</h3>
                    <div className="flex gap-2">
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Fácil</span>
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Difícil</span>
                    </div>
                </div>
                
                <div className="flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
                    {questoesStats.map((q, index) => {
                        // Determine color based on hit rate
                        let barColor = "bg-red-500" // Hard (< 30%)
                        if (q.taxaAcerto >= 70) barColor = "bg-green-500" // Easy
                        else if (q.taxaAcerto >= 40) barColor = "bg-primary" // Medium
                        else barColor = "bg-orange-400" // Hard-ish

                        const shortEnunciado = q.enunciado.length > 50 
                            ? q.enunciado.substring(0, 50) + "..." 
                            : q.enunciado

                        const typeLabel = q.tipo === "MULTIPLA_ESCOLHA" ? "Múltipla" : q.tipo === "DISSERTATIVA" ? "Dissertativa" : "V/F"

                        return (
                            <div key={q.id} className="flex flex-col gap-1">
                                <div className="flex justify-between text-xs font-medium text-text-main">
                                    <span title={q.enunciado}>
                                        Q{index + 1} ({typeLabel}): {shortEnunciado}
                                    </span>
                                    <span>{q.taxaAcerto.toFixed(0)}%</span>
                                </div>
                                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full ${barColor} rounded-full transition-all duration-1000 ease-out`} 
                                        style={{ width: `${q.taxaAcerto}%` }}
                                    ></div>
                                </div>
                            </div>
                        )
                    })}
                    
                    {questoesStats.length === 0 && (
                        <div className="text-center text-text-muted text-sm py-4">
                            Nenhuma questão corrigida ainda.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
