import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { COLORS, FONT } from "../theme";

interface InsightSentenceProps {
  texto: string;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    marginTop: 12,
  },
  text: {
    fontFamily: FONT.body,
    fontSize: 16,
    fontWeight: 700,
    color: COLORS.text,
    lineHeight: 1.5,
    textAlign: "justify",
  },
});

export function InsightSentence({ texto }: InsightSentenceProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{texto}</Text>
    </View>
  );
}
