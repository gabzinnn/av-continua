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
