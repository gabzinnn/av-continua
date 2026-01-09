"use client"

import { Share2, MoreVertical, Ban, ArrowRight } from "lucide-react"
import { TermometroResumo } from "@/src/actions/termometroActions"

interface TermometroHeroCardProps {
    termometro: TermometroResumo
    onEncerrar?: () => void
    onVerDetalhes?: () => void
}

function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    })
}

function calcularProgresso(termo: TermometroResumo): number {
    if (termo.totalMembros === 0) return 0
    return Math.round((termo.totalRespostas / termo.totalMembros) * 100)
}

export function TermometroHeroCard({ termometro, onEncerrar, onVerDetalhes }: TermometroHeroCardProps) {
    const progresso = calcularProgresso(termometro)

    return (
        <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-border overflow-hidden">
            <div className="p-8 flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase tracking-widest mb-3 inline-block">
                                Em andamento
                            </span>
                            <h3 className="text-2xl font-bold text-text-main">{termometro.nome}</h3>
                            <p className="text-gray-500 mt-1">
                                Criado em {formatDate(termometro.dataInicial)} • Expira em {formatDate(termometro.dataFinal)}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100 cursor-pointer">
                                <Share2 size={20} />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100 cursor-pointer">
                                <MoreVertical size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-semibold text-gray-700">Progresso de Respostas</span>
                            <span className="font-bold text-primary">{progresso}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-3">
                            <div
                                className="bg-primary h-3 rounded-full shadow-[0_0_8px_rgba(250,212,25,0.4)] transition-all duration-500"
                                style={{ width: `${progresso}%` }}
                            />
                        </div>
                        <p className="text-sm text-gray-500">
                            {termometro.totalRespostas} de {termometro.totalMembros} membros responderam
                        </p>
                    </div>
                </div>

                <div className="flex justify-end items-center gap-4 mt-10">
                    <button
                        onClick={onEncerrar}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-lg border border-red-200 text-red-600 font-bold hover:bg-red-50 transition-all cursor-pointer"
                    >
                        <Ban size={20} />
                        Encerrar Termômetro
                    </button>
                    <button
                        onClick={onVerDetalhes}
                        className="flex items-center gap-2 px-8 py-2.5 rounded-lg bg-text-main text-white font-bold hover:opacity-90 transition-all shadow-lg cursor-pointer"
                    >
                        Ver Detalhes
                        <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    )
}
