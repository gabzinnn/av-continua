"use client"

import { MembroResumo } from "@/src/actions/coordsHomeActions"
import Image from "next/image"
import Link from "next/link"
import dynamic from "next/dynamic"
import { TableColumn } from "react-data-table-component"

const DataTable = dynamic(() => import("react-data-table-component"), { ssr: false })

interface MembrosTableProps {
    membrosIniciais: MembroResumo[]
    total: number
}

function getInitials(nome: string): string {
    const parts = nome.split(" ")
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return nome.substring(0, 2).toUpperCase()
}

const columns: TableColumn<MembroResumo>[] = [
    {
        name: "Nome",
        cell: (row) => (
            <div className="flex items-center gap-3 py-3 whitespace-nowrap">
                {row.fotoUrl ? (
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                        <Image
                            src={row.fotoUrl}
                            alt={row.nome}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                        />
                    </div>
                ) : (
                    <div className="w-8 h-8 rounded-full bg-secondary/40 flex items-center justify-center text-xs font-bold text-text-main flex-shrink-0">
                        {getInitials(row.nome)}
                    </div>
                )}
                <span className="text-text-main text-sm font-medium">{row.nome}</span>
            </div>
        ),
        sortable: true,
        selector: (row) => row.nome,
        minWidth: "180px",
    },
    {
        name: "Área",
        selector: (row) => row.area,
        sortable: true,
        cell: (row) => (
            <span className="text-gray-600 text-sm whitespace-nowrap">{row.area}</span>
        ),
        minWidth: "200px",
    },
    {
        name: "DRE",
        selector: (row) => row.dre,
        sortable: true,
        cell: (row) => (
            <span className="text-gray-600 text-sm whitespace-nowrap">{row.dre}</span>
        ),
        minWidth: "100px",
    },
    {
        name: "Status",
        cell: (row) => (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                row.isAtivo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
            }`}>
                {row.isAtivo ? "Ativo" : "Inativo"}
            </span>
        ),
        sortable: true,
        selector: (row) => row.isAtivo ? "Ativo" : "Inativo",
        minWidth: "100px",
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

export function MembrosTable({ membrosIniciais, total }: MembrosTableProps) {
    return (
        <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-text-main">Membros Atuais</h3>
                <Link 
                    href="/coord/membros" 
                    className="text-sm font-bold text-text-muted hover:text-text-main transition-colors"
                >
                    Ver todos
                </Link>
            </div>

            <div className="bg-bg-card rounded-xl border border-border shadow-sm overflow-x-auto">
                <DataTable
                    columns={columns as TableColumn<unknown>[]}
                    data={membrosIniciais}
                    pagination
                    paginationPerPage={5}
                    paginationRowsPerPageOptions={[5]}
                    customStyles={customStyles}
                    responsive={false}
                    noDataComponent={
                        <div className="py-12 text-center text-gray-500">
                            Nenhum membro encontrado
                        </div>
                    }
                    paginationComponentOptions={{
                        rowsPerPageText: "Por página:",
                        rangeSeparatorText: "de",
                    }}
                />
            </div>
        </section>
    )
}
