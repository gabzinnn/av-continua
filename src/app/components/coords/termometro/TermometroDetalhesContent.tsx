"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Download, Edit, ChevronRight } from "lucide-react"
import { Button } from "@/src/app/components/Button"
import { getTermometroDetalhes, exportarRespostas, TermometroDetalhes } from "@/src/actions/termometroActions"
import { getCiclos, Ciclo } from "@/src/actions/cicloActions"
import { TermometroStatsCards } from "./TermometroStatsCards"
import { EditarTermometroModal } from "./EditarTermometroModal"
import { TermometroDemandasList } from "./TermometroDemandasList"
import { TermometroMediaPerguntaChart } from "./TermometroMediaPerguntaChart"
import { TermometroRespostasTable } from "./TermometroRespostasTable"
import { VerTudoModal } from "./VerTudoModal"


interface TermometroDetalhesContentProps {
    termometroId: number
}

export function TermometroDetalhesContent({ termometroId }: TermometroDetalhesContentProps) {
    const router = useRouter()
    const [data, setData] = useState<TermometroDetalhes | null>(null)
    const [ciclos, setCiclos] = useState<Ciclo[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isVerTudoModalOpen, setIsVerTudoModalOpen] = useState(false)

    const fetchData = async () => {
        try {
            const [result, ciclosData] = await Promise.all([
                getTermometroDetalhes(termometroId),
                getCiclos(),
            ])
            setData(result)
            setCiclos(ciclosData)
        } catch (error) {
            console.error("Erro ao carregar dados:", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [termometroId])

    const handleExport = async () => {
        const { headers, rows } = await exportarRespostas(termometroId)
        if (rows.length === 0) return

        // Criar CSV
        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `termometro_${termometroId}_respostas.csv`
        link.click()
        URL.revokeObjectURL(url)
    }

    const handleEditSuccess = () => {
        fetchData()
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
                <div className="text-text-muted">Termômetro não encontrado</div>
            </div>
        )
    }

    return (
        <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-[1200px] mx-auto flex flex-col gap-8 pb-12">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-gray-500">
                    <Link href="/coord/termometro" className="hover:text-primary transition-colors">
                        Controle de Termômetros
                    </Link>
                    <ChevronRight size={16} />
                    <span className="text-text-main font-semibold">{data.nome}</span>
                </nav>

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-text-main text-3xl md:text-4xl font-black tracking-tight leading-tight">
                            Detalhes do Termômetro
                        </h1>
                        <p className="text-gray-500 text-base mt-1 max-w-2xl">
                            Análise detalhada de {data.nome}. Visão geral dos resultados, métricas principais e desempenho individual por membro.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            icon={<Download size={18} />}
                            iconPosition="left"
                            onClick={handleExport}
                        >
                            Exportar
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            icon={<Edit size={18} />}
                            iconPosition="left"
                            onClick={() => setIsEditModalOpen(true)}
                        >
                            Editar
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <TermometroStatsCards data={data} />

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Table Section */}
                    <div className="lg:col-span-2 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-text-main">Desempenho por Membro</h3>
                            <button
                                onClick={() => setIsVerTudoModalOpen(true)}
                                className="text-sm text-primary font-medium hover:underline cursor-pointer"
                            >
                                Ver tudo
                            </button>
                        </div>
                        <TermometroRespostasTable data={data} limit={5} />
                    </div>

                    {/* Chart Section */}
                    <div className="flex flex-col gap-6">
                        <TermometroMediaPerguntaChart
                            mediaPorPergunta={data.mediaPorPergunta}
                            perguntas={data.perguntas}
                        />
                    </div>
                </div>

                {/* Demandas List */}
                <TermometroDemandasList data={data} />

                {/* Modals */}
                <EditarTermometroModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSuccess={handleEditSuccess}
                    termometro={data}
                    ciclos={ciclos}
                />

                <VerTudoModal
                    isOpen={isVerTudoModalOpen}
                    onClose={() => setIsVerTudoModalOpen(false)}
                    data={data}
                />
            </div>
        </div>
    )
}
