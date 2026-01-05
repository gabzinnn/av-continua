"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Save, CheckCircle, XCircle, Clock, User, Mail, FileText } from "lucide-react"
import { Button } from "@/src/app/components/Button"
import {
    getResultadoDetalhado,
    corrigirResposta,
    autoCorrigirMultiplaEscolha
} from "@/src/actions/provasActions"
import { TipoQuestao } from "@/src/generated/prisma/client"

interface CorrecaoResultadoContentProps {
    provaId: number
    resultadoId: number
}

type RespostaDetalhada = {
    id: number
    questaoId: number
    alternativaId: number | null
    respostaTexto: string | null
    pontuacao: number | null
    corrigida: boolean
    questao: {
        id: number
        tipo: TipoQuestao
        enunciado: string
        pontos: number
        alternativas: {
            id: number
            texto: string
            correta: boolean
            ordem: number
        }[]
    }
}

type ResultadoDetalhado = {
    id: number
    status: string
    notaFinal: number | null
    tempoGasto: number | null
    iniciadoEm: Date
    finalizadoEm: Date | null
    candidato: {
        id: number
        nome: string
        email: string
        dre: string | null
        telefone: string | null
    }
    prova: {
        id: number
        titulo: string
        questoes: {
            id: number
            tipo: TipoQuestao
            enunciado: string
            pontos: number
            alternativas: {
                id: number
                texto: string
                correta: boolean
            }[]
        }[]
    }
    respostas: RespostaDetalhada[]
}

export function CorrecaoResultadoContent({ provaId, resultadoId }: CorrecaoResultadoContentProps) {
    const [resultado, setResultado] = useState<ResultadoDetalhado | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [localPontuacoes, setLocalPontuacoes] = useState<Record<number, number>>({})
    const [savingId, setSavingId] = useState<number | null>(null)

    useEffect(() => {
        loadData()
    }, [resultadoId])

    const loadData = async () => {
        setIsLoading(true)
        const data = await getResultadoDetalhado(resultadoId)
        setResultado(data as ResultadoDetalhado)
        
        // Initialize local pontuacoes
        if (data) {
            const pontuacoes: Record<number, number> = {}
            data.respostas.forEach((r) => {
                pontuacoes[+r.id] = r.pontuacao ?? 0
            })
            setLocalPontuacoes(pontuacoes)
        }
        setIsLoading(false)
    }

    const handleAutoCorrigir = async () => {
        await autoCorrigirMultiplaEscolha(resultadoId)
        await loadData()
    }

    const handleSaveCorrecao = async (respostaId: number) => {
        setSavingId(respostaId)
        await corrigirResposta(respostaId, localPontuacoes[respostaId] || 0)
        await loadData()
        setSavingId(null)
    }

    const getQuestaoFromProva = (questaoId: number) => {
        return resultado?.prova.questoes.find(q => q.id === questaoId)
    }

    const getRespostaForQuestao = (questaoId: number) => {
        return resultado?.respostas.find(r => r.questaoId === questaoId)
    }

    if (isLoading || !resultado) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-gray-500">Carregando...</div>
            </div>
        )
    }

    const questoesCorrigidas = resultado.respostas.filter(r => r.corrigida).length
    const totalQuestoes = resultado.prova.questoes.length
    const notaParcial = resultado.respostas.reduce((acc, r) => acc + (r.pontuacao || 0), 0)
    const pontuacaoTotal = resultado.prova.questoes.reduce((acc, q) => acc + q.pontos, 0)

    return (
        <div className="flex-1 overflow-y-auto bg-bg-main">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-bg-main/90 backdrop-blur-sm px-6 py-4 border-b border-border flex justify-between items-center">
                <div className="flex flex-wrap gap-2 items-center text-sm">
                    <Link href="/coord/home" className="text-text-muted hover:text-primary transition-colors font-medium">Home</Link>
                    <span className="text-text-muted">/</span>
                    <Link href="/coord/processo-seletivo/provas" className="text-text-muted hover:text-primary transition-colors font-medium">Provas</Link>
                    <span className="text-text-muted">/</span>
                    <Link href={`/coord/processo-seletivo/provas/${provaId}/resultados`} className="text-text-muted hover:text-primary transition-colors font-medium">Resultados</Link>
                    <span className="text-text-muted">/</span>
                    <span className="text-text-main font-semibold">Correção</span>
                </div>
            </div>

            <div className="p-6 md:p-10 max-w-5xl mx-auto w-full flex flex-col gap-8">
                {/* Page Heading */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-text-main text-3xl font-black leading-tight tracking-tight">
                            Correção de Prova
                        </h1>
                        <p className="text-text-muted text-base">{resultado.prova.titulo}</p>
                    </div>
                    <div className="flex gap-3">
                        <Link href={`/coord/processo-seletivo/provas/${provaId}/resultados`}>
                            <button className="flex items-center gap-2 h-10 px-4 bg-white border border-border rounded-lg text-text-main text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm cursor-pointer">
                                <ArrowLeft size={18} />
                                Voltar
                            </button>
                        </Link>
                        <Button onClick={handleAutoCorrigir} icon={<CheckCircle size={18} />}>
                            Auto-corrigir Objetivas
                        </Button>
                    </div>
                </div>

                {/* Candidato Info Card */}
                <div className="bg-white rounded-xl border border-border shadow-sm p-6">
                    <div className="flex flex-wrap gap-6 items-center">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-text-main">
                                {resultado.candidato.nome.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-text-main">{resultado.candidato.nome}</h3>
                                <p className="text-sm text-text-muted flex items-center gap-1">
                                    <Mail size={14} />
                                    {resultado.candidato.email}
                                </p>
                                {/* @ts-ignore - DRE might be missing in type if not fully updated yet by TS */}
                                {resultado.candidato.dre && (
                                    <p className="text-sm text-text-muted flex items-center gap-1">
                                        <FileText size={14} />
                                        <span className="font-medium">DRE:</span> {resultado.candidato.dre}
                                    </p>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex gap-6 ml-auto">
                            <div className="text-center">
                                <p className="text-xs text-text-muted uppercase tracking-wider">Nota Parcial</p>
                                <p className="text-2xl font-bold text-text-main">
                                    {notaParcial.toFixed(1)} <span className="text-sm font-normal text-text-muted">/ {pontuacaoTotal.toFixed(1)}</span>
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-text-muted uppercase tracking-wider">Progresso</p>
                                <p className="text-2xl font-bold text-text-main">
                                    {questoesCorrigidas} <span className="text-sm font-normal text-text-muted">/ {totalQuestoes}</span>
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-text-muted uppercase tracking-wider">Status</p>
                                <p className={`text-sm font-bold ${resultado.status === "CORRIGIDA" ? "text-green-600" : "text-yellow-600"}`}>
                                    {resultado.status === "CORRIGIDA" ? "Corrigida" : "Pendente"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Questões */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-text-main">Questões e Respostas</h2>
                    
                    {resultado.prova.questoes.map((questao, index) => {
                        const resposta = getRespostaForQuestao(questao.id)
                        const alternativaCorreta = questao.alternativas.find(a => a.correta)
                        const alternativaSelecionada = questao.alternativas.find(a => a.id === resposta?.alternativaId)
                        const isCorrect = alternativaSelecionada?.id === alternativaCorreta?.id

                        return (
                            <div key={questao.id} className={`bg-white rounded-xl border ${resposta?.corrigida ? "border-green-200" : "border-border"} shadow-sm overflow-hidden`}>
                                <div className={`p-4 ${resposta?.corrigida ? "bg-green-50" : "bg-gray-50"} border-b border-border`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${resposta?.corrigida ? "bg-green-500 text-white" : "bg-gray-200 text-text-muted"}`}>
                                                {index + 1}
                                            </div>
                                            <span className="text-xs font-bold uppercase tracking-wider text-text-muted bg-white px-2 py-1 rounded border border-border">
                                                {questao.tipo === "MULTIPLA_ESCOLHA" ? "Múltipla Escolha" : questao.tipo === "DISSERTATIVA" ? "Dissertativa" : "V/F"}
                                            </span>
                                            <span className="text-sm font-medium text-text-muted">
                                                {questao.pontos} pts
                                            </span>
                                        </div>
                                        {resposta?.corrigida && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-green-600">
                                                    {resposta.pontuacao?.toFixed(1)} pts
                                                </span>
                                                <CheckCircle size={18} className="text-green-500" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="p-6 space-y-4">
                                    {/* Enunciado */}
                                    <div>
                                        <p className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">Enunciado</p>
                                        <p className="text-text-main">{questao.enunciado}</p>
                                    </div>

                                    {/* Resposta */}
                                    {questao.tipo === "MULTIPLA_ESCOLHA" && (
                                        <div>
                                            <p className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">Resposta do Candidato</p>
                                            <div className="space-y-2">
                                                {questao.alternativas.map(alt => {
                                                    const selected = alt.id === resposta?.alternativaId
                                                    const correct = alt.correta
                                                    
                                                    let bgColor = "bg-gray-50"
                                                    let borderColor = "border-gray-200"
                                                    let textColor = "text-text-main"
                                                    
                                                    if (selected && correct) {
                                                        bgColor = "bg-green-50"
                                                        borderColor = "border-green-300"
                                                        textColor = "text-green-800"
                                                    } else if (selected && !correct) {
                                                        bgColor = "bg-red-50"
                                                        borderColor = "border-red-300"
                                                        textColor = "text-red-800"
                                                    } else if (correct) {
                                                        bgColor = "bg-green-50"
                                                        borderColor = "border-green-200"
                                                        textColor = "text-green-700"
                                                    }

                                                    return (
                                                        <div
                                                            key={alt.id}
                                                            className={`p-3 rounded-lg border ${borderColor} ${bgColor} flex items-center gap-3`}
                                                        >
                                                            {selected ? (
                                                                correct ? <CheckCircle size={18} className="text-green-500" /> : <XCircle size={18} className="text-red-500" />
                                                            ) : correct ? (
                                                                <CheckCircle size={18} className="text-green-400" />
                                                            ) : (
                                                                <div className="w-[18px]" />
                                                            )}
                                                            <span className={`text-sm ${textColor}`}>{alt.texto}</span>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {questao.tipo === "DISSERTATIVA" && (
                                        <div>
                                            <p className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">Resposta do Candidato</p>
                                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                <p className="text-text-main whitespace-pre-wrap">
                                                    {resposta?.respostaTexto || <span className="text-text-muted italic">Sem resposta</span>}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Correção Manual (para dissertivas ou para atribuir nota) */}
                                    {resposta && !resposta.corrigida && (
                                        <div className="flex items-end gap-4 pt-4 border-t border-border">
                                            <div>
                                                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                                                    Atribuir Pontuação (máx: {questao.pontos})
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.5"
                                                    min="0"
                                                    max={questao.pontos}
                                                    value={localPontuacoes[resposta.id] ?? 0}
                                                    onChange={(e) => setLocalPontuacoes({
                                                        ...localPontuacoes,
                                                        [resposta.id]: Math.min(parseFloat(e.target.value) || 0, questao.pontos)
                                                    })}
                                                    className="w-24 rounded-lg border border-border px-2 bg-white text-text-main focus:border-primary focus:ring-primary h-10 text-center font-bold outline-none"
                                                />
                                            </div>
                                            <Button
                                                onClick={() => handleSaveCorrecao(resposta.id)}
                                                disabled={savingId === resposta.id}
                                                icon={<Save size={16} />}
                                            >
                                                {savingId === resposta.id ? "Salvando..." : "Salvar Correção"}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
