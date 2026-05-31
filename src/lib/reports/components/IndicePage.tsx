import { Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { COLORS, FONT, baseStyles } from "../theme";

interface IndiceItem {
  titulo: string;
  paginaInicio: number;
  subitems?: Array<{ titulo: string; paginaInicio: number }>;
}

interface IndicePageProps {
  items: IndiceItem[];
}

const styles = StyleSheet.create({
  page: {
    ...baseStyles.page,
  },
  title: {
    fontFamily: FONT.display,
    fontSize: 48,
    color: COLORS.accent,
    textAlign: "center",
    marginBottom: 56,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  rowText: {
    fontFamily: FONT.body,
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  rowPage: {
    fontFamily: FONT.body,
    fontSize: 14,
    color: COLORS.text,
  },
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    paddingLeft: 60,
  },
  subRowText: {
    fontFamily: FONT.body,
    fontSize: 13,
    color: COLORS.text,
    flex: 1,
  },
  subRowPage: {
    fontFamily: FONT.body,
    fontSize: 13,
    color: COLORS.text,
  },
});

export function IndicePage({ items }: IndicePageProps) {
  const allRows: Array<{
    titulo: string;
    paginaInicio: number;
    isSub: boolean;
    index: number;
  }> = [];

  items.forEach((item) => {
    allRows.push({ titulo: item.titulo, paginaInicio: item.paginaInicio, isSub: false, index: allRows.length });
    if (item.subitems) {
      item.subitems.forEach((sub) => {
        allRows.push({ titulo: sub.titulo, paginaInicio: sub.paginaInicio, isSub: true, index: allRows.length });
      });
    }
  });

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>ÍNDICE</Text>
      {allRows.map((row) => {
        const bg = row.index % 2 === 0 ? "transparent" : "#3d3d3d";
        if (row.isSub) {
          return (
            <View key={row.index} style={[styles.subRow, { backgroundColor: bg }]}>
              <Text style={styles.subRowText}>{row.titulo}</Text>
              <Text style={styles.subRowPage}>{row.paginaInicio}</Text>
            </View>
          );
        }
        return (
          <View key={row.index} style={[styles.row, { backgroundColor: bg }]}>
            <Text style={styles.rowText}>{row.titulo}</Text>
            <Text style={styles.rowPage}>{row.paginaInicio}</Text>
          </View>
        );
      })}
    </Page>
  );
}
