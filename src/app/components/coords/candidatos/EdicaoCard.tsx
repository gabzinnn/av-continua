import { Check } from "lucide-react"

interface EdicaoCardProps {
    id: number
    nome: string
    descricao?: string | null
    ativo: boolean
    createdAt: Date
    stats: {
        totalInscritos: number
        totalAprovados: number
        taxaConversao: number
    }
    isSelected: boolean
    onClick: () => void
}

function formatDate(date: Date): string {
    return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }).format(new Date(date))
}

function getStatusBadge(ativo: boolean) {
    if (ativo) {
        return (
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                Em andamento
            </span>
        )
    }
    return (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
            Finalizado
        </span>
    )
}

export function EdicaoCard({
    nome,
    ativo,
    createdAt,
    stats,
    isSelected,
    onClick
}: EdicaoCardProps) {
    const isActive = ativo

    return (
        <div
            onClick={onClick}
            className={`
                group relative flex cursor-pointer flex-col justify-between rounded-xl p-6 shadow-sm transition-all hover:shadow-md
                ${isSelected
                    ? "border-2 border-primary bg-white shadow-md"
                    : "border border-border bg-white hover:border-primary/50"
                }
            `}
        >
            {/* Selected check mark */}
            {isSelected && (
                <div className="absolute -top-3 -right-3 flex size-8 items-center justify-center rounded-full bg-primary text-text-main shadow-sm">
                    <Check size={20} />
                </div>
            )}

            <div className="flex flex-col gap-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className={`rounded-lg p-3 ${isActive ? "bg-primary/10 text-primary" : "bg-gray-50 text-gray-400 group-hover:text-primary transition-colors"}`}>
                        {isActive ? (
                            <Check size={20} />
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                    </div>
                    {getStatusBadge(ativo)}
                </div>

                {/* Content */}
                <div>
                    <h3 className={`text-xl font-bold text-text-main ${!isSelected && "group-hover:text-primary"} transition-colors`}>
                        {nome}
                    </h3>
                    <p className="text-sm text-text-muted">
                        {isActive ? `Início: ${formatDate(createdAt)}` : `Fim: ${formatDate(createdAt)}`}
                    </p>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
                <span className={`text-sm font-medium ${isSelected ? "text-primary" : "text-text-muted group-hover:text-primary"} transition-colors`}>
                    {isSelected ? "Selecionado" : "Selecionar"}
                </span>
                <span className="text-xs text-text-muted">
                    {stats.totalInscritos} inscritos
                </span>
            </div>
        </div>
    )
}
