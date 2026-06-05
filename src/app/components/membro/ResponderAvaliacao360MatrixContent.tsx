"use client"

import React, { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useMember } from "@/src/context/memberContext"
import { getFeedback360MatrixParaResponder, salvarRespostas360, finalizarFeedback360 } from "@/src/actions/avaliacao360Actions"
const TipoPergunta360 = { ESCALA: "ESCALA", TEXTO_ABERTO: "TEXTO_ABERTO" } as const
type TipoPergunta360 = typeof TipoPergunta360[keyof typeof TipoPergunta360]
import { CustomAlert } from "../CustomAlert"

type RespostasMap = Record<number, Record<number, any>>

function getDraftKey(membroId: number, avaliacaoId: number) {
    return `av360_draft_${membroId}_${avaliacaoId}`
}
function saveDraft(membroId: number, avaliacaoId: number, respostas: RespostasMap) {
    try { localStorage.setItem(getDraftKey(membroId, avaliacaoId), JSON.stringify(respostas)) } catch {}
}
function loadDraft(membroId: number, avaliacaoId: number): RespostasMap | null {
    try { const raw = localStorage.getItem(getDraftKey(membroId, avaliacaoId)); return raw ? JSON.parse(raw) : null } catch { return null }
}
function clearDraft(membroId: number, avaliacaoId: number) {
    try { localStorage.removeItem(getDraftKey(membroId, avaliacaoId)) } catch {}
}

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
    const [respostas, setRespostas] = useState<RespostasMap>({})
    const [progresso, setProgresso] = useState(0)
    const [draftStatus, setDraftStatus] = useState<"idle" | "saving" | "saved">("idle")

    const draftDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const dirtyFeedbacksRef = useRef<Set<number>>(new Set())

    useEffect(() => {
        if (selectedMember) {
            getFeedback360MatrixParaResponder(avaliacaoId, Number(selectedMember.id)).then(data => {
                setFeedbacks(data)
                
                // Initialize respostas state from server
                const initialRespostas: RespostasMap = {}
                data.forEach(f => {
                    initialRespostas[f.id] = {}
                    f.respostas.forEach((r: any) => {
                        initialRespostas[f.id][r.perguntaId] = {
                            nota: r.nota,
                            texto: r.texto
                        }
                    })
                })

                // Merge com rascunho local (pode conter alterações ainda não sincronizadas)
                const localDraft = loadDraft(Number(selectedMember.id), avaliacaoId)
                if (localDraft) {
                    Object.entries(localDraft).forEach(([fId, perguntas]) => {
                        const feedbackId = Number(fId)
                        if (!initialRespostas[feedbackId]) initialRespostas[feedbackId] = {}
                        Object.entries(perguntas).forEach(([pId, resp]: any) => {
                            initialRespostas[feedbackId][Number(pId)] = {
                                ...initialRespostas[feedbackId][Number(pId)],
                                ...resp,
                            }
                        })
                    })
                    setDraftStatus("saved")
                }

                setRespostas(initialRespostas)
                setLoading(false)
            }).catch(err => {
                console.error(err)
                setLoading(false)
            })
        }
    }, [selectedMember, avaliacaoId])

    // Cancela debounce pendente ao desmontar (localStorage já foi gravado a cada tecla)
    useEffect(() => {
        return () => {
            if (draftDebounceRef.current) clearTimeout(draftDebounceRef.current)
        }
    }, [])

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
                            if (p.tipo === "ESCALA" && resp.nota >= 1 && resp.nota <= 10) {
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
            const novo = { ...prev, [feedbackId]: { ...prev[feedbackId] } }
            if (!novo[feedbackId][perguntaId]) novo[feedbackId][perguntaId] = {}
            else novo[feedbackId][perguntaId] = { ...novo[feedbackId][perguntaId] }

            if (tipo === TipoPergunta360.ESCALA) {
                novo[feedbackId][perguntaId].nota = valor
            } else {
                novo[feedbackId][perguntaId].texto = valor
            }
            scheduleDraftSave(feedbackId, novo)
            return novo
        })
    }

    // Autosave em background: grava no localStorage imediatamente e sincroniza com o
    // servidor após um pequeno debounce, salvando apenas os feedbacks que mudaram.
    const scheduleDraftSave = (feedbackId: number, next: RespostasMap) => {
        if (!selectedMember) return
        saveDraft(Number(selectedMember.id), avaliacaoId, next)
        dirtyFeedbacksRef.current.add(feedbackId)
        setDraftStatus("saving")

        if (draftDebounceRef.current) clearTimeout(draftDebounceRef.current)
        draftDebounceRef.current = setTimeout(async () => {
            if (!selectedMember) return
            const ids = Array.from(dirtyFeedbacksRef.current)
            dirtyFeedbacksRef.current.clear()
            try {
                for (const fId of ids) {
                    const toSave = Object.entries(next[fId] || {}).map(([perguntaId, resp]: any) => ({
                        perguntaId: Number(perguntaId),
                        nota: resp.nota,
                        texto: resp.texto,
                    }))
                    if (toSave.length > 0) {
                        await salvarRespostas360(fId, Number(selectedMember.id), toSave)
                    }
                }
                setDraftStatus("saved")
            } catch {
                // Falha silenciosa: o localStorage preserva os dados e a próxima alteração reenvia
                setDraftStatus("idle")
            }
        }, 1500)
    }

    const salvarRascunho = async () => {
        if (!selectedMember) return
        // Cancela qualquer autosave pendente — vamos salvar tudo agora
        if (draftDebounceRef.current) clearTimeout(draftDebounceRef.current)
        dirtyFeedbacksRef.current.clear()
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
            setDraftStatus("saved")
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
        
        // Cancela autosave pendente antes de finalizar
        if (draftDebounceRef.current) clearTimeout(draftDebounceRef.current)
        dirtyFeedbacksRef.current.clear()
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
            clearDraft(Number(selectedMember.id), avaliacaoId)
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
        <div className="flex-1 min-h-0 flex flex-col">
            <CustomAlert
                isOpen={alert.isOpen}
                type={alert.type}
                title={alert.title}
                message={alert.message}
                onConfirm={() => setAlert(prev => ({...prev, isOpen: false}))}
            />

            {/* Main Matrix Card */}
            <div className="flex-1 min-h-0 px-6 pb-24 max-w-350 mx-auto w-full">
            <div className="h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-auto h-full">

                    {/* Page Heading — scrollável */}
                    <div className="flex flex-col gap-3 px-6 pt-10 pb-6">
                        <h1 className="text-gray-900 text-3xl font-black leading-tight tracking-[-0.033em]">
                            Responder Avaliação 360: {avaliacao.nome}
                        </h1>
                        <p className="text-gray-600 text-base font-normal leading-normal max-w-2xl">
                            Atribua notas de 1 a 10 para cada competência ou escreva seu comentário nas perguntas abertas.
                            Recomendamos salvar rascunho regularmente.
                        </p>
                    </div>
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 sticky top-0 z-20">
                                <th className="sticky left-0 bg-gray-50 text-left p-6 min-w-87.5 font-bold text-sm z-30 border-r border-gray-200">
                                    Competência / Comportamento
                                </th>
                                {feedbacks.map(f => (
                                    <th key={f.id} className="p-4 min-w-45 text-center align-middle border-l border-gray-200 bg-gray-50">
                                        <span className="font-bold text-sm">{f.avaliado.nome}</span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {dimensoes.map((dimensao: any) => (
                                <React.Fragment key={dimensao.id}>
                                    {/* Dimension Header */}
                                    <tr className="bg-gray-50/50">
                                        <td className="sticky left-0 p-4 border-b border-gray-200 bg-gray-50/50 z-10">
                                            <div className="flex items-center gap-3">
                                                <div className="w-1 h-6 bg-[#fad419] rounded-full"></div>
                                                <h3 className="font-bold text-base tracking-tight text-gray-700">{dimensao.titulo}</h3>
                                            </div>
                                        </td>
                                        {feedbacks.map(f => (
                                            <td key={f.id} className="border-b border-gray-200 bg-gray-50/50" />
                                        ))}
                                    </tr>
                                    
                                    {/* Dimension Questions */}
                                    {dimensao.perguntas.map((pergunta: any, idx: number) => (
                                        <tr key={pergunta.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                            <td className="sticky left-0 p-6 bg-white border-r border-gray-200 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                                <p className="font-medium text-sm text-gray-900">{pergunta.texto}</p>
                                            </td>
                                            
                                            {feedbacks.map(f => {
                                                const resp = respostas[f.id]?.[pergunta.id]
                                                const isFilled = pergunta.tipo === "ESCALA" ? (resp?.nota >= 0 && resp?.nota <= 10) : (resp?.texto?.trim() !== "")
                                                
                                                return (
                                                    <td key={f.id} className="p-6 text-center border-l border-gray-200 align-middle">
                                                        {pergunta.tipo === "ESCALA" ? (
                                                            <input 
                                                                className={`w-14 h-14 rounded-lg bg-gray-50 border text-center font-bold text-lg focus:ring-0 focus:outline-none focus:border-[#fad419] transition-all
                                                                    ${isFilled ? 'border-[#fad419] shadow-[0_0_0_2px_rgba(250,213,25,0.2)]' : 'border-gray-200'}
                                                                `}
                                                                type="number"
                                                                min="0"
                                                                max="10"
                                                                step="1"
                                                                placeholder="-"
                                                                value={resp?.nota ?? ''}
                                                                onKeyDown={(e) => { if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault() }}
                                                                onChange={(e) => {
                                                                    const raw = e.target.value
                                                                    if (raw === "") { handleRespostaChange(f.id, pergunta.id, TipoPergunta360.ESCALA, null); return }
                                                                    const n = parseInt(raw, 10)
                                                                    if (isNaN(n)) return
                                                                    const clamped = Math.min(10, Math.max(0, n))
                                                                    handleRespostaChange(f.id, pergunta.id, TipoPergunta360.ESCALA, clamped)
                                                                }}
                                                            />
                                                        ) : (
                                                            <textarea 
                                                                className={`w-full min-w-50 h-20 p-3 rounded-lg bg-gray-50 border text-sm resize-none focus:ring-0 focus:outline-none focus:border-[#fad419] transition-all
                                                                    ${isFilled ? 'border-[#fad419]' : 'border-gray-200'}
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
            </div>

            {/* Sticky Footer Progress Bar */}
            <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-4 px-10 flex items-center justify-between shadow-2xl z-50">
                <div className="flex items-center gap-6 flex-1 max-w-200">
                    <div className="flex flex-col gap-1 min-w-30">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Progresso Geral</span>
                        <span className="text-xl font-black">{progresso}%</span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#fad419] rounded-full transition-all duration-500" style={{ width: `${progresso}%` }}></div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {draftStatus !== "idle" && (
                        <span className="text-xs font-medium text-gray-400 flex items-center gap-1.5 select-none">
                            {draftStatus === "saving" ? (
                                <>
                                    <span className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
                                    Salvando…
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-sm text-green-500">check_circle</span>
                                    Rascunho salvo
                                </>
                            )}
                        </span>
                    )}
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
