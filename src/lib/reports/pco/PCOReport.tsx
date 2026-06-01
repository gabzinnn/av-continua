import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { COLORS, FONT, baseStyles } from "../theme";
import { computeStdDev } from "../utils/distribution";
import { Cover } from "../components/Cover";
import { IndicePage } from "../components/IndicePage";
import { ContextoPage } from "../components/ContextoPage";
import { MethodologyPage } from "../components/MethodologyPage";
import { SectionTitle } from "../components/SectionTitle";
import { ScaleTable } from "../components/ScaleTable";
import { StackedBarChart } from "../components/StackedBarChart";
import { InsightSentence } from "../components/InsightSentence";
import { InsightBadge } from "../components/InsightBadge";
import { CalloutBox } from "../components/CalloutBox";
import { DonutChart } from "../components/DonutChart";
import type { DonutSegment } from "../components/DonutChart";
import { NPSChart } from "../components/NPSChart";
import { ConclusaoCallout } from "../components/ConclusaoCallout";
import { LogoPage } from "../components/LogoPage";
import type { PCOReportData, PerguntaRelatorio, SecaoRelatorio } from "./types";

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    ...baseStyles.page,
  },
  // ResumoPage
  resumoHeading: {
    fontFamily: FONT.heading,
    fontSize: 44,
    fontWeight: 800,
    color: COLORS.accent,
    textAlign: "center",
    marginBottom: 20,
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
    fontSize: 14,
    color: "#888888",
    marginBottom: 12,
  },
  questionText: {
    fontFamily: FONT.heading,
    fontSize: 26,
    fontWeight: 700,
    color: COLORS.text,
    lineHeight: 1.4,
    textAlign: "justify",
    marginBottom: 16,
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 4,
  },
  legendSquare: {
    width: 16,
    height: 16,
    marginRight: 5,
  },
  legendLabel: {
    fontFamily: FONT.body,
    fontSize: 12,
    color: COLORS.text,
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
});

// ─── Legend constants ─────────────────────────────────────────────────────────

const LEGEND_ITEMS = [
  { color: "#00FF00", label: "Concordo" },
  { color: "#5DC65D", label: "Concordo parcialmente" },
  { color: "#CC2222", label: "Discordo parcialmente" },
  { color: "#FF3333", label: "Discordo" },
];

// ─── Donut colors ─────────────────────────────────────────────────────────────

const DONUT_COLORS = [COLORS.accent, "#555555", "#888888", "#b0b0b0", "#222222"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isNPSQuestion(p: PerguntaRelatorio): boolean {
  return (
    p.tipo === "MULTIPLA_ESCOLHA" &&
    (p.texto.toLowerCase().includes("recomendaria") ||
      p.texto.toLowerCase().includes("0 a 10"))
  );
}

function toDonutSegments(
  donutData: NonNullable<PerguntaRelatorio["donutData"]>
): DonutSegment[] {
  return donutData.map((item, i) => ({
    label: item.texto,
    count: item.count,
    percent: item.percent,
    color: DONUT_COLORS[i % DONUT_COLORS.length],
  }));
}

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

const STD_DEV_THRESHOLD = 0.9;

function PerguntaDetailPage({
  pergunta,
  grupos,
  secaoTitulo,
}: PerguntaDetailPageProps) {
  const geralDist = pergunta.distribuicaoPorGrupo["Geral"];
  const stdDev = geralDist ? computeStdDev(geralDist) : 0;
  const hasAltoDesvio = stdDev >= STD_DEV_THRESHOLD;

  // Manually-set callouts from coord editing
  const manualCallouts = pergunta.callouts ?? [];
  // Avoid duplicating "DESVIO" callout if coord already added one
  const showAutoDesvio =
    hasAltoDesvio && !manualCallouts.some((c) => c.tipo === "DESVIO");

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.breadcrumb}>{secaoTitulo}</Text>

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

      {/* Agrupamentos (badges Nx) */}
      {pergunta.agrupamentos && pergunta.agrupamentos.length > 0 ? (
        <View style={styles.agrupamentosSection}>
          {pergunta.agrupamentos.map((ag, i) => (
            <InsightBadge key={i} count={ag.count} texto={ag.texto} />
          ))}
        </View>
      ) : null}

      {/* Callouts manuais + auto desvio padrão */}
      {(manualCallouts.length > 0 || showAutoDesvio) ? (
        <View style={styles.calloutsSection}>
          {manualCallouts.map((c, i) => (
            <CalloutBox key={i} texto={c.texto} tipo={c.tipo} />
          ))}
          {showAutoDesvio ? (
            <CalloutBox texto="Alto desvio padrão" tipo="DESVIO" />
          ) : null}
        </View>
      ) : null}

      {/* Justificativas — sempre exibidas quando existem */}
      {pergunta.justificativas.length > 0 ? (
        <View style={styles.justificativasSection}>
          {pergunta.justificativas.map((j, i) => (
            <Text key={i} style={styles.justificativaItem}>
              {"“"}{j}{"”"}
            </Text>
          ))}
        </View>
      ) : null}
    </Page>
  );
}

// ─── Page number estimation ───────────────────────────────────────────────────

interface IndiceItem {
  titulo: string;
  paginaInicio: number;
  subitems?: Array<{ titulo: string; paginaInicio: number }>;
}

function buildIndiceItems(secoes: SecaoRelatorio[]): IndiceItem[] {
  // Fixed pages: Cover=1, Indice=2, Contexto=3, Metodologia=4
  let nextPage = 5;

  const secaoSubitems = secoes.map((secao) => {
    const resumoPage = nextPage;
    const perguntasEscala = secao.perguntas.filter((p) => p.tipo === "ESCALA");
    const perguntasMultipla = secao.perguntas.filter((p) => p.tipo === "MULTIPLA_ESCOLHA");
    const perguntasTexto = secao.perguntas.filter((p) => p.tipo === "TEXTO_LIVRE");
    // ResumoPage + ESCALA detail pages + MULTIPLA_ESCOLHA pages + TEXTO_LIVRE pages
    nextPage += 1 + perguntasEscala.length + perguntasMultipla.length + perguntasTexto.length;
    return { titulo: secao.titulo, paginaInicio: resumoPage };
  });

  return [
    { titulo: "Objetivo", paginaInicio: 3 },
    { titulo: "Contexto", paginaInicio: 3 },
    { titulo: "Metodologia", paginaInicio: 4 },
    { titulo: "Resumo", paginaInicio: 5, subitems: secaoSubitems },
  ];
}

// ─── Main Document ────────────────────────────────────────────────────────────

interface PCOReportProps {
  data: PCOReportData;
  logoBase64?: string;
}

export function PCOReport({ data, logoBase64 }: PCOReportProps) {
  // All sections except "Identificação" (which becomes Contexto)
  const secoesConteudo = data.secoes.filter(
    (s) => s.titulo !== "Identificação"
  );

  const indiceItems = buildIndiceItems(secoesConteudo);

  return (
    <Document>
      {/* 1. Cover */}
      <Cover titulo="PCO" subtitulo={data.nome.replace(/^pco[\s.:-]*/i, "").trim()} logoBase64={logoBase64} />

      {/* 2. Index */}
      <IndicePage items={indiceItems} />

      {/* 3. Contexto */}
      <ContextoPage
        objetivo={data.meta.objetivo}
        contexto={data.meta.contexto}
      />

      {/* 4. Methodology */}
      <MethodologyPage />

      {/* 5. For each section: Resumo + ESCALA details + MULTIPLA_ESCOLHA donuts + NPS */}
      {secoesConteudo.map((secao) => {
        const perguntasEscala = secao.perguntas.filter(
          (p) => p.tipo === "ESCALA"
        );
        const perguntasMultipla = secao.perguntas.filter(
          (p) => p.tipo === "MULTIPLA_ESCOLHA"
        );
        const perguntasDonut = perguntasMultipla.filter(
          (p) => !isNPSQuestion(p)
        );
        const perguntaNPS = perguntasMultipla.find((p) => isNPSQuestion(p));

        return (
          <React.Fragment key={`secao-${secao.id}`}>
            {/* a. ResumoPage */}
            <ResumoPage secao={secao} grupos={data.grupos} />

            {/* b. PerguntaDetailPage for each ESCALA question */}
            {perguntasEscala.map((p) => (
              <PerguntaDetailPage
                key={`pergunta-${p.id}`}
                pergunta={p}
                grupos={data.grupos}
                secaoTitulo={secao.titulo}
              />
            ))}

            {/* c. DonutPage for each non-NPS MULTIPLA_ESCOLHA question */}
            {perguntasDonut.map((p) => (
              <Page key={`donut-${p.id}`} size="A4" style={styles.page}>
                <Text style={styles.breadcrumb}>{secao.titulo}</Text>
                <Text style={styles.questionText}>{p.texto}</Text>
                {p.donutData && p.donutData.length > 0 ? (
                  <DonutChart segments={toDonutSegments(p.donutData)} />
                ) : null}
              </Page>
            ))}

            {/* d. NPSPage for the NPS question */}
            {perguntaNPS && perguntaNPS.npsData ? (
              <Page key={`nps-${perguntaNPS.id}`} size="A4" style={styles.page}>
                <Text style={styles.breadcrumb}>{secao.titulo}</Text>
                <Text style={styles.questionText}>{perguntaNPS.texto}</Text>
                <NPSChart
                  npsData={perguntaNPS.npsData}
                  cicloAtual={data.nome}
                  historico={data.meta.npsHistorico ?? []}
                />
              </Page>
            ) : null}

            {/* e. ConclusaoCallout pages for TEXTO_LIVRE questions */}
            {secao.perguntas
              .filter((p) => p.tipo === "TEXTO_LIVRE")
              .map((p) => (
                <Page key={`textol-${p.id}`} size="A4" style={styles.page}>
                  <Text style={styles.breadcrumb}>{secao.titulo}</Text>
                  <Text style={styles.questionText}>{p.texto}</Text>
                  <ConclusaoCallout items={p.agrupamentos ?? []} />
                </Page>
              ))}
          </React.Fragment>
        );
      })}

      {/* 6. LogoPage */}
      <LogoPage logoBase64={logoBase64} />
    </Document>
  );
}
