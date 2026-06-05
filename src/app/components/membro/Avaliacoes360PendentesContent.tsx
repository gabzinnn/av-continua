"use client"

import { useEffect, useState } from "react"
import { useMember } from "@/src/context/memberContext"
import { getMinhas360Pendentes, getAv360HistoricoMembro, Av360HistoricoItem } from "@/src/actions/avaliacao360Actions"
import { Card } from "../Card"
import Link from "next/link"
import { ClipboardCheck, CheckCircle } from "lucide-react"

export function Avaliacoes360PendentesContent() {
    const { selectedMember } = useMember()
    const [feedbacks, setFeedbacks] = useState<any[]>([])
    const [historico, setHistorico] = useState<Av360HistoricoItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (selectedMember) {
            Promise.all([
                getMinhas360Pendentes(Number(selectedMember.id)),
                getAv360HistoricoMembro(Number(selectedMember.id)),
            ]).then(([pendentes, hist]) => {
                setFeedbacks(pendentes)
                setHistorico(hist)
                setLoading(false)
            }).catch(() => setLoading(false))
        }
    }, [selectedMember])

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Carregando...</div>
    }

    // =============== LISTA PRINCIPAL ===============
    const agrupado = feedbacks.reduce((acc: any, f) => {
        if (!acc[f.avaliacaoId]) {
            acc[f.avaliacaoId] = { avaliacaoId: f.avaliacaoId, avaliacaoNome: f.avaliacaoNome, feedbacks: [] }
        }
        acc[f.avaliacaoId].feedbacks.push(f)
        return acc
    }, {})

    const avaliacoesPendentes = Object.values(agrupado) as any[]

    return (
        <div className="p-8 max-w-5xl mx-auto w-full flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Avaliações 360</h1>

            {/* Pendentes */}
            {avaliacoesPendentes.length > 0 ? (
                <div className="mb-8">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">
                        Pendentes ({avaliacoesPendentes.length})
                    </h2>
                    <div className="grid gap-6">
                        {avaliacoesPendentes.map((av) => (
                            <Card key={av.avaliacaoId} className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 mb-2">{av.avaliacaoNome}</h2>
                                        <p className="text-sm text-gray-500">
                                            Você tem {av.feedbacks.length} membro(s) para avaliar nesta etapa.
                                        </p>
                                        <div className="flex flex-wrap gap-2 mt-4">
                                            {av.feedbacks.map((f: any) => (
                                                <div key={f.id} className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full text-xs">
                                                    <div className="w-2 h-2 rounded-full bg-[#fad419]" />
                                                    {f.avaliadoNome} ({f.progresso}%)
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <Link
                                        href={`/avaliacoes-360/${av.avaliacaoId}`}
                                        className="bg-[#fad419] hover:bg-[#eac416] text-[#1c1a0d] px-6 py-2 rounded-lg font-bold text-sm text-center shadow-sm transition-colors whitespace-nowrap"
                                    >
                                        Responder
                                    </Link>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            ) : (
                <Card className="p-8 flex flex-col items-center justify-center text-center bg-gray-50/50 mb-8">
                    <ClipboardCheck className="w-12 h-12 text-gray-300 mb-3" />
                    <h3 className="text-base font-medium text-gray-900 mb-1">Nenhuma avaliação pendente</h3>
                    <p className="text-sm text-gray-500">Você será avisado quando uma nova avaliação for iniciada.</p>
                </Card>
            )}

            {/* Histórico */}
            {historico.length > 0 && (
                <div>
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">
                        Histórico ({historico.length})
                    </h2>
                    <div className="grid gap-3">
                        {historico.map((av) => (
                            <div
                                key={av.avaliacaoId}
                                className="bg-white rounded-xl p-5 border border-border"
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{av.avaliacaoNome}</h3>
                                        <div className="flex items-center gap-4 mt-1.5">
                                            <div className="flex items-center gap-1.5 text-xs text-green-600">
                                                <CheckCircle size={13} />
                                                <span>{av.totalAvaliados} avaliado(s) concluído(s)</span>
                                            </div>
                                            {av.dataFim && (
                                                <span className="text-xs text-gray-400">
                                                    Encerrada em {new Date(av.dataFim).toLocaleDateString("pt-BR")}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <span className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                                        <CheckCircle size={14} />
                                        Enviada
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
