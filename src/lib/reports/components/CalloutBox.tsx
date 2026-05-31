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
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    alignItems: "center",
  },
  iconSquare: {
    width: 16,
    height: 16,
    backgroundColor: COLORS.accent,
    borderRadius: 2,
    marginRight: 12,
  },
  text: {
    fontFamily: FONT.heading,
    fontSize: 20,
    fontWeight: 700,
    color: COLORS.accent,
    flex: 1,
  },
});

export function CalloutBox({ texto }: CalloutBoxProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconSquare} />
      <Text style={styles.text}>{texto}</Text>
    </View>
  );
}
