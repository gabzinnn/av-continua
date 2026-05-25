export interface AV360MembroRanking {
  membroId: number;
  nome: string;
  fotoUrl: string | null;
  scoreGeral: number;
}

export interface AV360DimensaoGlobal {
  titulo: string;
  mediaGlobal: number;
}

export interface AV360DimensaoMembro {
  dimensao: string;
  mediaSimples: number;
  distribuicao: Record<number, number>;
  // curated
  insightTexto?: string | null;
  callouts?: Array<{ tipo: "DESVIO" | "ATENCAO"; texto: string }> | null;
}

export interface AV360MembroDetalhes {
  membroId: number;
  nome: string;
  scoreGeral: number;
  numRespondentes: number;
  dimensoes: AV360DimensaoMembro[];
  comentarios: Array<{ pergunta: string; respostas: string[] }>;
}

export interface AV360ReportData {
  avaliacaoId: number;
  nome: string;
  scoreGlobalMedia: number;
  ranking: AV360MembroRanking[];
  dimensoesGlobais: AV360DimensaoGlobal[];
  membrosDetalhes: AV360MembroDetalhes[];
  meta: {
    capaTitulo?: string | null;
    objetivo?: string | null;
    conclusao?: string | null;
  };
}
