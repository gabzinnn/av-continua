import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { COLORS, FONT } from "../theme";

interface MetricCardProps {
  value: string | number;
  label: string;
  variant?: "yellow" | "gray";
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 4,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 90,
  },
  value: {
    fontFamily: FONT.body,
    fontSize: 36,
    fontWeight: 700,
    lineHeight: 1.1,
  },
  label: {
    fontFamily: FONT.body,
    fontSize: 9,
    fontWeight: 700,
    textTransform: "uppercase",
    marginTop: 3,
    textAlign: "center",
  },
});

export function MetricCard({
  value,
  label,
  variant = "yellow",
}: MetricCardProps) {
  const bgColor = variant === "yellow" ? COLORS.accent : "#555555";
  const textColor = variant === "yellow" ? "#000000" : COLORS.text;

  return (
    <View style={[styles.card, { backgroundColor: bgColor }]}>
      <Text style={[styles.value, { color: textColor }]}>{value}</Text>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </View>
  );
}
