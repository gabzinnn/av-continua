"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import dynamic from "next/dynamic"
import { TableColumn } from "react-data-table-component"
import { ArrowLeft, Search, ChevronRight, CheckCircle, XCircle, ChevronDown } from "lucide-react"
import { Button } from "@/src/app/components/Button"
import { DetalheAvaliacao, ParticipanteDetalhe } from "@/src/actions/controleAvaliacoesActions"
import { AREA_ORDER } from "@/src/utils/areaOrder"
import coresAreas from "@/src/utils/coresAreas"

const DataTable = dynamic(() => import("react-data-table-component"), { ssr: false })

interface DetalheAvaliacaoContentProps {
    avaliacao: DetalheAvaliacao
}

function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    })
}

type StatusFilter = "todos" | "completo" | "parcial" | "pendente"

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
            justifyContent: "center",
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

export function DetalheAvaliacaoContent({ avaliacao }: DetalheAvaliacaoContentProps) {
    const router = useRouter()
    const [searchTerm, setSearchTerm] = useState("")
    const [areaFilter, setAreaFilter] = useState<string>("todas")
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos")

    // Extrair áreas únicas
    const areas = useMemo(() => {
        const uniqueAreas = [...new Set(avaliacao.participantes.map((p) => p.area))]
        return uniqueAreas.sort()
    }, [avaliacao.participantes])

    // Filtrar participantes
    const filteredParticipantes = useMemo(() => {
        return avaliacao.participantes.filter((p) => {
            // Filtro de busca
            if (searchTerm && !p.nome.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false
            }
            // Filtro de área
            if (areaFilter !== "todas" && p.area !== areaFilter) {
                return false
            }
            // Filtro de status
            if (statusFilter === "completo" && (!p.respondeuAvaliacao || !p.avaliouFeedbacks)) {
                return false
            }
            if (statusFilter === "parcial" && !(p.respondeuAvaliacao !== p.avaliouFeedbacks)) {
                return false
            }
            if (statusFilter === "pendente" && (p.respondeuAvaliacao || p.avaliouFeedbacks)) {
                return false
            }
            return true
        })
    }, [avaliacao.participantes, searchTerm, areaFilter, statusFilter])

    const handleVoltar = () => {
        router.push("/coord/avaliacoes")
    }

    // Função para calcular a média das notas (para ordenação)
    const calcularMediaNotas = (p: ParticipanteDetalhe): number => {
        if (p.mediaEntrega === null || p.mediaCultura === null) {
            return -1 // Sem notas vai para o fim
        }
        return (p.mediaEntrega + p.mediaCultura) / 2
    }

    // Colunas da tabela
    const columns: TableColumn<ParticipanteDetalhe>[] = [
        {
            name: "Participante",
            cell: (row) => (
                <div className="flex items-center gap-3 py-2">
                    {row.fotoUrl ? (
                        <Image
                            src={row.fotoUrl}
                            alt={row.nome}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full object-cover border border-border"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary border border-border">
                            {row.nome.charAt(0)}
                        </div>
                    )}
                    <span className="text-sm font-bold text-text-main whitespace-nowrap">{row.nome}</span>
                </div>
            ),
            sortable: true,
            selector: (row) => row.nome,
            minWidth: "220px",
        },
        {
            name: "Área",
            cell: (row) => (
                <span
                    className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium text-text-main border border-border/50 whitespace-nowrap"
                    style={{ backgroundColor: coresAreas(row.area) }}
                >
                    {row.area}
                </span>
            ),
            sortable: true,
            selector: (row) => AREA_ORDER[row.area] ?? 999,
            minWidth: "180px",
        },
        {
            name: "Respondeu Avaliação",
            cell: (row) => (
                <div className="flex justify-center w-full">
                    {row.respondeuAvaliacao ? (
                        <CheckCircle
                            size={24}
                            className="text-green-600"
                            fill="currentColor"
                            strokeWidth={0}
                        />
                    ) : (
                        <XCircle size={24} className="text-gray-300" />
                    )}
                </div>
            ),
            sortable: true,
            selector: (row) => (row.respondeuAvaliacao ? 1 : 0),
            minWidth: "160px",
        },
        {
            name: "Avaliou Feedbacks",
            cell: (row) => (
                <div className="flex justify-center w-full">
                    {row.avaliouFeedbacks ? (
                        <CheckCircle
                            size={24}
                            className="text-green-600"
                            fill="currentColor"
                            strokeWidth={0}
                        />
                    ) : (
                        <XCircle size={24} className="text-gray-300" />
                    )}
                </div>
            ),
            sortable: true,
            selector: (row) => (row.avaliouFeedbacks ? 1 : 0),
            minWidth: "150px",
        },
        {
            name: "Notas Recebidas",
            cell: (row) => (
                <div className="flex justify-center w-full">
                    {row.mediaEntrega !== null && row.mediaCultura !== null ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-text-main text-xs font-semibold whitespace-nowrap">
                            {row.mediaEntrega.toFixed(1)} / {row.mediaCultura.toFixed(1)}
                        </span>
                    ) : (
                        <span className="text-gray-400 text-xs">-</span>
                    )}
                </div>
            ),
            sortable: true,
            selector: (row) => calcularMediaNotas(row),
            minWidth: "150px",
        },
    ]

    return (
        <div className="flex-1 overflow-y-auto">
            {/* Header */}
            <div className="bg-bg-main border-b border-border">
                <div className="px-8 py-6 max-w-[1200px] mx-auto w-full flex flex-col gap-4">
                    {/* Breadcrumbs */}
                    <nav className="flex items-center gap-2 text-sm">
                        <button
                            onClick={() => router.push("/coord/home")}
                            className="text-text-muted hover:text-primary transition-colors cursor-pointer"
                        >
                            Home
                        </button>
                        <ChevronRight size={14} className="text-text-muted" />
                        <button
                            onClick={() => router.push("/coord/avaliacoes")}
                            className="text-text-muted hover:text-primary transition-colors cursor-pointer"
                        >
                            Avaliações
                        </button>
                        <ChevronRight size={14} className="text-text-muted" />
                        <span className="text-text-main font-medium">Detalhe</span>
                    </nav>

                    {/* Title and Back */}
                    <div className="flex flex-wrap justify-between items-end gap-4">
                        <div className="flex flex-col gap-2">
                            <h2 className="text-text-main text-3xl font-bold tracking-tight">
                                {avaliacao.nome}
                            </h2>
                            <div className="flex items-center gap-2 text-text-muted">
                                <span className="text-sm">
                                    {formatDate(avaliacao.dataInicio)}
                                    {avaliacao.dataFim && ` a ${formatDate(avaliacao.dataFim)}`}
                                </span>
                                {avaliacao.finalizada ? (
                                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                                        Finalizada
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                                        Em andamento
                                    </span>
                                )}
                            </div>
                        </div>
                        <Button
                            variant="secondary"
                            onClick={handleVoltar}
                            icon={<ArrowLeft size={18} />}
                            iconPosition="left"
                        >
                            Voltar
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-8 py-6 max-w-[1200px] mx-auto w-full flex flex-col gap-6">
                {/* Filters Bar */}
                <div className="flex flex-wrap gap-3 items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                        {/* Área Filter */}
                        <div className="relative">
                            <select
                                value={areaFilter}
                                onChange={(e) => setAreaFilter(e.target.value)}
                                className="appearance-none bg-bg-card border border-border text-text-main py-2 pl-3 pr-8 rounded-full text-sm font-medium shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer min-w-[180px]"
                            >
                                <option value="todas">Todas as Áreas</option>
                                {areas.map((area) => (
                                    <option key={area} value={area}>
                                        {area}
                                    </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                <ChevronDown size={16} />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                                className="appearance-none bg-bg-card border border-border text-text-main py-2 pl-3 pr-8 rounded-full text-sm font-medium shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer min-w-[140px]"
                            >
                                <option value="todos">Status: Todos</option>
                                <option value="completo">Completo</option>
                                <option value="parcial">Parcial</option>
                                <option value="pendente">Pendente</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                <ChevronDown size={16} />
                            </div>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search
                            size={18}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar participante..."
                            className="h-10 w-64 rounded-full border border-border bg-bg-card pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        />
                    </div>
                </div>

                {/* DataTable */}
                <div className="bg-bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    <DataTable
                        columns={columns as TableColumn<unknown>[]}
                        data={filteredParticipantes}
                        pagination
                        paginationPerPage={10}
                        paginationRowsPerPageOptions={[10, 20, 50]}
                        customStyles={customStyles}
                        responsive={false}
                        defaultSortFieldId={2}
                        defaultSortAsc={true}
                        noDataComponent={
                            <div className="py-12 text-center text-gray-500">
                                Nenhum participante encontrado
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
    )
}
