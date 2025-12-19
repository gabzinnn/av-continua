"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { Search, Plus, Edit, UserX, UserCheck, MoreVertical } from "lucide-react"
import { Button } from "@/src/app/components/Button"
import { AddMembroModal } from "./AddMembroModal"
import { EditMembroModal } from "./EditMembroModal"
import { ToggleStatusModal } from "./ToggleStatusModal"
import { getAllMembros, getAllAreas, MembroCompleto, AreaOption } from "@/src/actions/membrosActions"
import coresAreas from "@/src/utils/coresAreas"
import dynamic from "next/dynamic"
import { TableColumn } from "react-data-table-component"

const DataTable = dynamic(() => import("react-data-table-component"), { ssr: false })

function getInitials(nome: string): string {
    const parts = nome.split(" ")
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return nome.substring(0, 2).toUpperCase()
}

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

export function MembrosContent() {
    const [membros, setMembros] = useState<MembroCompleto[]>([])
    const [areas, setAreas] = useState<AreaOption[]>([])
    const [busca, setBusca] = useState("")
    const [isLoading, setIsLoading] = useState(true)

    // Modals
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showToggleModal, setShowToggleModal] = useState(false)
    const [selectedMembro, setSelectedMembro] = useState<MembroCompleto | null>(null)

    // Dropdown menu
    const [openMenuId, setOpenMenuId] = useState<number | null>(null)

    const loadData = useCallback(async () => {
        setIsLoading(true)
        const [membrosData, areasData] = await Promise.all([
            getAllMembros(busca),
            getAllAreas(),
        ])
        setMembros(membrosData)
        setAreas(areasData)
        setIsLoading(false)
    }, [busca])

    useEffect(() => {
        loadData()
    }, [loadData])

    const handleEdit = (membro: MembroCompleto) => {
        setSelectedMembro(membro)
        setShowEditModal(true)
        setOpenMenuId(null)
    }

    const handleToggleStatus = (membro: MembroCompleto) => {
        setSelectedMembro(membro)
        setShowToggleModal(true)
        setOpenMenuId(null)
    }

    const columns: TableColumn<MembroCompleto>[] = [
        {
            name: "",
            cell: (row) => (
                <div className="py-2">
                    {row.fotoUrl ? (
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 shadow-sm">
                            <Image
                                src={row.fotoUrl}
                                alt={row.nome}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-secondary/40 flex items-center justify-center text-sm font-bold text-text-main border border-gray-200 shadow-sm">
                            {getInitials(row.nome)}
                        </div>
                    )}
                </div>
            ),
            width: "80px",
        },
        {
            name: "Nome",
            cell: (row) => (
                <div className="flex flex-col py-2 whitespace-nowrap">
                    <span className="text-sm font-semibold text-text-main">{row.nome}</span>
                    {row.isCoordenador && (
                        <span className="text-xs text-primary font-medium">Coordenador</span>
                    )}
                </div>
            ),
            sortable: true,
            selector: (row) => row.nome,
            minWidth: "180px",
        },
        {
            name: "DRE",
            selector: (row) => row.dre,
            sortable: true,
            cell: (row) => <span className="text-sm text-gray-600 whitespace-nowrap">{row.dre}</span>,
            minWidth: "120px",
        },
        {
            name: "Período",
            selector: (row) => row.periodo,
            sortable: true,
            cell: (row) => <span className="text-sm text-gray-600 whitespace-nowrap">{row.periodo}</span>,
            minWidth: "120px",
        },
        {
            name: "Área",
            selector: (row) => row.area.nome,
            sortable: true,
            cell: (row) => (
                <span 
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-text-main whitespace-nowrap"
                    style={{ backgroundColor: coresAreas(row.area.nome) }}
                >
                    {row.area.nome}
                </span>
            ),
            minWidth: "200px",
        },
        {
            name: "Status",
            cell: (row) => (
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap border ${
                    row.isAtivo 
                        ? "bg-green-100 text-green-800 border-green-200" 
                        : "bg-red-100 text-red-800 border-red-200"
                }`}>
                    {row.isAtivo ? "Ativo" : "Inativo"}
                </span>
            ),
            sortable: true,
            selector: (row) => row.isAtivo ? "Ativo" : "Inativo",
            minWidth: "100px",
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
                                    onClick={() => handleToggleStatus(row)}
                                    className={`flex items-center gap-2 w-full px-4 py-2 text-sm cursor-pointer ${
                                        row.isAtivo 
                                            ? "text-red-600 hover:bg-red-50" 
                                            : "text-green-600 hover:bg-green-50"
                                    }`}
                                >
                                    {row.isAtivo ? <UserX size={16} /> : <UserCheck size={16} />}
                                    {row.isAtivo ? "Desativar" : "Reativar"}
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
                        <span className="text-text-main font-semibold">Membros</span>
                    </div>

                    {/* Title */}
                    <div className="flex flex-col gap-1">
                        <h2 className="text-text-main text-3xl font-bold tracking-tight">Gestão de Membros</h2>
                        <p className="text-text-muted">Gerencie os membros do clube, suas áreas e status.</p>
                    </div>

                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-2">
                        {/* Search */}
                        <div className="w-full md:w-96">
                            <div className="relative group">
                                <Search 
                                    size={20} 
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" 
                                />
                                <input
                                    type="text"
                                    value={busca}
                                    onChange={(e) => setBusca(e.target.value)}
                                    placeholder="Pesquisar por nome ou DRE"
                                    className="w-full h-11 pl-12 pr-4 bg-bg-card border-none ring-1 ring-border rounded-lg text-text-main placeholder:text-text-muted focus:ring-2 focus:ring-primary focus:outline-none shadow-sm transition-all"
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <Button
                                onClick={() => setShowAddModal(true)}
                                icon={<Plus size={20} />}
                                className="whitespace-nowrap"
                            >
                                Criar membro
                            </Button>
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
                            data={membros}
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
                                    {busca ? "Nenhum membro encontrado" : "Nenhum membro cadastrado"}
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
            <AddMembroModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={loadData}
                areas={areas}
            />

            <EditMembroModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSuccess={loadData}
                areas={areas}
                membro={selectedMembro}
            />

            <ToggleStatusModal
                isOpen={showToggleModal}
                onClose={() => setShowToggleModal(false)}
                onSuccess={loadData}
                membro={selectedMembro}
            />
        </div>
    )
}
