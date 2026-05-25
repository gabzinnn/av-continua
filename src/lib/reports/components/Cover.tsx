import { Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { COLORS, FONT, baseStyles } from "../theme";

interface CoverProps {
  titulo: string;
  subtitulo: string;
}

const styles = StyleSheet.create({
  page: {
    ...baseStyles.page,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  titleText: {
    fontFamily: FONT.display,
    fontSize: 80,
    color: COLORS.text,
    lineHeight: 1,
  },
  yellowDot: {
    width: 18,
    height: 18,
    backgroundColor: COLORS.accent,
    marginLeft: 6,
    marginBottom: 14,
  },
  subtitle: {
    fontFamily: FONT.body,
    fontSize: 32,
    color: "#888888",
    marginTop: 16,
  },
  bottomRight: {
    position: "absolute",
    bottom: 40,
    right: 40,
    flexDirection: "row",
    alignItems: "center",
  },
  logoCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.accent,
    marginRight: 8,
  },
  logoText: {
    fontFamily: FONT.body,
    fontSize: 8,
    color: "#9ca3af",
    lineHeight: 1.4,
  },
});

export function Cover({ titulo, subtitulo }: CoverProps) {
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.titleRow}>
        <Text style={styles.titleText}>{titulo}</Text>
        <View style={styles.yellowDot} />
      </View>
      <Text style={styles.subtitle}>{subtitulo}</Text>

      <View style={styles.bottomRight}>
        <View style={styles.logoCircle} />
        <Text style={styles.logoText}>{"UFRJ\nCONSULTING\nCLUB"}</Text>
      </View>
    </Page>
  );
}
