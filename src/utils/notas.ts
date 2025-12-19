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
