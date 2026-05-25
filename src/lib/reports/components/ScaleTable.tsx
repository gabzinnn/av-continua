import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { COLORS, FONT } from "../theme";
import { mediaToColor } from "../utils/colorScale";

interface ScaleTableProps {
  grupos: string[];
  rows: Array<{
    texto: string;
    mediaPorGrupo: Record<string, number>;
  }>;
}

const COL_WIDTH = 52;
const QUESTION_COL_FLEX = 1;

const styles = StyleSheet.create({
  table: {
    width: "100%",
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerQuestionCell: {
    flex: QUESTION_COL_FLEX,
    fontFamily: FONT.body,
    fontSize: 8,
    color: COLORS.muted,
    fontWeight: 700,
  },
  headerGroupCell: {
    width: COL_WIDTH,
    fontFamily: FONT.body,
    fontSize: 8,
    color: COLORS.muted,
    fontWeight: 700,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowAlt: {
    backgroundColor: COLORS.surfaceAlt,
  },
  questionCell: {
    flex: QUESTION_COL_FLEX,
    fontFamily: FONT.body,
    fontSize: 9,
    color: COLORS.text,
    paddingRight: 8,
  },
  groupCell: {
    width: COL_WIDTH,
    alignItems: "center",
    justifyContent: "center",
  },
  mediaBadge: {
    width: 36,
    height: 18,
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  mediaText: {
    fontFamily: FONT.body,
    fontSize: 9,
    fontWeight: 700,
    color: "#000000",
  },
});

export function ScaleTable({ grupos, rows }: ScaleTableProps) {
  return (
    <View style={styles.table}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerQuestionCell}>AFIRMATIVA</Text>
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
            const color = val !== undefined ? mediaToColor(val) : COLORS.border;
            return (
              <View key={g} style={styles.groupCell}>
                {val !== undefined ? (
                  <View style={[styles.mediaBadge, { backgroundColor: color }]}>
                    <Text style={styles.mediaText}>
                      {val >= 0 ? `+${val.toFixed(1)}` : val.toFixed(1)}
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.mediaText, { color: COLORS.muted }]}>
                    —
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
