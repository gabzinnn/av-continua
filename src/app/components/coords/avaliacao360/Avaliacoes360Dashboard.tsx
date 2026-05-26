"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Plus, Eye, TimerOff, Play, Trash2, Search, BarChart3, Clock, Settings, Copy, RotateCcw } from "lucide-react"
import { Button } from "@/src/app/components/Button"
import dynamic from "next/dynamic"
import { TableColumn } from "react-data-table-component"
import {
    getAvaliacoes360PageData,
    type Avaliacao360PageData,
    type Avaliacao360Resumo,
    encerrarAvaliacao360,
    deletarAvaliacao360,
    reabrirAvaliacao360,
    criarAvaliacao360,
    duplicarAvaliacao360
} from "@/src/actions/avaliacao360Actions"
import type { StatusAvaliacao360 } from "@/src/generated/prisma/client"

const DataTable = dynamic(() => import("react-data-table-component"), { ssr: false })
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

const customStyles = {
    headRow: {
        style: {
            backgroundColor: "#fcfbf8",
            borderBottom: "1px solid #e9e4ce",
            minHeight: "56px",
        },
    },
    headCells: {
        style: {
            color: "#6b6b6b",
            fontSize: "0.75rem",
            fontWeight: "600",
            textTransform: "uppercase" as const,
            letterSpacing: "0.05em",
            paddingLeft: "1.5rem",
            paddingRight: "1.5rem",
        },
    },
    rows: {
        style: {
            minHeight: "64px",
            "&:hover": {
                backgroundColor: "#fcfbf8",
            },
        },
    },
    cells: {
        style: {
            paddingLeft: "1.5rem",
            paddingRight: "1.5rem",
            paddingTop: "0.75rem",
            paddingBottom: "0.75rem",
        },
    },
    pagination: {
        style: {
            backgroundColor: "#fcfbf8",
            borderTop: "1px solid #e9e4ce",
            minHeight: "56px",
        },
    },
}

type FilterStatus = "TODAS" | StatusAvaliacao360

export function Avaliacoes360Dashboard() {
    const router = useRouter()
    const [data, setData] = useState<Avaliacao360PageData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<number | null>(null)
    const [busca, setBusca] = useState("")
    const [filtroStatus, setFiltroStatus] = useState<FilterStatus>("TODAS")

    const fetchData = async () => {
        try {
            const result = await getAvaliacoes360PageData()
            setData(result)
        } catch (error) {
            console.error("Erro ao carregar dados:", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleCriar = async () => {
        const nome = prompt("Digite o nome da nova Avaliação 360:")
        if (!nome) return

        setIsLoading(true)
        const res = await criarAvaliacao360({ nome })
        if (res.success && res.data) {
            router.push(`/coord/avaliacoes-360/${res.data.id}/editar`)
        } else {
            alert(res.error)
            setIsLoading(false)
        }
    }

    const handleIniciar = (id: number) => {
        router.push(`/coord/avaliacoes-360/${id}/editar`)
    }

    const handleEncerrar = async (id: number) => {
        if (!confirm("Tem certeza que deseja encerrar este ciclo?")) return
        setActionLoading(id)
        try {
            const result = await encerrarAvaliacao360(id)
            if (result.success) fetchData()
            else alert(result.error)
        } finally {
            setActionLoading(null)
        }
    }

    const handleDeletar = async (id: number) => {
        if (!confirm("Tem certeza que deseja excluir esta avaliação?")) return
        setActionLoading(id)
        try {
            const result = await deletarAvaliacao360(id)
            if (result.success) fetchData()
            else alert(result.error)
        } finally {
            setActionLoading(null)
        }
    }

    const handleReabrir = async (id: number) => {
        if (!confirm("Reabrir esta avaliação? Ela voltará para o status ATIVA.")) return
        setActionLoading(id)
        try {
            const result = await reabrirAvaliacao360(id)
            if (result.success) fetchData()
            else alert(result.error)
        } finally {
            setActionLoading(null)
        }
    }

    const handleEditar = (id: number) => {
        router.push(`/coord/avaliacoes-360/${id}/editar`)
    }

    const handleDuplicar = async (id: number) => {
        setActionLoading(id)
        try {
            const result = await duplicarAvaliacao360(id)
            if (result.success && result.id) {
                router.push(`/coord/avaliacoes-360/${result.id}/editar`)
            } else {
                alert(result.error)
            }
        } finally {
            setActionLoading(null)
        }
    }

    const handleVerRelatorio = (id: number) => {
        router.push(`/coord/avaliacoes-360/${id}`)
    }

    const formatDate = (date: Date | null) => {
        if (!date) return "—"
        return new Date(date).toLocaleDateString("pt-BR", { month: 'short', year: 'numeric' })
    }

    const getStatusBadge = (status: StatusAvaliacao360) => {
        switch (status) {
            case "ATIVA":
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700">
                        Ativa
                    </span>
                )
            case "RASCUNHO":
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/30 text-yellow-800">
                        Rascunho
                    </span>
                )
            case "ENCERRADA":
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-200 text-gray-600">
                        Encerrada
                    </span>
                )
        }
    }

    // Filtered data
    const filtrados = useMemo(() => {
        if (!data) return []
        let filtered = data.avaliacoes

        if (filtroStatus !== "TODAS") {
            filtered = filtered.filter((p) => p.status === filtroStatus)
        }

        if (busca.trim()) {
            const search = busca.toLowerCase()
            filtered = filtered.filter((p) => p.nome.toLowerCase().includes(search))
        }

        return filtered
    }, [data, filtroStatus, busca])

    const ciclosAtivos = data?.avaliacoes.filter(a => a.status === "ATIVA") || []
    const cicloEmDestaque = ciclosAtivos.length > 0 ? ciclosAtivos[0] : null

    const filterChips: { label: string; value: FilterStatus }[] = [
        { label: "Todas", value: "TODAS" },
        { label: "Ativas", value: "ATIVA" },
        { label: "Rascunhos", value: "RASCUNHO" },
        { label: "Encerradas", value: "ENCERRADA" },
    ]

    const columns: TableColumn<Avaliacao360Resumo>[] = [
        {
            name: "Pesquisa",
            cell: (row) => (
                <div className="flex flex-col gap-0.5 py-2">
                    <span className="text-sm font-bold text-text-main">{row.nome}</span>
                    <span className="text-xs text-gray-400">Avaliação 360</span>
                </div>
            ),
            sortable: true,
            selector: (row) => row.nome,
            minWidth: "220px",
        },
        {
            name: "Período",
            cell: (row) => (
                <span className="text-sm text-gray-700">
                    {formatDate(row.dataInicio || row.createdAt)} - {row.status === "ENCERRADA" ? formatDate(row.dataFim) : "Atual"}
                </span>
            ),
            sortable: true,
            selector: (row) => (row.dataInicio || row.createdAt).getTime(),
            minWidth: "160px",
        },
        {
            name: "Status",
            cell: (row) => getStatusBadge(row.status),
            sortable: true,
            selector: (row) => row.status,
            width: "130px",
        },
        {
            name: "Participação",
            cell: (row) => (
                <div className="text-center font-bold text-sm">
                    {row.status === "RASCUNHO" ? "—" : `${row.taxaResposta}%`}
                </div>
            ),
            sortable: true,
            selector: (row) => row.taxaResposta,
            center: true,
            width: "140px",
        },
        {
            name: "Alocação",
            cell: (row) => (
                <div className="text-center text-sm text-gray-600">
                    {row.status === "RASCUNHO" || row.totalPares === 0 ? "—" : `${row.totalPares} pares`}
                </div>
            ),
            sortable: true,
            selector: (row) => row.totalPares,
            center: true,
            width: "120px",
        },
        {
            name: "Ações",
            cell: (row) => {
                const isDisabled = actionLoading === row.id
                switch (row.status) {
                    case "ATIVA":
                        return (
                            <div className="flex items-center gap-3 text-sm">
                                <button
                                    onClick={() => handleVerRelatorio(row.id)}
                                    disabled={isDisabled}
                                    className="text-gray-500 hover:text-primary font-medium flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    <BarChart3 size={16} /> Relatório
                                </button>
                                <button
                                    onClick={() => handleEncerrar(row.id)}
                                    disabled={isDisabled}
                                    className="text-gray-500 hover:text-red-500 font-medium flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    <TimerOff size={16} /> Encerrar
                                </button>
                                <button
                                    onClick={async () => {
                                        if (!confirm("Esta avaliação tem respostas em andamento. Excluir mesmo assim? Esta ação não pode ser desfeita.")) return
                                        setActionLoading(row.id)
                                        try {
                                            const result = await deletarAvaliacao360(row.id)
                                            if (result.success) fetchData()
                                            else alert(result.error)
                                        } finally {
                                            setActionLoading(null)
                                        }
                                    }}
                                    disabled={isDisabled}
                                    className="text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                                    title="Excluir"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )
                    case "RASCUNHO":
                        return (
                            <div className="flex items-center justify-end gap-3 text-sm w-full">
                                <button
                                    onClick={() => handleEditar(row.id)}
                                    disabled={isDisabled}
                                    className="text-gray-500 hover:text-primary font-medium flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    <Settings size={16} /> Editar
                                </button>
                                <button
                                    onClick={() => handleDuplicar(row.id)}
                                    disabled={isDisabled}
                                    className="text-gray-500 hover:text-primary font-medium flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                                    title="Duplicar"
                                >
                                    <Copy size={16} />
                                </button>
                                <button
                                    onClick={() => handleIniciar(row.id)}
                                    disabled={isDisabled}
                                    className="text-gray-500 hover:text-green-600 font-medium flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    <Play size={16} /> Iniciar
                                </button>
                                <button
                                    onClick={() => handleDeletar(row.id)}
                                    disabled={isDisabled}
                                    className="text-gray-500 hover:text-red-500 font-medium flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )
                    case "ENCERRADA":
                        return (
                            <div className="flex items-center gap-3 text-sm">
                                <button
                                    onClick={() => handleVerRelatorio(row.id)}
                                    disabled={isDisabled}
                                    className="text-primary hover:brightness-95 font-bold flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer px-4 py-2 bg-primary/10 rounded-lg"
                                >
                                    <BarChart3 size={16} /> Ver Relatório
                                </button>
                                <button
                                    onClick={() => handleDuplicar(row.id)}
                                    disabled={isDisabled}
                                    className="text-gray-500 hover:text-primary font-medium flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                                    title="Duplicar"
                                >
                                    <Copy size={16} />
                                </button>
                                <button
                                    onClick={() => handleReabrir(row.id)}
                                    disabled={isDisabled}
                                    className="text-gray-500 hover:text-green-600 font-medium flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                                    title="Reabrir"
                                >
                                    <RotateCcw size={16} />
                                </button>
                                <button
                                    onClick={() => handleDeletar(row.id)}
                                    disabled={isDisabled}
                                    className="text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                                    title="Excluir"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )
                }
            },
            right: true,
            minWidth: "260px",
        },
    ]

    if (!isLoading && !data) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-text-muted">Erro ao carregar dados</div>
            </div>
        )
    }

    const temEncerradas = (data?.avaliacoes ?? []).some(a => a.status === "ENCERRADA")

    return (
        <div className="flex-1 flex flex-col pt-4 overflow-y-auto">
            <div className="px-8 max-w-[1400px] mx-auto w-full flex flex-col gap-8 pb-12">
                
                {/* Header */}
                <div className="flex flex-wrap justify-between items-end gap-4">
                    <div className="flex flex-col gap-2 max-w-2xl">
                        <h1 className="text-text-main text-4xl font-black tracking-tight">Análise de Ciclos 360</h1>
                        <p className="text-text-muted text-lg font-normal">Monitoramento analítico de desempenho e engajamento 360º</p>
                    </div>
                </div>

                {/* Status Card and Metrics */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Active Cycle Compact Card */}
                    {cicloEmDestaque ? (
                        <div className="bg-bg-card rounded-xl p-5 shadow-sm border border-border flex flex-col justify-center gap-2">
                             <div className="flex items-center gap-3 mb-1">
                                <div className="p-2 border border-primary/30 rounded-lg">
                                    <Clock size={20} className="text-primary" />
                                </div>
                                <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Ciclo Ativo</p>
                             </div>
                            <h3 className="text-xl font-bold">{cicloEmDestaque.nome}</h3>
                            <div className="mt-2 w-full bg-gray-100 rounded-full h-2">
                                <div className="bg-primary h-2 rounded-full" style={{ width: `${cicloEmDestaque.taxaResposta}%` }}></div>
                            </div>
                            <p className="text-[10px] mt-1 text-text-muted">{cicloEmDestaque.taxaResposta}% Participação</p>
                        </div>
                    ) : (
                        <div className="bg-bg-card rounded-xl shadow-sm border border-border flex items-center justify-center p-6 text-center">
                             <div className="flex flex-col items-center">
                                <p className="text-sm font-bold text-text-muted uppercase tracking-wider mb-2">Sem ciclo ativo</p>
                                <Button size="sm" onClick={handleCriar} icon={<Plus size={16}/>}>Iniciar Novo</Button>
                             </div>
                        </div>
                    )}

                    {/* Overall Score */}
                    <div className="bg-bg-card rounded-xl p-6 shadow-sm border border-border">
                        <h4 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4">Engajamento</h4>
                        <div className="flex items-end gap-2 mb-2">
                            <span className="text-4xl font-black">
                                {data?.avaliacoes.length ? Math.round(data.avaliacoes.reduce((acc, v) => acc + v.taxaResposta, 0) / data.avaliacoes.length) : 0}%
                            </span>
                        </div>
                        <p className="text-sm text-gray-500">Taxa de resposta média da empresa.</p>
                    </div>

                    <div className="bg-bg-card rounded-xl p-6 shadow-sm border border-border">
                        <h4 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4">Média Global</h4>
                        <div className="flex items-end gap-2 mb-2">
                            <span className="text-4xl font-black text-gray-300">—</span>
                        </div>
                        <p className="text-sm text-gray-400 italic">Disponível após a conclusão de uma avaliação.</p>
                    </div>
                </div>

                {/* Dashboard Analytics Section */}
                {temEncerradas ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Radar Chart */}
                        <div className="bg-bg-card rounded-xl p-6 shadow-sm border border-border">
                            <h4 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4">Desempenho por Dimensão</h4>
                            <Chart
                                type="radar"
                                height={280}
                                options={{
                                    chart: { toolbar: { show: false }, background: "transparent" },
                                    xaxis: {
                                        categories: ["Comunicação", "Trabalho em Equipe", "Liderança", "Alinhamento Cultural", "Entrega"],
                                    },
                                    yaxis: { min: 0, max: 10, tickAmount: 5 },
                                    fill: { opacity: 0.25, colors: ["#fad419"] },
                                    stroke: { width: 2, colors: ["#fad419"] },
                                    markers: { size: 4, colors: ["#fad419"] },
                                    dataLabels: { enabled: false },
                                    plotOptions: { radar: { polygons: { strokeColors: "#e9e4ce", fill: { colors: ["#fcfbf8", "#ffffff"] } } } },
                                    legend: { show: false },
                                    tooltip: { y: { formatter: (v: number) => v.toFixed(1) } },
                                }}
                                series={[{ name: "Média", data: [0, 0, 0, 0, 0] }]}
                            />
                            <p className="text-xs text-gray-400 italic text-center mt-1">Dados por dimensão em breve.</p>
                        </div>

                        {/* Destaques placeholder */}
                        <div className="bg-bg-card rounded-xl p-6 shadow-sm border border-border flex flex-col gap-4">
                            <h4 className="text-sm font-bold text-text-muted uppercase tracking-wider">Destaques</h4>
                            <div className="flex flex-col gap-3 flex-1 justify-center">
                                {["Comunicação", "Trabalho em Equipe", "Alinhamento Cultural"].map((dim) => (
                                    <div key={dim} className="flex items-center justify-between gap-3">
                                        <span className="text-sm text-text-main font-medium">{dim}</span>
                                        <span className="text-sm font-bold text-gray-300">—</span>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-gray-400 italic">Médias disponíveis após análise dos ciclos encerrados.</p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-bg-card rounded-xl p-8 shadow-sm border border-border flex flex-col items-center justify-center text-center gap-3 min-h-[220px]">
                        <BarChart3 size={36} className="text-gray-200" />
                        <p className="text-sm font-semibold text-gray-400">Nenhuma análise disponível</p>
                        <p className="text-xs text-gray-400 max-w-xs">Os gráficos de desempenho por dimensão serão exibidos após a conclusão de uma avaliação 360.</p>
                    </div>
                )}

                {/* Table Section */}
                <section className="space-y-4 mt-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold">Histórico de Ciclos</h3>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar..."
                                    value={busca}
                                    onChange={(e) => setBusca(e.target.value)}
                                    className="pl-9 pr-4 py-2 bg-white border border-border rounded-lg text-sm w-64 focus:ring-2 focus:ring-primary focus:outline-none"
                                />
                            </div>
                            <Button size="sm" onClick={handleCriar} icon={<Plus size={16} />} iconPosition="left">
                                Nova Avaliação
                            </Button>
                        </div>
                    </div>

                    <div className="bg-bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                        <DataTable
                            columns={columns as TableColumn<unknown>[]}
                            data={filtrados}
                            pagination
                            paginationPerPage={10}
                            customStyles={customStyles}
                            progressPending={isLoading}
                            noDataComponent={<p className="p-8 text-gray-500">Nenhuma avaliação encontrada.</p>}
                        />
                    </div>
                </section>
                
            </div>
        </div>
    )
}
