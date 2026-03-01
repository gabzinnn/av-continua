"use client"

import dynamic from "next/dynamic"
import { ApexOptions } from "apexcharts"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

interface EvolucaoItem {
    nome: string
    minhaMedia: number
}

interface TermometroHistoricoChartProps {
    data: EvolucaoItem[]
}

export function TermometroHistoricoChart({ data }: TermometroHistoricoChartProps) {
    const categories = data.map((d) => d.nome)

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
        colors: ["#329fe9"],
        markers: {
            size: 5,
            strokeWidth: 0,
            hover: { size: 7 },
        },
        legend: {
            show: false,
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
                rotateAlways: categories.length > 4,
                trim: true,
                maxHeight: 80,
            },
            axisBorder: {
                show: true,
                color: "#E5E7EB",
            },
            axisTicks: { show: false },
        },
        yaxis: {
            min: 0,
            max: 10,
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

    const series = [
        {
            name: "Minha Média",
            data: data.map((d) => d.minhaMedia),
        },
    ]

    return (
        <div className="flex flex-col h-full min-h-[220px] sm:min-h-[280px]">
            <Chart options={options} series={series} type="line" height="100%" />
        </div>
    )
}
