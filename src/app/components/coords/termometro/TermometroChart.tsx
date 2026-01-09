"use client"

import dynamic from "next/dynamic"
import { ApexOptions } from "apexcharts"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

interface TermometroChartProps {
    data: { mes: string; media: number }[]
}

export function TermometroChart({ data }: TermometroChartProps) {
    const categories = data.map((d) => d.mes)
    const seriesData = data.map((d) => d.media)

    const options: ApexOptions = {
        chart: {
            type: "area",
            toolbar: { show: false },
            background: "transparent",
            fontFamily: "inherit",
            zoom: { enabled: false },
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
                opacityTo: 0,
                stops: [0, 100],
            },
        },
        markers: {
            size: 4,
            strokeWidth: 0,
            colors: ["#fad419"],
            hover: {
                size: 6,
            },
        },
        legend: {
            show: false,
        },
        xaxis: {
            categories,
            labels: {
                style: {
                    fontSize: "10px",
                    fontWeight: 700,
                    colors: "#9CA3AF",
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
            padding: { top: 0, bottom: 0, left: 12, right: 12 },
        },
        tooltip: {
            theme: "dark",
            y: {
                formatter: (val: number) => `${val.toFixed(1)} / 5`,
            },
        },
        dataLabels: {
            enabled: false,
        },
    }

    const series = [
        {
            name: "Média Mensal",
            data: seriesData,
        },
    ]

    if (data.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-text-muted">
                Nenhum dado disponível
            </div>
        )
    }

    return (
        <div className="h-[220px]">
            <Chart options={options} series={series} type="area" height="100%" />
        </div>
    )
}
