import { Page, View, Text, Svg, Circle, StyleSheet } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import { COLORS, FONT, baseStyles } from "../theme";
import { MetricCard } from "./MetricCard";

// Renders inline **bold** markdown inside a <Text> block
function RichText({ text, style, boldStyle }: { text: string; style: Style; boldStyle: Style }) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <Text style={style}>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <Text key={i} style={boldStyle}>{part.slice(2, -2)}</Text>
        ) : (
          <Text key={i}>{part}</Text>
        )
      )}
    </Text>
  );
}

interface ContextoPageProps {
  objetivo?: string | null;
  contexto?: {
    totalMembros?: number;
    breakdownAreas?: Array<{ nome: string; count: number }>;
    faixas?: Array<{ count: number; descricao: string }>;
  } | null;
}

const styles = StyleSheet.create({
  page: {
    ...baseStyles.page,
  },
  sectionTitle: {
    fontFamily: FONT.display,
    fontSize: 34,
    color: COLORS.accent,
    textAlign: "center",
    marginBottom: 20,
    marginTop: 16,
  },
  bodyText: {
    fontFamily: FONT.body,
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 1.7,
    textAlign: "justify",
    width: "100%",
  },
  bodyTextBold: {
    fontFamily: FONT.body,
    fontSize: 13,
    color: COLORS.text,
    fontWeight: 700,
    lineHeight: 1.7,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 24,
  },
  contextoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    marginTop: 8,
  },
  leftCircle: {
    alignItems: "center",
    justifyContent: "center",
    marginRight: 32,
  },
  circleLabel: {
    fontFamily: FONT.body,
    fontSize: 9,
    color: COLORS.text,
    textTransform: "uppercase",
    textAlign: "center",
    marginTop: 4,
  },
  circleNumber: {
    fontFamily: FONT.display,
    fontSize: 42,
    color: COLORS.accent,
    textAlign: "center",
  },
  areasList: {
    flex: 1,
  },
  areaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  areaCount: {
    fontFamily: FONT.display,
    fontSize: 20,
    color: COLORS.accent,
    marginRight: 12,
    width: 28,
  },
  areaName: {
    fontFamily: FONT.body,
    fontSize: 13,
    color: COLORS.text,
  },
  faixaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  faixaDesc: {
    fontFamily: FONT.body,
    fontSize: 13,
    color: COLORS.text,
    marginLeft: 16,
    flex: 1,
  },
});

const CIRCLE_SIZE = 110;

export function ContextoPage({ objetivo, contexto }: ContextoPageProps) {
  const cx = CIRCLE_SIZE / 2;
  const cy = CIRCLE_SIZE / 2;
  const r = CIRCLE_SIZE / 2 - 2;

  return (
    <Page size="A4" style={styles.page}>
      {/* OBJETIVO section */}
      {objetivo ? (
        <>
          <Text style={styles.sectionTitle}>OBJETIVO</Text>
          <RichText text={objetivo} style={styles.bodyText} boldStyle={styles.bodyTextBold} />
          <View style={styles.divider} />
        </>
      ) : null}

      {/* CONTEXTO section */}
      <Text style={styles.sectionTitle}>CONTEXTO</Text>
      {contexto ? (
        <>
          <View style={styles.contextoRow}>
            {/* Left: total membros circle */}
            {contexto.totalMembros !== undefined && contexto.totalMembros !== null ? (
              <View style={styles.leftCircle}>
                <View style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE, position: "relative" }}>
                  <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} viewBox={`0 0 ${CIRCLE_SIZE} ${CIRCLE_SIZE}`}>
                    <Circle cx={cx} cy={cy} r={r} fill="#555555" />
                  </Svg>
                  <View
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: CIRCLE_SIZE,
                      height: CIRCLE_SIZE,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={styles.circleNumber}>{contexto.totalMembros}</Text>
                  </View>
                </View>
                <Text style={styles.circleLabel}>MEMBROS</Text>
              </View>
            ) : null}

            {/* Right: areas list */}
            {contexto.breakdownAreas && contexto.breakdownAreas.length > 0 ? (
              <View style={styles.areasList}>
                {contexto.breakdownAreas.map((area, i) => (
                  <View key={i} style={styles.areaRow}>
                    <Text style={styles.areaCount}>{area.count}</Text>
                    <Text style={styles.areaName}>{area.nome}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          {/* Faixas */}
          {contexto.faixas && contexto.faixas.length > 0 ? (
            <View>
              {contexto.faixas.map((faixa, i) => (
                <View key={i} style={styles.faixaItem}>
                  <MetricCard value={faixa.count} label="MEMBROS" variant="yellow" />
                  <Text style={styles.faixaDesc}>{faixa.descricao}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </>
      ) : null}
    </Page>
  );
}
