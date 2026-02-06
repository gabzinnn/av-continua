"use client"

import { StatusEtapa } from "@/src/types/candidatos"
import { Lock } from "lucide-react"

interface StatusBadgeProps {
    status: StatusEtapa
    size?: "sm" | "md"
    showLabel?: boolean
}

const statusConfig: Record<StatusEtapa, {
    label: string
    bgClass: string
    textClass: string
    borderClass: string
}> = {
    APROVADO: {
        label: "Aprovado",
        bgClass: "bg-green-100",
        textClass: "text-green-700",
        borderClass: "border-green-200"
    },
    REPROVADO: {
        label: "Reprovado",
        bgClass: "bg-red-100",
        textClass: "text-red-700",
        borderClass: "border-red-200"
    },
    PENDENTE: {
        label: "Pendente",
        bgClass: "bg-yellow-100",
        textClass: "text-yellow-800",
        borderClass: "border-yellow-200"
    },
    AGUARDANDO: {
        label: "Aguardando",
        bgClass: "bg-gray-100",
        textClass: "text-gray-600",
        borderClass: "border-gray-200"
    },
    BLOQUEADO: {
        label: "Bloqueado",
        bgClass: "bg-transparent",
        textClass: "text-gray-400",
        borderClass: "border-transparent"
    },
    EM_ANDAMENTO: {
        label: "Em andamento",
        bgClass: "bg-blue-100",
        textClass: "text-blue-700",
        borderClass: "border-blue-200"
    }
}

export function StatusBadge({ status, size = "sm", showLabel = true }: StatusBadgeProps) {
    const config = statusConfig[status]
    
    if (status === "BLOQUEADO") {
        return (
            <span className="flex items-center gap-1.5 text-gray-400">
                <Lock size={14} />
                {showLabel && <span className="text-xs font-medium">Bloqueado</span>}
            </span>
        )
    }
    
    const sizeClasses = size === "sm" 
        ? "px-2 py-0.5 text-[10px]"
        : "px-2.5 py-1 text-xs"
    
    return (
        <span className={`
            inline-flex items-center rounded-full font-bold uppercase tracking-wide
            border ${config.bgClass} ${config.textClass} ${config.borderClass}
            ${sizeClasses}
        `}>
            {showLabel && config.label}
        </span>
    )
}

// Badge simplificado para mostrar check/X/pendente
export function StatusIcon({ status }: { status: StatusEtapa }) {
    if (status === "BLOQUEADO") {
        return (
            <span className="text-gray-300">
                <Lock size={18} />
            </span>
        )
    }
    
    if (status === "APROVADO") {
        return (
            <div className="w-7 h-7 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
            </div>
        )
    }
    
    if (status === "REPROVADO") {
        return (
            <div className="w-7 h-7 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">cancel</span>
            </div>
        )
    }
    
    if (status === "EM_ANDAMENTO") {
        return (
            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">pending</span>
            </div>
        )
    }
    
    // PENDENTE ou AGUARDANDO
    return (
        <div className="w-7 h-7 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center animate-pulse">
            <span className="material-symbols-outlined text-[18px]">schedule</span>
        </div>
    )
}
