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
    fontFamily: FONT.display,
    fontSize: 22,
    color: COLORS.accent,
    lineHeight: 1,
  },
  count: {
    fontFamily: FONT.display,
    fontSize: 22,
    color: COLORS.accent,
    lineHeight: 1,
  },
  suffix: {
    fontFamily: FONT.display,
    fontSize: 22,
    color: COLORS.accent,
    lineHeight: 1,
    marginRight: 12,
  },
  texto: {
    fontFamily: FONT.body,
    fontSize: 12,
    color: COLORS.text,
    flex: 1,
    lineHeight: 1.5,
    textAlign: "justify",
  },
});

export function InsightBadge({ count, texto }: InsightBadgeProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.bracket}>(</Text>
      <Text style={styles.count}>{count}</Text>
      <Text style={styles.suffix}>x)</Text>
      <Text style={styles.texto}>{texto}</Text>
    </View>
  );
}
