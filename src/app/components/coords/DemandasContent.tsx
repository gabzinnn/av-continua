"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { Search, Plus, Edit, Trash2, Users, MoreVertical, CheckCircle, Circle } from "lucide-react"
import { Button } from "@/src/app/components/Button"
import { AddDemandaModal } from "./AddDemandaModal"
import { EditDemandaModal } from "./EditDemandaModal"
import { DeleteDemandaModal } from "./DeleteDemandaModal"
import { AlocarMembrosModal } from "./AlocarMembrosModal"
import { 
    getAllDemandas, 
    getMembrosParaAlocacao, 
    DemandaCompleta, 
    MembroParaAlocacao 
} from "@/src/actions/demandasActions"
import { getAllAreas, AreaOption } from "@/src/actions/membrosActions"
import { getCiclos, Ciclo } from "@/src/actions/cicloActions"
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

export function DemandasContent() {
    const [demandas, setDemandas] = useState<DemandaCompleta[]>([])
    const [areas, setAreas] = useState<AreaOption[]>([])
    const [membros, setMembros] = useState<MembroParaAlocacao[]>([])
    const [ciclos, setCiclos] = useState<Ciclo[]>([])
    const [busca, setBusca] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [showFinalizadas, setShowFinalizadas] = useState(false)

    // Modals
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showAlocarModal, setShowAlocarModal] = useState(false)
    const [selectedDemanda, setSelectedDemanda] = useState<DemandaCompleta | null>(null)

    // Dropdown menu
    const [openMenuId, setOpenMenuId] = useState<number | null>(null)

    const loadData = useCallback(async () => {
        setIsLoading(true)
        const [demandasData, areasData, membrosData, ciclosData] = await Promise.all([
            getAllDemandas(busca),
            getAllAreas(),
            getMembrosParaAlocacao(),
            getCiclos(),
        ])
        setDemandas(demandasData)
        setAreas(areasData)
        setMembros(membrosData)
        setCiclos(ciclosData)
        
        // Update selectedDemanda with fresh data if it exists
        setSelectedDemanda(prev => {
            if (prev) {
                const updated = demandasData.find(d => d.id === prev.id)
                return updated || null
            }
            return prev
        })
        
        setIsLoading(false)
    }, [busca])

    useEffect(() => {
        loadData()
    }, [loadData])

    const handleEdit = (demanda: DemandaCompleta) => {
        setSelectedDemanda(demanda)
        setShowEditModal(true)
        setOpenMenuId(null)
    }

    const handleDelete = (demanda: DemandaCompleta) => {
        setSelectedDemanda(demanda)
        setShowDeleteModal(true)
        setOpenMenuId(null)
    }

    const handleAlocar = (demanda: DemandaCompleta) => {
        setSelectedDemanda(demanda)
        setShowAlocarModal(true)
        setOpenMenuId(null)
    }

    const demandasFiltradas = demandas.filter(d => showFinalizadas || !d.finalizada)

    const columns: TableColumn<DemandaCompleta>[] = [
        {
            name: "Status",
            cell: (row) => (
                <div className="py-2">
                    {row.finalizada ? (
                        <CheckCircle size={22} className="text-green-600" />
                    ) : (
                        <Circle size={22} className="text-gray-400" />
                    )}
                </div>
            ),
            width: "120px",
        },
        {
            name: "Nome",
            cell: (row) => (
                <div className="flex flex-col py-2 whitespace-nowrap">
                    <span className="text-sm font-semibold text-text-main">{row.nome}</span>
                    {row.descricao && (
                        <span className="text-xs text-gray-500 truncate max-w-[250px]">{row.descricao}</span>
                    )}
                </div>
            ),
            sortable: true,
            selector: (row) => row.nome,
            minWidth: "250px",
        },
        {
            name: "Área",
            selector: (row) => row.area?.nome || "",
            sortable: true,
            cell: (row) => row.area ? (
                <div className="flex flex-col gap-1">
                    <span 
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-text-main whitespace-nowrap"
                        style={{ backgroundColor: coresAreas(row.area.nome) }}
                    >
                        {row.area.nome}
                    </span>
                    {row.subarea && (
                        <span className="text-xs text-gray-500">{row.subarea.nome}</span>
                    )}
                </div>
            ) : (
                <span className="text-gray-400 text-sm">—</span>
            ),
            minWidth: "180px",
        },
        {
            name: "Membros",
            cell: (row) => (
                <div className="flex items-center">
                    {row.alocacoes.length === 0 ? (
                        <span className="text-gray-400 text-sm">Nenhum</span>
                    ) : (
                        <div className="flex items-center -space-x-2">
                            {row.alocacoes.slice(0, 4).map((alocacao) => (
                                <div 
                                    key={alocacao.id} 
                                    className="relative"
                                    title={`${alocacao.membro.nome}${alocacao.isLider ? " (Líder)" : ""}`}
                                >
                                    {alocacao.membro.fotoUrl ? (
                                        <div className={`w-8 h-8 rounded-full overflow-hidden border-2 ${alocacao.isLider ? "border-primary" : "border-white"}`}>
                                            <Image
                                                src={alocacao.membro.fotoUrl}
                                                alt={alocacao.membro.nome}
                                                width={32}
                                                height={32}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className={`w-8 h-8 rounded-full bg-secondary/40 flex items-center justify-center text-xs font-bold text-text-main border-2 ${alocacao.isLider ? "border-primary" : "border-white"}`}>
                                            {getInitials(alocacao.membro.nome)}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {row.alocacoes.length > 4 && (
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 border-2 border-white">
                                    +{row.alocacoes.length - 4}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ),
            minWidth: "150px",
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
                            <div className="absolute right-0 top-8 z-20 bg-white rounded-lg shadow-lg border border-border py-1 min-w-[160px]">
                                <button
                                    onClick={() => handleAlocar(row)}
                                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-text-main hover:bg-gray-50 cursor-pointer"
                                >
                                    <Users size={16} />
                                    Alocar Membros
                                </button>
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
                        <span className="text-text-main font-semibold">Demandas</span>
                    </div>

                    {/* Title */}
                    <div className="flex flex-col gap-1">
                        <h2 className="text-text-main text-3xl font-bold tracking-tight">Gestão de Demandas</h2>
                        <p className="text-text-muted">Gerencie as demandas do clube e suas alocações de membros.</p>
                    </div>

                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-2">
                        {/* Search + Filter */}
                        <div className="flex items-center gap-4 w-full md:w-auto">
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
                                        placeholder="Pesquisar demandas..."
                                        className="w-full h-11 pl-12 pr-4 bg-bg-card border-none ring-1 ring-border rounded-lg text-text-main placeholder:text-text-muted focus:ring-2 focus:ring-primary focus:outline-none shadow-sm transition-all"
                                    />
                                </div>
                            </div>
                            
                            <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
                                <input
                                    type="checkbox"
                                    checked={showFinalizadas}
                                    onChange={(e) => setShowFinalizadas(e.target.checked)}
                                    className="w-4 h-4 rounded border-border cursor-pointer"
                                />
                                <span className="text-sm text-text-main">Mostrar finalizadas</span>
                            </label>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <Button
                                onClick={() => setShowAddModal(true)}
                                icon={<Plus size={20} />}
                                className="whitespace-nowrap"
                            >
                                Criar demanda
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
                            data={demandasFiltradas}
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
                                    {busca ? "Nenhuma demanda encontrada" : "Nenhuma demanda cadastrada"}
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
            <AddDemandaModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={loadData}
                areas={areas}
                ciclos={ciclos}
            />

            <EditDemandaModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSuccess={loadData}
                areas={areas}
                ciclos={ciclos}
                demanda={selectedDemanda}
            />

            <DeleteDemandaModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onSuccess={loadData}
                demanda={selectedDemanda}
            />

            <AlocarMembrosModal
                isOpen={showAlocarModal}
                onClose={() => setShowAlocarModal(false)}
                onSuccess={loadData}
                demanda={selectedDemanda}
                membrosDisponiveis={membros}
            />
        </div>
    )
}

