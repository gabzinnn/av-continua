"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Download, Users, BarChart3, Trophy, TrendingDown, CheckCircle, Search, Filter, Clock, Percent } from "lucide-react"
import { Button } from "@/src/app/components/Button"
import { getProvaById, getResultadosProva, getProvaStats, ProvaCompleta, ResultadoProvaCompleto } from "@/src/actions/provasActions"
import { StatusResultado, TipoQuestao } from "@/src/generated/prisma/client"
import { ProvaAnalytics } from "./ProvaAnalytics"

interface ProvaResultadosContentProps {
    provaId: number
}

interface StatsState {
    totalParticipantes: number
    totalCorrigidos: number
    pontuacaoTotal: number
    mediaGeral: number
    maiorNota: number
    menorNota: number
    distribuicao: number[]
    questoesStats: {
        id: number
        enunciado: string
        tipo: TipoQuestao
        taxaAcerto: number
    }[]
}

function formatTime(seconds: number | null): string {
    if (!seconds) return "-"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
}

export function ProvaResultadosContent({ provaId }: ProvaResultadosContentProps) {
    const [prova, setProva] = useState<ProvaCompleta | null>(null)
    const [resultados, setResultados] = useState<ResultadoProvaCompleto[]>([])
    const [stats, setStats] = useState<StatsState | null>(null)
    const [busca, setBusca] = useState("")
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [provaId])

    const loadData = async () => {
        setIsLoading(true)
        const [provaData, resultadosData, statsData] = await Promise.all([
            getProvaById(provaId),
            getResultadosProva(provaId),
            getProvaStats(provaId)
        ])
        setProva(provaData)
        setResultados(resultadosData)
        setStats(statsData)
        setIsLoading(false)
    }

    const filteredResultados = resultados.filter(r =>
        r.candidato.nome.toLowerCase().includes(busca.toLowerCase()) ||
        r.candidato.email.toLowerCase().includes(busca.toLowerCase())
    )

    const aprovados = resultados.filter(r => r.status === "CORRIGIDA" && (r.notaFinal || 0) >= (stats?.pontuacaoTotal || 0) * 0.6).length
    const taxaAprovacao = stats?.totalCorrigidos ? (aprovados / stats.totalCorrigidos) * 100 : 0

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-gray-500">Carregando...</div>
            </div>
        )
    }

    return (
        <div className="flex-1 overflow-y-auto bg-bg-main">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-bg-main/90 backdrop-blur-sm px-6 py-4 border-b border-border flex justify-between items-center">
                <div className="flex flex-wrap gap-2 items-center text-sm">
                    <Link href="/coord/home" className="text-text-muted hover:text-primary transition-colors font-medium">Home</Link>
                    <span className="text-text-muted">/</span>
                    <Link href="/coord/processo-seletivo/provas" className="text-text-muted hover:text-primary transition-colors font-medium">Provas</Link>
                    <span className="text-text-muted">/</span>
                    <span className="text-text-main font-semibold">Resultados</span>
                </div>
            </div>

            <div className="p-6 md:p-10 max-w-[1400px] mx-auto w-full flex flex-col gap-8">
                {/* Page Heading & Actions */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                    <div className="flex flex-col gap-2 max-w-2xl">
                        <h1 className="text-text-main text-3xl md:text-4xl font-black leading-tight tracking-tight">
                            Resultados da Prova
                        </h1>
                        <p className="text-text-muted text-base font-normal leading-relaxed">
                            {prova?.titulo}
                        </p>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                        <Link href={`/coord/processo-seletivo/provas/${provaId}`}>
                            <button className="flex items-center gap-2 h-10 px-4 bg-white border border-border rounded-lg text-text-main text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm cursor-pointer">
                                <ArrowLeft size={18} />
                                <span>Voltar para edição</span>
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-white rounded-xl p-5 border border-border shadow-sm flex flex-col gap-1 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Users size={32} className="text-primary" />
                        </div>
                        <p className="text-text-muted text-sm font-medium uppercase tracking-wider">Participantes</p>
                        <p className="text-text-main text-3xl font-bold tracking-tight">{stats?.totalParticipantes || 0}</p>
                    </div>

                    <div className="bg-white rounded-xl p-5 border border-border shadow-sm flex flex-col gap-1 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <BarChart3 size={32} className="text-primary" />
                        </div>
                        <p className="text-text-muted text-sm font-medium uppercase tracking-wider">Média Geral</p>
                        <p className="text-text-main text-3xl font-bold tracking-tight">{stats?.mediaGeral.toFixed(1) || "0.0"}</p>
                        <div className="text-xs text-text-muted mt-1">Máximo: {stats?.pontuacaoTotal.toFixed(1)}</div>
                    </div>

                    <div className="bg-white rounded-xl p-5 border border-border shadow-sm flex flex-col gap-1 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Trophy size={32} className="text-primary" />
                        </div>
                        <p className="text-text-muted text-sm font-medium uppercase tracking-wider">Maior Nota</p>
                        <p className="text-text-main text-3xl font-bold tracking-tight">{stats?.maiorNota.toFixed(1) || "0.0"}</p>
                    </div>

                    <div className="bg-white rounded-xl p-5 border border-border shadow-sm flex flex-col gap-1 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <TrendingDown size={32} className="text-primary" />
                        </div>
                        <p className="text-text-muted text-sm font-medium uppercase tracking-wider">Menor Nota</p>
                        <p className="text-text-main text-3xl font-bold tracking-tight">{stats?.menorNota.toFixed(1) || "0.0"}</p>
                    </div>

                    <div className="bg-white rounded-xl p-5 border border-border shadow-sm flex flex-col gap-1 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <CheckCircle size={32} className="text-primary" />
                        </div>
                        <p className="text-text-muted text-sm font-medium uppercase tracking-wider">Aprovação</p>
                        <p className="text-text-main text-3xl font-bold tracking-tight">{taxaAprovacao.toFixed(0)}%</p>
                        <div className="text-xs text-text-muted mt-1">{aprovados} Aprovados</div>
                    </div>
                </div>

                {/* Analytics Charts */}
                {stats && (
                    <ProvaAnalytics 
                        distribuicao={stats.distribuicao} 
                        questoesStats={stats.questoesStats} 
                    />
                )}

                {/* Participants Table */}
                <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-border flex justify-between items-center flex-wrap gap-4">
                        <h3 className="text-lg font-bold text-text-main">Participantes</h3>
                        <div className="flex gap-2">
                            <div className="relative">
                                <Search size={18} className="absolute left-2.5 top-2.5 text-gray-400" />
                                <input
                                    type="text"
                                    value={busca}
                                    onChange={(e) => setBusca(e.target.value)}
                                    placeholder="Buscar candidato..."
                                    className="pl-10 pr-4 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white text-text-main"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#fcfbf8] border-b border-border">
                                    <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Nome</th>
                                    <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">Nota Final</th>
                                    <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">Acertos</th>
                                    <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">Tempo</th>
                                    <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-center">Status</th>
                                    <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredResultados.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-500">
                                            {busca ? "Nenhum candidato encontrado" : "Nenhum participante ainda"}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredResultados.map((resultado) => {
                                        const initials = resultado.candidato.nome.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
                                        const acertos = resultado.respostas.filter(r => r.corrigida && (r.pontuacao || 0) > 0).length
                                        const totalQuestoes = resultado.respostas.length
                                        const percentAcertos = totalQuestoes ? (acertos / totalQuestoes) * 100 : 0

                                        return (
                                            <tr key={resultado.id} className="hover:bg-yellow-50/50 transition-colors group">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-primary/20 text-text-main flex items-center justify-center text-xs font-bold">
                                                            {initials}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-text-main">{resultado.candidato.nome}</p>
                                                            <p className="text-xs text-text-muted">{resultado.candidato.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right text-sm font-bold text-text-main">
                                                    {resultado.notaFinal?.toFixed(1) || "-"}
                                                </td>
                                                <td className="p-4 text-right text-sm text-text-main">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <span className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                            <span
                                                                className={`block h-full ${percentAcertos >= 60 ? "bg-green-500" : percentAcertos >= 40 ? "bg-yellow-500" : "bg-red-400"}`}
                                                                style={{ width: `${percentAcertos}%` }}
                                                            />
                                                        </span>
                                                        <span>{percentAcertos.toFixed(0)}%</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right text-sm text-text-muted">
                                                    {formatTime(resultado.tempoGasto)}
                                                </td>
                                                <td className="p-4 text-center">
                                                    {resultado.status === "CORRIGIDA" ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            Corrigida
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                            Pendente
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <Link
                                                        href={`/coord/processo-seletivo/provas/${provaId}/resultados/${resultado.id}`}
                                                        className="text-primary hover:text-yellow-600 font-medium text-sm flex items-center justify-end gap-1 group-hover:underline decoration-primary underline-offset-4"
                                                    >
                                                        Ver detalhes
                                                    </Link>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="p-4 border-t border-border flex justify-between items-center bg-[#fcfbf8]">
                        <span className="text-xs text-text-muted">
                            Mostrando {filteredResultados.length} de {resultados.length} participantes
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}
