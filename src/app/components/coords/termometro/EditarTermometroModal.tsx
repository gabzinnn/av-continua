"use client"

import { useState, useEffect } from "react"
import { X, Plus, Trash2 } from "lucide-react"
import { Button } from "@/src/app/components/Button"
import { editarTermometro, TermometroDetalhes } from "@/src/actions/termometroActions"
import { Ciclo } from "@/src/actions/cicloActions"

interface EditarTermometroModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    termometro: TermometroDetalhes
    ciclos: Ciclo[]
}

export function EditarTermometroModal({ isOpen, onClose, onSuccess, termometro, ciclos }: EditarTermometroModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [nome, setNome] = useState(termometro.nome)
    const [perguntas, setPerguntas] = useState<string[]>(termometro.perguntas.map(p => p.texto))
    const [idCiclo, setIdCiclo] = useState<number | null>(termometro.ciclo?.id || null)

    useEffect(() => {
        if (isOpen) {
            setNome(termometro.nome)
            setPerguntas(termometro.perguntas.map(p => p.texto))
            setIdCiclo(termometro.ciclo?.id || null)
            setError("")
        }
    }, [isOpen, termometro])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (!nome.trim()) {
            setError("O nome do termômetro é obrigatório")
            return
        }

        const perguntasValidas = perguntas.filter(p => p.trim())
        if (perguntasValidas.length === 0) {
            setError("Adicione pelo menos uma pergunta")
            return
        }

        setIsLoading(true)
        const result = await editarTermometro({
            id: termometro.id,
            nome,
            perguntas: perguntasValidas.map(texto => ({ texto })),
            idCiclo,
        })

        if (result.success) {
            onSuccess()
            onClose()
        } else {
            setError(result.error || "Erro ao editar termômetro")
        }
        setIsLoading(false)
    }

    const adicionarPergunta = () => {
        setPerguntas([...perguntas, ""])
    }

    const removerPergunta = (index: number) => {
        if (perguntas.length > 1) {
            setPerguntas(perguntas.filter((_, i) => i !== index))
        }
    }

    const atualizarPergunta = (index: number, texto: string) => {
        const novasPerguntas = [...perguntas]
        novasPerguntas[index] = texto
        setPerguntas(novasPerguntas)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-bg-card rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-bold text-text-main">Editar Termômetro</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
                    <div>
                        <label className="block text-sm font-medium text-text-main mb-1">Nome do Termômetro *</label>
                        <input
                            type="text"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            className="w-full px-4 py-2.5 border border-border rounded-lg bg-bg-main focus:outline-none focus:border-primary"
                            placeholder="Nome do termômetro"
                        />
                    </div>

                    {/* Ciclo */}
                    <div>
                        <label className="block text-sm font-medium text-text-main mb-1">Ciclo</label>
                        <select
                            value={idCiclo || ""}
                            onChange={(e) => setIdCiclo(e.target.value ? Number(e.target.value) : null)}
                            className="w-full px-4 py-2.5 border border-border rounded-lg bg-bg-main focus:outline-none focus:border-primary cursor-pointer"
                        >
                            <option value="">Sem ciclo específico</option>
                            {ciclos.map((ciclo) => (
                                <option key={ciclo.id} value={ciclo.id}>{ciclo.nome}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-text-main">Perguntas *</label>
                            <button
                                type="button"
                                onClick={adicionarPergunta}
                                className="flex items-center gap-1 text-sm text-primary font-medium hover:underline cursor-pointer"
                            >
                                <Plus size={16} />
                                Adicionar pergunta
                            </button>
                        </div>
                        <div className="flex flex-col gap-3">
                            {perguntas.map((pergunta, index) => (
                                <div key={index} className="flex items-start gap-2">
                                    <span className="text-sm font-medium text-gray-500 w-6 mt-3">{index + 1}.</span>
                                    <textarea
                                        value={pergunta}
                                        onChange={(e) => atualizarPergunta(index, e.target.value)}
                                        className="flex-1 px-4 py-2.5 border border-border rounded-lg bg-bg-main focus:outline-none focus:border-primary resize-none"
                                        placeholder={`Pergunta ${index + 1}`}
                                        rows={2}
                                    />
                                    {perguntas.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removerPergunta(index)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer mt-1"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {termometro.totalRespostas > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                            ⚠️ Este termômetro já possui {termometro.totalRespostas} respostas. Editar as perguntas pode afetar a consistência dos dados.
                        </div>
                    )}

                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>
                    )}

                    <div className="flex gap-3 mt-2">
                        <Button
                            type="button"
                            variant="secondary"
                            className="flex-1"
                            onClick={onClose}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1"
                            isLoading={isLoading}
                        >
                            Salvar Alterações
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
