import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { COLORS, FONT } from "../theme";

interface ScaleTableProps {
  grupos: string[];
  rows: Array<{
    texto: string;
    mediaPorGrupo: Record<string, number>;
  }>;
}

const COL_WIDTH = 42;
const QUESTION_COL_FLEX = 1;

function filterGrupos(grupos: string[]): string[] {
  return grupos.filter((g) =>
    /geral/i.test(g) ||
    /coord/i.test(g) ||
    /f[aá]brica/i.test(g) ||
    /escola/i.test(g) ||
    /academia/i.test(g)
  );
}

function valueColor(val: number): string {
  if (val >= 1.5)  return "#00FF00";
  if (val >= 0.5)  return "#92D050";
  if (val >= -0.5) return "#FFFF00";
  if (val >= -1.5) return "#FF6600";
  return "#FF0000";
}

function formatValue(val: number): string {
  return val.toFixed(3).replace(".", ",").replace(/,?0+$/, "").replace(/,$/, "");
}

const styles = StyleSheet.create({
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#333333",
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  headerQuestionCell: {
    flex: QUESTION_COL_FLEX,
    fontFamily: FONT.body,
    fontSize: 10,
    color: COLORS.accent,
    fontWeight: 700,
    textAlign: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  headerGroupCell: {
    width: COL_WIDTH,
    fontFamily: FONT.body,
    fontSize: 9,
    color: COLORS.accent,
    fontWeight: 700,
    textAlign: "center",
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderLeftWidth: 1,
    borderLeftColor: "#333333",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
    minHeight: 28,
  },
  rowAlt: {
    backgroundColor: "#1e1e1e",
  },
  questionCell: {
    flex: QUESTION_COL_FLEX,
    fontFamily: FONT.body,
    fontSize: 8,
    color: COLORS.text,
    paddingVertical: 6,
    paddingHorizontal: 8,
    textAlign: "left",
    lineHeight: 1.4,
  },
  groupCell: {
    width: COL_WIDTH,
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: 1,
    borderLeftColor: "#333333",
    paddingVertical: 6,
  },
  mediaText: {
    fontFamily: FONT.body,
    fontSize: 9,
    fontWeight: 700,
  },
  mutedText: {
    fontFamily: FONT.body,
    fontSize: 9,
    color: COLORS.muted,
  },
});

export function ScaleTable({ grupos, rows }: ScaleTableProps) {
  const visibleGrupos = filterGrupos(grupos);

  return (
    <View style={styles.table}>
      {/* Header */}
      <View style={styles.headerRow} wrap={false}>
        <Text style={styles.headerQuestionCell}>Perguntas</Text>
        {visibleGrupos.map((g) => (
          <Text key={g} style={styles.headerGroupCell}>
            {g}
          </Text>
        ))}
      </View>

      {/* Rows */}
      {rows.map((row, i) => (
        <View key={i} style={[styles.row, i % 2 === 1 ? styles.rowAlt : {}]} wrap={false}>
          <Text style={styles.questionCell}>{row.texto}</Text>
          {visibleGrupos.map((g) => {
            const val = row.mediaPorGrupo[g];
            return (
              <View key={g} style={styles.groupCell}>
                {val !== undefined ? (
                  <Text style={[styles.mediaText, { color: valueColor(val) }]}>
                    {formatValue(val)}
                  </Text>
                ) : (
                  <Text style={styles.mutedText}>—</Text>
                )}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
