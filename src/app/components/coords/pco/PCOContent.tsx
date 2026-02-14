"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Plus, Eye, TimerOff, Play, Trash2, Search } from "lucide-react"
import { Button } from "@/src/app/components/Button"
import { getPCOPageData, PCOPageData, PCOResumo, iniciarPCO, encerrarPCO, deletarPCO } from "@/src/actions/pcoActions"
import dynamic from "next/dynamic"
import { TableColumn } from "react-data-table-component"

const DataTable = dynamic(() => import("react-data-table-component"), { ssr: false })

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

type FilterStatus = "TODAS" | "ATIVA" | "RASCUNHO" | "ENCERRADA"

export function PCOContent() {
    const router = useRouter()
    const [data, setData] = useState<PCOPageData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<number | null>(null)
    const [busca, setBusca] = useState("")
    const [filtroStatus, setFiltroStatus] = useState<FilterStatus>("TODAS")

    const fetchData = async () => {
        try {
            const result = await getPCOPageData()
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



    const handleIniciar = async (id: number) => {
        setActionLoading(id)
        try {
            const result = await iniciarPCO(id)
            if (result.success) {
                fetchData()
            } else {
                alert(result.error)
            }
        } finally {
            setActionLoading(null)
        }
    }

    const handleEncerrar = async (id: number) => {
        if (!confirm("Tem certeza que deseja encerrar esta pesquisa?")) return
        setActionLoading(id)
        try {
            const result = await encerrarPCO(id)
            if (result.success) {
                fetchData()
            } else {
                alert(result.error)
            }
        } finally {
            setActionLoading(null)
        }
    }

    const handleDeletar = async (id: number) => {
        if (!confirm("Tem certeza que deseja excluir este rascunho?")) return
        setActionLoading(id)
        try {
            const result = await deletarPCO(id)
            if (result.success) {
                fetchData()
            } else {
                alert(result.error)
            }
        } finally {
            setActionLoading(null)
        }
    }

    const handleVerRespostas = (id: number) => {
        router.push(`/coord/pco/${id}`)
    }

    const formatDate = (date: Date | null) => {
        if (!date) return "—"
        return new Date(date).toLocaleDateString("pt-BR")
    }

    const getStatusBadge = (status: PCOResumo["status"]) => {
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
    const pcosFiltrados = useMemo(() => {
        if (!data) return []
        let filtered = data.pcos

        // Filter by status
        if (filtroStatus !== "TODAS") {
            filtered = filtered.filter((p) => p.status === filtroStatus)
        }

        // Filter by search
        if (busca.trim()) {
            const search = busca.toLowerCase()
            filtered = filtered.filter((p) => p.nome.toLowerCase().includes(search))
        }

        return filtered
    }, [data, filtroStatus, busca])

    const filterChips: { label: string; value: FilterStatus }[] = [
        { label: "Todas", value: "TODAS" },
        { label: "Ativas", value: "ATIVA" },
        { label: "Rascunhos", value: "RASCUNHO" },
        { label: "Encerradas", value: "ENCERRADA" },
    ]

    const columns: TableColumn<PCOResumo>[] = [
        {
            name: "Pesquisa",
            cell: (row) => (
                <div className="flex flex-col gap-0.5 py-2">
                    <span className="text-sm font-semibold text-text-main">{row.nome}</span>
                    <span className="text-xs text-gray-400">ID: #{row.id}</span>
                </div>
            ),
            sortable: true,
            selector: (row) => row.nome,
            minWidth: "220px",
        },
        {
            name: "Status",
            cell: (row) => getStatusBadge(row.status),
            sortable: true,
            selector: (row) => row.status,
            width: "130px",
        },
        {
            name: "Participantes",
            cell: (row) => (
                <span className="text-sm text-gray-700 font-medium">
                    {row.status === "RASCUNHO" ? "—" : `${row.totalRespostas}/${row.totalParticipantes}`}
                </span>
            ),
            sortable: true,
            selector: (row) => row.totalParticipantes,
            center: true,
            width: "130px",
        },
        {
            name: "Taxa de Resposta",
            cell: (row) => {
                if (row.status === "RASCUNHO") {
                    return <span className="text-sm text-gray-400 italic">Não iniciada</span>
                }
                return (
                    <div className="flex items-center gap-3 w-full">
                        <div className="w-20 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div
                                className={`h-full rounded-full ${row.status === "ATIVA" ? "bg-green-500" : "bg-gray-400"}`}
                                style={{ width: `${row.taxaResposta}%` }}
                            />
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                            {row.taxaResposta}%
                        </span>
                    </div>
                )
            },
            minWidth: "180px",
        },
        {
            name: "Datas",
            cell: (row) => (
                <div className="text-sm flex flex-col gap-0.5">
                    <p className="text-gray-700">
                        {formatDate(row.dataInicio || row.createdAt)}
                    </p>
                    <p className="text-gray-400 text-xs">
                        {row.status === "ENCERRADA"
                            ? `Encerrada em ${formatDate(row.dataFim)}`
                            : row.dataFim
                                ? `até ${formatDate(row.dataFim)}`
                                : "—"
                        }
                    </p>
                </div>
            ),
            minWidth: "160px",
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
                                    onClick={() => handleVerRespostas(row.id)}
                                    disabled={isDisabled}
                                    className="text-gray-500 hover:text-primary font-medium flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    <Eye size={16} /> Ver
                                </button>
                                <button
                                    onClick={() => handleEncerrar(row.id)}
                                    disabled={isDisabled}
                                    className="text-gray-500 hover:text-red-500 font-medium flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    <TimerOff size={16} /> Encerrar
                                </button>
                            </div>
                        )
                    case "RASCUNHO":
                        return (
                            <div className="flex items-center gap-3 text-sm">
                                <button
                                    onClick={() => handleIniciar(row.id)}
                                    disabled={isDisabled}
                                    className="text-gray-500 hover:text-primary font-medium flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    <Play size={16} /> Iniciar
                                </button>
                                <button
                                    onClick={() => handleDeletar(row.id)}
                                    disabled={isDisabled}
                                    className="text-gray-500 hover:text-red-500 font-medium flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    <Trash2 size={16} /> Excluir
                                </button>
                            </div>
                        )
                    case "ENCERRADA":
                        return (
                            <div className="flex items-center gap-3 text-sm">
                                <button
                                    onClick={() => handleVerRespostas(row.id)}
                                    disabled={isDisabled}
                                    className="text-gray-500 hover:text-primary font-medium flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    <Eye size={16} /> Relatório
                                </button>
                            </div>
                        )
                }
            },
            right: true,
            minWidth: "200px",
        },
    ]

    if (!isLoading && !data) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-text-muted">Erro ao carregar dados</div>
            </div>
        )
    }

    return (
        <div className="flex-1 overflow-y-auto">
            {/* Header & Controls */}
            <div className="bg-bg-main border-b border-border">
                <div className="px-8 py-6 max-w-[1400px] mx-auto w-full flex flex-col gap-6">
                    {/* Breadcrumbs */}
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="text-text-muted">Home</span>
                        <span className="text-text-muted">/</span>
                        <span className="text-text-main font-semibold">PCO</span>
                    </div>

                    {/* Title + Button */}
                    <div className="flex flex-wrap justify-between items-center gap-4">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-text-main text-3xl font-bold tracking-tight">
                                Gerenciar Pesquisas de Clima (PCOs)
                            </h1>
                            <p className="text-text-muted text-base">
                                Acompanhe e gerencie todas as pesquisas organizacionais.
                            </p>
                        </div>
                        <Button
                            icon={<Plus size={20} />}
                            iconPosition="left"
                            size="md"
                            onClick={() => router.push("/coord/pco/criar")}
                        >
                            Criar nova PCO
                        </Button>
                    </div>

                    {/* Search + Filter Chips */}
                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-bg-card rounded-xl border border-border p-2 shadow-sm">
                        {/* Search */}
                        <div className="flex-1 min-w-0">
                            <div className="relative group">
                                <Search
                                    size={20}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors"
                                />
                                <input
                                    type="text"
                                    value={busca}
                                    onChange={(e) => setBusca(e.target.value)}
                                    placeholder="Buscar por nome da pesquisa..."
                                    className="w-full h-10 pl-12 pr-4 bg-[#f4f2e6] border-none rounded-lg text-text-main placeholder:text-text-muted focus:ring-2 focus:ring-primary focus:outline-none text-sm transition-all"
                                />
                            </div>
                        </div>

                        {/* Filter Chips */}
                        <div className="flex gap-2 flex-wrap justify-center md:justify-end px-1">
                            {filterChips.map((chip) => (
                                <button
                                    key={chip.value}
                                    onClick={() => setFiltroStatus(chip.value)}
                                    className={`flex h-8 shrink-0 items-center justify-center px-4 rounded-lg text-xs font-bold transition-all cursor-pointer ${filtroStatus === chip.value
                                            ? "bg-primary text-text-main shadow-sm"
                                            : "bg-[#f4f2e6] text-text-main hover:bg-gray-200"
                                        }`}
                                >
                                    {chip.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="px-8 pb-8 pt-6">
                <div className="max-w-[1400px] mx-auto w-full">
                    <div className="bg-bg-card rounded-xl shadow-sm border border-border overflow-x-auto">
                        <DataTable
                            columns={columns as TableColumn<unknown>[]}
                            data={pcosFiltrados}
                            pagination
                            paginationPerPage={10}
                            paginationRowsPerPageOptions={[10, 20, 50]}
                            customStyles={customStyles}
                            responsive={false}
                            progressPending={isLoading}
                            progressComponent={
                                <div className="py-12 text-center text-gray-500">
                                    Carregando...
                                </div>
                            }
                            noDataComponent={
                                <div className="py-12 text-center text-gray-500">
                                    {busca || filtroStatus !== "TODAS"
                                        ? "Nenhuma pesquisa encontrada com os filtros aplicados."
                                        : "Nenhuma pesquisa encontrada. Crie uma nova PCO para começar."}
                                </div>
                            }
                            paginationComponentOptions={{
                                rowsPerPageText: "Por página:",
                                rangeSeparatorText: "de",
                            }}
                        />
                    </div>
                </div>
            </div>


        </div>
    )
}
