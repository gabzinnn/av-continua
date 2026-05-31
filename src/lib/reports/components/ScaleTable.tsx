import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { COLORS, FONT } from "../theme";

interface ScaleTableProps {
  grupos: string[];
  rows: Array<{
    texto: string;
    mediaPorGrupo: Record<string, number>;
  }>;
}

const COL_WIDTH = 56;
const QUESTION_COL_FLEX = 1;

function valueColor(val: number): string {
  if (val >= 1.0) return "#22c55e";
  if (val >= 0) return COLORS.accent;
  return "#ef4444";
}

function formatValue(val: number): string {
  return val.toFixed(3).replace(".", ",").replace(/,?0+$/, "").replace(/,$/, "");
}

const styles = StyleSheet.create({
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#2a2a2a",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerQuestionCell: {
    flex: QUESTION_COL_FLEX,
    fontFamily: FONT.body,
    fontSize: 9,
    color: COLORS.accent,
    fontWeight: 700,
    textAlign: "center",
  },
  headerGroupCell: {
    width: COL_WIDTH,
    fontFamily: FONT.body,
    fontSize: 9,
    color: COLORS.accent,
    fontWeight: 700,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowAlt: {
    backgroundColor: "#2a2a2a",
  },
  questionCell: {
    flex: QUESTION_COL_FLEX,
    fontFamily: FONT.body,
    fontSize: 9,
    color: COLORS.text,
    paddingRight: 8,
    textAlign: "center",
  },
  groupCell: {
    width: COL_WIDTH,
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
  },
  mediaText: {
    fontFamily: FONT.body,
    fontSize: 10,
    fontWeight: 700,
  },
  mutedText: {
    fontFamily: FONT.body,
    fontSize: 10,
    color: COLORS.muted,
  },
});

export function ScaleTable({ grupos, rows }: ScaleTableProps) {
  return (
    <View style={styles.table}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerQuestionCell}>Perguntas</Text>
        {grupos.map((g) => (
          <Text key={g} style={styles.headerGroupCell}>
            {g}
          </Text>
        ))}
      </View>

      {/* Rows */}
      {rows.map((row, i) => (
        <View key={i} style={[styles.row, i % 2 === 1 ? styles.rowAlt : {}]}>
          <Text style={styles.questionCell}>{row.texto}</Text>
          {grupos.map((g) => {
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
