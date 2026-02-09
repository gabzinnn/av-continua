"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Search, Plus, MoreVertical, Clock, ListChecks, FileText, BarChart3, Trash2, Edit, Eye, Copy, ArrowUpDown } from "lucide-react"
import { Button } from "@/src/app/components/Button"
import { getAllProvas, deleteProva, duplicateProva, ProvaCompleta, OrderByOption } from "@/src/actions/provasActions"
import { StatusProva } from "@/src/generated/prisma/client"
import { DeleteProvaModal } from "./DeleteProvaModal"

function formatDate(date: Date): string {
    return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }).format(new Date(date))
}

function getStatusBadge(status: StatusProva) {
    switch (status) {
        case "RASCUNHO":
            return (
                <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-secondary/30 border border-secondary/50">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-600"></div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-800">Rascunho</span>
                </div>
            )
        case "PUBLICADA":
            return (
                <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-green-100 border border-green-200">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-green-700">Publicada</span>
                </div>
            )
        case "ENCERRADA":
            return (
                <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-gray-100 border border-gray-200">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-500"></div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600">Encerrada</span>
                </div>
            )
    }
}

function getIconForProva(index: number) {
    const icons = ["quiz", "edit_document", "psychology", "verified", "bug_report"]
    const colors = [
        { bg: "bg-blue-50", text: "text-blue-600" },
        { bg: "bg-orange-50", text: "text-orange-600" },
        { bg: "bg-purple-50", text: "text-purple-600" },
        { bg: "bg-teal-50", text: "text-teal-600" },
        { bg: "bg-red-50", text: "text-red-600" },
    ]
    return { icon: icons[index % 5], color: colors[index % 5] }
}

export function ProvasContent() {
    const [provas, setProvas] = useState<ProvaCompleta[]>([])
    const [busca, setBusca] = useState("")
    const [statusFilter, setStatusFilter] = useState<StatusProva | "">("")
    const [orderBy, setOrderBy] = useState<OrderByOption>("updatedAt_desc")
    const [isLoading, setIsLoading] = useState(true)
    const [isDuplicating, setIsDuplicating] = useState(false)
    const [openMenuId, setOpenMenuId] = useState<number | null>(null)
    const [provaToDelete, setProvaToDelete] = useState<ProvaCompleta | null>(null)
    const router = useRouter()

    const loadData = useCallback(async () => {
        setIsLoading(true)
        const data = await getAllProvas(busca, statusFilter || undefined, orderBy)
        setProvas(data)
        setIsLoading(false)
    }, [busca, statusFilter, orderBy])

    useEffect(() => {
        loadData()
    }, [loadData])

    const handleDelete = async () => {
        if (provaToDelete) {
            await deleteProva(provaToDelete.id)
            setProvaToDelete(null)
            loadData()
        }
    }

    const handleDuplicate = async (id: number) => {
        setIsDuplicating(true)
        try {
            await duplicateProva(id)
            setOpenMenuId(null)
            loadData()
        } catch (error) {
            console.error("Erro ao duplicar prova:", error)
            alert("Erro ao duplicar prova")
        } finally {
            setIsDuplicating(false)
        }
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
                        <span className="text-text-muted">Processo Seletivo</span>
                        <span className="text-text-muted">/</span>
                        <span className="text-text-main font-semibold">Provas</span>
                    </div>

                    {/* Title & Primary Action */}
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div className="flex flex-col gap-1 max-w-2xl">
                            <h2 className="text-text-main text-3xl font-bold tracking-tight">Gestão de Provas</h2>
                            <p className="text-text-muted">Gerencie suas avaliações existentes ou crie novas provas para os candidatos.</p>
                        </div>
                        <Link href="/coord/processo-seletivo/provas/nova">
                            <Button icon={<Plus size={20} />}>
                                Criar nova prova
                            </Button>
                        </Link>
                    </div>

                    {/* Filters & Toolbar */}
                    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mt-2">
                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                            <input
                                type="text"
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                                placeholder="Buscar por nome ou descrição..."
                                className="w-full h-11 pl-10 pr-4 rounded-lg bg-white border border-border text-text-main placeholder:text-text-muted focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="flex items-center gap-3">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as StatusProva | "")}
                                className="h-11 px-4 bg-white border border-border rounded-lg text-text-main focus:ring-2 focus:ring-primary focus:border-transparent outline-none cursor-pointer"
                            >
                                <option value="">Todos os status</option>
                                <option value="RASCUNHO">Rascunho</option>
                                <option value="PUBLICADA">Publicada</option>
                                <option value="ENCERRADA">Encerrada</option>
                            </select>
                        </div>

                        {/* Sort Order */}
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <ArrowUpDown size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                <select
                                    value={orderBy}
                                    onChange={(e) => setOrderBy(e.target.value as OrderByOption)}
                                    className="h-11 pl-10 pr-4 bg-white border border-border rounded-lg text-text-main focus:ring-2 focus:ring-primary focus:border-transparent outline-none cursor-pointer appearance-none min-w-[180px]"
                                >
                                    <option value="updatedAt_desc">Mais recentes</option>
                                    <option value="updatedAt_asc">Mais antigas</option>
                                    <option value="titulo_asc">Nome (A-Z)</option>
                                    <option value="titulo_desc">Nome (Z-A)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-8 pb-8 pt-6">
                <div className="max-w-[1400px] mx-auto w-full">
                    {isLoading ? (
                        <div className="py-12 text-center text-gray-500">Carregando...</div>
                    ) : provas.length === 0 ? (
                        <div className="py-12 text-center text-gray-500">
                            {busca || statusFilter ? "Nenhuma prova encontrada" : "Nenhuma prova cadastrada"}
                        </div>
                    ) : (
                        <>
                            {/* Grid of Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {provas.map((prova, index) => {
                                    const { icon, color } = getIconForProva(index)
                                    return (
                                        <article
                                            key={prova.id}
                                            className="group relative flex flex-col bg-white rounded-xl border border-border shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-300"
                                        >
                                            <div className="p-5 flex flex-col gap-4 flex-1">
                                                {/* Card Header */}
                                                <div className="flex justify-between items-start">
                                                    <div className={`w-10 h-10 rounded-lg ${color.bg} flex items-center justify-center ${color.text}`}>
                                                        <FileText size={20} />
                                                    </div>
                                                    <div className="relative">
                                                        <button
                                                            onClick={() => setOpenMenuId(openMenuId === prova.id ? null : prova.id)}
                                                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-text-muted transition-colors cursor-pointer"
                                                        >
                                                            <MoreVertical size={20} />
                                                        </button>

                                                        {openMenuId === prova.id && (
                                                            <>
                                                                <div
                                                                    className="fixed inset-0 z-10"
                                                                    onClick={() => setOpenMenuId(null)}
                                                                />
                                                                <div className="absolute right-0 top-8 z-20 bg-white rounded-lg shadow-lg border border-border py-1 min-w-[160px]">
                                                                    <Link
                                                                        href={`/coord/processo-seletivo/provas/${prova.id}`}
                                                                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-text-main hover:bg-gray-50"
                                                                    >
                                                                        <Edit size={16} />
                                                                        Editar
                                                                    </Link>
                                                                    {prova.status !== "RASCUNHO" && (
                                                                        <Link
                                                                            href={`/coord/processo-seletivo/provas/${prova.id}/resultados`}
                                                                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-text-main hover:bg-gray-50"
                                                                        >
                                                                            <BarChart3 size={16} />
                                                                            Ver Resultados
                                                                        </Link>
                                                                    )}

                                                                    <button
                                                                        onClick={() => handleDuplicate(prova.id)}
                                                                        disabled={isDuplicating}
                                                                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-text-main hover:bg-gray-50 cursor-pointer disabled:opacity-50"
                                                                    >
                                                                        <Copy size={16} />
                                                                        Duplicar
                                                                    </button>
                                                                    <div className="h-px bg-border my-1"></div>
                                                                    <button
                                                                        onClick={() => {
                                                                            setProvaToDelete(prova)
                                                                            setOpenMenuId(null)
                                                                        }}
                                                                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                        Excluir
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                <Link href={`/coord/processo-seletivo/provas/${prova.id}`} className="flex flex-col gap-1">
                                                    <h3 className="text-lg font-bold text-text-main group-hover:text-primary transition-colors line-clamp-2">
                                                        {prova.titulo}
                                                    </h3>
                                                    {prova.descricao && (
                                                        <p className="text-sm text-text-muted line-clamp-2">{prova.descricao}</p>
                                                    )}
                                                </Link>

                                                {/* Stats */}
                                                <div className="flex items-center gap-4 py-2">
                                                    <div className="flex items-center gap-1.5 text-text-main">
                                                        <ListChecks size={16} className="text-text-muted" />
                                                        <span className="text-xs font-medium">{prova._count.questoes} Questões</span>
                                                    </div>
                                                    {prova.tempoLimite && (
                                                        <div className="flex items-center gap-1.5 text-text-main">
                                                            <Clock size={16} className="text-text-muted" />
                                                            <span className="text-xs font-medium">{prova.tempoLimite} min</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Footer */}
                                            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 rounded-b-xl flex items-center justify-between">
                                                {getStatusBadge(prova.status)}
                                                <span className="text-xs text-text-muted">{formatDate(prova.updatedAt)}</span>
                                            </div>
                                        </article>
                                    )
                                })}

                                {/* Create New Placeholder */}
                                <Link
                                    href="/coord/processo-seletivo/provas/nova"
                                    className="group relative flex flex-col items-center justify-center min-h-[220px] bg-transparent rounded-xl border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary/5 transition-all duration-300"
                                >
                                    <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-primary group-hover:text-text-main text-gray-400 flex items-center justify-center transition-colors mb-3">
                                        <Plus size={24} />
                                    </div>
                                    <span className="text-sm font-bold text-text-main">Criar Nova Prova</span>
                                    <span className="text-xs text-text-muted mt-1">Clique para começar</span>
                                </Link>
                            </div>

                            {/* Pagination Info */}
                            <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
                                <p className="text-sm text-text-muted">
                                    Mostrando <span className="font-bold text-text-main">{provas.length}</span> provas
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Delete Modal */}
            <DeleteProvaModal
                isOpen={!!provaToDelete}
                onClose={() => setProvaToDelete(null)}
                onConfirm={handleDelete}
                provaTitulo={provaToDelete?.titulo || ""}
            />
        </div>
    )
}
