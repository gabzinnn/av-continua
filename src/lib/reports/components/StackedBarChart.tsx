import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { COLORS, FONT } from "../theme";
import { DistribuicaoGrupo, toPercents } from "../utils/distribution";

interface StackedBarChartProps {
  label: string;
  dist: DistribuicaoGrupo;
}

const BAR_HEIGHT = 14;
const LABEL_WIDTH = 80;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  label: {
    width: LABEL_WIDTH,
    fontFamily: FONT.body,
    fontSize: 9,
    color: COLORS.text,
    textAlign: "right",
    paddingRight: 8,
  },
  barContainer: {
    flex: 1,
    flexDirection: "row",
    height: BAR_HEIGHT,
  },
  segment: {
    height: BAR_HEIGHT,
  },
});

const SEGMENT_COLORS = {
  concordo: "#22c55e",
  concordoParcial: "#16a34a",
  naoConsigo: "#888888",
  discordoParcial: "#b91c1c",
  discordo: "#ef4444",
};

export function StackedBarChart({ label, dist }: StackedBarChartProps) {
  const pcts = toPercents(dist);

  const segments: Array<{ key: keyof typeof SEGMENT_COLORS; pct: number }> = [
    { key: "concordo", pct: pcts.concordo },
    { key: "concordoParcial", pct: pcts.concordoParcial },
    { key: "naoConsigo", pct: pcts.naoConsigo },
    { key: "discordoParcial", pct: pcts.discordoParcial },
    { key: "discordo", pct: pcts.discordo },
  ];

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.barContainer}>
        {segments.map(({ key, pct }) =>
          pct > 0 ? (
            <View
              key={key}
              style={[
                styles.segment,
                {
                  width: `${pct}%`,
                  backgroundColor: SEGMENT_COLORS[key],
                },
              ]}
            />
          ) : null
        )}
      </View>
    </View>
  );
}
