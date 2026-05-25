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
    marginBottom: 6,
  },
  bracket: {
    fontFamily: FONT.display,
    fontSize: 20,
    color: COLORS.accent,
    lineHeight: 1,
  },
  count: {
    fontFamily: FONT.display,
    fontSize: 20,
    color: COLORS.accent,
    lineHeight: 1,
  },
  suffix: {
    fontFamily: FONT.display,
    fontSize: 20,
    color: COLORS.accent,
    lineHeight: 1,
    marginRight: 8,
  },
  texto: {
    fontFamily: FONT.body,
    fontSize: 10,
    color: COLORS.text,
    flex: 1,
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
