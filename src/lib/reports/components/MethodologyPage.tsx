import { Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { COLORS, FONT, baseStyles } from "../theme";

const SCALE_ITEMS = [
  { value: "+2", label: "Concordo", color: "#22c55e" },
  { value: "+1", label: "Concordo parcialmente", color: "#16a34a" },
  { value: "-1", label: "Discordo parcialmente", color: "#b91c1c" },
  { value: "-2", label: "Discordo", color: "#ef4444" },
];

const LEGEND_ITEMS = [
  { label: "Concordo", color: "#22c55e" },
  { label: "Concordo parcialmente", color: "#16a34a" },
  { label: "Discordo Parcialmente", color: "#b91c1c" },
  { label: "Discordo", color: "#ef4444" },
];

const styles = StyleSheet.create({
  page: {
    ...baseStyles.page,
    flexDirection: "column",
  },
  title: {
    fontFamily: FONT.display,
    fontSize: 36,
    color: COLORS.accent,
    textAlign: "center",
    marginBottom: 24,
  },
  twoColumns: {
    flexDirection: "row",
    marginBottom: 20,
  },
  leftColumn: {
    flex: 1,
    paddingRight: 20,
  },
  rightColumn: {
    flex: 1,
    paddingLeft: 8,
  },
  bodyText: {
    fontFamily: FONT.body,
    fontSize: 11,
    color: COLORS.text,
    lineHeight: 1.6,
    textAlign: "justify",
  },
  scaleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  scaleValue: {
    fontFamily: FONT.display,
    fontSize: 24,
    width: 44,
    textAlign: "center",
  },
  scaleLabel: {
    fontFamily: FONT.body,
    fontSize: 11,
    color: COLORS.text,
    marginLeft: 10,
  },
  fullWidthText: {
    fontFamily: FONT.body,
    fontSize: 11,
    color: COLORS.text,
    lineHeight: 1.6,
    textAlign: "justify",
    marginBottom: 14,
  },
  legendSpacer: {
    flex: 1,
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 28,
    marginBottom: 10,
    width: "45%",
  },
  legendSwatch: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  legendText: {
    fontFamily: FONT.body,
    fontSize: 13,
    color: COLORS.text,
    fontWeight: 700,
  },
});

export function MethodologyPage() {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>METODOLOGIA</Text>

      {/* Two-column layout */}
      <View style={styles.twoColumns}>
        {/* Left column: explanatory text */}
        <View style={styles.leftColumn}>
          <Text style={styles.bodyText}>
            Para cada uma das seções, foram formuladas afirmativas das quais os
            membros poderiam concordar ou discordar em duas intensidades
            diferentes. Para quantificar essa escala, adotou-se a relação ao
            lado.
          </Text>
        </View>

        {/* Right column: scale items */}
        <View style={styles.rightColumn}>
          {SCALE_ITEMS.map((item) => (
            <View key={item.value} style={styles.scaleRow}>
              <Text style={[styles.scaleValue, { color: item.color }]}>
                {item.value}
              </Text>
              <Text style={styles.scaleLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Full-width paragraphs */}
      <Text style={styles.fullWidthText}>
        Dessa forma, médias positivas indicam que os membros concordam mais do
        que discordam com a frase em questão, enquanto médias negativas
        significam o contrário, mostrando pontos sobre os quais se devem
        desenvolver planos de melhoria.
      </Text>
      <Text style={styles.fullWidthText}>
        As perguntas e este relatório foram divididos em Introdução, Conclusão e
        outras seções relacionadas ao dia-a-dia do UFRJ Consulting Club.
      </Text>
      <Text style={styles.fullWidthText}>
        Para visualização dos dados, foram gerados gráficos que mostram a
        distribuição percentual das respostas de cada uma das três áreas, dos
        coordenadores e do Consulting Club em geral, juntamente de suas
        respectivas médias, conforme o padrão estabelecido.
      </Text>

      {/* Push legend to bottom */}
      <View style={styles.legendSpacer} />

      {/* Color legend with large square swatches */}
      <View style={styles.legendRow}>
        {LEGEND_ITEMS.map((item) => (
          <View key={item.label} style={styles.legendItem}>
            <View
              style={[styles.legendSwatch, { backgroundColor: item.color }]}
            />
            <Text style={styles.legendText}>{item.label}</Text>
          </View>
        ))}
      </View>
    </Page>
  );
}
