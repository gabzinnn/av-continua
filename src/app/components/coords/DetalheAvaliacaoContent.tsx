"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, Search, ChevronLeft, ChevronRight, CheckCircle, XCircle, ChevronDown } from "lucide-react"
import { Button } from "@/src/app/components/Button"
import { DetalheAvaliacao } from "@/src/actions/controleAvaliacoesActions"
import { AREA_ORDER } from "@/src/utils/areaOrder"

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

export function DetalheAvaliacaoContent({ avaliacao }: DetalheAvaliacaoContentProps) {
    const router = useRouter()
    const [searchTerm, setSearchTerm] = useState("")
    const [areaFilter, setAreaFilter] = useState<string>("todas")
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

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

    // Paginação
    const totalPages = Math.ceil(filteredParticipantes.length / itemsPerPage)
    const paginatedParticipantes = filteredParticipantes.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    ).sort((a, b) => AREA_ORDER[a.area] - AREA_ORDER[b.area] || a.nome.localeCompare(b.nome))

    const handleVoltar = () => {
        router.push("/coord/avaliacoes")
    }

    // Reset página quando filtros mudam
    const handleFilterChange = () => {
        setCurrentPage(1)
    }

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
                                onChange={(e) => {
                                    setAreaFilter(e.target.value)
                                    handleFilterChange()
                                }}
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
                                onChange={(e) => {
                                    setStatusFilter(e.target.value as StatusFilter)
                                    handleFilterChange()
                                }}
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
                            onChange={(e) => {
                                setSearchTerm(e.target.value)
                                handleFilterChange()
                            }}
                            placeholder="Buscar participante..."
                            className="h-10 w-64 rounded-full border border-border bg-bg-card pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        />
                    </div>
                </div>

                {/* Table Card */}
                <div className="bg-bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-bg-main border-b border-border">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-muted w-[40%]">
                                        Participante
                                    </th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-muted w-[25%]">
                                        Área
                                    </th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-muted text-center w-[17.5%]">
                                        Respondeu Avaliação
                                    </th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-muted text-center w-[17.5%]">
                                        Avaliou Feedbacks
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {paginatedParticipantes.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-text-muted">
                                            Nenhum participante encontrado
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedParticipantes.map((participante) => (
                                        <tr
                                            key={participante.id}
                                            className="hover:bg-bg-main transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {participante.fotoUrl ? (
                                                        <Image
                                                            src={participante.fotoUrl}
                                                            alt={participante.nome}
                                                            width={40}
                                                            height={40}
                                                            className="w-10 h-10 rounded-full object-cover border border-border"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary border border-border">
                                                            {participante.nome.charAt(0)}
                                                        </div>
                                                    )}
                                                    <span className="text-sm font-bold text-text-main">
                                                        {participante.nome}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center rounded-md bg-bg-main px-2.5 py-1 text-xs font-medium text-text-main border border-border">
                                                    {participante.area}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {participante.respondeuAvaliacao ? (
                                                    <CheckCircle
                                                        size={24}
                                                        className="inline-block text-green-600"
                                                        fill="currentColor"
                                                        strokeWidth={0}
                                                    />
                                                ) : (
                                                    <XCircle
                                                        size={24}
                                                        className="inline-block text-gray-300"
                                                    />
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {participante.avaliouFeedbacks ? (
                                                    <CheckCircle
                                                        size={24}
                                                        className="inline-block text-green-600"
                                                        fill="currentColor"
                                                        strokeWidth={0}
                                                    />
                                                ) : (
                                                    <XCircle
                                                        size={24}
                                                        className="inline-block text-gray-300"
                                                    />
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {filteredParticipantes.length > 0 && (
                        <div className="flex items-center justify-between border-t border-border bg-bg-main px-6 py-3">
                            <p className="text-xs text-text-muted">
                                Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
                                {Math.min(currentPage * itemsPerPage, filteredParticipantes.length)} de{" "}
                                {filteredParticipantes.length} resultados
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="flex items-center justify-center rounded-lg border border-border bg-bg-card p-1.5 hover:bg-bg-main disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="flex items-center justify-center rounded-lg border border-border bg-bg-card p-1.5 hover:bg-bg-main disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
