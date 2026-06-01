import type { ContextoArea, ContextoFaixa } from "../pco/types";

const AREA_ORDER = [
  "Coordenação Geral",
  "Organização Interna",
  "Academia de Preparação",
  "Escola de Negócios",
  "Fábrica de Consultores",
];

export function computeBreakdownAreas(
  distribuicaoOpcoes: Array<{ texto: string; count: number }>
): ContextoArea[] {
  const map = new Map<string, number>();
  for (const { texto, count } of distribuicaoOpcoes) {
    map.set(texto, (map.get(texto) ?? 0) + count);
  }
  // Areas that appear in AREA_ORDER come first in that order; remaining come after
  const ordered: ContextoArea[] = [];
  const seen = new Set<string>();
  for (const nome of AREA_ORDER) {
    const count = map.get(nome) ?? 0;
    if (count > 0) { ordered.push({ nome, count }); seen.add(nome); }
  }
  for (const [nome, count] of map) {
    if (!seen.has(nome) && count > 0) ordered.push({ nome, count });
  }
  return ordered;
}

export function computeFaixasPeriodo(
  distribuicaoOpcoes: Array<{ texto: string; count: number }>
): ContextoFaixa[] {
  let faixa1 = 0;
  let faixa2 = 0;

  for (const { texto, count } of distribuicaoOpcoes) {
    const raw = texto.trim();
    let periodo: number | null = null;

    const numMatch = raw.match(/^(\d+)/);
    if (numMatch) {
      periodo = parseInt(numMatch[1], 10);
    }

    if (periodo !== null) {
      if (periodo >= 1 && periodo <= 3) {
        faixa1 += count;
      } else if (periodo >= 4) {
        faixa2 += count;
      }
    }
  }

  const result: ContextoFaixa[] = [];
  if (faixa1 > 0) result.push({ count: faixa1, descricao: "entre o 1º e o 3º período" });
  if (faixa2 > 0) result.push({ count: faixa2, descricao: "entre o 4º e o 7º período" });
  return result;
}

export function computeTotalRespondentes(
  distribuicaoOpcoes: Array<{ texto: string; count: number }>
): number {
  return distribuicaoOpcoes.reduce((s, { count }) => s + count, 0);
}
