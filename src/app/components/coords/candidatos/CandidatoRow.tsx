"use client"

import { CandidatoDetalhado } from "@/src/types/candidatos"
import { StatusBadge, StatusIcon } from "./StatusBadge"
import { Eye, Edit } from "lucide-react"

interface CandidatoRowProps {
    candidato: CandidatoDetalhado
    onViewDetails: (candidato: CandidatoDetalhado) => void
    onEdit?: (candidato: CandidatoDetalhado) => void
}

function getInitials(nome: string): string {
    const parts = nome.split(" ")
    if (parts.length >= 2) {
        return parts[0][0] + parts[parts.length - 1][0]
    }
    return nome.substring(0, 2).toUpperCase()
}

function getStatusBarColor(status: string): string {
    switch (status) {
        case "APROVADO": return "bg-green-500"
        case "REPROVADO": return "bg-red-500"
        case "DESISTENTE": return "bg-gray-400"
        default: return "bg-primary" // ATIVO
    }
}

function getAvatarColor(nome: string): string {
    const colors = [
        "bg-blue-100 text-blue-700",
        "bg-purple-100 text-purple-700",
        "bg-pink-100 text-pink-700",
        "bg-indigo-100 text-indigo-700",
        "bg-teal-100 text-teal-700",
        "bg-orange-100 text-orange-700",
    ]
    const index = nome.charCodeAt(0) % colors.length
    return colors[index]
}

export function CandidatoRow({ candidato, onViewDetails, onEdit }: CandidatoRowProps) {
    const initials = getInitials(candidato.nome)
    const statusBarColor = getStatusBarColor(candidato.statusGeral)
    const avatarColor = getAvatarColor(candidato.nome)
    
    return (
        <div className={`
            group bg-white rounded-xl shadow-sm hover:shadow-md 
            border border-border transition-all duration-200 mb-4 overflow-hidden relative
            ${candidato.statusGeral === "REPROVADO" ? "opacity-75 hover:opacity-100" : ""}
        `}>
            {/* Status bar lateral */}
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${statusBarColor}`} />
            
            <div className="grid grid-cols-1 md:grid-cols-12 items-stretch min-h-[100px]">
                {/* Candidato Info */}
                <div className="col-span-3 flex items-center gap-4 p-5 border-r border-border">
                    <div className={`size-12 rounded-full ${avatarColor} shrink-0 flex items-center justify-center font-bold text-lg`}>
                        {initials}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <h3 className={`text-base font-bold text-text-main leading-tight truncate ${candidato.statusGeral === "REPROVADO" ? "line-through decoration-red-500/50" : ""}`}>
                            {candidato.nome}
                        </h3>
                        <div className="flex flex-col gap-0.5 mt-1">
                            <span className="text-xs font-medium text-text-muted truncate">{candidato.curso || "Curso não informado"}</span>
                            <span className="text-xs font-medium text-text-muted opacity-80">{candidato.periodo || "-"}</span>
                        </div>
                    </div>
                </div>
                
                {/* 1. Prova */}
                <div className="col-span-2 flex flex-col items-center justify-center gap-2 p-4">
                    {candidato.prova.notaFinal !== null ? (
                        <span className="text-2xl font-black text-text-main tracking-tight">
                            {candidato.prova.notaFinal.toFixed(1)}
                        </span>
                    ) : (
                        <span className="text-2xl font-black text-text-muted/40">-</span>
                    )}
                    <StatusBadge status={candidato.prova.status} />
                </div>
                
                {/* 2. Dinâmica */}
                <div className="col-span-2 flex flex-col items-center justify-center gap-2 p-4">
                    {candidato.dinamica.status === "BLOQUEADO" ? (
                        <StatusIcon status="BLOQUEADO" />
                    ) : (
                        <>
                            {candidato.dinamica.notaLabel ? (
                                <span className="text-2xl font-black text-text-main tracking-tight">
                                    {candidato.dinamica.notaLabel.valor}
                                </span>
                            ) : (
                                <span className="text-2xl font-black text-text-muted/40">-</span>
                            )}
                            <StatusBadge status={candidato.dinamica.status} />
                        </>
                    )}
                </div>
                
                {/* 3. Entrevista */}
                <div className="col-span-2 flex flex-col items-center justify-center gap-2 p-4">
                    {candidato.entrevista.status === "BLOQUEADO" ? (
                        <StatusIcon status="BLOQUEADO" />
                    ) : (
                        <>
                            {candidato.entrevista.notaLabel ? (
                                <span className="text-2xl font-black text-text-main tracking-tight">
                                    {candidato.entrevista.notaLabel.valor}
                                </span>
                            ) : (
                                <span className="text-2xl font-black text-text-muted/40">-</span>
                            )}
                            <StatusBadge status={candidato.entrevista.status} />
                        </>
                    )}
                </div>
                
                {/* 4. Capacitação */}
                <div className="col-span-1 flex flex-col items-center justify-center gap-2 p-4">
                    {candidato.capacitacao.status === "BLOQUEADO" ? (
                        <StatusIcon status="BLOQUEADO" />
                    ) : candidato.capacitacao.status === "EM_ANDAMENTO" ? (
                        <>
                            <span className="text-xl font-black text-text-main">{candidato.capacitacao.progresso}%</span>
                            <div className="w-full max-w-[80px] bg-gray-200 rounded-full h-1.5">
                                <div 
                                    className="bg-primary h-1.5 rounded-full shadow-sm transition-all" 
                                    style={{ width: `${candidato.capacitacao.progresso}%` }}
                                />
                            </div>
                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wide">
                                Em andamento
                            </span>
                        </>
                    ) : (
                        <>
                            <StatusIcon status={candidato.capacitacao.status} />
                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wide mt-1">
                                {candidato.capacitacao.status === "APROVADO" ? "Concluído" : 
                                 candidato.capacitacao.status === "REPROVADO" ? "Reprovado" : "Pendente"}
                            </span>
                        </>
                    )}
                </div>
                
                {/* Ações */}
                <div className="col-span-2 flex flex-col justify-center items-end gap-2 p-5">
                    <button
                        onClick={() => onViewDetails(candidato)}
                        className="w-full text-xs font-bold text-text-main hover:bg-primary-hover transition-colors border border-transparent px-3 py-2.5 rounded-lg bg-primary shadow-sm text-center cursor-pointer flex items-center justify-center gap-2"
                    >
                        <Eye size={14} />
                        Ver detalhes
                    </button>
                    {onEdit && (
                        <button
                            onClick={() => onEdit(candidato)}
                            className="flex items-center gap-1 text-xs font-bold text-text-muted hover:text-primary transition-colors pr-2 cursor-pointer"
                        >
                            <Edit size={14} />
                            Editar
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
