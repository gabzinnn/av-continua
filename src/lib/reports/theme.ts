import { Font, StyleSheet } from "@react-pdf/renderer";

Font.register({
  family: "Anton",
  src: "/fonts/Anton-Regular.ttf",
});

Font.register({
  family: "Inter",
  fonts: [
    { src: "/fonts/Inter-Regular.ttf", fontWeight: 400 },
    { src: "/fonts/Inter-Regular.ttf", fontWeight: 400, fontStyle: "italic" },
    { src: "/fonts/Inter-Bold.ttf", fontWeight: 700 },
    { src: "/fonts/Inter-Bold.ttf", fontWeight: 700, fontStyle: "italic" },
  ],
});

export const COLORS = {
  bg: "#000000",
  surface: "#1a1a1a",
  surfaceAlt: "#242424",
  accent: "#fad419",
  text: "#ffffff",
  muted: "#9ca3af",
  border: "#2a2a2a",
  agree: "#22c55e",
  agreePartial: "#16a34a",
  disagreePartial: "#b91c1c",
  disagree: "#ef4444",
  yellow: "#fad419",
};

export const FONT = {
  display: "Anton",
  body: "Inter",
};

export const PAGE_PADDING = 40;

export const baseStyles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.bg,
    color: COLORS.text,
    fontFamily: FONT.body,
    padding: PAGE_PADDING,
    fontSize: 10,
  },
  accentText: {
    color: COLORS.accent,
    fontFamily: FONT.display,
  },
});
