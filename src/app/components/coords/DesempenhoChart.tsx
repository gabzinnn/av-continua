"use client"

import dynamic from "next/dynamic"
import { ApexOptions } from "apexcharts"
import { useState } from "react"
import { EvolucaoDesempenho } from "@/src/actions/controleAvaliacoesActions"

// Dynamic import para evitar erros de SSR
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

interface DesempenhoChartProps {
    data: EvolucaoDesempenho[]
}

type SeriesKey = "entrega" | "cultura" | "feedbacks"

interface SeriesConfig {
    key: SeriesKey
    name: string
    shortName: string
    color: string
}

const SERIES_CONFIG: SeriesConfig[] = [
    { key: "entrega", name: "Entrega", shortName: "Entrega", color: "#329fe9" },
    { key: "cultura", name: "Alinhamento Cultural", shortName: "Cultura", color: "#fad419" },
    { key: "feedbacks", name: "Feedbacks", shortName: "Feedback", color: "#10B981" },
]

export function DesempenhoChart({ data }: DesempenhoChartProps) {
    const [selectedSeries, setSelectedSeries] = useState<Set<SeriesKey>>(
        new Set(["entrega", "cultura"])
    )

    const categories = data.map((d) => d.avaliacao)

    const toggleSeries = (key: SeriesKey) => {
        setSelectedSeries((prev) => {
            const next = new Set(prev)
            if (next.has(key)) {
                // Não permitir desmarcar todos
                if (next.size > 1) {
                    next.delete(key)
                }
            } else {
                next.add(key)
            }
            return next
        })
    }

    const activeSeries = SERIES_CONFIG.filter((s) => selectedSeries.has(s.key))

    const hasFeedbacks = selectedSeries.has("feedbacks")

    const options: ApexOptions = {
        chart: {
            type: "line",
            toolbar: { show: false },
            background: "transparent",
            fontFamily: "inherit",
            zoom: { enabled: false },
        },
        stroke: {
            curve: "smooth",
            width: 3,
        },
        colors: activeSeries.map((s) => s.color),
        markers: {
            size: 4,
            strokeWidth: 0,
            hover: {
                size: 6,
            },
        },
        legend: {
            show: false, // Usamos nossa própria legenda interativa
        },
        xaxis: {
            categories,
            labels: {
                style: {
                    fontSize: "11px",
                    fontWeight: 500,
                    colors: "#6B7280",
                },
                rotate: -45,
                trim: true,
            },
            axisBorder: {
                show: true,
                color: "#E5E7EB",
            },
            axisTicks: { show: false },
        },
        yaxis: {
            // Removemos min/max fixos para que a escala seja "maleável" e destaque as diferenças (5-8)
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
            padding: { top: 0, bottom: 0, left: 12, right: 12 },
        },
        tooltip: {
            theme: "dark",
            shared: true,
            intersect: false,
            y: {
                formatter: (val: number) => `${val.toFixed(1)} / 10`,
            },
        },
        dataLabels: {
            enabled: false,
        },
        responsive: [
            {
                breakpoint: 640,
                options: {
                    markers: { size: 3 },
                    stroke: { width: 2 },
                },
            },
        ],
    }

    const series = activeSeries.map((s) => ({
        name: s.name,
        data: data.map((d) => Number(d[s.key].toFixed(1))),
    }))

    if (data.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-text-muted">
                Nenhum dado disponível
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            {/* Série Selector - responsivo */}
            <div className="flex justify-center md:justify-end mb-4">
                <div className="flex flex-wrap justify-center gap-1 bg-gray-100 p-1 rounded-lg">
                    {SERIES_CONFIG.map((config) => {
                        const isSelected = selectedSeries.has(config.key)
                        return (
                            <button
                                key={config.key}
                                onClick={() => toggleSeries(config.key)}
                                className={`
                                    flex items-center gap-1.5 px-2.5 py-1.5 sm:px-4 sm:gap-2 rounded-md text-xs sm:text-sm font-medium transition-all cursor-pointer
                                    ${isSelected
                                        ? "bg-white shadow-sm text-text-main font-semibold"
                                        : "text-gray-500 hover:text-text-main"
                                    }
                                `}
                            >
                                <span
                                    className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shrink-0"
                                    style={{
                                        backgroundColor: isSelected ? config.color : "#cbd5e1",
                                    }}
                                />
                                {/* Nome curto no mobile, completo no desktop */}
                                <span className="sm:hidden">{config.shortName}</span>
                                <span className="hidden sm:inline">{config.name}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Chart - altura responsiva */}
            <div className="flex-1 min-h-[220px] sm:min-h-[280px]">
                <Chart options={options} series={series} type="line" height="100%" />
            </div>
        </div>
    )
}
