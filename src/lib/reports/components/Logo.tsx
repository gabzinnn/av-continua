import { View, Svg, Path, Text, StyleSheet } from "@react-pdf/renderer";
import { COLORS, FONT } from "../theme";

interface LogoProps {
  size?: number;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoText: {
    fontFamily: FONT.body,
    fontWeight: 700,
    color: COLORS.text,
    lineHeight: 1.3,
    marginLeft: 14,
  },
});

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const sx = cx + r * Math.cos(toRad(startDeg));
  const sy = cy + r * Math.sin(toRad(startDeg));
  const ex = cx + r * Math.cos(toRad(endDeg));
  const ey = cy + r * Math.sin(toRad(endDeg));
  const span = ((endDeg - startDeg) + 360) % 360;
  const largeArc = span > 180 ? 1 : 0;
  return `M ${sx.toFixed(3)} ${sy.toFixed(3)} A ${r} ${r} 0 ${largeArc} 1 ${ex.toFixed(3)} ${ey.toFixed(3)}`;
}

export function Logo({ size = 32 }: LogoProps) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.44;
  const innerR = size * 0.30;

  const outerD = arcPath(cx, cy, outerR, 30, 330);
  const innerD = arcPath(cx, cy, innerR, 30, 330);

  const textSize = Math.round(size * 0.22);

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Path
          d={outerD}
          stroke={COLORS.text}
          strokeWidth={size * 0.08}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d={innerD}
          stroke={COLORS.accent}
          strokeWidth={size * 0.055}
          fill="none"
          strokeLinecap="round"
        />
      </Svg>
      <Text style={[styles.logoText, { fontSize: textSize }]}>{"UFRJ\nCONSULTING\nCLUB"}</Text>
    </View>
  );
}
