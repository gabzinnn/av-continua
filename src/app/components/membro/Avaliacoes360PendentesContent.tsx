"use client"

import { useEffect, useState } from "react"
import { useMember } from "@/src/context/memberContext"
import { getMinhas360Pendentes } from "@/src/actions/avaliacao360Actions"
import { Card } from "../Card"
import Link from "next/link"
import { ClipboardCheck } from "lucide-react"

export function Avaliacoes360PendentesContent() {
    const { selectedMember } = useMember()
    const [feedbacks, setFeedbacks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (selectedMember) {
            getMinhas360Pendentes(Number(selectedMember.id)).then(data => {
                setFeedbacks(data)
                setLoading(false)
            })
        }
    }, [selectedMember])

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Carregando...</div>
    }

    if (feedbacks.length === 0) {
        return (
            <div className="p-8 max-w-4xl mx-auto w-full">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Avaliações 360 Pendentes</h1>
                <Card className="p-12 flex flex-col items-center justify-center text-center bg-gray-50/50">
                    <ClipboardCheck className="w-16 h-16 text-gray-300 mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">Nenhuma avaliação pendente</h3>
                    <p className="text-gray-500 max-w-md">
                        Você não possui avaliações 360 pendentes no momento.
                    </p>
                </Card>
            </div>
        )
    }

    // Agrupar por avaliacaoId
    const agrupado = feedbacks.reduce((acc: any, f) => {
        if (!acc[f.avaliacaoId]) {
            acc[f.avaliacaoId] = {
                avaliacaoId: f.avaliacaoId,
                avaliacaoNome: f.avaliacaoNome,
                feedbacks: []
            }
        }
        acc[f.avaliacaoId].feedbacks.push(f)
        return acc
    }, {})

    const avaliacoes = Object.values(agrupado) as any[]

    return (
        <div className="p-8 max-w-5xl mx-auto w-full flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Avaliações 360 Pendentes</h1>
            <div className="grid gap-6">
                {avaliacoes.map((av) => (
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
                                            <div className="w-2 h-2 rounded-full bg-[#fad519]" />
                                            {f.avaliadoNome} ({f.progresso}%)
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <Link 
                                href={`/avaliacoes-360/${av.avaliacaoId}`}
                                className="bg-[#fad519] hover:bg-[#eac416] text-[#1c1a0d] px-6 py-2 rounded-lg font-bold text-sm text-center shadow-sm transition-colors whitespace-nowrap"
                            >
                                Responder
                            </Link>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    )
}
