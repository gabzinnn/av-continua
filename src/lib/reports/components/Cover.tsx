import { Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { COLORS, FONT, baseStyles } from "../theme";
import { Logo } from "./Logo";

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
    fontSize: 120,
    color: COLORS.text,
    lineHeight: 1,
  },
  yellowSquare: {
    width: 28,
    height: 28,
    backgroundColor: COLORS.accent,
    marginLeft: 8,
    marginBottom: 18,
  },
  subtitle: {
    fontFamily: FONT.display,
    fontSize: 55,
    color: "#888888",
    marginTop: 20,
  },
  bottomRight: {
    position: "absolute",
    bottom: 40,
    right: 40,
    flexDirection: "row",
    alignItems: "center",
  },
});

export function Cover({ titulo, subtitulo }: CoverProps) {
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.titleRow}>
        <Text style={styles.titleText}>{titulo}.</Text>
        <View style={styles.yellowSquare} />
      </View>
      <Text style={styles.subtitle}>{subtitulo}</Text>

      <View style={styles.bottomRight}>
        <Logo size={40} />
      </View>
    </Page>
  );
}
