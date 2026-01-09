"use client"

import { useState } from "react"
import { X, Plus, Trash2 } from "lucide-react"
import { Button } from "@/src/app/components/Button"
import { criarTermometro } from "@/src/actions/termometroActions"

interface CriarTermometroModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

const PERGUNTAS_PADRAO = [
    'Quanto você sente que conseguiu administrar as tarefas do clube com sua vida pessoal essa quinzena, sendo 1 "Não consegui conciliar e isso afetou meu rendimento na faculdade clube e planejamento pessoal e 5 "Consegui conciliar de forma tranquila"',
    'Quanto você sente que conseguiu conciliar as suas obrigações com a faculdade e o clube essa quinzena sendo 1 "Não consegui conciliar e isso afetou meu rendimento na faculdade clube e planejamento pessoal e 5 "Consegui conciliar de forma tranquila" ?',
    'Como foi o nível de sobrecarga dentro do clube essa quinzena em termos de densidade de reuniões, feedbacks e entregas sendo 1 "Tive muitas reuniões, entregas, feedbacks ou outros compromissos e isso afetou negativamente minha rotina" e 5 "Não tive tantas reuniões, entregas feedbacks ou outros compromissos e, se tive, não afetou minha rotina de forma significativa" ?',
    'Como você avalia suas entregas no clube essa quinzena sendo 1 "Entreguei completamente abaixo do padrão esperado e permitido muitos prazos" e 5 "Entreguei notoriamente acima do esperado ficando mais do que satisfeito com meu rendimento"',
    'Como você avalia sua perspectiva para a próxima quinzena sendo 1 "Provavelmente estarei pior que nessa quinzena e isso vai afetar significativamente meu rendimento no clube e faculdade e 5 "Provavelmente estarei com a programação mais tranquila e conseguirei me dedicar mais ao clube sem afetar meu desempenho na faculdade"',
]

export function CriarTermometroModal({ isOpen, onClose, onSuccess }: CriarTermometroModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [nome, setNome] = useState("Termômetro Quinzenal - Título Provisório")
    const [perguntas, setPerguntas] = useState<string[]>(PERGUNTAS_PADRAO)
    const [duracaoDias, setDuracaoDias] = useState(14) // Quinzenal por padrão

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
        const result = await criarTermometro({
            nome,
            perguntas: perguntasValidas,
            duracaoDias,
        })

        if (result.success) {
            resetForm()
            onSuccess()
            onClose()
        } else {
            setError(result.error || "Erro ao criar termômetro")
        }
        setIsLoading(false)
    }

    const resetForm = () => {
        setNome("Termômetro Quinzenal - Título Provisório")
        setPerguntas(PERGUNTAS_PADRAO)
        setDuracaoDias(14)
        setError("")
    }

    const handleClose = () => {
        resetForm()
        onClose()
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
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
            <div className="relative bg-bg-card rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-bold text-text-main">Criar Novo Termômetro</h2>
                    <button onClick={handleClose} className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer">
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

                    <div>
                        <label className="block text-sm font-medium text-text-main mb-1">Duração (dias)</label>
                        <input
                            type="number"
                            min="1"
                            max="30"
                            value={duracaoDias}
                            onChange={(e) => setDuracaoDias(parseInt(e.target.value) || 14)}
                            className="w-full px-4 py-2.5 border border-border rounded-lg bg-bg-main focus:outline-none focus:border-primary"
                        />
                        <p className="text-xs text-gray-500 mt-1">Padrão: 14 dias (quinzenal)</p>
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
                                <div key={index} className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-500 w-6">{index + 1}.</span>
                                    <input
                                        type="text"
                                        value={pergunta}
                                        onChange={(e) => atualizarPergunta(index, e.target.value)}
                                        className="flex-1 px-4 py-2.5 border border-border rounded-lg bg-bg-main focus:outline-none focus:border-primary"
                                        placeholder={`Pergunta ${index + 1}`}
                                    />
                                    {perguntas.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removerPergunta(index)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Cada pergunta será respondida com uma nota de 1 a 5
                        </p>
                    </div>

                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>
                    )}

                    <div className="flex gap-3 mt-2">
                        <Button
                            type="button"
                            variant="secondary"
                            className="flex-1"
                            onClick={handleClose}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1"
                            isLoading={isLoading}
                        >
                            Criar Termômetro
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
