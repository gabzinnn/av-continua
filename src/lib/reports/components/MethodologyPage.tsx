import { Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { COLORS, FONT, baseStyles, PAGE_PADDING } from "../theme";

const SCALE_ITEMS = [
  { value: "+2", label: "Concordo", color: "#22c55e" },
  { value: "+1", label: "Concordo parcialmente", color: "#16a34a" },
  { value: "-1", label: "Discordo parcialmente", color: "#b91c1c" },
  { value: "-2", label: "Discordo", color: "#ef4444" },
];

const styles = StyleSheet.create({
  page: {
    ...baseStyles.page,
  },
  title: {
    fontFamily: FONT.display,
    fontSize: 36,
    color: COLORS.accent,
    textAlign: "center",
    marginBottom: 24,
  },
  body: {
    fontFamily: FONT.body,
    fontSize: 11,
    color: COLORS.text,
    lineHeight: 1.6,
    marginBottom: 28,
    textAlign: "center",
  },
  scaleTable: {
    marginBottom: 28,
    marginHorizontal: PAGE_PADDING,
  },
  scaleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    backgroundColor: COLORS.surface,
  },
  scaleValue: {
    fontFamily: FONT.display,
    fontSize: 18,
    width: 36,
    textAlign: "center",
  },
  scaleLabel: {
    fontFamily: FONT.body,
    fontSize: 11,
    color: COLORS.text,
    marginLeft: 12,
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  legendText: {
    fontFamily: FONT.body,
    fontSize: 8,
    color: COLORS.muted,
  },
});

export function MethodologyPage() {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>METODOLOGIA</Text>
      <Text style={styles.body}>
        Para cada uma das seções, foram formuladas afirmativas das quais os
        membros poderiam concordar ou discordar em duas intensidades diferentes.
      </Text>

      <View style={styles.scaleTable}>
        {SCALE_ITEMS.map((item) => (
          <View key={item.value} style={styles.scaleRow}>
            <Text style={[styles.scaleValue, { color: item.color }]}>
              {item.value}
            </Text>
            <Text style={styles.scaleLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* Color legend */}
      <View style={styles.legendRow}>
        {SCALE_ITEMS.map((item) => (
          <View key={item.value} style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: item.color }]}
            />
            <Text style={styles.legendText}>{item.label}</Text>
          </View>
        ))}
      </View>
    </Page>
  );
}
