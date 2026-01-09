"use client"

import { useEffect, useState } from "react"
import { Calendar, CheckCircle } from "lucide-react"
import { useMember } from "@/src/context/memberContext"
import { Button } from "@/src/app/components/Button"
import { getTermometroAtivoParaMembro, enviarRespostasTermometro, TermometroParaResponder } from "@/src/actions/termometroActions"
import { TermometroQuestionCard } from "./TermometroQuestionCard"

export function MembroTermometroContent() {
    const { selectedMember } = useMember()
    const [data, setData] = useState<TermometroParaResponder | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [respostas, setRespostas] = useState<number[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [enviado, setEnviado] = useState(false)

    useEffect(() => {
        async function fetchData() {
            if (!selectedMember) return
            try {
                const result = await getTermometroAtivoParaMembro(+selectedMember.id)
                setData(result)
                if (result) {
                    // Preencher respostas existentes ou inicializar com 0
                    const initialRespostas = result.perguntas.map((_, i) =>
                        result.respostasExistentes[i] || 0
                    )
                    setRespostas(initialRespostas)
                    setEnviado(result.totalRespondidas > 0)
                }
            } catch (error) {
                console.error("Erro ao carregar termômetro:", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [selectedMember])

    const handleNotaChange = (index: number, nota: number) => {
        setRespostas(prev => {
            const newRespostas = [...prev]
            newRespostas[index] = nota
            return newRespostas
        })
    }

    const handleSubmit = async () => {
        if (!selectedMember || !data) return

        // Validar que todas as perguntas foram respondidas
        if (respostas.some(nota => nota === 0)) {
            alert("Por favor, responda todas as perguntas.")
            return
        }

        setIsSubmitting(true)
        const result = await enviarRespostasTermometro({
            membroId: +selectedMember.id,
            termometroId: data.id,
            notas: respostas,
        })

        if (result.success) {
            setEnviado(true)
        } else {
            alert(result.error || "Erro ao enviar respostas")
        }
        setIsSubmitting(false)
    }

    const respondidas = respostas.filter(r => r > 0).length
    const total = data?.perguntas.length || 0
    const progresso = total > 0 ? Math.round((respondidas / total) * 100) : 0

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-text-muted">Carregando...</div>
            </div>
        )
    }

    if (!data) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Calendar size={40} className="text-gray-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-text-main mb-3">
                        Nenhum termômetro ativo
                    </h2>
                    <p className="text-gray-500">
                        Não há nenhum termômetro aberto para responder no momento.
                        Você será notificado quando um novo termômetro estiver disponível.
                    </p>
                </div>
            </div>
        )
    }

    const dataFinal = new Date(data.dataFinal)
    const dataFormatada = dataFinal.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-[960px] mx-auto px-8 py-8 flex flex-col gap-6 pb-32">
                    {/* Header */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                        <div className="lg:col-span-2 flex flex-col gap-2">
                            <h1 className="text-text-main text-3xl font-black leading-tight tracking-tight">
                                {data.nome}
                            </h1>
                            <p className="text-gray-500 text-base leading-relaxed max-w-xl">
                                Esta avaliação tem como objetivo mapear seu bem-estar e produtividade no clube. Responda com sinceridade.
                            </p>
                        </div>

                        {/* Info Card */}
                        <div className="bg-bg-card rounded-xl p-5 shadow-sm border border-border flex flex-col gap-4">
                            <div className="flex items-center justify-between border-b border-border pb-3">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Status</span>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${enviado
                                        ? "bg-green-100 text-green-700"
                                        : "bg-gray-100 text-gray-600"
                                    }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${enviado ? "bg-green-500" : "bg-gray-400"}`}></span>
                                    {enviado ? "Enviado" : "Não enviado"}
                                </span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-gray-500">Prazo de entrega</span>
                                <div className="flex items-center gap-2 text-text-main font-semibold">
                                    <Calendar size={18} />
                                    {dataFormatada}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="bg-bg-card rounded-lg p-4 border border-border shadow-sm flex flex-col gap-3">
                        <div className="flex justify-between items-end">
                            <div className="flex flex-col">
                                <span className="text-xs font-medium text-gray-500 uppercase mb-1">Seu Progresso</span>
                                <p className="text-text-main text-sm font-bold">{respondidas} de {total} respondidas</p>
                            </div>
                            <span className="text-2xl font-black text-primary">{progresso}%</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${progresso}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="w-full h-px bg-gray-200 my-2"></div>

                    {/* Questions List */}
                    <div className="flex flex-col gap-6">
                        {data.perguntas.map((pergunta, index) => (
                            <TermometroQuestionCard
                                key={pergunta.id}
                                index={index}
                                texto={pergunta.texto}
                                notaSelecionada={respostas[index] || 0}
                                onNotaChange={(nota) => handleNotaChange(index, nota)}
                                disabled={enviado}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Sticky Footer */}
            {!enviado && (
                <div className="sticky bottom-0 w-full bg-bg-card border-t border-border px-8 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] flex justify-end items-center">
                    <Button
                        onClick={handleSubmit}
                        isLoading={isSubmitting}
                        disabled={progresso < 100}
                    >
                        Enviar respostas
                    </Button>
                </div>
            )}

            {/* Success Message */}
            {enviado && (
                <div className="sticky bottom-0 w-full bg-green-50 border-t border-green-200 px-8 py-4 flex items-center justify-center gap-3">
                    <CheckCircle size={24} className="text-green-600" />
                    <span className="text-green-700 font-medium">Suas respostas foram enviadas com sucesso!</span>
                </div>
            )}
        </div>
    )
}
