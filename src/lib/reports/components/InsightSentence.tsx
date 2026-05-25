import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { COLORS, FONT } from "../theme";

interface InsightSentenceProps {
  texto: string;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    marginTop: 6,
  },
  text: {
    fontFamily: FONT.body,
    fontSize: 12,
    fontWeight: 700,
    color: COLORS.text,
    lineHeight: 1.5,
  },
});

export function InsightSentence({ texto }: InsightSentenceProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{texto}</Text>
    </View>
  );
}
