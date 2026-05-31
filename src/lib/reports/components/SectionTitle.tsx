import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { COLORS, FONT } from "../theme";

interface SectionTitleProps {
  title: string;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  titleText: {
    fontFamily: FONT.display,
    fontSize: 34,
    color: COLORS.text,
    lineHeight: 1.1,
  },
  underline: {
    height: 4,
    backgroundColor: COLORS.accent,
    marginTop: 6,
    width: 60,
  },
});

export function SectionTitle({ title }: SectionTitleProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.titleText}>{title}</Text>
      <View style={styles.underline} />
    </View>
  );
}
