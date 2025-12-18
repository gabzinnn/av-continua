"use client"

import dynamic from "next/dynamic"
import { ApexOptions } from "apexcharts"

// Dynamic import para evitar erros de SSR
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

interface EvolucaoData {
  mes: string
  entrega: number
  cultura: number
  feedback: number
}

interface EvolucaoChartProps {
  data: EvolucaoData[]
}

export function EvolucaoChart({ data }: EvolucaoChartProps) {
  const categories = data.map((d) => d.mes)

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
    colors: ["#F9D41A", "#8B5CF6", "#10B981"], // primary, violet, emerald
    markers: {
      size: 5,
      strokeWidth: 0,
      hover: {
        size: 7,
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "right",
      fontSize: "12px",
      fontWeight: 500,
      labels: {
        colors: "#6B7280",
      },
      markers: {
        offsetX: -4,
      },
      itemMargin: {
        horizontal: 12,
      },
    },
    xaxis: {
      categories,
      labels: {
        style: {
          fontSize: "12px",
          fontWeight: 500,
          colors: "#6B7280",
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
      max: 5,
      tickAmount: 5,
      labels: {
        formatter: (val: number) => val.toFixed(1),
        style: {
          fontSize: "12px",
          colors: "#9CA3AF",
        },
      },
    },
    grid: {
      borderColor: "#F3F4F6",
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
      padding: { top: 0, bottom: 0 },
    },
    tooltip: {
      theme: "dark",
      y: {
        formatter: (val: number) => `${val.toFixed(1)} / 5.0`,
      },
    },
    dataLabels: {
      enabled: false,
    },
  }

  const series = [
    {
      name: "Entrega",
      data: data.map((d) => Number(d.entrega.toFixed(1))),
    },
    {
      name: "Alinhamento Cultural",
      data: data.map((d) => Number(d.cultura.toFixed(1))),
    },
    {
      name: "Feedbacks",
      data: data.map((d) => Number(d.feedback.toFixed(1))),
    },
  ]

  return (
    <div className="w-full h-full">
      <Chart options={options} series={series} type="line" height="100%" />
    </div>
  )
}
