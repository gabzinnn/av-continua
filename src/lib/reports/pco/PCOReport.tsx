import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { COLORS, FONT, baseStyles } from "../theme";
import { Cover } from "../components/Cover";
import { MethodologyPage } from "../components/MethodologyPage";
import { SectionTitle } from "../components/SectionTitle";
import { ScaleTable } from "../components/ScaleTable";
import { StackedBarChart } from "../components/StackedBarChart";
import { InsightSentence } from "../components/InsightSentence";
import { InsightBadge } from "../components/InsightBadge";
import { CalloutBox } from "../components/CalloutBox";
import type { PCOReportData, PerguntaRelatorio, SecaoRelatorio } from "./types";

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    ...baseStyles.page,
  },
  // ResumoPage
  resumoHeading: {
    fontFamily: FONT.display,
    fontSize: 36,
    color: COLORS.accent,
    marginBottom: 12,
  },
  introText: {
    fontFamily: FONT.body,
    fontSize: 10,
    color: COLORS.muted,
    lineHeight: 1.6,
    marginBottom: 16,
  },
  // PerguntaDetailPage
  breadcrumb: {
    fontFamily: FONT.body,
    fontSize: 8,
    color: COLORS.muted,
    marginBottom: 10,
  },
  questionText: {
    fontFamily: FONT.body,
    fontSize: 14,
    fontWeight: 700,
    color: COLORS.text,
    lineHeight: 1.4,
    marginBottom: 16,
  },
  legendRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 14,
  },
  legendSquare: {
    width: 10,
    height: 10,
    marginRight: 4,
  },
  legendLabel: {
    fontFamily: FONT.body,
    fontSize: 8,
    color: COLORS.muted,
  },
  barsSection: {
    marginBottom: 12,
  },
  agrupamentosSection: {
    marginTop: 8,
    marginBottom: 8,
  },
  calloutsSection: {
    marginTop: 8,
    marginBottom: 8,
  },
  justificativasSection: {
    marginTop: 8,
  },
  justificativaItem: {
    fontFamily: FONT.body,
    fontSize: 9,
    color: COLORS.muted,
    fontStyle: "italic",
    lineHeight: 1.5,
    marginBottom: 4,
  },
  // ConclusaoPage
  conclusaoHeading: {
    fontFamily: FONT.display,
    fontSize: 36,
    color: COLORS.accent,
    marginBottom: 20,
  },
  conclusaoText: {
    fontFamily: FONT.body,
    fontSize: 12,
    color: COLORS.text,
    lineHeight: 1.6,
  },
});

// ─── Legend constants ─────────────────────────────────────────────────────────

const LEGEND_ITEMS = [
  { color: COLORS.agree, label: "Concordo" },
  { color: COLORS.agreePartial, label: "Concordo parcialmente" },
  { color: COLORS.disagreePartial, label: "Discordo parcialmente" },
  { color: COLORS.disagree, label: "Discordo" },
];

// ─── Sub-pages ────────────────────────────────────────────────────────────────

interface ResumoPageProps {
  secao: SecaoRelatorio;
  grupos: string[];
}

function ResumoPage({ secao, grupos }: ResumoPageProps) {
  const perguntasEscala = secao.perguntas.filter((p) => p.tipo === "ESCALA");

  const rows = perguntasEscala.map((p) => ({
    texto: p.texto,
    mediaPorGrupo: p.mediaPorGrupo,
  }));

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.resumoHeading}>RESUMO</Text>
      <SectionTitle title={secao.titulo} />
      {secao.introducao ? (
        <Text style={styles.introText}>{secao.introducao}</Text>
      ) : null}
      {rows.length > 0 ? <ScaleTable grupos={grupos} rows={rows} /> : null}
    </Page>
  );
}

interface PerguntaDetailPageProps {
  pergunta: PerguntaRelatorio;
  grupos: string[];
  secaoTitulo: string;
}

function PerguntaDetailPage({
  pergunta,
  grupos,
  secaoTitulo,
}: PerguntaDetailPageProps) {
  const showRawJustificativas =
    pergunta.justificativas.length > 0 &&
    (!pergunta.agrupamentos || pergunta.agrupamentos.length === 0);

  const justificativasToShow = pergunta.justificativas.slice(0, 6);

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.breadcrumb}>{secaoTitulo.toUpperCase()}</Text>

      <View>
        <Text style={styles.questionText}>{pergunta.texto}</Text>
      </View>

      {/* Legend */}
      <View style={styles.legendRow}>
        {LEGEND_ITEMS.map((item) => (
          <View key={item.label} style={styles.legendItem}>
            <View
              style={[styles.legendSquare, { backgroundColor: item.color }]}
            />
            <Text style={styles.legendLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* Stacked bar charts per group */}
      <View style={styles.barsSection}>
        {grupos.map((grupo) => {
          const dist = pergunta.distribuicaoPorGrupo[grupo];
          if (!dist || dist.total === 0) return null;
          return (
            <StackedBarChart key={grupo} label={grupo} dist={dist} />
          );
        })}
      </View>

      {/* Insight sentence */}
      {pergunta.insightTexto ? (
        <InsightSentence texto={pergunta.insightTexto} />
      ) : null}

      {/* Agrupamentos */}
      {pergunta.agrupamentos && pergunta.agrupamentos.length > 0 ? (
        <View style={styles.agrupamentosSection}>
          {pergunta.agrupamentos.map((ag, i) => (
            <InsightBadge key={i} count={ag.count} texto={ag.texto} />
          ))}
        </View>
      ) : null}

      {/* Callouts */}
      {pergunta.callouts && pergunta.callouts.length > 0 ? (
        <View style={styles.calloutsSection}>
          {pergunta.callouts.map((c, i) => (
            <CalloutBox key={i} texto={c.texto} tipo={c.tipo} />
          ))}
        </View>
      ) : null}

      {/* Raw justificativas fallback */}
      {showRawJustificativas ? (
        <View style={styles.justificativasSection}>
          {justificativasToShow.map((j, i) => (
            <Text key={i} style={styles.justificativaItem}>
              {"“"}
              {j}
              {"”"}
            </Text>
          ))}
        </View>
      ) : null}
    </Page>
  );
}

interface ConclusaoPageProps {
  texto: string;
}

function ConclusaoPage({ texto }: ConclusaoPageProps) {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.conclusaoHeading}>{"CONCLUSÃO"}</Text>
      <Text style={styles.conclusaoText}>{texto}</Text>
    </Page>
  );
}

// ─── Main Document ────────────────────────────────────────────────────────────

interface PCOReportProps {
  data: PCOReportData;
}

export function PCOReport({ data }: PCOReportProps) {
  return (
    <Document>
      <Cover titulo="PCO" subtitulo={data.meta.capaTitulo ?? data.nome} />
      <MethodologyPage />

      {data.secoes.map((secao) => {
        const perguntasEscala = secao.perguntas.filter(
          (p) => p.tipo === "ESCALA"
        );
        return [
          <ResumoPage
            key={`resumo-${secao.id}`}
            secao={secao}
            grupos={data.grupos}
          />,
          ...perguntasEscala.map((p) => (
            <PerguntaDetailPage
              key={`pergunta-${p.id}`}
              pergunta={p}
              grupos={data.grupos}
              secaoTitulo={secao.titulo}
            />
          )),
        ];
      })}

      {data.meta.conclusao ? (
        <ConclusaoPage texto={data.meta.conclusao} />
      ) : null}
    </Document>
  );
}
