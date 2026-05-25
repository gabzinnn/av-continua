"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useMember } from "@/src/context/memberContext"
import { getFeedback360MatrixParaResponder, salvarRespostas360, finalizarFeedback360 } from "@/src/actions/avaliacao360Actions"
const TipoPergunta360 = { ESCALA: "ESCALA", TEXTO_ABERTO: "TEXTO_ABERTO" } as const
type TipoPergunta360 = typeof TipoPergunta360[keyof typeof TipoPergunta360]
import { CustomAlert } from "../CustomAlert"

export function ResponderAvaliacao360MatrixContent({ avaliacaoId }: { avaliacaoId: number }) {
    const { selectedMember } = useMember()
    const router = useRouter()
    
    const [feedbacks, setFeedbacks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [alert, setAlert] = useState<{isOpen: boolean, type: any, title: string, message: string}>({
        isOpen: false, type: "info", title: "", message: ""
    })
    
    // Map of feedbackId -> (perguntaId -> nota/texto)
    const [respostas, setRespostas] = useState<Record<number, Record<number, any>>>({})
    const [progresso, setProgresso] = useState(0)

    useEffect(() => {
        if (selectedMember) {
            getFeedback360MatrixParaResponder(avaliacaoId, Number(selectedMember.id)).then(data => {
                setFeedbacks(data)
                
                // Initialize respostas state
                const initialRespostas: Record<number, Record<number, any>> = {}
                data.forEach(f => {
                    initialRespostas[f.id] = {}
                    f.respostas.forEach((r: any) => {
                        initialRespostas[f.id][r.perguntaId] = {
                            nota: r.nota,
                            texto: r.texto
                        }
                    })
                })
                setRespostas(initialRespostas)
                setLoading(false)
            }).catch(err => {
                console.error(err)
                setLoading(false)
            })
        }
    }, [selectedMember, avaliacaoId])

    useEffect(() => {
        if (feedbacks.length > 0) {
            let totalObrigatorias = 0
            let respondidas = 0
            
            feedbacks.forEach(f => {
                const perguntas = f.avaliacao.dimensoes.flatMap((d: any) => d.perguntas)
                perguntas.forEach((p: any) => {
                    if (p.obrigatoria) {
                        totalObrigatorias++
                        const resp = respostas[f.id]?.[p.id]
                        if (resp) {
                            if (p.tipo === "ESCALA" && resp.nota >= 1 && resp.nota <= 5) {
                                respondidas++
                            } else if (p.tipo === "TEXTO_ABERTO" && resp.texto?.trim() !== "") {
                                respondidas++
                            }
                        }
                    }
                })
            })
            
            setProgresso(totalObrigatorias > 0 ? Math.round((respondidas / totalObrigatorias) * 100) : 100)
        }
    }, [respostas, feedbacks])

    const handleRespostaChange = (feedbackId: number, perguntaId: number, tipo: TipoPergunta360, valor: any) => {
        setRespostas(prev => {
            const novo = { ...prev }
            if (!novo[feedbackId]) novo[feedbackId] = {}
            if (!novo[feedbackId][perguntaId]) novo[feedbackId][perguntaId] = {}
            
            if (tipo === TipoPergunta360.ESCALA) {
                novo[feedbackId][perguntaId].nota = valor
            } else {
                novo[feedbackId][perguntaId].texto = valor
            }
            return novo
        })
    }

    const salvarRascunho = async () => {
        if (!selectedMember) return
        setSaving(true)
        try {
            for (const f of feedbacks) {
                const toSave = Object.entries(respostas[f.id] || {}).map(([perguntaId, resp]: any) => ({
                    perguntaId: Number(perguntaId),
                    nota: resp.nota,
                    texto: resp.texto
                }))
                if (toSave.length > 0) {
                    await salvarRespostas360(f.id, Number(selectedMember.id), toSave)
                }
            }
            setAlert({ isOpen: true, type: "success", title: "Sucesso", message: "Rascunho salvo com sucesso!" })
        } catch (err) {
            setAlert({ isOpen: true, type: "error", title: "Erro", message: "Falha ao salvar rascunho." })
        }
        setSaving(false)
    }

    const finalizarAvaliacao = async () => {
        if (!selectedMember) return
        if (progresso < 100) {
            setAlert({ isOpen: true, type: "warning", title: "Atenção", message: "Preencha todas as perguntas obrigatórias antes de finalizar." })
            return
        }
        
        setSaving(true)
        try {
            for (const f of feedbacks) {
                const toSave = Object.entries(respostas[f.id] || {}).map(([perguntaId, resp]: any) => ({
                    perguntaId: Number(perguntaId),
                    nota: resp.nota,
                    texto: resp.texto
                }))
                if (toSave.length > 0) {
                    await salvarRespostas360(f.id, Number(selectedMember.id), toSave)
                }
                
                const result = await finalizarFeedback360(f.id, Number(selectedMember.id))
                if (!result.success) {
                    throw new Error(result.error)
                }
            }
            setAlert({ isOpen: true, type: "success", title: "Sucesso", message: "Avaliação finalizada com sucesso!" })
            setTimeout(() => {
                router.push("/avaliacoes-360")
            }, 2000)
        } catch (err: any) {
            setAlert({ isOpen: true, type: "error", title: "Erro", message: err.message || "Falha ao finalizar avaliação." })
        }
        setSaving(false)
    }

    if (loading) {
        return <div className="p-10 text-center">Carregando avaliação...</div>
    }

    if (feedbacks.length === 0) {
        return <div className="p-10 text-center">Nenhum feedback encontrado.</div>
    }

    const avaliacao = feedbacks[0].avaliacao
    const dimensoes = avaliacao.dimensoes

    return (
        <div className="flex-1 flex flex-col items-center py-10 px-6 max-w-350 mx-auto w-full">
            <CustomAlert 
                isOpen={alert.isOpen}
                type={alert.type}
                title={alert.title}
                message={alert.message}
                onConfirm={() => setAlert(prev => ({...prev, isOpen: false}))}
            />

            {/* Page Heading */}
            <div className="w-full flex flex-col gap-3 mb-8">
                <h1 className="text-gray-900 text-3xl font-black leading-tight tracking-[-0.033em]">
                    Responder Avaliação 360: {avaliacao.nome}
                </h1>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <p className="text-gray-600 text-base font-normal leading-normal max-w-2xl">
                        Atribua notas de 1 a 5 para cada competência ou escreva seu comentário nas perguntas abertas. 
                        Recomendamos salvar rascunho regularmente.
                    </p>
                    
                    {/* Scale Legend */}
                    <div className="flex items-center gap-4 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                        <span className="text-xs font-bold uppercase tracking-wider opacity-60">Legenda:</span>
                        <div className="flex gap-3 text-xs font-medium">
                            <span className="flex items-center gap-1"><b className="text-red-500">1–2</b> Insuficiente</span>
                            <span className="flex items-center gap-1"><b className="text-orange-500">3–4</b> Regular</span>
                            <span className="flex items-center gap-1"><b className="text-[#fad519]">5–6</b> Bom</span>
                            <span className="flex items-center gap-1"><b className="text-green-600">7–8</b> Muito Bom</span>
                            <span className="flex items-center gap-1"><b className="text-blue-600">9–10</b> Excepcional</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Matrix Card */}
            <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-24">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="sticky left-0 bg-gray-50 text-left p-6 min-w-87.5 font-bold text-sm z-10 border-r border-gray-200">
                                    Competência / Comportamento
                                </th>
                                {feedbacks.map(f => {
                                    // Calc personal progress
                                    const perguntas = f.avaliacao.dimensoes.flatMap((d: any) => d.perguntas)
                                    let req = 0; let done = 0;
                                    perguntas.forEach((p: any) => {
                                        if (p.obrigatoria) {
                                            req++
                                            const resp = respostas[f.id]?.[p.id]
                                            if (resp && ((p.tipo === "ESCALA" && resp.nota >= 1 && resp.nota <= 5) || (p.tipo === "TEXTO_ABERTO" && resp.texto?.trim() !== ""))) {
                                                done++
                                            }
                                        }
                                    })
                                    const perc = req > 0 ? Math.round((done/req)*100) : 100
                                    
                                    return (
                                        <th key={f.id} className="p-6 min-w-45 text-center align-bottom border-l border-gray-200 bg-gray-50">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-1.5 h-16 bg-gray-200 rounded-full relative overflow-hidden">
                                                    <div className="absolute bottom-0 left-0 w-full bg-[#fad519] transition-all duration-300" style={{ height: `${perc}%` }}></div>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm">{f.avaliado.nome}</span>
                                                    <span className="text-xs text-[#fad519] font-bold mt-1">{perc}%</span>
                                                </div>
                                            </div>
                                        </th>
                                    )
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {dimensoes.map((dimensao: any) => (
                                <React.Fragment key={dimensao.id}>
                                    {/* Dimension Header */}
                                    <tr className="bg-gray-50/50">
                                        <td className="p-4 border-b border-gray-200" colSpan={feedbacks.length + 1}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-1 h-6 bg-[#fad519] rounded-full"></div>
                                                <h3 className="font-bold text-base tracking-tight text-gray-700">{dimensao.titulo}</h3>
                                            </div>
                                        </td>
                                    </tr>
                                    
                                    {/* Dimension Questions */}
                                    {dimensao.perguntas.map((pergunta: any, idx: number) => (
                                        <tr key={pergunta.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                            <td className="sticky left-0 p-6 bg-white border-r border-gray-200 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                                <p className="font-medium text-sm text-gray-900">{pergunta.texto}</p>
                                                {pergunta.obrigatoria && <p className="text-xs text-red-500 mt-1 font-semibold">* Obrigatória</p>}
                                            </td>
                                            
                                            {feedbacks.map(f => {
                                                const resp = respostas[f.id]?.[pergunta.id]
                                                const isFilled = pergunta.tipo === "ESCALA" ? (resp?.nota >= 1 && resp?.nota <= 10) : (resp?.texto?.trim() !== "")
                                                
                                                return (
                                                    <td key={f.id} className="p-6 text-center border-l border-gray-200 align-middle">
                                                        {pergunta.tipo === "ESCALA" ? (
                                                            <input 
                                                                className={`w-14 h-14 rounded-lg bg-gray-50 border text-center font-bold text-lg focus:ring-0 focus:outline-none focus:border-[#fad519] transition-all
                                                                    ${isFilled ? 'border-[#fad519] shadow-[0_0_0_2px_rgba(250,213,25,0.2)]' : 'border-gray-200'}
                                                                `}
                                                                type="number"
                                                                min="1"
                                                                max="10"
                                                                placeholder="-"
                                                                value={resp?.nota || ''}
                                                                onChange={(e) => handleRespostaChange(f.id, pergunta.id, TipoPergunta360.ESCALA, parseInt(e.target.value) || null)}
                                                            />
                                                        ) : (
                                                            <textarea 
                                                                className={`w-full min-w-50 h-20 p-3 rounded-lg bg-gray-50 border text-sm resize-none focus:ring-0 focus:outline-none focus:border-[#fad519] transition-all
                                                                    ${isFilled ? 'border-[#fad519]' : 'border-gray-200'}
                                                                `}
                                                                placeholder="Escreva aqui..."
                                                                value={resp?.texto || ''}
                                                                onChange={(e) => handleRespostaChange(f.id, pergunta.id, TipoPergunta360.TEXTO_ABERTO, e.target.value)}
                                                            />
                                                        )}
                                                    </td>
                                                )
                                            })}
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Sticky Footer Progress Bar */}
            <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-4 px-10 flex items-center justify-between shadow-2xl z-50">
                <div className="flex items-center gap-6 flex-1 max-w-200">
                    <div className="flex flex-col gap-1 min-w-30">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Progresso Geral</span>
                        <span className="text-xl font-black">{progresso}%</span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#fad519] rounded-full transition-all duration-500" style={{ width: `${progresso}%` }}></div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={salvarRascunho}
                        disabled={saving}
                        className="px-6 py-3 text-sm font-bold text-gray-600 hover:text-black transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        {saving ? "Salvando..." : "Salvar Rascunho"}
                    </button>
                    <button 
                        onClick={finalizarAvaliacao}
                        disabled={saving || progresso < 100}
                        className="bg-primary hover:bg-[#eac416] text-text-main px-8 py-3 rounded-lg font-bold text-sm shadow-md transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        Enviar Avaliação
                        <span className="material-symbols-outlined text-base">send</span>
                    </button>
                </div>
            </footer>
        </div>
    )
}
