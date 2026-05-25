import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { COLORS, FONT } from "../theme";

interface SectionTitleProps {
  title: string;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  titleText: {
    fontFamily: FONT.display,
    fontSize: 28,
    color: COLORS.accent,
    lineHeight: 1.1,
  },
  underline: {
    height: 3,
    backgroundColor: COLORS.accent,
    marginTop: 6,
    width: 48,
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
