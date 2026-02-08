// ==========================================
// TYPES E CONSTANTES PARA GESTÃO DE CANDIDATOS
// ==========================================

export type StatusEtapa = "APROVADO" | "REPROVADO" | "PENDENTE" | "BLOQUEADO" | "AGUARDANDO" | "EM_ANDAMENTO"
export type StatusCandidato = "ATIVO" | "REPROVADO" | "DESISTENTE" | "APROVADO"

export type EscalaNotasLabel = {
    valor: string
    label: string
    cor: "green" | "yellow" | "red" | "gray"
}

export const ESCALA_NOTAS_MAP: Record<string, EscalaNotasLabel> = {
    "A": { valor: "A", label: "Aprovado", cor: "green" },
    "P_MAIS": { valor: "P+", label: "Passar+", cor: "green" },
    "P_ALTO": { valor: "P↑", label: "Passar Alto", cor: "green" },
    "P": { valor: "P", label: "Passar", cor: "yellow" },
    "P_BAIXO": { valor: "P↓", label: "Passar Baixo", cor: "yellow" },
    "P_MENOS": { valor: "P-", label: "Passar-", cor: "yellow" },
    "R": { valor: "R", label: "Reprovado", cor: "red" }
}

export type CandidatoDetalhado = {
    id: number
    nome: string
    email: string
    curso: string | null
    periodo: string | null
    dre: string
    createdAt: Date
    observacao: string | null
    // Etapa 1: Prova
    prova: {
        status: StatusEtapa
        notaFinal: number | null
        provaId: number | null
        provaTitulo: string | null
    }
    // Etapa 2: Dinâmica
    dinamica: {
        status: StatusEtapa
        nota: string | null
        notaLabel: EscalaNotasLabel | null
    }
    // Etapa 3: Entrevista
    entrevista: {
        status: StatusEtapa
        nota: string | null
        notaLabel: EscalaNotasLabel | null
    }
    // Etapa 4: Capacitação
    capacitacao: {
        status: StatusEtapa
        progresso: number // 0-100
        notaArtigo: number | null
        apresArtigo: number | null
        notaCase: string | null
        notaCaseLabel: EscalaNotasLabel | null
    }
    // Status geral
    statusGeral: StatusCandidato
    etapaAtual: number // 1-4
}
