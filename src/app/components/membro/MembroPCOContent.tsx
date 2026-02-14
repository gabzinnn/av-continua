"use client"

import { useEffect, useState } from "react"
import { CheckCircle, ChevronRight, ChevronLeft, ClipboardList } from "lucide-react"
import { useMember } from "@/src/context/memberContext"
import { Button } from "@/src/app/components/Button"
import { getPCOsAtivasParaMembro, enviarRespostasPCO, PCOParaResponder } from "@/src/actions/pcoActions"

type RespostaMap = Record<number, { nota?: number; opcaoId?: number; texto?: string; justificativa?: string }>

const ESCALA_OPTIONS = [
    { label: "Discordo", value: -2 },
    { label: "Discordo parcialmente", value: -1 },
    { label: "Não consigo responder", value: 0 },
    { label: "Concordo parcialmente", value: 1 },
    { label: "Concordo", value: 2 },
]

export function MembroPCOContent() {
    const { selectedMember } = useMember()
    const [pcos, setPcos] = useState<PCOParaResponder[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedPCO, setSelectedPCO] = useState<PCOParaResponder | null>(null)
    const [respostas, setRespostas] = useState<RespostaMap>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0)

    const fetchData = async () => {
        if (!selectedMember) return
        try {
            const data = await getPCOsAtivasParaMembro(Number(selectedMember.id))
            setPcos(data)
        } catch (error) {
            console.error("Erro ao carregar PCOs:", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [selectedMember])

    const handleSelectPCO = (pco: PCOParaResponder) => {
        setSelectedPCO(pco)
        setRespostas({})
        setCurrentSectionIndex(0)
        setSubmitted(false)
    }

    const handleSetNota = (perguntaId: number, nota: number) => {
        setRespostas((prev) => ({
            ...prev,
            [perguntaId]: { ...prev[perguntaId], nota },
        }))
    }

    const handleSetOpcao = (perguntaId: number, opcaoId: number) => {
        setRespostas((prev) => ({
            ...prev,
            [perguntaId]: { ...prev[perguntaId], opcaoId },
        }))
    }

    const handleSetTexto = (perguntaId: number, texto: string) => {
        setRespostas((prev) => ({
            ...prev,
            [perguntaId]: { ...prev[perguntaId], texto },
        }))
    }

    const handleSetJustificativa = (perguntaId: number, justificativa: string) => {
        setRespostas((prev) => ({
            ...prev,
            [perguntaId]: { ...prev[perguntaId], justificativa },
        }))
    }

    const validateCurrentSection = () => {
        if (!selectedPCO) return false
        const currentSection = selectedPCO.secoes[currentSectionIndex]

        for (const p of currentSection.perguntas) {
            if (!p.obrigatoria) continue
            const r = respostas[p.id]
            if (!r) {
                alert(`Por favor, responda a pergunta: "${p.texto}"`)
                return false
            }
            if (p.tipo === "ESCALA" && r.nota === undefined) {
                alert(`Por favor, responda a pergunta: "${p.texto}"`)
                return false
            }
            if (p.tipo === "MULTIPLA_ESCOLHA" && !r.opcaoId) {
                alert(`Por favor, selecione uma opção para: "${p.texto}"`)
                return false
            }
            if (p.tipo === "TEXTO_LIVRE" && (!r.texto || !r.texto.trim())) {
                alert(`Por favor, responda a pergunta: "${p.texto}"`)
                return false
            }
        }
        return true
    }

    const handleNext = () => {
        if (validateCurrentSection()) {
            setCurrentSectionIndex((prev) => Math.min((selectedPCO?.secoes.length || 1) - 1, prev + 1))
            window.scrollTo({ top: 0, behavior: "smooth" })
        }
    }

    const handlePrev = () => {
        setCurrentSectionIndex((prev) => Math.max(0, prev - 1))
        window.scrollTo({ top: 0, behavior: "smooth" })
    }

    const handleSubmit = async () => {
        if (!selectedMember || !selectedPCO) return
        if (!validateCurrentSection()) return

        setIsSubmitting(true)
        try {
            const result = await enviarRespostasPCO({
                membroId: Number(selectedMember.id),
                pcoId: selectedPCO.id,
                respostas: Object.entries(respostas).map(([perguntaId, r]) => ({
                    perguntaId: Number(perguntaId),
                    nota: r.nota,
                    opcaoId: r.opcaoId,
                    texto: r.texto,
                    justificativa: r.justificativa,
                })),
            })

            if (result.success) {
                setSubmitted(true)
            } else {
                alert(result.error || "Erro ao enviar respostas.")
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleBack = () => {
        setSelectedPCO(null)
        setSubmitted(false)
        fetchData()
    }

    // Calculation utils
    const getTotalPerguntas = () => selectedPCO?.secoes.reduce((acc, s) => acc + s.perguntas.length, 0) || 0
    const getAnsweredCount = () => {
        if (!selectedPCO) return 0
        let count = 0
        selectedPCO.secoes.forEach(s => {
            s.perguntas.forEach(p => {
                const r = respostas[p.id]
                if (!r) return
                if (p.tipo === "ESCALA" && r.nota !== undefined) count++
                else if (p.tipo === "MULTIPLA_ESCOLHA" && !!r.opcaoId) count++
                else if (p.tipo === "TEXTO_LIVRE" && !!r.texto?.trim()) count++
            })
        })
        return count
    }

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-gray-500">Carregando...</div>
            </div>
        )
    }

    // =============== SUCCESS STATE ===============
    if (submitted) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="bg-bg-card rounded-xl p-10 border border-border shadow-sm text-center max-w-md">
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle size={32} className="text-green-500" />
                    </div>
                    <h2 className="text-xl font-bold text-text-main mb-2">Respostas enviadas!</h2>
                    <p className="text-gray-500 text-sm mb-6">
                        Suas respostas à pesquisa foram registradas com sucesso. Obrigado pela sua participação!
                    </p>
                    <Button size="md" onClick={handleBack}>
                        Voltar
                    </Button>
                </div>
            </div>
        )
    }

    // =============== SURVEY FORM ===============
    if (selectedPCO && selectedPCO.secoes.length > 0) {
        const currentSection = selectedPCO.secoes[currentSectionIndex]
        const totalPerguntas = getTotalPerguntas()
        const answeredCount = getAnsweredCount()
        const progressPct = totalPerguntas > 0 ? Math.round((answeredCount / totalPerguntas) * 100) : 0

        return (
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-[900px] mx-auto py-8 px-6 flex flex-col gap-8 pb-12">
                    {/* Header */}
                    <div>
                        <button
                            onClick={handleBack}
                            className="text-sm text-gray-400 hover:text-primary transition-colors mb-4 cursor-pointer flex items-center gap-1"
                        >
                            <ChevronLeft size={16} />
                            Voltar para pesquisas
                        </button>
                        <h1 className="text-2xl md:text-3xl font-bold text-text-main tracking-tight">
                            {selectedPCO.nome}
                        </h1>
                        {selectedPCO.descricao && (
                            <p className="text-gray-400 text-sm mt-1 max-w-2xl">{selectedPCO.descricao}</p>
                        )}
                    </div>

                    {/* Central Card */}
                    <div className="bg-bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                        {/* Stepper Header */}
                        <div className="p-6 border-b border-border bg-[#fcfbf8]">
                            {/* Steps Indicator */}
                            <div className="flex items-center justify-between mb-6 px-2">
                                {selectedPCO.secoes.map((s, idx) => (
                                    <div key={s.id} className="flex flex-col items-center gap-2 relative flex-1">
                                        {/* Connector Line */}
                                        {idx !== 0 && (
                                            <div className={`absolute top-4 right-[50%] w-full h-[2px] -translate-y-1/2 -z-10
                                                ${idx <= currentSectionIndex ? "bg-primary" : "bg-gray-200"}`}
                                            />
                                        )}

                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                                            ${idx === currentSectionIndex
                                                ? "bg-primary text-text-main ring-4 ring-primary/20"
                                                : idx < currentSectionIndex
                                                    ? "bg-primary text-text-main"
                                                    : "bg-gray-200 text-gray-500"
                                            }`}
                                        >
                                            {idx + 1}
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider text-center hidden md:block max-w-[100px] truncate
                                            ${idx === currentSectionIndex ? "text-primary" : "text-gray-400"}`}
                                        >
                                            {s.titulo}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between items-end">
                                <div>
                                    <h2 className="text-xl font-bold text-text-main">{currentSection.titulo}</h2>
                                    {currentSection.descricao && (
                                        <p className="text-sm text-gray-500 mt-1 max-w-xl">{currentSection.descricao}</p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Progresso Geral</p>
                                    <p className="text-lg font-bold text-text-main">{progressPct}%</p>
                                </div>
                            </div>
                        </div>

                        {/* Questions List */}
                        <div className="p-8 space-y-12">
                            {currentSection.perguntas.map((pergunta, idx) => (
                                <div key={pergunta.id} className="space-y-5">
                                    {/* Question Header */}
                                    <div className="flex gap-3">
                                        <span className="font-bold text-primary text-lg shrink-0">
                                            {pergunta.ordem}.
                                        </span>
                                        <p className="text-lg font-medium leading-snug text-text-main">
                                            {pergunta.texto}
                                        </p>
                                    </div>

                                    {/* ESCALA */}
                                    {pergunta.tipo === "ESCALA" && (
                                        <div className="space-y-4 ml-8">
                                            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                                {ESCALA_OPTIONS.map((option) => (
                                                    <label
                                                        key={option.value}
                                                        className={`flex flex-col items-center justify-center text-center gap-2 rounded-lg border-2 p-3 cursor-pointer transition-all
                                                            ${respostas[pergunta.id]?.nota === option.value
                                                                ? "border-primary bg-primary/5"
                                                                : "border-border hover:border-primary/50"
                                                            }`}
                                                        onClick={() => handleSetNota(pergunta.id, option.value)}
                                                    >
                                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all
                                                            ${respostas[pergunta.id]?.nota === option.value
                                                                ? "border-primary bg-primary"
                                                                : "border-gray-300"
                                                            }`}
                                                        >
                                                            {respostas[pergunta.id]?.nota === option.value && (
                                                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                                            )}
                                                        </div>
                                                        <span className="text-xs font-bold text-text-main">{option.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                            {/* Justificativa */}
                                            <div>
                                                <textarea
                                                    placeholder="Justificativa (opcional)..."
                                                    value={respostas[pergunta.id]?.justificativa || ""}
                                                    onChange={(e) => handleSetJustificativa(pergunta.id, e.target.value)}
                                                    className="w-full rounded-lg border border-border bg-transparent p-3 text-sm
                                                        focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                                                        placeholder:text-gray-300 resize-none h-20"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* MULTIPLA_ESCOLHA */}
                                    {pergunta.tipo === "MULTIPLA_ESCOLHA" && (
                                        <div className="flex flex-col gap-2 ml-8">
                                            {pergunta.opcoes.map((opcao) => (
                                                <label
                                                    key={opcao.id}
                                                    onClick={() => handleSetOpcao(pergunta.id, opcao.id)}
                                                    className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all
                                                        ${respostas[pergunta.id]?.opcaoId === opcao.id
                                                            ? "bg-primary/5 border-primary"
                                                            : "border-border hover:bg-[#fcfbf8]"
                                                        }`}
                                                >
                                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                                                        ${respostas[pergunta.id]?.opcaoId === opcao.id
                                                            ? "border-primary bg-primary"
                                                            : "border-gray-300"
                                                        }`}
                                                    >
                                                        {respostas[pergunta.id]?.opcaoId === opcao.id && (
                                                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                                        )}
                                                    </div>
                                                    <p className="text-sm font-medium text-text-main">{opcao.texto}</p>
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    {/* TEXTO_LIVRE */}
                                    {pergunta.tipo === "TEXTO_LIVRE" && (
                                        <div className="ml-8">
                                            <textarea
                                                placeholder="Escreva aqui sua resposta..."
                                                value={respostas[pergunta.id]?.texto || ""}
                                                onChange={(e) => handleSetTexto(pergunta.id, e.target.value)}
                                                className="w-full rounded-lg border border-border bg-transparent p-4 min-h-[100px] text-sm
                                                    focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                                                    placeholder:text-gray-300 resize-none"
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Navigation Footer */}
                        <div className="p-6 bg-[#fcfbf8] border-t border-border flex items-center justify-between">
                            <button
                                onClick={handlePrev}
                                disabled={currentSectionIndex === 0}
                                className="px-6 py-3 rounded-lg border-2 border-border font-bold text-sm uppercase tracking-widest 
                                    hover:bg-gray-100 transition-all flex items-center gap-2 cursor-pointer
                                    disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={16} />
                                Voltar
                            </button>

                            <div className="flex items-center gap-4">
                                {currentSectionIndex < selectedPCO.secoes.length - 1 ? (
                                    <button
                                        onClick={handleNext}
                                        className="px-8 py-3 rounded-lg bg-primary text-text-main font-bold text-sm uppercase tracking-widest 
                                            shadow-md hover:shadow-lg hover:brightness-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                                    >
                                        Próximo
                                        <ChevronRight size={16} />
                                    </button>
                                ) : (
                                    <Button
                                        size="md"
                                        onClick={handleSubmit}
                                        isLoading={isSubmitting}
                                        icon={<CheckCircle size={18} />}
                                    >
                                        Enviar Respostas
                                    </Button>

                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // =============== PCO LIST ===============
    // Same as before but updated check for validity
    const pcosNaoRespondidas = pcos.filter((p) => !p.jaRespondeu)
    const pcosRespondidas = pcos.filter((p) => p.jaRespondeu)

    return (
        <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-2xl mx-auto pb-12 flex flex-col gap-8">
                {/* Header */}
                <div>
                    <h2 className="text-text-main tracking-tight text-[32px] font-bold leading-tight">
                        Pesquisa de Clima
                    </h2>
                    <p className="text-gray-500 text-base mt-1">
                        Responda às pesquisas organizacionais ativas.
                    </p>
                </div>

                {/* Pending PCOs */}
                {pcosNaoRespondidas.length > 0 ? (
                    <div className="flex flex-col gap-3">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 px-1">
                            Pendentes ({pcosNaoRespondidas.length})
                        </h3>
                        {pcosNaoRespondidas.map((pco) => (
                            <button
                                key={pco.id}
                                onClick={() => handleSelectPCO(pco)}
                                className="bg-bg-card rounded-xl p-6 border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all text-left group cursor-pointer"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-semibold text-text-main group-hover:text-primary transition-colors">
                                            {pco.nome}
                                        </h4>
                                        {pco.descricao && (
                                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{pco.descricao}</p>
                                        )}
                                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                                            <span>
                                                {pco.secoes.reduce((acc, s) => acc + s.perguntas.length, 0)} perguntas
                                            </span>
                                            {pco.dataFim && (
                                                <span>até {new Date(pco.dataFim).toLocaleDateString("pt-BR")}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="bg-primary/20 p-3 rounded-xl">
                                        <ClipboardList size={20} className="text-primary" />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="bg-bg-card rounded-xl p-8 border border-border text-center">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <CheckCircle size={24} className="text-gray-300" />
                        </div>
                        <p className="text-gray-500">Nenhuma pesquisa pendente no momento.</p>
                        <p className="text-gray-400 text-sm mt-1">Você será notificado quando houver uma nova pesquisa.</p>
                    </div>
                )}

                {/* Already answered */}
                {pcosRespondidas.length > 0 && (
                    <div className="flex flex-col gap-3">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 px-1">
                            Respondidas ({pcosRespondidas.length})
                        </h3>
                        {pcosRespondidas.map((pco) => (
                            <div
                                key={pco.id}
                                className="bg-bg-card rounded-xl p-6 border border-border opacity-60"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-semibold text-text-main">{pco.nome}</h4>
                                        <div className="flex items-center gap-2 mt-2 text-xs text-green-600">
                                            <CheckCircle size={14} />
                                            <span>Respondida</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
