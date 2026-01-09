"use client"

import { useState } from "react"
import { X, Search } from "lucide-react"
import dynamic from "next/dynamic"
import { TableColumn } from "react-data-table-component"
import Image from "next/image"
import { TermometroDetalhes, RespostaMembro } from "@/src/actions/termometroActions"

const DataTable = dynamic(() => import("react-data-table-component"), { ssr: false })

interface VerTudoModalProps {
    isOpen: boolean
    onClose: () => void
    data: TermometroDetalhes
}

function getInitials(nome: string): string {
    const parts = nome.split(" ")
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return nome.substring(0, 2).toUpperCase()
}

function getNotaColor(nota: number): string {
    if (nota >= 4.5) return "bg-primary/70 text-text-main font-medium"
    if (nota >= 3.5) return "bg-primary/30 text-gray-700"
    if (nota >= 2.5) return "bg-gray-100 text-gray-500"
    return "bg-gray-100 text-gray-400"
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
            paddingLeft: "1rem",
            paddingRight: "1rem",
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
            paddingLeft: "1rem",
            paddingRight: "1rem",
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

export function VerTudoModal({ isOpen, onClose, data }: VerTudoModalProps) {
    const [searchText, setSearchText] = useState("")

    const filteredData = data.respostasPorMembro.filter(r =>
        r.membroNome.toLowerCase().includes(searchText.toLowerCase()) ||
        r.membroArea.toLowerCase().includes(searchText.toLowerCase())
    )

    const columns: TableColumn<RespostaMembro>[] = [
        {
            name: "Membro",
            cell: (row) => (
                <div className="flex items-center gap-3 py-2 whitespace-nowrap">
                    {row.membroFoto ? (
                        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                            <Image
                                src={row.membroFoto}
                                alt={row.membroNome}
                                width={32}
                                height={32}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-secondary/40 flex items-center justify-center text-xs font-bold text-text-main shrink-0">
                            {getInitials(row.membroNome)}
                        </div>
                    )}
                    <div>
                        <div className="text-text-main text-sm font-medium">{row.membroNome}</div>
                        <div className="text-gray-500 text-xs">{row.membroArea}</div>
                    </div>
                </div>
            ),
            sortable: true,
            selector: (row) => row.membroNome,
            width: "220px",
        },
        ...data.perguntas.map((_, index): TableColumn<RespostaMembro> => ({
            name: `Q${index + 1}`,
            cell: (row) => (
                <div className={`rounded py-1 px-2 text-sm ${getNotaColor(row.notas[index] || 0)}`}>
                    {row.notas[index]?.toFixed(1) || "-"}
                </div>
            ),
            sortable: true,
            selector: (row) => row.notas[index] || 0,
            width: "70px",
        })),
        {
            name: "Total",
            selector: (row) => row.total,
            sortable: true,
            right: true,
            cell: (row) => (
                <span className="font-medium text-text-main">{row.total.toFixed(1)}</span>
            ),
            width: "80px",
        },
        {
            name: "Média",
            selector: (row) => row.media,
            sortable: true,
            right: true,
            cell: (row) => (
                <span className="font-bold text-text-main">{row.media.toFixed(1)}</span>
            ),
            width: "80px",
        },
    ]

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-bg-card rounded-xl shadow-xl w-full max-w-5xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-bold text-text-main">Todas as Respostas - {data.nome}</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-4 border-b border-border">
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou área..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg bg-bg-main focus:outline-none focus:border-primary"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    <DataTable
                        columns={columns as TableColumn<unknown>[]}
                        data={filteredData}
                        pagination
                        paginationPerPage={10}
                        paginationRowsPerPageOptions={[10, 20, 50]}
                        customStyles={customStyles}
                        responsive={false}
                        noDataComponent={
                            <div className="py-12 text-center text-gray-500">
                                Nenhuma resposta encontrada
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
