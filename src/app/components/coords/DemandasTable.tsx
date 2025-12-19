"use client"

import { useState } from "react"
import { DemandaResumo } from "@/src/actions/coordsHomeActions"
import { Search } from "lucide-react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { TableColumn } from "react-data-table-component"
import coresAreas from "@/src/utils/coresAreas"

const DataTable = dynamic(() => import("react-data-table-component"), { ssr: false })

interface DemandasTableProps {
    demandas: DemandaResumo[]
    total: number
}

const columns: TableColumn<DemandaResumo>[] = [
    {
        name: "Nome",
        selector: (row) => row.nome,
        sortable: true,
        cell: (row) => (
            <span className="text-text-main text-sm font-medium whitespace-nowrap">{row.nome}</span>
        ),
        minWidth: "150px",
    },
    {
        name: "Descrição",
        selector: (row) => row.descricao,
        sortable: true,
        cell: (row) => (
            <p className="text-gray-600 text-sm whitespace-nowrap">
                {row.descricao || "—"}
            </p>
        ),
        minWidth: "250px",
    },
    {
        name: "Área",
        selector: (row) => row.area,
        sortable: true,
        cell: (row) => (
            <span 
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-text-main whitespace-nowrap"
                style={{ backgroundColor: coresAreas(row.area) }}
            >
                {row.area}
            </span>
        ),
        minWidth: "180px",
    },
]

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

export function DemandasTable({ demandas: demandasIniciais, total }: DemandasTableProps) {
    const [busca, setBusca] = useState("")

    const demandasFiltradas = demandasIniciais.filter((d) =>
        d.nome.toLowerCase().includes(busca.toLowerCase()) ||
        d.descricao.toLowerCase().includes(busca.toLowerCase()) ||
        d.area.toLowerCase().includes(busca.toLowerCase())
    ).sort((a, b) => a.area.localeCompare(b.area))

    return (
        <section className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h3 className="text-xl font-bold text-text-main">Demandas Atuais</h3>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search 
                            size={18} 
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" 
                        />
                        <input
                            type="text"
                            placeholder="Buscar demanda..."
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            className="bg-bg-card border border-border rounded-lg pl-10 pr-4 py-1.5 text-sm focus:outline-none focus:border-primary w-48 md:w-64 placeholder-text-muted/60"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-bg-card rounded-xl border border-border shadow-sm overflow-x-auto">
                <DataTable
                    columns={columns as TableColumn<unknown>[]}
                    data={demandasFiltradas}
                    pagination
                    paginationPerPage={5}
                    paginationRowsPerPageOptions={[5]}
                    customStyles={customStyles}
                    responsive={false}
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
                
                <div className="px-6 py-3 border-t border-border bg-[#fcfbf8] flex items-center justify-end">
                    <Link 
                        href="/coords/demandas"
                        className="text-xs font-medium text-text-muted hover:text-text-main transition-colors"
                    >
                        Ver todas →
                    </Link>
                </div>
            </div>
        </section>
    )
}
