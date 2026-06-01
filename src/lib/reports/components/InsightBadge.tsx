import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { COLORS, FONT } from "../theme";

interface InsightBadgeProps {
  count: number;
  texto: string;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  badgeWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    minWidth: 80,
  },
  bracket: {
    fontFamily: FONT.heading,
    fontSize: 36,
    fontWeight: 800,
    color: COLORS.accent,
    lineHeight: 1,
  },
  count: {
    fontFamily: FONT.heading,
    fontSize: 30,
    fontWeight: 800,
    color: COLORS.accent,
    lineHeight: 1,
  },
  suffix: {
    fontFamily: FONT.heading,
    fontSize: 24,
    fontWeight: 800,
    color: COLORS.accent,
    lineHeight: 1,
  },
  texto: {
    fontFamily: FONT.body,
    fontSize: 18,
    fontWeight: 400,
    color: COLORS.text,
    flex: 1,
    lineHeight: 1.6,
    textAlign: "justify",
  },
});

export function InsightBadge({ count, texto }: InsightBadgeProps) {
  return (
    <View style={styles.container}>
      <View style={styles.badgeWrapper}>
        <Text style={styles.bracket}>{"{"}</Text>
        <Text style={styles.count}>{count}</Text>
        <Text style={styles.suffix}>{"x}"}</Text>
      </View>
      <Text style={styles.texto}>{texto}</Text>
    </View>
  );
}
