import type { AgrupamentoInsight } from "../pco/types";

const STOPWORDS = new Set([
  "que", "para", "com", "mais", "como", "pelo", "pela", "dos", "das", "nos", "nas",
  "uma", "umas", "uns", "isso", "este", "esta", "esse", "essa", "meus", "seus",
  "minha", "nossa", "quando", "onde", "muito", "muita", "todo", "toda", "todos",
  "todas", "cada", "esses", "essas", "estes", "estas",
]);

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

function extractWords(normalized: string): string[] {
  return normalized
    .split(/\W+/)
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w));
}

export function agruparTextos(textos: string[]): AgrupamentoInsight[] {
  if (textos.length < 2) return [];

  const normalized = textos.map(normalize);

  const keywordFreq = new Map<string, number>();
  for (const norm of normalized) {
    const words = new Set(extractWords(norm));
    for (const w of words) {
      keywordFreq.set(w, (keywordFreq.get(w) ?? 0) + 1);
    }
  }

  const topKeywords = [...keywordFreq.entries()]
    .filter(([, freq]) => freq >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([kw]) => kw);

  if (topKeywords.length === 0) return [];

  const capturedIndices = new Set<number>();
  const insights: AgrupamentoInsight[] = [];

  for (const keyword of topKeywords) {
    const matching: number[] = [];
    for (let i = 0; i < normalized.length; i++) {
      if (extractWords(normalized[i]).includes(keyword)) {
        matching.push(i);
      }
    }
    if (matching.length === 0) continue;

    for (const idx of matching) capturedIndices.add(idx);

    // Representative text: the raw text most commonly shared — just pick the first match
    // (single best representative for the group)
    const rawTexts = matching.map((i) => textos[i]);
    const freqMap = new Map<string, number>();
    for (const t of rawTexts) freqMap.set(t, (freqMap.get(t) ?? 0) + 1);
    const representative = [...freqMap.entries()].sort((a, b) => b[1] - a[1])[0][0];

    insights.push({ count: matching.length, texto: representative });
  }

  const uncaptured = textos.filter((_, i) => !capturedIndices.has(i));
  if (uncaptured.length >= 2) {
    const freqMap = new Map<string, number>();
    for (const t of uncaptured) freqMap.set(t, (freqMap.get(t) ?? 0) + 1);
    const representative = [...freqMap.entries()].sort((a, b) => b[1] - a[1])[0][0];
    insights.push({ count: uncaptured.length, texto: representative });
  }

  return insights.sort((a, b) => b.count - a.count);
}
