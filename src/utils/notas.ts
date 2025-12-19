// Mapeamento de notas numéricas para texto
export const NOTAS_MAP = {
    2: "Muito abaixo do esperado",
    4: "Abaixo do esperado",
    6: "Esperado",
    8: "Acima do esperado",
    10: "Muito acima do esperado",
} as const

export type NotaNumero = keyof typeof NOTAS_MAP
export type NotaTexto = typeof NOTAS_MAP[NotaNumero]

// Converte número para texto
export function notaParaTexto(nota: number): NotaTexto {
    if (nota in NOTAS_MAP) {
        return NOTAS_MAP[nota as NotaNumero]
    }
    // Fallback para valores não mapeados
    return NOTAS_MAP[6]
}

// Converte texto para número
export function textoParaNota(texto: string): NotaNumero {
    const entry = Object.entries(NOTAS_MAP).find(([, value]) => value === texto)
    return entry ? (Number(entry[0]) as NotaNumero) : 6
}

// Opções para uso em selects
export const NOTAS_OPTIONS = Object.entries(NOTAS_MAP).map(([valor, label]) => ({
    value: valor,
    label: label,
}))

// Opções para avaliação de utilidade do feedback recebido
export const FEEDBACK_OPTIONS = [
    { value: "2", label: "Muito abaixo do esperado" },
    { value: "4", label: "Abaixo do esperado" },
    { value: "6", label: "Esperado" },
    { value: "8", label: "Acima do esperado" },
    { value: "10", label: "Muito acima do esperado" },
]

// Retorna a cor da borda baseado na nota
export function getNotaBorderColor(nota: number): string {
    if (nota >= 8) return "border-green-500"
    if (nota === 6) return "border-yellow-400"
    return "border-red-400"
}
