import { Users, CheckCircle, TrendingUp } from "lucide-react"

interface StatsResumoProps {
    processoNome: string
    stats: {
        totalInscritos: number
        totalAprovados: number
        taxaConversao: number
    }
}

export function StatsResumo({ processoNome, stats }: StatsResumoProps) {
    const progresso = stats.totalInscritos > 0 
        ? Math.round((stats.totalAprovados / stats.totalInscritos) * 100) 
        : 0

    return (
        <div className="flex flex-col rounded-xl border border-border bg-white shadow-sm overflow-hidden">
            {/* Stats Header */}
            <div className="flex items-center justify-between border-b border-border bg-gray-50 px-6 py-3">
                <div className="flex items-center gap-2">
                    <TrendingUp size={20} className="text-primary" />
                    <h3 className="text-sm font-bold text-text-main">Resumo - {processoNome}</h3>
                </div>
            </div>

            {/* Stats Content */}
            <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border">
                {/* Stat Item 1 - Total Inscritos */}
                <div className="flex flex-1 items-center gap-4 p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex size-12 items-center justify-center rounded-full bg-primary/20 text-primary">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-text-muted">Total Inscritos</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-2xl font-bold text-text-main">{stats.totalInscritos.toLocaleString('pt-BR')}</p>
                        </div>
                    </div>
                </div>

                {/* Stat Item 2 - Aprovados */}
                <div className="flex flex-1 items-center gap-4 p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex size-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-text-muted">Aprovados</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-2xl font-bold text-text-main">{stats.totalAprovados.toLocaleString('pt-BR')}</p>
                            <span className="text-xs font-medium text-text-muted">até agora</span>
                        </div>
                    </div>
                </div>

                {/* Stat Item 3 - Taxa de Conversão */}
                <div className="flex flex-1 items-center gap-4 p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex size-12 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-text-muted">Taxa de Conversão</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-2xl font-bold text-text-main">{stats.taxaConversao}%</p>
                        </div>
                    </div>
                </div>

                </div>


            {/* Progress Bar */}
            <div className="bg-gray-50 px-6 py-4 border-t border-border">
                <div className="flex justify-between mb-2">
                    <span className="text-xs font-semibold text-text-main uppercase tracking-wider">Progresso da Edição</span>
                    <span className="text-xs font-medium text-text-muted">{progresso}% Concluído</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200">
                    <div 
                        className="h-2 rounded-full bg-primary transition-all duration-500" 
                        style={{ width: `${Math.min(progresso, 100)}%` }}
                    />
                </div>
            </div>
        </div>
    )
}
