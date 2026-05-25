import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Svg,
  Polygon,
  Line,
  Text as SvgText,
} from "@react-pdf/renderer";
import { COLORS, FONT, baseStyles } from "../theme";
import { Cover } from "../components/Cover";
import { CalloutBox } from "../components/CalloutBox";
import { InsightSentence } from "../components/InsightSentence";
import type { AV360ReportData, AV360DimensaoMembro, AV360MembroDetalhes } from "./types";

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    ...baseStyles.page,
  },
  // VisaoGeralPage
  visaoHeading: {
    fontFamily: FONT.display,
    fontSize: 36,
    color: COLORS.accent,
    marginBottom: 20,
  },
  scoreGlobal: {
    fontFamily: FONT.display,
    fontSize: 28,
    color: COLORS.text,
    marginBottom: 24,
  },
  scoreGlobalValue: {
    color: COLORS.accent,
  },
  sectionLabel: {
    fontFamily: FONT.body,
    fontSize: 9,
    fontWeight: 700,
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 20,
  },
  // Dimension bars
  dimRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  dimLabel: {
    fontFamily: FONT.body,
    fontSize: 9,
    color: COLORS.text,
    width: 130,
  },
  dimBarTrack: {
    flex: 1,
    height: 12,
    backgroundColor: "#222222",
  },
  dimBarFill: {
    height: 12,
    backgroundColor: COLORS.accent,
  },
  dimValue: {
    fontFamily: FONT.body,
    fontSize: 9,
    color: COLORS.muted,
    width: 32,
    textAlign: "right",
  },
  // Ranking
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 4,
    padding: 8,
    marginBottom: 6,
  },
  rankPos: {
    fontFamily: FONT.display,
    fontSize: 14,
    color: COLORS.muted,
    width: 28,
  },
  rankName: {
    fontFamily: FONT.body,
    fontSize: 10,
    fontWeight: 700,
    color: COLORS.text,
    flex: 1,
  },
  rankScore: {
    fontFamily: FONT.display,
    fontSize: 14,
    color: COLORS.accent,
  },
  // MembroPage
  membroName: {
    fontFamily: FONT.display,
    fontSize: 24,
    color: COLORS.text,
    marginBottom: 4,
  },
  membroBadge: {
    fontFamily: FONT.display,
    fontSize: 20,
    color: COLORS.accent,
    marginBottom: 4,
  },
  membroRespondentes: {
    fontFamily: FONT.body,
    fontSize: 9,
    color: COLORS.muted,
    marginBottom: 16,
  },
  radarContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  // Comments
  commentQuestion: {
    fontFamily: FONT.body,
    fontSize: 10,
    fontWeight: 700,
    color: COLORS.text,
    marginBottom: 6,
    marginTop: 12,
  },
  commentResponse: {
    fontFamily: FONT.body,
    fontSize: 9,
    color: COLORS.muted,
    fontStyle: "italic",
    lineHeight: 1.5,
    marginBottom: 4,
  },
  // ConclusaoPage
  conclusaoHeading: {
    fontFamily: FONT.display,
    fontSize: 36,
    color: COLORS.accent,
    marginBottom: 20,
  },
  conclusaoText: {
    fontFamily: FONT.body,
    fontSize: 12,
    color: COLORS.text,
    lineHeight: 1.6,
  },
});

// ─── RadarChart ───────────────────────────────────────────────────────────────

function RadarChart({ dimensoes }: { dimensoes: AV360DimensaoMembro[] }) {
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 20;
  const n = dimensoes.length;
  if (n < 3) return null;

  function getPoint(i: number, r: number) {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  }

  const gridLevels = [0.33, 0.66, 1];

  const dataPoints = dimensoes.map((d, i) =>
    getPoint(i, (d.mediaSimples / 10) * maxR)
  );
  const dataPointsStr = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  const labelPoints = dimensoes.map((_, i) => getPoint(i, maxR + 14));

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid polygons */}
      {gridLevels.map((level, li) => {
        const pts = Array.from({ length: n }, (_, i) =>
          getPoint(i, maxR * level)
        );
        return (
          <Polygon
            key={li}
            points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke="#333333"
            strokeWidth={0.5}
          />
        );
      })}
      {/* Spokes */}
      {dimensoes.map((_, i) => {
        const outer = getPoint(i, maxR);
        return (
          <Line
            key={i}
            x1={cx}
            y1={cy}
            x2={outer.x}
            y2={outer.y}
            stroke="#333333"
            strokeWidth={0.5}
          />
        );
      })}
      {/* Data polygon */}
      <Polygon
        points={dataPointsStr}
        fill="#fad51933"
        stroke="#fad519"
        strokeWidth={1.5}
      />
      {/* Labels */}
      {dimensoes.map((d, i) => {
        const label = d.dimensao.length > 10 ? d.dimensao.slice(0, 10) + "…" : d.dimensao;
        const lp = labelPoints[i];
        // SVG Text attrs fontSize/textAnchor are valid but missing from @react-pdf TS overloads
        const SvgTextAny = SvgText as any;
        return (
          <SvgTextAny
            key={i}
            x={lp.x}
            y={lp.y}
            fontSize={7}
            fill="#9ca3af"
            textAnchor="middle"
          >
            {label}
          </SvgTextAny>
        );
      })}
    </Svg>
  );
}

// ─── VisaoGeralPage ───────────────────────────────────────────────────────────

function VisaoGeralPage({ data }: { data: AV360ReportData }) {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.visaoHeading}>{"VISÃO GERAL"}</Text>

      <Text style={styles.scoreGlobal}>
        {"Score Global: "}
        <Text style={styles.scoreGlobalValue}>
          {data.scoreGlobalMedia.toFixed(2)}
        </Text>
        {" / 10"}
      </Text>

      <Text style={styles.sectionLabel}>{"Médias por Dimensão"}</Text>
      {data.dimensoesGlobais.map((dim, i) => (
        <View key={i} style={styles.dimRow}>
          <Text style={styles.dimLabel}>{dim.titulo}</Text>
          <View style={styles.dimBarTrack}>
            <View
              style={[
                styles.dimBarFill,
                { width: `${(dim.mediaGlobal / 10) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.dimValue}>{dim.mediaGlobal.toFixed(2)}</Text>
        </View>
      ))}

      <Text style={styles.sectionLabel}>{"Ranking"}</Text>
      {data.ranking.map((r, idx) => (
        <View key={r.membroId} style={styles.rankRow}>
          <Text style={styles.rankPos}>{`${idx + 1}.`}</Text>
          <Text style={styles.rankName}>{r.nome}</Text>
          <Text style={styles.rankScore}>{r.scoreGeral.toFixed(2)}</Text>
        </View>
      ))}
    </Page>
  );
}

// ─── MembroPage ───────────────────────────────────────────────────────────────

function MembroPage({ membro }: { membro: AV360MembroDetalhes }) {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.membroName}>{membro.nome}</Text>
      <Text style={styles.membroBadge}>{`${membro.scoreGeral.toFixed(2)} / 10`}</Text>
      <Text style={styles.membroRespondentes}>
        {`${membro.numRespondentes} avaliador${membro.numRespondentes !== 1 ? "es" : ""} anônimo${membro.numRespondentes !== 1 ? "s" : ""}`}
      </Text>

      {/* Radar chart */}
      {membro.dimensoes.length >= 3 && (
        <View style={styles.radarContainer}>
          <RadarChart dimensoes={membro.dimensoes} />
        </View>
      )}

      {/* Dimensions list */}
      {membro.dimensoes.map((d, i) => (
        <View key={i} style={{ marginBottom: 10 }}>
          <View style={styles.dimRow}>
            <Text style={styles.dimLabel}>{d.dimensao}</Text>
            <View style={styles.dimBarTrack}>
              <View
                style={[
                  styles.dimBarFill,
                  { width: `${(d.mediaSimples / 10) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.dimValue}>{d.mediaSimples.toFixed(2)}</Text>
          </View>
          {d.insightTexto ? (
            <InsightSentence texto={d.insightTexto} />
          ) : null}
          {d.callouts && d.callouts.length > 0
            ? d.callouts.map((c, ci) => (
                <CalloutBox key={ci} texto={c.texto} tipo={c.tipo} />
              ))
            : null}
        </View>
      ))}

      {/* Comentários */}
      {membro.comentarios.length > 0 && (
        <View style={{ marginTop: 8 }}>
          {membro.comentarios.map((c, i) => (
            <View key={i}>
              <Text style={styles.commentQuestion}>{c.pergunta}</Text>
              {c.respostas.slice(0, 5).map((r, j) => (
                <Text key={j} style={styles.commentResponse}>
                  {`"${r}"`}
                </Text>
              ))}
            </View>
          ))}
        </View>
      )}
    </Page>
  );
}

// ─── ConclusaoPage ────────────────────────────────────────────────────────────

function ConclusaoPage({ texto }: { texto: string }) {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.conclusaoHeading}>{"CONCLUSÃO"}</Text>
      <Text style={styles.conclusaoText}>{texto}</Text>
    </Page>
  );
}

// ─── Main Document ────────────────────────────────────────────────────────────

export function AV360Report({ data }: { data: AV360ReportData }) {
  return (
    <Document>
      <Cover titulo="AV360" subtitulo={data.meta.capaTitulo ?? data.nome} />
      <VisaoGeralPage data={data} />
      {data.membrosDetalhes.map((membro) => (
        <MembroPage key={membro.membroId} membro={membro} />
      ))}
      {data.meta.conclusao ? (
        <ConclusaoPage texto={data.meta.conclusao} />
      ) : null}
    </Document>
  );
}
