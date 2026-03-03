"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { 
    getAvaliacao360ById, 
    salvarRascunhoAvaliacao360, 
    type SaveAvaliacaoFullPayload,
    ativarAvaliacao360
} from "@/src/actions/avaliacao360Actions"
import type { TipoPergunta360 } from "@/src/generated/prisma/client"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"
import { ChevronRight, GripVertical, PlusCircle, Trash2, Save, Send } from "lucide-react"
import Link from "next/link"

type LocalPergunta = {
    idLocal: string; // ID apenas para renderização e drag-drop
    id?: number;
    texto: string;
    tipo: TipoPergunta360;
    obrigatoria: boolean;
}

type LocalDimensao = {
    idLocal: string;
    id?: number;
    titulo: string;
    peso: number;
    perguntas: LocalPergunta[];
}

export function Avaliacoes360Editor({ id }: { id: number }) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [nome, setNome] = useState("")
    
    // Estado local das dimensões para ser manipulado livremente
    const [dimensoes, setDimensoes] = useState<LocalDimensao[]>([])
    const [activeDimId, setActiveDimId] = useState<string | null>(null)

    useEffect(() => {
        const fetchAvaliacao = async () => {
            const data = await getAvaliacao360ById(id)
            if (data) {
                setNome(data.nome)
                const dims: LocalDimensao[] = data.dimensoes.map(d => ({
                    idLocal: `dim-${d.id || Math.random()}`,
                    id: d.id,
                    titulo: d.titulo,
                    peso: d.peso ? Number(d.peso) : 0,
                    perguntas: d.perguntas.map(p => ({
                        idLocal: `perg-${p.id || Math.random()}`,
                        id: p.id,
                        texto: p.texto,
                        tipo: p.tipo,
                        obrigatoria: p.obrigatoria
                    }))
                }))
                
                // Se estiver vazio, já joga uma dimensão fake pra UI não ficar feia
                if (dims.length === 0) {
                     const fakeId = `dim-${Date.now()}`
                     dims.push({ idLocal: fakeId, titulo: "Nova Dimensão", peso: 100, perguntas: [] })
                }

                setDimensoes(dims)
                if (dims.length > 0) setActiveDimId(dims[0].idLocal)
            }
            setIsLoading(false)
        }
        fetchAvaliacao()
    }, [id])

    // ============================================
    // HANDLERS GERAIS
    // ============================================

    const handleSalvar = async (redirecionarParaDash = false) => {
        setIsSaving(true)
        const payload: SaveAvaliacaoFullPayload = {
            nome,
            dimensoes: dimensoes.map(d => ({
                id: d.id,
                titulo: d.titulo,
                peso: d.peso,
                perguntas: d.perguntas.map(p => ({
                    id: p.id,
                    texto: p.texto,
                    tipo: p.tipo,
                    obrigatoria: p.obrigatoria
                }))
            }))
        }

        const res = await salvarRascunhoAvaliacao360(id, payload)
        setIsSaving(false)

        if (!res.success) {
            alert(res.error)
        } else if (redirecionarParaDash) {
            router.push('/coord/avaliacoes-360')
        } else {
             alert('Rascunho salvo com sucesso!')
        }
    }

    const handleAtivar = async () => {
        if (!confirm("Ao ativar, o ciclo será visível para membros e não poderá mais ser editado estruturalmente. Confirmar?")) return
        
        // Salva primeiro e depois ativa
        await handleSalvar(false) 
        setIsSaving(true)
        const res = await ativarAvaliacao360(id)
        if (res.success) {
            router.push('/coord/avaliacoes-360')
        } else {
            alert(res.error)
        }
        setIsSaving(false)
    }

    // ============================================
    // DND & Dimensões Handlers
    // ============================================

    const handleDragEndDimensoes = (result: DropResult) => {
        if (!result.destination) return
        const itens = Array.from(dimensoes)
        const [reordered] = itens.splice(result.source.index, 1)
        itens.splice(result.destination.index, 0, reordered)
        setDimensoes(itens)
    }

    const handleAddDimensao = () => {
        const nova: LocalDimensao = {
            idLocal: `dim-${Date.now()}`,
            titulo: "Nova Dimensão",
            peso: 10,
            perguntas: []
        }
        setDimensoes([...dimensoes, nova])
        setActiveDimId(nova.idLocal)
    }

    const handleRemoveDimensao = (targetId: string) => {
        const novas = dimensoes.filter(d => d.idLocal !== targetId)
        setDimensoes(novas)
        if (activeDimId === targetId && novas.length > 0) {
            setActiveDimId(novas[0].idLocal)
        }
    }

    // ============================================
    // Active Dimension Handlers
    // ============================================
    
    const activeDimIndex = dimensoes.findIndex(d => d.idLocal === activeDimId)
    const activeDim = activeDimIndex >= 0 ? dimensoes[activeDimIndex] : null

    const updateActiveDim = (updates: Partial<LocalDimensao>) => {
        if (activeDimIndex < 0) return
        const novas = [...dimensoes]
        novas[activeDimIndex] = { ...novas[activeDimIndex], ...updates }
        setDimensoes(novas)
    }

    const handleDragEndPerguntas = (result: DropResult) => {
        if (!result.destination || !activeDim) return
        const itens = Array.from(activeDim.perguntas)
        const [reordered] = itens.splice(result.source.index, 1)
        itens.splice(result.destination.index, 0, reordered)
        updateActiveDim({ perguntas: itens })
    }

    const handleAddPergunta = () => {
        if (!activeDim) return
        const nova: LocalPergunta = {
            idLocal: `perg-${Date.now()}`,
            texto: "Escreva sua pergunta aqui...",
            tipo: "ESCALA",
            obrigatoria: true
        }
        updateActiveDim({ perguntas: [...activeDim.perguntas, nova] })
    }

    const updatePergunta = (perguntaId: string, updates: Partial<LocalPergunta>) => {
        if (!activeDim) return
        const novas = activeDim.perguntas.map(p => p.idLocal === perguntaId ? { ...p, ...updates } : p)
        updateActiveDim({ perguntas: novas })
    }

    const removePergunta = (perguntaId: string) => {
         if (!activeDim) return
         const novas = activeDim.perguntas.filter(p => p.idLocal !== perguntaId)
         updateActiveDim({ perguntas: novas })
    }

    if (isLoading) return <div className="p-8">Carregando editor...</div>

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-bg-main relative">
             {/* Header */}
             <header className="bg-bg-card border-b border-border px-8 py-4 sticky top-0 z-20 flex justify-between items-center">
                <div className="flex flex-col gap-1">
                    <nav className="flex items-center gap-2 text-xs font-medium text-text-muted">
                        <Link href="/coord/home" className="hover:underline">Home</Link>
                        <ChevronRight size={14} />
                        <Link href="/coord/avaliacoes-360" className="hover:underline">Avaliações 360</Link>
                        <ChevronRight size={14} />
                        <span className="text-text-main font-bold">Editar</span>
                    </nav>
                    <div className="flex items-center gap-3">
                         <input 
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            className="text-2xl font-black bg-transparent border-none p-0 focus:ring-0 w-[400px] text-text-main placeholder-gray-300"
                            placeholder="Nome da Avaliação"
                         />
                         <span className="bg-[#f4f2e6] text-text-muted px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                            Rascunho
                        </span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => handleSalvar(true)}
                        disabled={isSaving}
                        className="flex items-center gap-2 h-10 px-4 bg-white border border-border rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                        <Save size={16} /> Salvar Fechar
                    </button>
                    <button 
                        onClick={handleAtivar}
                        disabled={isSaving}
                        className="flex items-center gap-2 h-10 px-6 bg-primary text-text-main rounded-lg text-sm font-bold shadow-sm hover:brightness-105 disabled:opacity-50 transition-all cursor-pointer"
                    >
                         <Send size={16} /> Publicar P/ Membros
                    </button>
                </div>
             </header>

             {/* Main Editor Content */}
             <div className="flex-1 p-8 max-w-7xl mx-auto w-full flex overflow-hidden min-h-[600px] gap-6">
                 
                 {/* Dimensoes Sidebar */}
                 <div className="w-80 bg-bg-card rounded-xl border border-border flex flex-col shadow-sm">
                    <div className="p-5 border-b border-border">
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4">Dimensões (Seções)</p>
                        
                        <DragDropContext onDragEnd={handleDragEndDimensoes}>
                            <Droppable droppableId="dimensoes-list">
                                {(provided) => (
                                    <div {...provided.droppableProps} ref={provided.innerRef} className="flex flex-col gap-2">
                                        {dimensoes.map((dim, index) => (
                                            <Draggable key={dim.idLocal} draggableId={dim.idLocal} index={index}>
                                                {(provided) => (
                                                     <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        className={`group flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                                                            activeDimId === dim.idLocal 
                                                                ? "bg-primary/10 border-primary/30" 
                                                                : "border-transparent hover:border-border"
                                                        }`}
                                                        onClick={() => setActiveDimId(dim.idLocal)}
                                                     >
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                             <div {...provided.dragHandleProps} className="text-gray-400 hover:text-primary transition-colors cursor-grab">
                                                                <GripVertical size={16} />
                                                             </div>
                                                             <span className={`text-sm truncate ${activeDimId === dim.idLocal ? "font-bold text-text-main" : "font-medium text-text-muted"}`}>
                                                                {dim.titulo || "Sem título"}
                                                             </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                             <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                                                 activeDimId === dim.idLocal ? "bg-primary text-text-main" : "bg-gray-100 text-gray-500"
                                                             }`}>
                                                                {dim.perguntas.length}
                                                             </span>
                                                        </div>
                                                     </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    </div>
                    <div className="p-4 mt-auto">
                        <button 
                            onClick={handleAddDimensao}
                            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-border rounded-xl text-text-muted hover:bg-[#f4f2e6] transition-all text-sm font-bold cursor-pointer"
                        >
                            <PlusCircle size={18} /> Nova Dimensão
                        </button>
                    </div>
                 </div>

                 {/* Active Dimension Details */}
                 <div className="flex-1 bg-bg-card rounded-xl border border-border shadow-sm flex flex-col relative">
                    {activeDim ? (
                        <>
                            {/* Properties Header */}
                            <div className="p-8 border-b border-border bg-[#fcfbf8] rounded-t-xl">
                                <div className="flex justify-between items-start mb-4">
                                     <h3 className="text-xl font-bold text-text-main">Configurar Dimensão</h3>
                                     <button onClick={() => handleRemoveDimensao(activeDim.idLocal)} className="text-gray-400 hover:text-red-500 transition-colors p-2 cursor-pointer">
                                        <Trash2 size={20} />
                                     </button>
                                </div>
                                <div className="flex gap-4">
                                     <div className="flex-1">
                                        <label className="block text-xs font-bold text-text-muted uppercase mb-1">Título da Dimensão</label>
                                        <input 
                                            type="text"
                                            value={activeDim.titulo}
                                            onChange={(e) => updateActiveDim({ titulo: e.target.value })}
                                            className="w-full border-border rounded-lg text-sm bg-white focus:ring-primary focus:border-primary h-10 px-3"
                                        />
                                     </div>
                                     <div className="w-1/3">
                                        <label className="block text-xs font-bold text-text-muted uppercase mb-1">Peso (%)</label>
                                        <input 
                                            type="number"
                                            value={activeDim.peso}
                                            onChange={(e) => updateActiveDim({ peso: Number(e.target.value) })}
                                            className="w-full border-border rounded-lg text-sm bg-white focus:ring-primary focus:border-primary h-10 px-3"
                                        />
                                     </div>
                                </div>
                            </div>
                            
                            {/* Questions List */}
                            <div className="flex-1 p-8 space-y-6 overflow-y-auto w-full">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-bold text-text-main flex items-center gap-2">
                                        Perguntas desta dimensão
                                    </h4>
                                    <p className="text-xs text-text-muted">Arraste para reordenar</p>
                                </div>

                                <DragDropContext onDragEnd={handleDragEndPerguntas}>
                                    <Droppable droppableId="perguntas-list">
                                        {(provided) => (
                                            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                                                {activeDim.perguntas.map((perg, index) => (
                                                    <Draggable key={perg.idLocal} draggableId={perg.idLocal} index={index}>
                                                        {(provided) => (
                                                            <div 
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                className="bg-white border border-border rounded-xl p-5 flex gap-4 items-start shadow-sm group relative"
                                                            >
                                                                 <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing text-gray-300 group-hover:text-primary transition-colors pt-2">
                                                                     <GripVertical size={20} />
                                                                 </div>
                                                                 <div className="flex-1 space-y-4">
                                                                     <div>
                                                                        <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Enunciado da Pergunta</label>
                                                                        <textarea 
                                                                            value={perg.texto}
                                                                            onChange={(e) => updatePergunta(perg.idLocal, { texto: e.target.value })}
                                                                            className="w-full border-border rounded-lg text-sm focus:ring-primary focus:border-primary p-3 bg-[#fcfbf8]"
                                                                            rows={2}
                                                                        />
                                                                     </div>
                                                                     <div className="flex items-center justify-between">
                                                                          <div className="flex gap-4 items-center">
                                                                               <div className="flex items-center gap-2">
                                                                                    <label className="text-xs font-medium text-gray-600">Tipo:</label>
                                                                                    <select 
                                                                                        value={perg.tipo}
                                                                                        onChange={(e) => updatePergunta(perg.idLocal, { tipo: e.target.value as TipoPergunta360 })}
                                                                                        className="border-border rounded-lg text-xs py-1.5 px-3 bg-white focus:ring-primary focus:border-primary"
                                                                                    >
                                                                                        <option value="ESCALA">Escala Linear (1-5)</option>
                                                                                        <option value="TEXTO_ABERTO">Texto Aberto</option>
                                                                                    </select>
                                                                               </div>
                                                                               <div className="flex items-center gap-2">
                                                                                    <input 
                                                                                        type="checkbox"
                                                                                        checked={perg.obrigatoria}
                                                                                        onChange={(e) => updatePergunta(perg.idLocal, { obrigatoria: e.target.checked })}
                                                                                        className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                                                                                    />
                                                                                    <label className="text-xs font-medium text-gray-600 cursor-pointer" onClick={() => updatePergunta(perg.idLocal, { obrigatoria: !perg.obrigatoria })}>Obrigatória</label>
                                                                               </div>
                                                                          </div>
                                                                          <button onClick={() => removePergunta(perg.idLocal)} className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50 cursor-pointer">
                                                                             <Trash2 size={16} />
                                                                          </button>
                                                                     </div>
                                                                 </div>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </DragDropContext>

                                <button 
                                    onClick={handleAddPergunta}
                                    className="w-full py-4 border-2 border-dotted border-border rounded-xl flex items-center justify-center gap-2 text-text-muted font-bold text-sm hover:bg-[#fcfbf8] hover:border-primary/50 hover:text-primary transition-all cursor-pointer"
                                >
                                    <PlusCircle size={18} /> Adicionar Nova Pergunta
                                </button>
                            </div>

                             {/* Dim Footer */}
                             <div className="p-4 bg-[#fcfbf8] border-t border-border flex justify-end shrink-0 rounded-b-xl">
                                  <button onClick={() => handleSalvar(false)} className="px-6 py-2 rounded-lg bg-primary/20 text-text-main text-sm font-bold shadow-sm hover:bg-primary/30 transition-all cursor-pointer">
                                      Guardar Dimensão
                                  </button>
                             </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-400 flex-col gap-4">
                             <PlusCircle size={48} className="opacity-20" />
                             <p>Selecione ou crie uma dimensão para editá-la.</p>
                        </div>
                    )}
                 </div>
             </div>
        </div>
    )
}
