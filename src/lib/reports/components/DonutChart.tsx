import { View, Text, Svg, Path, Circle, StyleSheet, Text as SvgText } from "@react-pdf/renderer";
const SvgTextAny = SvgText as any;
import { COLORS, FONT } from "../theme";

export interface DonutSegment {
  label: string;
  count: number;
  percent: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  innerRadius?: number;
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 8,
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
});

/**
 * Computes an SVG donut arc path.
 * Angles in degrees where 0 = top (i.e. -90° in standard SVG), clockwise.
 */
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
  // Clamp full-circle to avoid degenerate arc
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

function formatPercent(p: number): string {
  return p.toFixed(1).replace(".", ",");
}

export function DonutChart({ segments, size = 200, innerRadius = 0.55 }: DonutChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.45;
  const innerR = outerR * innerRadius;

  const active = segments.filter((s) => s.percent > 0);

  let currentAngle = 0;
  type SegmentWithAngles = DonutSegment & { startAngle: number; endAngle: number; midAngle: number };
  const computed: SegmentWithAngles[] = active.map((seg) => {
    const span = (seg.percent / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + span;
    const midAngle = (startAngle + endAngle) / 2;
    currentAngle = endAngle;
    return { ...seg, startAngle, endAngle, midAngle };
  });

  const labelR = outerR + 18;

  return (
    <View style={styles.wrapper}>
      <Svg width={size + 80} height={size + 80} viewBox={`${-40} ${-40} ${size + 80} ${size + 80}`}>
        {/* Segments */}
        {computed.map((seg, i) => (
          <Path
            key={i}
            d={donutArcPath(cx, cy, outerR, innerR, seg.startAngle, seg.endAngle)}
            fill={seg.color}
          />
        ))}

        {/* Labels outside donut */}
        {computed.map((seg, i) => {
          const toRad = (d: number) => ((d - 90) * Math.PI) / 180;
          const lx = cx + labelR * Math.cos(toRad(seg.midAngle));
          const ly = cy + labelR * Math.sin(toRad(seg.midAngle));
          const label = `${seg.count} (${formatPercent(seg.percent)}%)`;
          return (
            <SvgTextAny
              key={i}
              x={lx.toFixed(3)}
              y={ly.toFixed(3)}
              fontSize={7}
              fill={COLORS.muted}
              textAnchor="middle"
              fontFamily={FONT.body}
            >
              {label}
            </SvgTextAny>
          );
        })}
      </Svg>

      {/* Legend */}
      <View style={styles.legendRow}>
        {active.map((seg, i) => (
          <View key={i} style={styles.legendItem}>
            <Svg width={8} height={8} viewBox="0 0 8 8">
              <Circle cx={4} cy={4} r={4} fill={seg.color} />
            </Svg>
            <Text style={styles.legendText}>{seg.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
