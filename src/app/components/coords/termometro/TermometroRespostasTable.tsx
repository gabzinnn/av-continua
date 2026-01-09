"use client"

import dynamic from "next/dynamic"
import { TableColumn } from "react-data-table-component"
import Image from "next/image"
import { TermometroDetalhes, RespostaMembro } from "@/src/actions/termometroActions"

const DataTable = dynamic(() => import("react-data-table-component"), { ssr: false })

interface TermometroRespostasTableProps {
    data: TermometroDetalhes
    limit?: number
}

function getInitials(nome: string): string {
    const parts = nome.split(" ")
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return nome.substring(0, 2).toUpperCase()
}

function getNotaColor(nota: number): string {
    if (nota >= 5) return "bg-[#e3ffc2] text-gray-800"
    if (nota >= 4) return "bg-[#f8ffc2] text-gray-800"
    if (nota >= 3) return "bg-[#fffbc2] text-gray-800"
    if (nota >= 2) return "bg-[#ffebc2] text-gray-800"
    return "bg-[#ffd6c2] text-gray-800"
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
}

export function TermometroRespostasTable({ data, limit }: TermometroRespostasTableProps) {
    const respostas = limit ? data.respostasPorMembro.slice(0, limit) : data.respostasPorMembro

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
                    <span className="text-text-main text-sm font-medium">{row.membroNome}</span>
                </div>
            ),
            width: "200px",
        },
        ...data.perguntas.map((_, index): TableColumn<RespostaMembro> => ({
            name: `Q${index + 1}`,
            cell: (row) => (
                <div className={`rounded py-1 px-2 text-sm ${getNotaColor(row.notas[index] || 0)}`}>
                    {row.notas[index]?.toFixed(1) || "-"}
                </div>
            ),
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

    // Footer row with averages
    const footerData: RespostaMembro = {
        membroId: -1,
        membroNome: "Total / Média da Equipe",
        membroFoto: null,
        membroArea: "",
        notas: data.mediaPorPergunta,
        total: data.mediaPorPergunta.reduce((a, b) => a + b, 0),
        media: data.mediaGeral,
    }

    return (
        <div className="bg-bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <DataTable
                columns={columns as TableColumn<unknown>[]}
                data={respostas}
                customStyles={customStyles}
                responsive={false}
                noDataComponent={
                    <div className="py-12 text-center text-gray-500">
                        Nenhuma resposta encontrada
                    </div>
                }
            />
        </div>
    )
}
