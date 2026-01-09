"use client"

import dynamic from "next/dynamic"
import { ApexOptions } from "apexcharts"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

interface TermometroMediaPerguntaChartProps {
    mediaPorPergunta: number[]
    perguntas: { id: number; texto: string }[]
}

export function TermometroMediaPerguntaChart({ mediaPorPergunta, perguntas }: TermometroMediaPerguntaChartProps) {
    const categories = perguntas.map((_, i) => `Q${i + 1}`)

    const options: ApexOptions = {
        chart: {
            type: "bar",
            toolbar: { show: false },
            background: "transparent",
            fontFamily: "inherit",
        },
        plotOptions: {
            bar: {
                borderRadius: 4,
                columnWidth: "60%",
            },
        },
        colors: ["#fad419"],
        dataLabels: {
            enabled: true,
            formatter: (val: number) => val.toFixed(1),
            style: {
                fontSize: "11px",
                fontWeight: 600,
            },
            offsetY: -20,
        },
        xaxis: {
            categories,
            labels: {
                style: {
                    fontSize: "12px",
                    fontWeight: 500,
                    colors: "#6b7280",
                },
            },
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: {
            min: 0,
            max: 5,
            tickAmount: 5,
            labels: {
                formatter: (val: number) => val.toFixed(0),
                style: {
                    fontSize: "11px",
                    colors: "#9CA3AF",
                },
            },
        },
        grid: {
            borderColor: "#F3F4F6",
            strokeDashArray: 4,
            xaxis: { lines: { show: false } },
            yaxis: { lines: { show: true } },
        },
        tooltip: {
            enabled: true,
            custom: ({ dataPointIndex }) => {
                const pergunta = perguntas[dataPointIndex]?.texto || `Pergunta ${dataPointIndex + 1}`
                const media = mediaPorPergunta[dataPointIndex]?.toFixed(1) || "0"
                return `
                    <div class="bg-gray-900 text-white p-3 rounded-lg shadow-lg max-w-xs">
                        <p class="text-xs text-gray-400 mb-1">Q${dataPointIndex + 1}</p>
                        <p class="text-sm mb-2">${pergunta.substring(0, 100)}${pergunta.length > 100 ? '...' : ''}</p>
                        <p class="text-lg font-bold text-primary">${media} / 5.0</p>
                    </div>
                `
            },
        },
    }

    const series = [
        {
            name: "Média",
            data: mediaPorPergunta,
        },
    ]

    if (mediaPorPergunta.length === 0) {
        return (
            <div className="flex flex-col h-full min-h-[300px] rounded-xl border border-border bg-bg-card p-6 shadow-sm">
                <h3 className="text-lg font-bold text-text-main mb-6">Média por Pergunta</h3>
                <div className="flex-1 flex items-center justify-center text-text-muted">
                    Nenhum dado disponível
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full min-h-[300px] rounded-xl border border-border bg-bg-card p-6 shadow-sm">
            <h3 className="text-lg font-bold text-text-main mb-4">Média por Pergunta</h3>
            <div className="flex-1">
                <Chart options={options} series={series} type="bar" height="100%" />
            </div>
            <div className="border-t border-border pt-4 text-xs text-gray-400 text-center">
                Escala 1 - 5 pontos
            </div>
        </div>
    )
}
