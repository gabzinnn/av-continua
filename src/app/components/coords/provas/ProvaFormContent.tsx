"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import CreatableSelect from "react-select/creatable"
import { ArrowLeft, Save, Eye, Send, Plus, GripVertical, Copy, Trash2, ChevronDown, ChevronUp, Image as ImageIcon, Upload, X, Loader2 } from "lucide-react"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"
import { Button } from "@/src/app/components/Button"
import {
    getProvaById,
    createProva,
    updateProva,
    createQuestao,
    updateQuestao,
    deleteQuestao,
    reorderQuestoes,
    getAllProcessosSeletivos,
    createProcessoSeletivo,
    ProvaCompleta,
    ProvaData,
    QuestaoData,
    QuestaoCompleta,
    ProcessoSeletivoSimples
} from "@/src/actions/provasActions"
import { uploadQuestaoImageToCloudinary } from "@/src/actions/uploadActions"
import { StatusProva, TipoQuestao } from "@/src/generated/prisma/client"

interface ProvaFormContentProps {
    mode: "create" | "edit"
    provaId?: number
}

type LocalQuestao = QuestaoCompleta & { isNew?: boolean; isExpanded?: boolean }

type ProcessoOption = {
    value: number | null
    label: string
    __isNew__?: boolean
}

export function ProvaFormContent({ mode, provaId }: ProvaFormContentProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(mode === "edit")
    const [isSaving, setIsSaving] = useState(false)

    // Prova fields
    const [titulo, setTitulo] = useState("")
    const [descricao, setDescricao] = useState("")
    const [tempoLimite, setTempoLimite] = useState<number | "">("")
    const [embaralhar, setEmbaralhar] = useState(false)
    const [status, setStatus] = useState<StatusProva>("RASCUNHO")

    // Processo Seletivo
    const [processosSeletivos, setProcessosSeletivos] = useState<ProcessoSeletivoSimples[]>([])
    const [selectedProcesso, setSelectedProcesso] = useState<ProcessoOption | null>(null)
    const [isLoadingProcessos, setIsLoadingProcessos] = useState(true)

    // Questões
    const [questoes, setQuestoes] = useState<LocalQuestao[]>([])
    const [expandedId, setExpandedId] = useState<number | null>(null)

    useEffect(() => {
        loadProcessosSeletivos()
    }, [])

    useEffect(() => {
        if (mode === "edit" && provaId) {
            loadProva()
        }
    }, [mode, provaId])

    const loadProcessosSeletivos = async () => {
        setIsLoadingProcessos(true)
        const processos = await getAllProcessosSeletivos()
        setProcessosSeletivos(processos)
        setIsLoadingProcessos(false)
    }

    const loadProva = async () => {
        if (!provaId) return
        setIsLoading(true)
        const prova = await getProvaById(provaId)
        if (prova) {
            setTitulo(prova.titulo)
            setDescricao(prova.descricao || "")
            setTempoLimite(prova.tempoLimite || "")
            setEmbaralhar(prova.embaralhar)
            setStatus(prova.status)
            setQuestoes(prova.questoes.map(q => ({ ...q, isExpanded: false })))
            if (prova.processoSeletivo) {
                setSelectedProcesso({
                    value: prova.processoSeletivo.id,
                    label: prova.processoSeletivo.nome
                })
            }
        }
        setIsLoading(false)
    }

    const handleCreateProcesso = async (inputValue: string) => {
        const newProcesso = await createProcessoSeletivo(inputValue)
        const newOption: ProcessoOption = {
            value: newProcesso.id,
            label: newProcesso.nome
        }
        setProcessosSeletivos([...processosSeletivos, { id: newProcesso.id, nome: newProcesso.nome, ativo: true }])
        setSelectedProcesso(newOption)
    }

    const handleSaveProva = async () => {
        setIsSaving(true)
        try {
            const provaData: ProvaData = {
                titulo,
                descricao: descricao || null,
                tempoLimite: tempoLimite ? Number(tempoLimite) : null,
                embaralhar,
                status,
                processoSeletivoId: selectedProcesso?.value || null,
            }

            if (mode === "create") {
                const newProva = await createProva(provaData)
                router.push(`/coord/processo-seletivo/provas/${newProva.id}`)
            } else if (provaId) {
                await updateProva(provaId, provaData)
            }
        } finally {
            setIsSaving(false)
        }
    }

    const handleAddQuestao = async () => {
        if (!provaId) {
            // Save prova first
            const provaData: ProvaData = {
                titulo: titulo || "Nova Prova",
                descricao: descricao || null,
                tempoLimite: tempoLimite ? Number(tempoLimite) : null,
                embaralhar,
                status: "RASCUNHO",
                processoSeletivoId: selectedProcesso?.value || null,
            }
            const newProva = await createProva(provaData)
            router.push(`/coord/processo-seletivo/provas/${newProva.id}`)
            return
        }

        const newQuestao = await createQuestao(provaId, {
            tipo: "MULTIPLA_ESCOLHA",
            enunciado: "",
            pontos: 1,
            ordem: questoes.length + 1,
            alternativas: [
                { texto: "", correta: true, ordem: 1 },
                { texto: "", correta: false, ordem: 2 },
            ]
        })

        setQuestoes([...questoes, { ...newQuestao, isExpanded: true }])
        setExpandedId(newQuestao.id)
    }

    const handleUpdateQuestao = async (questao: LocalQuestao) => {
        const updated = await updateQuestao(questao.id, {
            tipo: questao.tipo,
            enunciado: questao.enunciado,
            pontos: questao.pontos,
            ordem: questao.ordem,
            imagens: questao.imagens?.map(img => img.url) || [],
            alternativas: questao.alternativas.map(a => ({
                id: a.id,
                texto: a.texto,
                correta: a.correta,
                ordem: a.ordem,
            }))
        })

        if (updated) {
            setQuestoes(questoes.map(q => q.id === questao.id ? { ...updated, isExpanded: q.isExpanded } : q))
        }
    }

    const handleDeleteQuestao = async (id: number) => {
        await deleteQuestao(id)
        setQuestoes(questoes.filter(q => q.id !== id))
    }

    const handleDuplicateQuestao = async (questao: LocalQuestao) => {
        if (!provaId) return

        const newQuestao = await createQuestao(provaId, {
            tipo: questao.tipo,
            enunciado: questao.enunciado,
            imagens: questao.imagens?.map(img => img.url) || [],
            pontos: questao.pontos,
            ordem: questoes.length + 1,
            alternativas: questao.alternativas.map(a => ({
                texto: a.texto,
                correta: a.correta,
                ordem: a.ordem,
            }))
        })

        setQuestoes([...questoes, { ...newQuestao, isExpanded: false }])
    }

    const updateLocalQuestao = (id: number, updates: Partial<LocalQuestao>) => {
        setQuestoes(questoes.map(q => q.id === id ? { ...q, ...updates } : q))
    }

    const onDragEnd = async (result: DropResult) => {
        if (!result.destination) return

        const items = Array.from(questoes)
        const [reorderedItem] = items.splice(result.source.index, 1)
        items.splice(result.destination.index, 0, reorderedItem)

        // Update ordem property
        const updatedItems = items.map((item, index) => ({
            ...item,
            ordem: index + 1
        }))

        setQuestoes(updatedItems)

        if (provaId) {
            const reorderPayload = updatedItems.map(q => ({ id: q.id, ordem: q.ordem }))
            await reorderQuestoes(provaId, reorderPayload)
        }
    }

    const pontuacaoTotal = questoes.reduce((acc, q) => acc + q.pontos, 0)

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-gray-500">Carregando...</div>
            </div>
        )
    }

    return (
        <div className="flex-1 overflow-y-auto bg-[#fcfbf8]">
            <div className="max-w-5xl mx-auto px-8 py-10 pb-24">
                {/* Breadcrumbs */}
                <div className="flex flex-wrap gap-2 mb-6 text-sm">
                    <Link href="/coord/home" className="text-text-muted hover:text-primary font-medium transition-colors">Home</Link>
                    <span className="text-text-muted">/</span>
                    <Link href="/coord/processo-seletivo/provas" className="text-text-muted hover:text-primary font-medium transition-colors">Provas</Link>
                    <span className="text-text-muted">/</span>
                    <span className="text-text-main font-medium">{mode === "create" ? "Nova Prova" : "Edição"}</span>
                </div>

                {/* Page Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-text-main text-3xl font-black leading-tight tracking-tight">
                            {mode === "create" ? "Nova Prova" : "Edição de Prova"}
                        </h1>
                        <p className="text-text-muted text-sm">
                            {mode === "create" ? "Configure sua nova prova" : "Gerencie conteúdo e configurações"}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/coord/processo-seletivo/provas">
                            <button className="flex items-center justify-center h-10 px-4 rounded-lg border border-border bg-white text-text-main text-sm font-bold hover:bg-gray-50 transition-colors cursor-pointer">
                                <ArrowLeft size={18} className="mr-2" />
                                Voltar
                            </button>
                        </Link>
                        <Button onClick={handleSaveProva} disabled={isSaving} icon={<Save size={18} />}>
                            {isSaving ? "Salvando..." : "Salvar"}
                        </Button>
                    </div>
                </div>

                {/* Configurações da Prova */}
                <div className="bg-white rounded-xl shadow-sm border border-border p-6 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                    <h2 className="text-lg font-bold text-text-main mb-6 flex items-center gap-2">
                        Configurações da Prova
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Título */}
                        <div className="lg:col-span-2">
                            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                                Título da Prova
                            </label>
                            <input
                                type="text"
                                value={titulo}
                                onChange={(e) => setTitulo(e.target.value)}
                                placeholder="Ex: Avaliação Técnica Q3 2024"
                                className="w-full rounded-lg border border-border px-4 bg-gray-50 text-text-main focus:border-primary focus:ring-primary h-11 transition-colors font-medium outline-none"
                            />
                        </div>

                        {/* Processo Seletivo */}
                        <div className="lg:col-span-1">
                            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                                Processo Seletivo
                            </label>
                            <CreatableSelect
                                isClearable
                                isLoading={isLoadingProcessos}
                                options={processosSeletivos.map(p => ({ value: p.id, label: p.nome }))}
                                value={selectedProcesso}
                                onChange={(newValue) => setSelectedProcesso(newValue as ProcessoOption | null)}
                                onCreateOption={handleCreateProcesso}
                                placeholder="Selecione ou crie..."
                                formatCreateLabel={(inputValue) => `Criar "${inputValue}"`}
                                noOptionsMessage={() => "Nenhum processo encontrado"}
                                loadingMessage={() => "Carregando..."}
                                styles={{
                                    control: (base, state) => ({
                                        ...base,
                                        minHeight: '44px',
                                        backgroundColor: '#f9fafb',
                                        borderColor: state.isFocused ? '#fad519' : '#e5e7eb',
                                        borderRadius: '0.5rem',
                                        boxShadow: state.isFocused ? '0 0 0 1px #fad519' : 'none',
                                        '&:hover': {
                                            borderColor: '#fad519'
                                        }
                                    }),
                                    option: (base, state) => ({
                                        ...base,
                                        backgroundColor: state.isSelected ? '#fad519' : state.isFocused ? '#fef9e7' : 'white',
                                        color: '#1f2937',
                                        cursor: 'pointer'
                                    }),
                                    menu: (base) => ({
                                        ...base,
                                        borderRadius: '0.5rem',
                                        overflow: 'hidden'
                                    }),
                                    placeholder: (base) => ({
                                        ...base,
                                        color: '#9ca3af'
                                    }),
                                    singleValue: (base) => ({
                                        ...base,
                                        color: '#1f2937'
                                    })
                                }}
                            />
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                                Status
                            </label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as StatusProva)}
                                className="w-full rounded-lg border border-border px-4 bg-gray-50 text-text-main focus:border-primary focus:ring-primary h-11 cursor-pointer outline-none"
                            >
                                <option value="RASCUNHO">Rascunho</option>
                                <option value="PUBLICADA">Publicada</option>
                                <option value="ENCERRADA">Encerrada</option>
                            </select>
                        </div>

                        {/* Descrição */}
                        <div className="lg:col-span-4">
                            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                                Descrição / Instruções
                            </label>
                            <textarea
                                value={descricao}
                                onChange={(e) => setDescricao(e.target.value)}
                                placeholder="Instruções para os candidatos..."
                                rows={3}
                                className="w-full rounded-lg border border-border p-4 bg-gray-50 text-text-main focus:border-primary focus:ring-primary min-h-[80px] text-sm resize-y outline-none"
                            />
                        </div>

                        {/* Tempo Limite */}
                        <div>
                            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                                Tempo Limite (min)
                            </label>
                            <input
                                type="number"
                                value={tempoLimite}
                                onChange={(e) => setTempoLimite(e.target.value ? Number(e.target.value) : "")}
                                placeholder="90"
                                className="w-full rounded-lg border border-border px-4 bg-gray-50 text-text-main focus:border-primary focus:ring-primary h-11 outline-none"
                            />
                        </div>

                        {/* Pontuação Total (readonly) */}
                        <div>
                            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                                Pontuação Total
                            </label>
                            <input
                                type="text"
                                value={pontuacaoTotal.toFixed(1)}
                                readOnly
                                className="w-full rounded-lg border border-border px-4 bg-gray-100 text-text-main h-11 cursor-not-allowed outline-none"
                            />
                        </div>

                        {/* Embaralhar */}
                        <div className="lg:col-span-2 flex items-center h-full pt-6">
                            <label className="inline-flex items-center cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={embaralhar}
                                    onChange={(e) => setEmbaralhar(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                <span className="ms-3 text-sm font-medium text-text-main group-hover:text-primary transition-colors">
                                    Embaralhar ordem das questões
                                </span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Lista de Questões */}
                <div className="flex items-end justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-text-main">Questões da Prova</h2>
                        <p className="text-text-muted text-sm mt-1">
                            Total: {questoes.length} questões • {pontuacaoTotal.toFixed(1)} pontos
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId="questoes-list">
                            {(provided) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className="space-y-4"
                                >
                                    {questoes.map((questao, index) => (
                                        <Draggable
                                            key={questao.id}
                                            draggableId={String(questao.id)}
                                            index={index}
                                            isDragDisabled={expandedId === questao.id} // Disable drag when editing
                                        >
                                            {(provided, snapshot) => (
                                                <QuestaoEditor
                                                    innerRef={provided.innerRef}
                                                    draggableProps={provided.draggableProps}
                                                    dragHandleProps={provided.dragHandleProps}
                                                    isDragging={snapshot.isDragging}
                                                    questao={questao}
                                                    index={index}
                                                    isExpanded={expandedId === questao.id}
                                                    onToggleExpand={() => setExpandedId(expandedId === questao.id ? null : questao.id)}
                                                    onUpdate={(updates) => updateLocalQuestao(questao.id, updates)}
                                                    onSave={() => handleUpdateQuestao(questao)}
                                                    onDelete={() => handleDeleteQuestao(questao.id)}
                                                    onDuplicate={() => handleDuplicateQuestao(questao)}
                                                />
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>

                    {/* Add Question Button */}
                    <div className="pt-4">
                        <button
                            onClick={handleAddQuestao}
                            className="w-full border-2 border-dashed border-gray-300 rounded-xl p-4 flex items-center justify-center gap-3 text-text-muted hover:text-primary hover:border-primary hover:bg-primary/5 transition-all group h-16 cursor-pointer"
                        >
                            <Plus size={24} className="group-hover:scale-110 transition-transform" />
                            <span className="font-bold text-lg">Adicionar Nova Questão</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ==========================================
// QuestaoEditor Component
// ==========================================

interface QuestaoEditorProps {
    questao: LocalQuestao
    index: number
    isExpanded: boolean
    onToggleExpand: () => void
    onUpdate: (updates: Partial<LocalQuestao>) => void
    onSave: () => void
    onDelete: () => void
    onDuplicate: () => void
    innerRef?: (element: HTMLElement | null) => void
    draggableProps?: any
    dragHandleProps?: any
    isDragging?: boolean
}

function QuestaoEditor({
    questao,
    index,
    isExpanded,
    onToggleExpand,
    onUpdate,
    onSave,
    onDelete,
    onDuplicate,
    innerRef,
    draggableProps,
    dragHandleProps,
    isDragging
}: QuestaoEditorProps) {
    const tipoLabels: Record<TipoQuestao, string> = {
        MULTIPLA_ESCOLHA: "Múltipla Escolha",
        DISSERTATIVA: "Dissertativa",
        VERDADEIRO_FALSO: "V/F"
    }

    const handleAlternativaChange = (altIndex: number, field: string, value: string | boolean) => {
        const newAlternativas = [...questao.alternativas]
        if (field === "correta" && value === true) {
            // Uncheck others
            newAlternativas.forEach((a, i) => {
                a.correta = i === altIndex
            })
        } else {
            (newAlternativas[altIndex] as Record<string, unknown>)[field] = value
        }
        onUpdate({ alternativas: newAlternativas })
    }

    const handleAddAlternativa = () => {
        const newAlternativas = [
            ...questao.alternativas,
            {
                id: Date.now(), // temp id
                questaoId: questao.id,
                texto: "",
                correta: false,
                ordem: questao.alternativas.length + 1
            }
        ]
        onUpdate({ alternativas: newAlternativas })
    }

    const handleRemoveAlternativa = (altIndex: number) => {
        const newAlternativas = questao.alternativas.filter((_, i) => i !== altIndex)
        onUpdate({ alternativas: newAlternativas })
    }

    const letters = ["A", "B", "C", "D", "E", "F", "G", "H"]

    return (
        <div
            ref={innerRef}
            {...draggableProps}
            style={{ ...draggableProps?.style }}
            className={`bg-white rounded-xl shadow-sm border ${isExpanded ? "border-2 border-primary/50" : "border-border"} ${isDragging ? "shadow-lg ring-2 ring-primary/20 z-10" : "hover:shadow-md"} transition-shadow`}
        >
            {/* Header */}
            <div
                className={`flex items-center justify-between p-4 ${isExpanded ? "bg-primary/10 border-b border-border" : ""} cursor-pointer`}
                onClick={onToggleExpand}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-gray-300 hover:text-gray-500">
                        <GripVertical size={20} />
                    </div>
                    <div className={`${isExpanded ? "bg-primary text-text-main" : "bg-gray-100 text-text-muted"} font-bold w-8 h-8 rounded-full flex items-center justify-center text-sm`}>
                        {index + 1}
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-text-muted bg-gray-50 px-2 py-1 rounded border border-border whitespace-nowrap">
                        {tipoLabels[questao.tipo]}
                    </span>
                    <h3 className="text-text-main font-medium truncate max-w-xs md:max-w-md">
                        {questao.enunciado || "Nova questão..."}
                    </h3>
                </div>
                <div className="flex items-center gap-2 pl-2">
                    <span className="text-xs font-bold text-text-muted whitespace-nowrap mr-2">{questao.pontos} pts</span>
                    <div className="flex gap-1">
                        <button
                            onClick={(e) => { e.stopPropagation(); onDuplicate() }}
                            className="p-2 text-gray-400 hover:text-primary rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                            title="Duplicar"
                        >
                            <Copy size={18} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete() }}
                            className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors cursor-pointer"
                            title="Excluir"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                    <button className="p-2 text-text-main rounded-full hover:bg-gray-100 transition-colors cursor-pointer">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                </div>
            </div>

            {/* Editor Body */}
            {isExpanded && (
                <div className="p-6 space-y-6">
                    {/* Tipo */}
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                                Tipo de Questão
                            </label>
                            <select
                                value={questao.tipo}
                                onChange={(e) => onUpdate({ tipo: e.target.value as TipoQuestao })}
                                className="w-full rounded-lg border border-border px-4 bg-gray-50 text-text-main focus:border-primary focus:ring-primary h-10 cursor-pointer outline-none"
                            >
                                <option value="MULTIPLA_ESCOLHA">Múltipla Escolha</option>
                                <option value="DISSERTATIVA">Dissertativa</option>
                                <option value="VERDADEIRO_FALSO">Verdadeiro/Falso</option>
                            </select>
                        </div>
                        <div className="w-32">
                            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                                Pontos
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={questao.pontos}
                                onChange={(e) => onUpdate({ pontos: parseFloat(e.target.value) || 0 })}
                                className="w-full rounded-lg border border-border px-2 bg-gray-50 text-text-main focus:border-primary focus:ring-primary h-10 text-center font-bold outline-none"
                            />
                        </div>
                    </div>

                    {/* Enunciado */}
                    <div>
                        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                            Enunciado
                        </label>
                        <textarea
                            value={questao.enunciado}
                            onChange={(e) => onUpdate({ enunciado: e.target.value })}
                            placeholder="Digite a pergunta aqui..."
                            rows={3}
                            className="w-full rounded-lg border border-border p-4 bg-gray-50 text-text-main focus:border-primary focus:ring-primary min-h-[100px] text-base outline-none"
                        />
                    </div>

                    {/* Images Upload */}
                    <ImageUploader
                        imageUrls={questao.imagens?.map(i => i.url) || []}
                        onImagesChange={(urls) => onUpdate({
                            imagens: urls.map((url, i) => ({ id: i, url, ordem: i }))
                        })}
                    />

                    {/* Alternativas (only for multiple choice) */}
                    {questao.tipo === "MULTIPLA_ESCOLHA" && (
                        <div>
                            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                                Alternativas
                            </label>
                            <div className="space-y-3">
                                {questao.alternativas.map((alt, altIndex) => (
                                    <div key={alt.id} className="flex items-center gap-3 group">
                                        <input
                                            type="radio"
                                            name={`q${questao.id}_correct`}
                                            checked={alt.correta}
                                            onChange={() => handleAlternativaChange(altIndex, "correta", true)}
                                            className="w-5 h-5 text-primary focus:ring-primary border-gray-300 cursor-pointer"
                                        />
                                        <div className={`flex items-center justify-center w-8 h-8 rounded text-sm font-bold ${alt.correta ? "bg-green-100 text-green-700 border border-green-200" : "bg-gray-100 text-text-muted"}`}>
                                            {letters[altIndex]}
                                        </div>
                                        <input
                                            type="text"
                                            value={alt.texto}
                                            onChange={(e) => handleAlternativaChange(altIndex, "texto", e.target.value)}
                                            placeholder="Texto da alternativa..."
                                            className={`flex-1 rounded-lg border ${alt.correta ? "border-green-300 bg-green-50" : "border-border bg-white"} px-4 text-text-main focus:border-primary focus:ring-primary h-10 outline-none`}
                                        />
                                        <button
                                            onClick={() => handleRemoveAlternativa(altIndex)}
                                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity cursor-pointer p-1"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={handleAddAlternativa}
                                    className="text-sm text-primary font-bold hover:underline pl-11 flex items-center gap-1 mt-2 cursor-pointer"
                                >
                                    <Plus size={16} />
                                    Adicionar alternativa
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex justify-end pt-4 border-t border-border">
                        <Button onClick={onSave} icon={<Save size={16} />}>
                            Salvar Questão
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

// ==========================================
// ImageUploader Component
// ==========================================

interface ImageUploaderProps {
    imageUrls: string[]
    onImagesChange: (urls: string[]) => void
}

function ImageUploader({ imageUrls, onImagesChange }: ImageUploaderProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            await handleFiles(Array.from(e.dataTransfer.files))
        }
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            await handleFiles(Array.from(e.target.files))
        }
    }

    const handleFiles = async (files: File[]) => {
        setIsUploading(true)
        const validFiles = files.filter(f => ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(f.type))

        if (validFiles.length === 0) {
            alert("Nenhum arquivo de imagem válido selecionado.")
            setIsUploading(false)
            return
        }

        try {
            const newUrls: string[] = []

            for (const file of validFiles) {
                const formData = new FormData()
                formData.append("file", file)

                const result = await uploadQuestaoImageToCloudinary(formData)

                if (result.success && result.url) {
                    newUrls.push(result.url)
                } else {
                    console.error(`Erro ao fazer upload de ${file.name}:`, result.error)
                }
            }

            if (newUrls.length > 0) {
                onImagesChange([...imageUrls, ...newUrls])
            }
        } catch (error) {
            console.error("Upload error:", error)
            alert("Erro ao fazer upload das imagens")
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        }
    }

    const handleRemoveImage = (index: number) => {
        const newUrls = [...imageUrls]
        newUrls.splice(index, 1)
        onImagesChange(newUrls)
    }

    return (
        <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                Imagens (opcional)
            </label>

            <div className="space-y-4">
                {imageUrls.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {imageUrls.map((url, index) => (
                            <div key={index} className="relative aspect-video rounded-lg border border-border overflow-hidden bg-gray-50 group">
                                <Image
                                    src={url}
                                    alt={`Imagem ${index + 1}`}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 50vw, 25vw"
                                />
                                <button
                                    onClick={() => handleRemoveImage(index)}
                                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm cursor-pointer"
                                    title="Remover imagem"
                                >
                                    <X size={14} />
                                </button>
                                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] p-1 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    Imagem {index + 1}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                        border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                        transition-all duration-200 flex flex-col items-center justify-center gap-2
                        ${dragActive
                            ? "border-primary bg-primary/10 scale-[1.01]"
                            : "border-gray-300 hover:border-primary hover:bg-primary/5"
                        }
                        ${isUploading ? "pointer-events-none opacity-50" : ""}
                    `}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    {isUploading ? (
                        <>
                            <Loader2 size={24} className="text-primary animate-spin" />
                            <span className="text-sm text-text-muted">Enviando imagens...</span>
                        </>
                    ) : (
                        <>
                            <div className="p-2 bg-gray-100 rounded-full">
                                <Upload size={20} className="text-text-muted" />
                            </div>
                            <div>
                                <span className="text-sm font-medium text-text-main">
                                    Adicionar imagens
                                </span>
                                <p className="text-xs text-text-muted mt-0.5">
                                    Arraste ou clique (JPG, PNG, GIF)
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
