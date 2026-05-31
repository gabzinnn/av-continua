import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { COLORS, FONT } from "../theme";

interface ConclusaoCalloutProps {
  items: Array<{ count: number; texto: string }>;
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 32,
    backgroundColor: "#2a2a2a",
  },
  count: {
    fontFamily: FONT.display,
    fontSize: 56,
    color: COLORS.accent,
    marginRight: 20,
    lineHeight: 1,
    minWidth: 80,
    textAlign: "center",
  },
  texto: {
    fontFamily: FONT.body,
    fontSize: 13,
    color: COLORS.text,
    flex: 1,
    lineHeight: 1.5,
    textAlign: "justify",
  },
});

export function ConclusaoCallout({ items }: ConclusaoCalloutProps) {
  return (
    <View>
      {items.map((item, i) => (
        <View key={i} style={styles.item}>
          <Text style={styles.count}>{item.count}x</Text>
          <Text style={styles.texto}>{item.texto}</Text>
        </View>
      ))}
    </View>
  );
}
