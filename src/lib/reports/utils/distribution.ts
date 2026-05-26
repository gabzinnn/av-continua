export interface DistribuicaoGrupo {
  concordo: number;
  concordoParcial: number;
  discordoParcial: number;
  discordo: number;
  naoConsigo: number;
  total: number;
}

export function toPercents(dist: DistribuicaoGrupo) {
  const t = dist.total || 1;
  return {
    concordo: (dist.concordo / t) * 100,
    concordoParcial: (dist.concordoParcial / t) * 100,
    naoConsigo: (dist.naoConsigo / t) * 100,
    discordoParcial: (dist.discordoParcial / t) * 100,
    discordo: (dist.discordo / t) * 100,
  };
}

// Computes population std dev on the -2..+2 scale from a DistribuicaoGrupo.
// Returns 0 if there are no valid responses (naoConsigo excluded from calculation).
export function computeStdDev(dist: DistribuicaoGrupo): number {
  const entries: [number, number][] = [
    [2, dist.concordo],
    [1, dist.concordoParcial],
    [-1, dist.discordoParcial],
    [-2, dist.discordo],
  ];
  const n = entries.reduce((s, [, c]) => s + c, 0);
  if (n === 0) return 0;
  const mean = entries.reduce((s, [v, c]) => s + v * c, 0) / n;
  const variance = entries.reduce((s, [v, c]) => s + c * (v - mean) ** 2, 0) / n;
  return Math.sqrt(variance);
}
