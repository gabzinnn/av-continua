// Maps a scale average (-2 to +2) to a PDF-safe color string
export function mediaToColor(value: number): string {
  if (value >= 1.5) return "#22c55e";   // bright green
  if (value >= 0.5) return "#16a34a";   // dark green
  if (value >= -0.5) return "#fad419";  // yellow
  if (value >= -1.5) return "#f97316";  // orange
  return "#ef4444";                      // red
}
