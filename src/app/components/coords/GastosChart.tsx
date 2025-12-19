"use client"

import dynamic from "next/dynamic"
import { ApexOptions } from "apexcharts"

// Dynamic import to avoid SSR errors
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

interface GastosData {
    mes: string
    valor: number
}

interface GastosChartProps {
    data: GastosData[]
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value)
}

export function GastosChart({ data }: GastosChartProps) {
    const categories = data.map((d) => d.mes)
    const valores = data.map((d) => d.valor)
    const maxValue = Math.max(...valores, 1000)

    const options: ApexOptions = {
        chart: {
            type: "area",
            toolbar: { show: false },
            background: "transparent",
            fontFamily: "inherit",
            zoom: { enabled: false },
            sparkline: { enabled: false },
        },
        stroke: {
            curve: "smooth",
            width: 3,
        },
        colors: ["#fad419"],
        fill: {
            type: "gradient",
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.3,
                opacityTo: 0.05,
                stops: [0, 90, 100],
            },
        },
        markers: {
            size: 5,
            colors: ["#fff"],
            strokeColors: "#fad419",
            strokeWidth: 3,
            hover: {
                size: 7,
            },
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
                    colors: "#9CA3AF",
                },
            },
            axisBorder: {
                show: true,
                color: "#E5E7EB",
            },
            axisTicks: { show: false },
        },
        yaxis: {
            min: 0,
            max: Math.ceil(maxValue / 1000) * 1000,
            tickAmount: 4,
            labels: {
                formatter: (val: number) => {
                    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`
                    return val.toFixed(0)
                },
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
            padding: { top: 10, bottom: 0, left: 16, right: 16 },
        },
        tooltip: {
            theme: "dark",
            y: {
                formatter: (val: number) => formatCurrency(val),
            },
        },
        dataLabels: {
            enabled: false,
        },
        responsive: [
            {
                breakpoint: 640,
                options: {
                    markers: { size: 4 },
                    stroke: { width: 2 },
                },
            },
        ],
    }

    const series = [
        {
            name: "Gastos",
            data: valores,
        },
    ]

    return (
        <div className="w-full h-full min-h-[220px]">
            <Chart options={options} series={series} type="area" height="100%" />
        </div>
    )
}
