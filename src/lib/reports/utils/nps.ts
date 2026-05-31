import type { NPSData } from "../pco/types";

export function calcNPS(distribuicao: Record<number, number>): NPSData {
  const promotores = (distribuicao[9] ?? 0) + (distribuicao[10] ?? 0);
  const neutros = (distribuicao[7] ?? 0) + (distribuicao[8] ?? 0);
  const detratores = [0, 1, 2, 3, 4, 5, 6].reduce((s, k) => s + (distribuicao[k] ?? 0), 0);
  const total = promotores + neutros + detratores;
  const npsPercent = total > 0 ? Math.round(((promotores - detratores) / total) * 10000) / 100 : 0;
  return { promotores, neutros, detratores, npsPercent, distribuicao };
}

export function extractNPSFromDistribuicao(
  distribuicaoOpcoes: Array<{ texto: string; count: number }>
): NPSData {
  const distribuicao: Record<number, number> = {};
  for (const { texto, count } of distribuicaoOpcoes) {
    const n = Number(texto);
    if (!Number.isNaN(n)) {
      distribuicao[n] = (distribuicao[n] ?? 0) + count;
    }
  }
  return calcNPS(distribuicao);
}
