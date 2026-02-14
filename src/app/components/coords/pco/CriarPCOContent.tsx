"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, X, GripVertical, ChevronDown, ChevronUp, ArrowLeft, FolderPlus } from "lucide-react"
import { Button } from "@/src/app/components/Button"
import { criarPCO, CriarPCOInput } from "@/src/actions/pcoActions"

interface PerguntaForm {
    texto: string
    tipo: "ESCALA" | "MULTIPLA_ESCOLHA" | "TEXTO_LIVRE"
    opcoes: string[]
    expanded: boolean
}

interface SecaoForm {
    titulo: string
    descricao: string
    perguntas: PerguntaForm[]
    expanded: boolean
}

export function CriarPCOContent() {
    const router = useRouter()
    const [nome, setNome] = useState("")
    const [descricao, setDescricao] = useState("")
    const [secoes, setSecoes] = useState<SecaoForm[]>([
        {
            titulo: "Seção 1",
            descricao: "",
            perguntas: [{ texto: "", tipo: "ESCALA", opcoes: [], expanded: true }],
            expanded: true
        }
    ])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState("")

    // --- Seção handlers ---
    const handleAddSecao = () => {
        setSecoes([...secoes, {
            titulo: `Seção ${secoes.length + 1}`,
            descricao: "",
            perguntas: [{ texto: "", tipo: "ESCALA", opcoes: [], expanded: true }],
            expanded: true
        }])
    }

    const handleRemoveSecao = (index: number) => {
        if (secoes.length <= 1) return
        setSecoes(secoes.filter((_, i) => i !== index))
    }

    const handleSecaoChange = (index: number, field: keyof SecaoForm, value: string | boolean) => {
        const updated = [...secoes]
        if (field === "titulo" || field === "descricao") {
            (updated[index] as any)[field] = value
        } else if (field === "expanded") {
            updated[index].expanded = value as boolean
        }
        setSecoes(updated)
    }

    const toggleSecaoExpanded = (index: number) => {
        handleSecaoChange(index, "expanded", !secoes[index].expanded)
    }

    // --- Pergunta handlers (dentro de seção) ---
    const handleAddPergunta = (secaoIndex: number) => {
        const updated = [...secoes]
        updated[secaoIndex].perguntas.push({ texto: "", tipo: "ESCALA", opcoes: [], expanded: true })
        setSecoes(updated)
    }

    const handleRemovePergunta = (secaoIndex: number, perguntaIndex: number) => {
        const updated = [...secoes]
        if (updated[secaoIndex].perguntas.length <= 1) return
        updated[secaoIndex].perguntas = updated[secaoIndex].perguntas.filter((_, i) => i !== perguntaIndex)
        setSecoes(updated)
    }

    const handlePerguntaChange = (secaoIndex: number, perguntaIndex: number, field: keyof PerguntaForm, value: string | boolean) => {
        const updated = [...secoes]
        const pergunta = updated[secaoIndex].perguntas[perguntaIndex]

        if (field === "tipo") {
            pergunta.tipo = value as PerguntaForm["tipo"]
            if (value !== "MULTIPLA_ESCOLHA") {
                pergunta.opcoes = []
            } else if (pergunta.opcoes.length === 0) {
                pergunta.opcoes = ["", ""]
            }
        } else if (field === "texto") {
            pergunta.texto = value as string
        } else if (field === "expanded") {
            pergunta.expanded = value as boolean
        }
        setSecoes(updated)
    }

    const togglePerguntaExpanded = (secaoIndex: number, perguntaIndex: number) => {
        handlePerguntaChange(secaoIndex, perguntaIndex, "expanded", !secoes[secaoIndex].perguntas[perguntaIndex].expanded)
    }

    const handleAddOpcao = (secaoIndex: number, perguntaIndex: number) => {
        const updated = [...secoes]
        updated[secaoIndex].perguntas[perguntaIndex].opcoes.push("")
        setSecoes(updated)
    }

    const handleRemoveOpcao = (secaoIndex: number, perguntaIndex: number, opcaoIndex: number) => {
        const updated = [...secoes]
        const pergunta = updated[secaoIndex].perguntas[perguntaIndex]
        if (pergunta.opcoes.length <= 2) return
        pergunta.opcoes = pergunta.opcoes.filter((_, i) => i !== opcaoIndex)
        setSecoes(updated)
    }

    const handleOpcaoChange = (secaoIndex: number, perguntaIndex: number, opcaoIndex: number, value: string) => {
        const updated = [...secoes]
        updated[secaoIndex].perguntas[perguntaIndex].opcoes[opcaoIndex] = value
        setSecoes(updated)
    }

    // --- Submit ---
    const handleSubmit = async () => {
        setError("")

        if (!nome.trim()) {
            setError("Preencha o título da pesquisa.")
            return
        }

        // Validate sections
        const secoesValidas = secoes.map(s => ({
            ...s,
            titulo: s.titulo.trim(),
            perguntas: s.perguntas.filter(p => p.texto.trim())
        })).filter(s => s.titulo)

        if (secoesValidas.length === 0) {
            setError("Adicione pelo menos uma seção com título.")
            return
        }

        for (const s of secoesValidas) {
            if (s.perguntas.length === 0) {
                setError(`A seção "${s.titulo}" precisa ter pelo menos uma pergunta.`)
                return
            }
            for (const p of s.perguntas) {
                if (p.tipo === "MULTIPLA_ESCOLHA") {
                    const opcoesValidas = p.opcoes.filter(o => o.trim())
                    if (opcoesValidas.length < 2) {
                        setError(`A pergunta "${p.texto}" precisa de pelo menos 2 opções.`)
                        return
                    }
                }
            }
        }

        setIsSubmitting(true)

        const input: CriarPCOInput = {
            nome: nome.trim(),
            descricao: descricao.trim() || undefined,
            secoes: secoesValidas.map((s, sIndex) => ({
                titulo: s.titulo,
                descricao: s.descricao || undefined,
                ordem: sIndex + 1,
                perguntas: s.perguntas.map((p) => ({
                    texto: p.texto,
                    tipo: p.tipo,
                    opcoes: p.tipo === "MULTIPLA_ESCOLHA" ? p.opcoes.filter(o => o.trim()) : undefined
                }))
            }))
        }

        const result = await criarPCO(input)

        if (result.success) {
            router.push("/coord/pco")
        } else {
            setError(result.error || "Erro ao criar pesquisa.")
        }

        setIsSubmitting(false)
    }

    const perguntasTotal = secoes.reduce((acc, s) => acc + s.perguntas.filter(p => p.texto.trim()).length, 0)

    return (
        <div className="flex-1 overflow-y-auto pb-24">
            {/* Header */}
            <div className="bg-bg-main border-b border-border">
                <div className="px-8 py-6 max-w-[960px] mx-auto w-full flex flex-col gap-4">
                    {/* Back nav */}
                    <button
                        onClick={() => router.push("/coord/pco")}
                        className="flex items-center gap-2 text-sm text-text-muted hover:text-primary transition-colors cursor-pointer self-start"
                    >
                        <ArrowLeft size={16} />
                        Voltar para PCOs
                    </button>

                    {/* Title */}
                    <div className="flex flex-wrap justify-between items-end gap-4">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-text-main text-3xl font-bold tracking-tight">Criar nova PCO</h1>
                            <p className="text-text-muted text-base">Configure sua Pesquisa de Clima Organizacional</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form Content */}
            <div className="px-8 pt-8">
                <div className="max-w-[960px] mx-auto w-full">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
                            {error}
                        </div>
                    )}

                    <div className="bg-bg-card rounded-xl shadow-sm border border-border overflow-hidden mb-6">
                        {/* Section: Dados Gerais */}
                        <div className="p-8 border-b border-gray-100">
                            <div className="flex items-center gap-2 mb-6">
                                <span className="text-primary text-lg">ℹ️</span>
                                <h2 className="text-text-main text-xl font-bold">Dados Gerais</h2>
                            </div>
                            <div className="space-y-6">
                                {/* Nome */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-text-main text-sm font-bold">Título da Pesquisa</label>
                                    <input
                                        type="text"
                                        value={nome}
                                        onChange={(e) => setNome(e.target.value)}
                                        placeholder="Ex: Pesquisa de Clima Q1 - 2026"
                                        className="w-full rounded-lg border border-border bg-transparent p-4 text-text-main focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                                    />
                                </div>

                                {/* Descrição */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-text-main text-sm font-bold">Descrição / Instruções</label>
                                    <textarea
                                        value={descricao}
                                        onChange={(e) => setDescricao(e.target.value)}
                                        placeholder="Dê orientações claras aos colaboradores sobre como responder..."
                                        className="w-full min-h-[120px] rounded-lg border border-border bg-transparent p-4 text-text-main focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-text-main">Estrutura da Pesquisa</h2>
                        <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                            {secoes.length} seções • {perguntasTotal} perguntas
                        </span>
                    </div>

                    {/* Rendering Sections */}
                    <div className="space-y-6">
                        {secoes.map((secao, sIndex) => (
                            <div key={sIndex} className="bg-bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                                {/* Section Header */}
                                <div className="bg-gray-50 p-4 border-b border-border flex items-start gap-4">
                                    <div className="mt-2 text-text-muted cursor-grab">
                                        <GripVertical size={20} />
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <input
                                            type="text"
                                            value={secao.titulo}
                                            onChange={(e) => handleSecaoChange(sIndex, "titulo", e.target.value)}
                                            placeholder={`Título da Seção ${sIndex + 1}`}
                                            className="w-full bg-transparent text-lg font-bold text-text-main placeholder:text-text-muted/50 border-none p-0 focus:ring-0 outline-none"
                                        />
                                        <input
                                            type="text"
                                            value={secao.descricao}
                                            onChange={(e) => handleSecaoChange(sIndex, "descricao", e.target.value)}
                                            placeholder="Descrição opcional da seção..."
                                            className="w-full bg-transparent text-sm text-text-muted placeholder:text-text-muted/50 border-none p-0 focus:ring-0 outline-none"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleRemoveSecao(sIndex)}
                                            disabled={secoes.length <= 1}
                                            className="text-text-muted hover:text-red-500 transition-colors disabled:opacity-30 cursor-pointer p-2"
                                            title="Remover seção"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => toggleSecaoExpanded(sIndex)}
                                            className="text-text-muted hover:text-primary transition-colors cursor-pointer p-2"
                                        >
                                            {secao.expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Section Content (Questions) */}
                                {secao.expanded && (
                                    <div className="p-6 bg-[#fcfbf8]">
                                        <div className="space-y-4">
                                            {secao.perguntas.map((pergunta, pIndex) => (
                                                <div
                                                    key={pIndex}
                                                    className={`flex flex-col bg-white rounded-lg overflow-hidden transition-all ${pergunta.expanded
                                                        ? "border-2 border-primary shadow-md"
                                                        : "border border-border"
                                                        }`}
                                                >
                                                    {/* Question header row */}
                                                    <div className={`flex items-center gap-3 p-4 ${pergunta.expanded ? "border-b border-gray-100" : ""}`}>
                                                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-bold text-text-muted">
                                                            {pIndex + 1}
                                                        </div>
                                                        <div className="flex-1">
                                                            <input
                                                                type="text"
                                                                value={pergunta.texto}
                                                                onChange={(e) => handlePerguntaChange(sIndex, pIndex, "texto", e.target.value)}
                                                                placeholder="Texto da pergunta..."
                                                                className="w-full bg-transparent border-none p-0 focus:ring-0 text-text-main font-medium placeholder:text-text-muted outline-none"
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <select
                                                                value={pergunta.tipo}
                                                                onChange={(e) => handlePerguntaChange(sIndex, pIndex, "tipo", e.target.value)}
                                                                className="rounded-lg border border-border bg-transparent text-sm text-text-main focus:ring-1 focus:ring-primary py-1.5 px-3 cursor-pointer outline-none"
                                                            >
                                                                <option value="ESCALA">Escala de Concordância</option>
                                                                <option value="MULTIPLA_ESCOLHA">Múltipla Escolha</option>
                                                                <option value="TEXTO_LIVRE">Texto Livre</option>
                                                            </select>
                                                            <button
                                                                onClick={() => handleRemovePergunta(sIndex, pIndex)}
                                                                disabled={secao.perguntas.length <= 1}
                                                                className="text-text-muted hover:text-red-500 transition-colors disabled:opacity-30 cursor-pointer p-1"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => togglePerguntaExpanded(sIndex, pIndex)}
                                                                className="text-text-muted hover:text-primary transition-colors cursor-pointer p-1"
                                                            >
                                                                {pergunta.expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Expanded content (options for multiple choice) */}
                                                    {pergunta.expanded && pergunta.tipo === "MULTIPLA_ESCOLHA" && (
                                                        <div className="p-6 bg-[#fcfbf8] space-y-3">
                                                            {pergunta.opcoes.map((opcao, oIndex) => (
                                                                <div key={oIndex} className="flex items-center gap-3">
                                                                    <span className="text-text-muted text-sm">○</span>
                                                                    <input
                                                                        type="text"
                                                                        value={opcao}
                                                                        onChange={(e) => handleOpcaoChange(sIndex, pIndex, oIndex, e.target.value)}
                                                                        placeholder={`Opção ${oIndex + 1}`}
                                                                        className="flex-1 bg-transparent border-b border-border p-1 text-sm text-text-main focus:border-primary outline-none transition-all"
                                                                    />
                                                                    <button
                                                                        onClick={() => handleRemoveOpcao(sIndex, pIndex, oIndex)}
                                                                        disabled={pergunta.opcoes.length <= 2}
                                                                        className="text-text-muted hover:text-red-400 disabled:opacity-30 cursor-pointer"
                                                                    >
                                                                        <X size={16} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            <button
                                                                onClick={() => handleAddOpcao(sIndex, pIndex)}
                                                                className="flex items-center gap-2 text-sm font-bold text-primary hover:underline cursor-pointer mt-1"
                                                            >
                                                                <Plus size={16} />
                                                                Adicionar opção
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Expanded preview for other types */}
                                                    {pergunta.expanded && pergunta.tipo === "ESCALA" && (
                                                        <div className="p-6 bg-[#fcfbf8]">
                                                            <p className="text-sm text-text-muted mb-3">Pré-visualização das opções:</p>
                                                            <div className="flex flex-col gap-2">
                                                                {[
                                                                    { label: "Concordo", value: "+2" },
                                                                    { label: "Concordo parcialmente", value: "+1" },
                                                                    { label: "Discordo parcialmente", value: "-1" },
                                                                    { label: "Discordo", value: "-2" },
                                                                    { label: "Não consigo responder", value: "0" },
                                                                ].map((opt) => (
                                                                    <div
                                                                        key={opt.value}
                                                                        className="flex items-center justify-between bg-white rounded-lg border border-border px-4 py-2.5"
                                                                    >
                                                                        <span className="text-sm text-text-main">{opt.label}</span>
                                                                        <span className="text-xs font-mono text-text-muted bg-gray-100 px-2 py-0.5 rounded">
                                                                            valor: {opt.value}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <p className="text-xs text-text-muted mt-3 italic">
                                                                Os valores numéricos são visíveis apenas para coordenadores. O aluno verá somente os rótulos de texto + campo de justificativa.
                                                            </p>
                                                        </div>
                                                    )}

                                                    {pergunta.expanded && pergunta.tipo === "TEXTO_LIVRE" && (
                                                        <div className="p-6 bg-[#fcfbf8]">
                                                            <p className="text-sm text-text-muted mb-3">Pré-visualização:</p>
                                                            <div className="w-full h-16 rounded-lg border border-dashed border-border bg-white"></div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                            {/* Add question button */}
                                            <button
                                                onClick={() => handleAddPergunta(sIndex)}
                                                className="w-full py-3 mt-2 border border-dashed border-border rounded-lg flex items-center justify-center gap-2 text-text-muted hover:text-primary hover:border-primary transition-all cursor-pointer group bg-white"
                                            >
                                                <Plus size={18} className="text-text-muted group-hover:text-primary transition-colors" />
                                                <span className="font-medium text-sm">Adicionar pergunta nesta seção</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Add Section Button */}
                        <button
                            onClick={handleAddSecao}
                            className="w-full py-6 mt-6 border-2 border-dashed border-primary/30 rounded-xl flex items-center justify-center gap-3 text-primary/70 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group"
                        >
                            <FolderPlus size={24} className="group-hover:scale-110 transition-transform" />
                            <span className="font-bold text-lg">Adicionar Nova Seção</span>
                        </button>
                    </div>

                </div>
            </div>

            {/* Sticky Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-border px-8 py-4 z-50">
                <div className="max-w-[960px] mx-auto flex items-center justify-between">
                    <div className="hidden md:flex flex-col">
                        <p className="text-[10px] uppercase font-bold text-text-muted tracking-widest">Status</p>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                            <span className="text-sm font-medium text-text-main">Editando rascunho</span>
                        </div>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <Button
                            variant="outline"
                            size="md"
                            onClick={() => router.push("/coord/pco")}
                        >
                            Cancelar
                        </Button>
                        <Button
                            size="md"
                            onClick={handleSubmit}
                            isLoading={isSubmitting}
                        >
                            Criar Pesquisa
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
