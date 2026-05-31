import { View, Text, Svg, Path, Circle, StyleSheet } from "@react-pdf/renderer";
import { COLORS, FONT } from "../theme";

interface NPSHistorico {
  ciclo: string;
  nps: number;
}

interface NPSChartProps {
  npsData: {
    promotores: number;
    neutros: number;
    detratores: number;
    npsPercent: number;
    distribuicao: Record<number, number>;
  };
  cicloAtual: string;
  historico?: NPSHistorico[];
}

const NPS_COLORS = {
  promotores: COLORS.accent,
  neutros: "#555555",
  detratores: "#222222",
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 6,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
    marginBottom: 4,
  },
  legendText: {
    fontFamily: FONT.body,
    fontSize: 8,
    color: COLORS.muted,
    marginLeft: 4,
  },
  historicoRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
    gap: 24,
  },
  historicoItem: {
    alignItems: "center",
  },
  historicoCiclo: {
    fontFamily: FONT.body,
    fontSize: 9,
    color: COLORS.text,
    textDecoration: "underline",
    marginBottom: 2,
  },
  historicoNps: {
    fontFamily: FONT.body,
    fontSize: 9,
    color: COLORS.muted,
  },
  centerLabel: {
    fontFamily: FONT.display,
    fontSize: 11,
    color: COLORS.text,
    textAlign: "center",
  },
  centerNps: {
    fontFamily: FONT.display,
    fontSize: 13,
    color: COLORS.accent,
    textAlign: "center",
  },
});

function formatPercent(p: number): string {
  return p.toFixed(2).replace(".", ",");
}

function donutArcPath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startDeg: number,
  endDeg: number
): string {
  const toRad = (d: number) => ((d - 90) * Math.PI) / 180;
  const span = ((endDeg - startDeg) + 360) % 360;
  const clampedEnd = span >= 359.99 ? startDeg + 359.9 : endDeg;
  const largeArc = span > 180 ? 1 : 0;

  const ox1 = cx + outerR * Math.cos(toRad(startDeg));
  const oy1 = cy + outerR * Math.sin(toRad(startDeg));
  const ox2 = cx + outerR * Math.cos(toRad(clampedEnd));
  const oy2 = cy + outerR * Math.sin(toRad(clampedEnd));

  const ix1 = cx + innerR * Math.cos(toRad(clampedEnd));
  const iy1 = cy + innerR * Math.sin(toRad(clampedEnd));
  const ix2 = cx + innerR * Math.cos(toRad(startDeg));
  const iy2 = cy + innerR * Math.sin(toRad(startDeg));

  return [
    `M ${ox1.toFixed(3)} ${oy1.toFixed(3)}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${ox2.toFixed(3)} ${oy2.toFixed(3)}`,
    `L ${ix1.toFixed(3)} ${iy1.toFixed(3)}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2.toFixed(3)} ${iy2.toFixed(3)}`,
    "Z",
  ].join(" ");
}

export function NPSChart({ npsData, cicloAtual, historico }: NPSChartProps) {
  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.44;
  const innerR = outerR * 0.62;

  const total = npsData.promotores + npsData.neutros + npsData.detratores;

  type Seg = { label: string; count: number; color: string; startAngle: number; endAngle: number };
  const rawSegs = [
    { label: "Promotores", count: npsData.promotores, color: NPS_COLORS.promotores },
    { label: "Neutros", count: npsData.neutros, color: NPS_COLORS.neutros },
    { label: "Detratores", count: npsData.detratores, color: NPS_COLORS.detratores },
  ];

  let angle = 0;
  const segs: Seg[] = rawSegs.map((s) => {
    const span = total > 0 ? (s.count / total) * 360 : 0;
    const start = angle;
    angle += span;
    return { ...s, startAngle: start, endAngle: angle };
  });

  const recent = historico ? historico.slice(-2) : [];
  const allCiclos = [
    ...recent,
    { ciclo: cicloAtual, nps: npsData.npsPercent },
  ];

  return (
    <View style={styles.wrapper}>
      {/* Donut SVG */}
      <View style={{ position: "relative", width: size, height: size }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {segs.map((seg, i) =>
            seg.count > 0 ? (
              <Path
                key={i}
                d={donutArcPath(cx, cy, outerR, innerR, seg.startAngle, seg.endAngle)}
                fill={seg.color}
              />
            ) : null
          )}
        </Svg>
        {/* Center text overlay */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: size,
            height: size,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={styles.centerLabel}>{cicloAtual}</Text>
          <Text style={styles.centerNps}>NPS: {formatPercent(npsData.npsPercent)}%</Text>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legendRow}>
        {segs.map((seg, i) => (
          <View key={i} style={styles.legendItem}>
            <Svg width={8} height={8} viewBox="0 0 8 8">
              <Circle cx={4} cy={4} r={4} fill={seg.color} />
            </Svg>
            <Text style={styles.legendText}>{seg.label}</Text>
          </View>
        ))}
      </View>

      {/* Historical comparison */}
      {allCiclos.length > 0 ? (
        <View style={styles.historicoRow}>
          {allCiclos.map((item, i) => (
            <View key={i} style={styles.historicoItem}>
              <Text style={styles.historicoCiclo}>{item.ciclo}</Text>
              <Text style={styles.historicoNps}>NPS: {formatPercent(item.nps)}%</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
