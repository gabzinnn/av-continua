import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { COLORS, FONT, baseStyles } from "../theme";

interface CoverProps {
  titulo: string;
  subtitulo?: string;
  logoBase64?: string;
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
    fontFamily: FONT.heading,
    fontSize: 160,
    fontWeight: 800,
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
    fontFamily: FONT.heading,
    fontSize: 72,
    fontWeight: 700,
    color: "#888888",
    marginTop: 20,
  },
  bottomRight: {
    position: "absolute",
    bottom: 40,
    right: 40,
  },
  logo: {
    height: 130,
  },
});

export function Cover({ titulo, subtitulo, logoBase64 }: CoverProps) {
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.titleRow}>
        <Text style={styles.titleText}>{titulo}</Text>
        <View style={styles.yellowSquare} />
      </View>
      {subtitulo ? <Text style={styles.subtitle}>{subtitulo}</Text> : null}

      {logoBase64 ? (
        <View style={styles.bottomRight}>
          <Image src={logoBase64} style={styles.logo} />
        </View>
      ) : null}
    </Page>
  );
}
