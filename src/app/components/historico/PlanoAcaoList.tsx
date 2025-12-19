"use client"

import { useState } from "react"
import { Card } from "../Card"
import { togglePlanoAcao, PlanoAcaoHistorico } from "@/src/actions/historicoActions"

interface PlanoAcaoItemProps {
    plano: PlanoAcaoHistorico
    onToggle: (id: number, concluido: boolean) => void
}

function PlanoAcaoItem({ plano, onToggle }: PlanoAcaoItemProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [concluido, setConcluido] = useState(plano.concluido)

    const handleToggle = async () => {
        setIsLoading(true)
        const novoConcluido = !concluido
        const result = await togglePlanoAcao(plano.id, novoConcluido)
        if (result.success) {
            setConcluido(novoConcluido)
            onToggle(plano.id, novoConcluido)
        }
        setIsLoading(false)
    }

    return (
        <div
            className={`
                group bg-bg-card rounded-lg border border-border p-4 
                flex items-start gap-4 transition-all
                ${concluido ? "opacity-70" : "hover:shadow-md"}
            `}
        >
            {/* Checkbox */}
            <button
                onClick={handleToggle}
                disabled={isLoading}
                className={`
                    mt-0.5 flex items-center justify-center w-5 h-5 rounded border-2 
                    transition-all cursor-pointer shrink-0
                    ${concluido
                        ? "bg-primary border-primary text-white"
                        : "border-gray-300 bg-white hover:border-primary"
                    }
                    ${isLoading ? "opacity-50" : ""}
                `}
            >
                {concluido && (
                    <span className="material-symbols-outlined text-[16px]">check</span>
                )}
            </button>

            {/* Conteúdo */}
            <div className="flex-1 min-w-0">
                <p
                    className={`
                        text-sm font-medium leading-relaxed
                        ${concluido ? "line-through text-gray-400" : "text-text-main"}
                    `}
                >
                    {plano.descricao}
                </p>
            </div>

            {/* Data */}
            <div className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
                <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                <span>{plano.dataRecebido}</span>
            </div>
        </div>
    )
}

interface PlanoAcaoListProps {
    planos: PlanoAcaoHistorico[]
}

type FiltroStatus = "todos" | "pendente" | "concluido"

export function PlanoAcaoList({ planos: planosIniciais }: PlanoAcaoListProps) {
    const [planos, setPlanos] = useState(planosIniciais)
    const [filtro, setFiltro] = useState<FiltroStatus>("pendente")
    const [busca, setBusca] = useState("")

    const handleToggle = (id: number, concluido: boolean) => {
        setPlanos((prev) =>
            prev.map((p) => (p.id === id ? { ...p, concluido } : p))
        )
    }

    // Filtrar planos
    const planosFiltrados = planos.filter((plano) => {
        // Filtro de status
        if (filtro === "pendente" && plano.concluido) return false
        if (filtro === "concluido" && !plano.concluido) return false

        // Filtro de busca
        if (busca && !plano.descricao.toLowerCase().includes(busca.toLowerCase())) {
            return false
        }

        return true
    })

    return (
        <div className="flex flex-col gap-5">
            {/* Header */}
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-text-main">Planos de Ação Recebidos</h2>
                    <p className="text-text-muted text-sm mt-1">
                        Acompanhe suas tarefas pendentes e concluídas
                    </p>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Search */}
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">
                            search
                        </span>
                        <input
                            type="text"
                            placeholder="Buscar plano..."
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary w-64 bg-bg-card"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="flex bg-bg-card border border-border rounded-lg p-1 shadow-sm">
                        <button
                            onClick={() => setFiltro("pendente")}
                            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                                filtro === "pendente"
                                    ? "bg-secondary/30 text-text-main font-bold"
                                    : "text-gray-500 hover:bg-gray-50"
                            }`}
                        >
                            Pendentes
                        </button>
                        <button
                            onClick={() => setFiltro("concluido")}
                            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                                filtro === "concluido"
                                    ? "bg-secondary/30 text-text-main font-bold"
                                    : "text-gray-500 hover:bg-gray-50"
                            }`}
                        >
                            Concluídos
                        </button>
                        <button
                            onClick={() => setFiltro("todos")}
                            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                                filtro === "todos"
                                    ? "bg-secondary/30 text-text-main font-bold"
                                    : "text-gray-500 hover:bg-gray-50"
                            }`}
                        >
                            Todos
                        </button>
                    </div>
                </div>
            </div>

            {/* Lista */}
            <div className="flex flex-col gap-3">
                {planosFiltrados.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center py-12 text-center">
                        <span className="material-symbols-outlined text-5xl text-gray-300 mb-3">
                            {busca ? "search_off" : "task_alt"}
                        </span>
                        <h3 className="text-base font-semibold text-text-main mb-1">
                            {busca
                                ? "Nenhum plano encontrado"
                                : filtro === "pendente"
                                ? "Nenhum plano pendente"
                                : filtro === "concluido"
                                ? "Nenhum plano concluído"
                                : "Nenhum plano de ação ainda"}
                        </h3>
                        <p className="text-text-muted text-sm max-w-sm">
                            {busca
                                ? "Tente buscar por outro termo"
                                : "Os planos de ação que você receber aparecerão aqui"}
                        </p>
                    </Card>
                ) : (
                    planosFiltrados.map((plano) => (
                        <PlanoAcaoItem key={plano.id} plano={plano} onToggle={handleToggle} />
                    ))
                )}
            </div>
        </div>
    )
}
