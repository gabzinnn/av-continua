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
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
    alignItems: "center",
  },
  icon: {
    width: 12,
    height: 12,
    backgroundColor: COLORS.accent,
    borderRadius: 2,
    marginRight: 8,
  },
  text: {
    fontFamily: FONT.body,
    fontSize: 9,
    fontWeight: 700,
    color: COLORS.accent,
    flex: 1,
  },
});

export function CalloutBox({ texto }: CalloutBoxProps) {
  return (
    <View style={styles.container}>
      <View style={styles.icon} />
      <Text style={styles.text}>{texto}</Text>
    </View>
  );
}
