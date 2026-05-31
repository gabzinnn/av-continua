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
    marginBottom: 16,
  },
  bracket: {
    fontFamily: FONT.heading,
    fontSize: 32,
    fontWeight: 800,
    color: COLORS.accent,
    lineHeight: 1,
  },
  count: {
    fontFamily: FONT.heading,
    fontSize: 28,
    fontWeight: 800,
    color: COLORS.accent,
    lineHeight: 1,
  },
  suffix: {
    fontFamily: FONT.heading,
    fontSize: 22,
    fontWeight: 800,
    color: COLORS.accent,
    lineHeight: 1,
    marginRight: 12,
  },
  texto: {
    fontFamily: FONT.heading,
    fontSize: 18,
    fontWeight: 400,
    color: COLORS.text,
    flex: 1,
    lineHeight: 1.5,
  },
});

export function InsightBadge({ count, texto }: InsightBadgeProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.bracket}>[</Text>
      <Text style={styles.count}>{count}</Text>
      <Text style={styles.suffix}>x]</Text>
      <Text style={styles.texto}>{texto}</Text>
    </View>
  );
}
