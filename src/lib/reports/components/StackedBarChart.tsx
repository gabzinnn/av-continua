import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { COLORS, FONT } from "../theme";
import { DistribuicaoGrupo, toPercents } from "../utils/distribution";

interface StackedBarChartProps {
  label: string;
  dist: DistribuicaoGrupo;
}

const BAR_HEIGHT = 36;
const LABEL_WIDTH = 110;
const TICK_HEIGHT = 4;
const AXIS_LABEL_FONT = 7;

const TICKS = [0, 25, 50, 75, 100];

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "column",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  label: {
    width: LABEL_WIDTH,
    fontFamily: FONT.body,
    fontSize: 13,
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
  axisRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 1,
  },
  axisLabelSpacer: {
    width: LABEL_WIDTH,
  },
  axisTrack: {
    flex: 1,
    flexDirection: "row",
    position: "relative",
  },
  tickContainer: {
    position: "absolute",
    alignItems: "center",
  },
  tickLine: {
    width: 1,
    height: TICK_HEIGHT,
    backgroundColor: "#333333",
  },
  tickLabel: {
    fontFamily: FONT.body,
    fontSize: AXIS_LABEL_FONT,
    color: "#444444",
    marginTop: 1,
  },
});

const SEGMENT_COLORS = {
  concordo: "#00FF00",
  concordoParcial: "#5DC65D",
  naoConsigo: "#888888",
  discordoParcial: "#CC2222",
  discordo: "#FF3333",
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
    <View style={styles.wrapper}>
      {/* Bar row */}
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

      {/* X-axis with tick marks */}
      <View style={styles.axisRow}>
        <View style={styles.axisLabelSpacer} />
        <View style={styles.axisTrack}>
          {TICKS.map((tick) => (
            <View
              key={tick}
              style={[
                styles.tickContainer,
                { left: `${tick}%` },
              ]}
            >
              <View style={styles.tickLine} />
              <Text style={styles.tickLabel}>{tick === 100 ? "" : String(tick)}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
