import type { DistribuicaoGrupo } from "../utils/distribution";

export interface AgrupamentoInsight {
  count: number;
  texto: string;
}

export interface CalloutItem {
  tipo: "DESVIO" | "ATENCAO";
  texto: string;
}

export interface NPSData {
  promotores: number;
  neutros: number;
  detratores: number;
  npsPercent: number;
  distribuicao: Record<number, number>;
}

export interface DonutItem {
  texto: string;
  count: number;
  percent: number;
}

export interface PerguntaRelatorio {
  id: number;
  texto: string;
  tipo: "ESCALA" | "MULTIPLA_ESCOLHA" | "TEXTO_LIVRE";
  ordem: number;
  mediaPorGrupo: Record<string, number>;
  distribuicaoPorGrupo: Record<string, DistribuicaoGrupo>;
  distribuicaoOpcoes: { texto: string; count: number }[];
  respostasTexto: string[];
  justificativas: string[];
  // curated
  insightTexto?: string | null;
  agrupamentos?: AgrupamentoInsight[] | null;
  callouts?: CalloutItem[] | null;
  npsData?: NPSData | null;
  donutData?: DonutItem[] | null;
}

export interface SecaoRelatorio {
  id: number;
  titulo: string;
  descricao: string | null;
  ordem: number;
  perguntas: PerguntaRelatorio[];
  // curated
  introducao?: string | null;
  conclusao?: string | null;
}

export interface ContextoArea {
  nome: string;
  count: number;
}

export interface ContextoFaixa {
  count: number;
  descricao: string;
}

export interface PCOReportData {
  id: number;
  nome: string;
  grupos: string[];
  secoes: SecaoRelatorio[];
  totalParticipantes: number;
  totalRespostas: number;
  taxaResposta: number;
  // curated meta
  meta: {
    capaTitulo?: string | null;
    objetivo?: string | null;
    conclusao?: string | null;
    contexto?: {
      totalMembros?: number;
      breakdownAreas?: ContextoArea[];
      faixas?: ContextoFaixa[];
    } | null;
    npsHistorico?: Array<{ ciclo: string; nps: number }> | null;
  };
}
