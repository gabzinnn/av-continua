import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { COLORS, FONT } from "../theme";

interface CalloutBoxProps {
  texto: string;
  tipo?: "DESVIO" | "ATENCAO";
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    borderRadius: 6,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    alignItems: "center",
  },
  icon: {
    fontSize: 22,
    marginRight: 14,
  },
  text: {
    fontFamily: FONT.body,
    fontSize: 18,
    fontWeight: 700,
    color: COLORS.accent,
    flex: 1,
  },
});

export function CalloutBox({ texto }: CalloutBoxProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📢</Text>
      <Text style={styles.text}>{texto}</Text>
    </View>
  );
}
