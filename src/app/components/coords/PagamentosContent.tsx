"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Plus, Edit, Trash2, MoreVertical, CheckCircle, Circle, FileText, ExternalLink, Calendar, Download, Loader2 } from "lucide-react"
import { Button } from "@/src/app/components/Button"
import { AddPagamentoModal } from "./AddPagamentoModal"
import { EditPagamentoModal } from "./EditPagamentoModal"
import { DeletePagamentoModal } from "./DeletePagamentoModal"
import { 
    getAllPagamentos, 
    getPagamentoStats,
    getEvolucaoMensal,
    PagamentoCompleto, 
    PagamentoStats,
    PagamentoFiltros,
    DadosEvolucaoMensal
} from "@/src/actions/pagamentosActions"
import { getAllAreas, AreaOption, getCoordenadoresAtivos } from "@/src/actions/membrosActions"
import { getAllDemandas, DemandaCompleta } from "@/src/actions/demandasActions"
import coresAreas from "@/src/utils/coresAreas"
import dynamic from "next/dynamic"
import { TableColumn } from "react-data-table-component"
import { GastosChart } from "./GastosChart"

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
            minHeight: "72px",
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

function formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value)
}

function formatDate(date: Date) {
    return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date(date))
}

function formatDateForExport(date: Date) {
    return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(new Date(date))
}

function exportToCSV(pagamentos: PagamentoCompleto[], stats: PagamentoStats | null) {
    // CSV Header
    const headers = ["Data", "Nome", "Descrição", "Área", "Demanda", "Responsável", "Nota Fiscal", "Valor (R$)", "Status"]
    
    // CSV Rows
    const rows = pagamentos.map(p => [
        formatDateForExport(p.createdAt),
        `"${p.nome.replace(/"/g, '""')}"`,
        `"${(p.descricao || "").replace(/"/g, '""')}"`,
        p.area?.nome || "",
        p.demanda?.nome || "",
        p.responsavel?.nome || "",
        p.notaFiscal || "",
        p.valor.toFixed(2).replace(".", ","),
        p.status === "CONCLUIDO" ? "Concluído" : "Aberto"
    ])
    
    // Add summary rows at the end
    rows.push([])
    rows.push(["=== RESUMO ===", "", "", "", "", "", "", ""])
    rows.push(["Total Gasto:", "", "", "", "", "", stats?.totalGasto.toFixed(2).replace(".", ",") || "0,00", ""])
    rows.push(["Média Mensal:", "", "", "", "", "", stats?.mediaMensal.toFixed(2).replace(".", ",") || "0,00", ""])
    if (stats?.maiorGasto) {
        rows.push(["Maior Gasto:", stats.maiorGasto.nome, "", "", "", "", stats.maiorGasto.valor.toFixed(2).replace(".", ","), ""])
    }
    rows.push(["Abertos:", "", "", "", "", "", String(stats?.totalPorStatus.abertos || 0), ""])
    rows.push(["Concluídos:", "", "", "", "", "", String(stats?.totalPorStatus.concluidos || 0), ""])
    
    // Build CSV content
    const csvContent = [
        headers.join(";"),
        ...rows.map(row => row.join(";"))
    ].join("\n")
    
    // Create BOM for Excel UTF-8 compatibility
    const BOM = "\uFEFF"
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" })
    
    // Generate filename with current date
    const today = new Date().toISOString().split("T")[0]
    const filename = `relatorio_gastos_${today}.csv`
    
    // Download file
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

export function PagamentosContent() {
    const [pagamentos, setPagamentos] = useState<PagamentoCompleto[]>([])
    const [stats, setStats] = useState<PagamentoStats | null>(null)
    const [evolucao, setEvolucao] = useState<DadosEvolucaoMensal[]>([])
    const [areas, setAreas] = useState<AreaOption[]>([])
    const [demandas, setDemandas] = useState<DemandaCompleta[]>([])
    const [coordenadores, setCoordenadores] = useState<{ id: number; nome: string }[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Filters
    const [filtros, setFiltros] = useState<PagamentoFiltros>({})
    const [dataInicio, setDataInicio] = useState("")
    const [dataFim, setDataFim] = useState("")

    // Modals
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [selectedPagamento, setSelectedPagamento] = useState<PagamentoCompleto | null>(null)

    // Dropdown menu
    const [openMenuId, setOpenMenuId] = useState<number | null>(null)

    // Chart year
    const [anoGrafico, setAnoGrafico] = useState(new Date().getFullYear())

    const loadData = useCallback(async () => {
        setIsLoading(true)
        
        const filterParams: PagamentoFiltros = { ...filtros }
        if (dataInicio) filterParams.dataInicio = new Date(dataInicio)
        if (dataFim) filterParams.dataFim = new Date(dataFim + "T23:59:59")
        
        const [pagamentosData, statsData, evolucaoData, areasData, demandasData, coordenadoresData] = await Promise.all([
            getAllPagamentos(filterParams),
            getPagamentoStats({ 
                dataInicio: filterParams.dataInicio, 
                dataFim: filterParams.dataFim,
                areaId: filterParams.areaId,
                demandaId: filterParams.demandaId,
            }),
            getEvolucaoMensal(anoGrafico, {
                areaId: filterParams.areaId,
                demandaId: filterParams.demandaId,
            }),
            getAllAreas(),
            getAllDemandas(),
            getCoordenadoresAtivos(),
        ])
        
        setPagamentos(pagamentosData)
        setStats(statsData)
        setEvolucao(evolucaoData)
        setAreas(areasData)
        setDemandas(demandasData)
        setCoordenadores(coordenadoresData)
        setIsLoading(false)
    }, [filtros, dataInicio, dataFim, anoGrafico])

    useEffect(() => {
        loadData()
    }, [loadData])

    const handleEdit = (pagamento: PagamentoCompleto) => {
        setSelectedPagamento(pagamento)
        setShowEditModal(true)
        setOpenMenuId(null)
    }

    const handleDelete = (pagamento: PagamentoCompleto) => {
        setSelectedPagamento(pagamento)
        setShowDeleteModal(true)
        setOpenMenuId(null)
    }

    const handleApplyFilters = () => {
        loadData()
    }

    const handleClearFilters = () => {
        setFiltros({})
        setDataInicio("")
        setDataFim("")
    }

    const columns: TableColumn<PagamentoCompleto>[] = [
        {
            name: "Data",
            cell: (row) => (
                <span className="text-sm text-gray-600">{formatDate(row.createdAt)}</span>
            ),
            width: "140px",
            sortable: true,
            selector: (row) => new Date(row.createdAt).getTime(),
        },
        {
            name: "Nome",
            cell: (row) => (
                <div className="flex flex-col py-2">
                    <span className="text-sm font-semibold text-text-main">{row.nome}</span>
                    {row.descricao && (
                        <span className="text-xs text-gray-500 truncate max-w-[250px]">{row.descricao}</span>
                    )}
                </div>
            ),
            sortable: true,
            selector: (row) => row.nome,
            minWidth: "220px",
        },
        {
            name: "Área",
            selector: (row) => row.area?.nome || "",
            sortable: true,
            cell: (row) => row.area ? (
                <span 
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-text-main whitespace-nowrap"
                    style={{ backgroundColor: coresAreas(row.area.nome) }}
                >
                    {row.area.nome}
                </span>
            ) : (
                <span className="text-gray-400 text-sm">—</span>
            ),
            minWidth: "160px",
        },
        {
            name: "Nota Fiscal",
            cell: (row) => {
                const handleDownloadPdf = async (e: React.MouseEvent) => {
                    e.preventDefault()
                    if (!row.pdfUrl) return

                    try {
                        const response = await fetch(row.pdfUrl)
                        const blob = await response.blob()
                        const url = window.URL.createObjectURL(blob)
                        const a = document.createElement("a")
                        a.href = url
                        
                        // Define filename: use notaFiscal or "documento" and ensure .pdf extension
                        let filename = row.notaFiscal || `Nota Fiscal - ${row.nome} - ${formatDate(row.createdAt)}`
                        if (!filename.toLowerCase().endsWith(".pdf")) {
                            filename += ".pdf"
                        }
                        
                        a.download = filename
                        document.body.appendChild(a)
                        a.click()
                        window.URL.revokeObjectURL(url)
                        document.body.removeChild(a)
                    } catch (error) {
                        console.error("Erro ao baixar PDF:", error)
                        // Fallback: open in new tab if download fails
                        window.open(row.pdfUrl, "_blank")
                    }
                }

                if (row.pdfUrl) {
                    return (
                        <button 
                            onClick={handleDownloadPdf}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-hover hover:underline cursor-pointer bg-transparent border-none p-0"
                        >
                            <FileText size={14} />
                            {row.notaFiscal || "Baixar PDF"}
                            <Download size={12} />
                        </button>
                    )
                }
                return row.notaFiscal ? (
                    <span className="text-sm text-gray-600">{row.notaFiscal}</span>
                ) : (
                    <span className="text-gray-400 text-sm">—</span>
                )
            },
            minWidth: "150px",
        },
        {
            name: "Responsável",
            selector: (row) => row.responsavel?.nome || "",
            sortable: true,
            cell: (row) => row.responsavel ? (
                <span className="text-sm text-text-main">{row.responsavel.nome}</span>
            ) : (
                <span className="text-gray-400 text-sm">—</span>
            ),
            minWidth: "140px",
        },
        {
            name: "Valor",
            cell: (row) => (
                <span className="text-sm font-medium text-text-main">
                    {formatCurrency(Number(row.valor))}
                </span>
            ),
            right: true,
            width: "140px",
            sortable: true,
            selector: (row) => Number(row.valor),
        },
        {
            name: "Status",
            cell: (row) => (
                <div className="flex items-center justify-center">
                    {row.status === "CONCLUIDO" ? (
                        <CheckCircle size={22} className="text-green-600" />
                    ) : (
                        <Circle size={22} className="text-orange-400" />
                    )}
                </div>
            ),
            center: true,
            width: "100px",
        },
        {
            name: "Ações",
            cell: (row) => (
                <div className="relative">
                    <button
                        onClick={() => setOpenMenuId(openMenuId === row.id ? null : row.id)}
                        className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer text-gray-400 hover:text-text-main transition-colors"
                    >
                        <MoreVertical size={20} />
                    </button>
                    
                    {openMenuId === row.id && (
                        <>
                            <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setOpenMenuId(null)} 
                            />
                            <div className="absolute right-0 top-8 z-20 bg-white rounded-lg shadow-lg border border-border py-1 min-w-[140px]">
                                <button
                                    onClick={() => handleEdit(row)}
                                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-text-main hover:bg-gray-50 cursor-pointer"
                                >
                                    <Edit size={16} />
                                    Editar
                                </button>
                                <button
                                    onClick={() => handleDelete(row)}
                                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                                >
                                    <Trash2 size={16} />
                                    Excluir
                                </button>
                            </div>
                        </>
                    )}
                </div>
            ),
            width: "120px",
            right: true,
        },
    ]

    return (
        <div className="flex-1 overflow-y-auto">
            {/* Header & Controls */}
            <div className="bg-bg-main border-b border-border">
                <div className="px-8 py-6 max-w-[1400px] mx-auto w-full flex flex-col gap-6">
                    {/* Breadcrumbs */}
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="text-text-muted">Home</span>
                        <span className="text-text-muted">/</span>
                        <span className="text-text-muted">Financeiro</span>
                        <span className="text-text-muted">/</span>
                        <span className="text-text-main font-semibold">Controle de Gastos</span>
                    </div>

                    {/* Title */}
                    <div className="flex flex-col gap-1">
                        <h2 className="text-text-main text-3xl font-bold tracking-tight">Controle de Gastos</h2>
                        <p className="text-text-muted">Gerencie e acompanhe todas as despesas internas do período.</p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="secondary"
                                size="md"
                                icon={<Download size={18} />}
                                iconPosition="left"
                                className="whitespace-nowrap"
                                onClick={() => exportToCSV(pagamentos, stats)}
                            >
                                Exportar Relatório
                            </Button>
                        </div>
                        <Button
                            onClick={() => setShowAddModal(true)}
                            icon={<Plus size={20} />}
                            className="whitespace-nowrap"
                        >
                            Adicionar gasto
                        </Button>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="px-8 py-4">
                <div className="max-w-[1400px] mx-auto w-full">
                    <div className="flex flex-wrap items-end gap-3 rounded-xl bg-bg-card p-4 shadow-sm border border-border">
                        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
                            <label className="text-xs font-semibold text-gray-600">Período - Início</label>
                            <div className="relative">
                                <Calendar size={18} className="absolute left-3 top-2.5 text-gray-400" />
                                <input
                                    type="date"
                                    value={dataInicio}
                                    onChange={(e) => setDataInicio(e.target.value)}
                                    className="w-full rounded-lg border border-border bg-bg-main py-2 pl-10 pr-3 text-sm text-text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
                            <label className="text-xs font-semibold text-gray-600">Período - Fim</label>
                            <div className="relative">
                                <Calendar size={18} className="absolute left-3 top-2.5 text-gray-400" />
                                <input
                                    type="date"
                                    value={dataFim}
                                    onChange={(e) => setDataFim(e.target.value)}
                                    className="w-full rounded-lg border border-border bg-bg-main py-2 pl-10 pr-3 text-sm text-text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
                            <label className="text-xs font-semibold text-gray-600">Área</label>
                            <select
                                value={filtros.areaId || ""}
                                onChange={(e) => setFiltros({ ...filtros, areaId: e.target.value ? Number(e.target.value) : undefined })}
                                className="w-full rounded-lg border border-border bg-bg-main py-2 pl-3 pr-10 text-sm text-text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none cursor-pointer"
                            >
                                <option value="">Todas as áreas</option>
                                {areas.map((area) => (
                                    <option key={area.id} value={area.id}>{area.nome}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
                            <label className="text-xs font-semibold text-gray-600">Demanda</label>
                            <select
                                value={filtros.demandaId || ""}
                                onChange={(e) => setFiltros({ ...filtros, demandaId: e.target.value ? Number(e.target.value) : undefined })}
                                className="w-full rounded-lg border border-border bg-bg-main py-2 pl-3 pr-10 text-sm text-text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none cursor-pointer"
                            >
                                <option value="">Todas as demandas</option>
                                {demandas.map((demanda) => (
                                    <option key={demanda.id} value={demanda.id}>{demanda.nome}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleClearFilters}
                                disabled={isLoading}
                                className="h-[42px] px-4 rounded-lg border border-border text-text-muted text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Limpar
                            </button>
                            <button
                                onClick={handleApplyFilters}
                                disabled={isLoading}
                                className="h-[42px] px-6 rounded-lg bg-primary text-text-main text-sm font-bold shadow-sm hover:bg-primary-hover transition-colors flex items-center gap-2 disabled:opacity-80 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Carregando...
                                    </>
                                ) : (
                                    "Aplicar filtros"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="px-8 pb-4">
                <div className="max-w-[1400px] mx-auto w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="rounded-xl bg-bg-card p-5 border border-border shadow-sm flex flex-col justify-between h-[140px]">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Gasto</p>
                                    <h3 className="mt-2 text-2xl font-bold text-text-main">
                                        {stats ? formatCurrency(stats.totalGasto) : "R$ 0,00"}
                                    </h3>
                                </div>
                                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/20 text-primary">
                                    <span className="material-symbols-outlined">payments</span>
                                </div>
                            </div>
                            <div className="text-xs text-gray-500">
                                No período selecionado
                            </div>
                        </div>
                        
                        <div className="rounded-xl bg-bg-card p-5 border border-border shadow-sm flex flex-col justify-between h-[140px]">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Média Mensal</p>
                                    <h3 className="mt-2 text-2xl font-bold text-text-main">
                                        {stats ? formatCurrency(stats.mediaMensal) : "R$ 0,00"}
                                    </h3>
                                </div>
                                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 text-gray-600">
                                    <span className="material-symbols-outlined">show_chart</span>
                                </div>
                            </div>
                            <div className="text-xs text-gray-500">
                                Baseado nos meses com registros
                            </div>
                        </div>
                        
                        <div className="rounded-xl bg-bg-card p-5 border border-border shadow-sm flex flex-col justify-between h-[140px]">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Maior Gasto</p>
                                    <h3 className="mt-2 text-2xl font-bold text-text-main">
                                        {stats?.maiorGasto ? formatCurrency(stats.maiorGasto.valor) : "R$ 0,00"}
                                    </h3>
                                </div>
                                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 text-gray-600">
                                    <span className="material-symbols-outlined">shopping_cart</span>
                                </div>
                            </div>
                            <div className="text-xs text-gray-500 truncate w-full">
                                {stats?.maiorGasto ? `Referente a: ${stats.maiorGasto.nome}` : "Sem registros"}
                            </div>
                        </div>
                        
                        <div className="rounded-xl bg-bg-card p-5 border border-border shadow-sm flex flex-col justify-between h-[140px]">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</p>
                                    <h3 className="mt-2 text-xl font-bold text-text-main">
                                        {stats ? `${stats.totalPorStatus.abertos} Abertos` : "0 Abertos"}
                                    </h3>
                                </div>
                                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/20 text-primary">
                                    <span className="material-symbols-outlined">pie_chart</span>
                                </div>
                            </div>
                            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                <div 
                                    className="bg-green-500 h-full rounded-full" 
                                    style={{ 
                                        width: stats && (stats.totalPorStatus.abertos + stats.totalPorStatus.concluidos) > 0
                                            ? `${(stats.totalPorStatus.concluidos / (stats.totalPorStatus.abertos + stats.totalPorStatus.concluidos)) * 100}%`
                                            : "0%" 
                                    }}
                                ></div>
                            </div>
                            <div className="text-xs text-gray-500">
                                {stats ? `${stats.totalPorStatus.concluidos} concluídos` : "0 concluídos"}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Evolution Chart */}
            <div className="px-8 pb-4">
                <div className="max-w-[1400px] mx-auto w-full">
                    <div className="rounded-xl bg-bg-card p-6 border border-border shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-text-main">Evolução Mensal de Gastos</h3>
                                <p className="text-sm text-gray-500">Acompanhe a evolução dos gastos ao longo do ano</p>
                            </div>
                            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                                {[anoGrafico - 2, anoGrafico - 1, anoGrafico, anoGrafico + 1].filter(a => a <= new Date().getFullYear()).map((ano) => (
                                    <button
                                        key={ano}
                                        onClick={() => setAnoGrafico(ano)}
                                        className={`
                                            px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer
                                            ${anoGrafico === ano
                                                ? "bg-white shadow-sm text-text-main font-semibold"
                                                : "text-gray-500 hover:text-text-main"
                                            }
                                        `}
                                    >
                                        {ano}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="h-[280px]">
                            <GastosChart data={evolucao} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="px-8 pb-4">
                <div className="max-w-[1400px] mx-auto w-full">
                    <div className="relative group w-full md:w-96">
                        <Search 
                            size={20} 
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" 
                        />
                        <input
                            type="text"
                            value={filtros.busca || ""}
                            onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
                            onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
                            placeholder="Pesquisar gastos..."
                            className="w-full h-11 pl-12 pr-4 bg-bg-card border-none ring-1 ring-border rounded-lg text-text-main placeholder:text-text-muted focus:ring-2 focus:ring-primary focus:outline-none shadow-sm transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="px-8 pb-8">
                <div className="max-w-[1400px] mx-auto w-full">
                    <div className="bg-bg-card rounded-xl shadow-sm border border-border overflow-x-auto">
                        <DataTable
                            columns={columns as TableColumn<unknown>[]}
                            data={pagamentos}
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
                                    Nenhum gasto encontrado
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

            {/* Modals */}
            <AddPagamentoModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={loadData}
                areas={areas}
                demandas={demandas}
                coordenadores={coordenadores}
            />

            <EditPagamentoModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSuccess={loadData}
                areas={areas}
                demandas={demandas}
                pagamento={selectedPagamento}
                coordenadores={coordenadores}
            />

            <DeletePagamentoModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onSuccess={loadData}
                pagamento={selectedPagamento}
            />
        </div>
    )
}
