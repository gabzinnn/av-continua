"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { Button } from "@/src/app/components/Button"
import { getTermometroPageData, TermometroPageData } from "@/src/actions/termometroActions"
import { TermometroHeroCard } from "./TermometroHeroCard"
import { TermometroChart } from "./TermometroChart"
import { TermometroHistoricoList } from "./TermometroHistoricoList"
import { CriarTermometroModal } from "./CriarTermometroModal"
import { EncerrarTermometroModal } from "./EncerrarTermometroModal"

export function TermometroContent() {
    const router = useRouter()
    const [data, setData] = useState<TermometroPageData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isEncerrarModalOpen, setIsEncerrarModalOpen] = useState(false)

    const fetchData = async () => {
        try {
            const result = await getTermometroPageData()
            setData(result)
        } catch (error) {
            console.error("Erro ao carregar dados:", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleCriarSuccess = () => {
        fetchData() // Recarrega os dados após criar
    }

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-text-muted">Carregando...</div>
            </div>
        )
    }

    if (!data) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-text-muted">Erro ao carregar dados</div>
            </div>
        )
    }

    const { termometroAtivo, historico } = data

    const handleEncerrar = () => {
        setIsEncerrarModalOpen(true)
    }

    const handleEncerrarSuccess = () => {
        fetchData()
    }

    const handleVerDetalhes = () => {
        if (termometroAtivo) {
            router.push(`/coord/termometro/${termometroAtivo.id}`)
        }
    }

    const handleHistoricoClick = (id: number) => {
        router.push(`/coord/termometro/${id}`)
    }

    return (
        <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-[1200px] mx-auto flex flex-col gap-8 pb-12">
                {/* Page Heading */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h2 className="text-text-main tracking-tight text-[32px] font-bold leading-tight">
                            Controle de Termômetros
                        </h2>
                        <p className="text-gray-500 text-base mt-1">
                            Gerencie e acompanhe o progresso das avaliações do clube em tempo real.
                        </p>
                    </div>
                    <Button icon={<Plus size={20} />} iconPosition="left" onClick={() => setIsModalOpen(true)}>
                        Criar novo termômetro
                    </Button>
                </div>

                {/* Active Termometer Hero Card */}
                {termometroAtivo ? (
                    <TermometroHeroCard
                        termometro={termometroAtivo}
                        onEncerrar={handleEncerrar}
                        onVerDetalhes={handleVerDetalhes}
                    />
                ) : (
                    <div className="bg-white rounded-xl p-8 border border-border text-center">
                        <p className="text-gray-500 text-lg">Nenhum termômetro ativo no momento.</p>
                        <p className="text-gray-400 text-sm mt-2">Crie um novo termômetro para começar a coletar respostas.</p>
                    </div>
                )}

                {/* General Performance Chart */}
                <section>
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                            Desempenho Geral do Clube
                        </h3>
                        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-primary" />
                                Média Mensal
                            </span>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-border">
                        <TermometroChart data={data.chartData} />
                    </div>
                </section>

                {/* Histórico de Termômetros */}
                <section>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4 px-1">
                        Histórico de Termômetros
                    </h3>
                    <TermometroHistoricoList
                        historico={historico}
                        onItemClick={handleHistoricoClick}
                    />
                </section>
            </div>

            <CriarTermometroModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleCriarSuccess}
            />

            {termometroAtivo && (
                <EncerrarTermometroModal
                    isOpen={isEncerrarModalOpen}
                    onClose={() => setIsEncerrarModalOpen(false)}
                    onSuccess={handleEncerrarSuccess}
                    termometro={termometroAtivo}
                />
            )}
        </div>
    )
}
