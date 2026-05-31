
import { Font, StyleSheet } from "@react-pdf/renderer";

Font.register({
  family: "Hammersmith One",
  src: "/fonts/HammersmithOne-Regular.ttf",
});

Font.register({
  family: "Montserrat",
  fonts: [
    { src: "/fonts/Montserrat-Regular.ttf", fontWeight: 400 },
    { src: "/fonts/Montserrat-Medium.ttf", fontWeight: 500 },
    { src: "/fonts/Montserrat-Bold.ttf", fontWeight: 700 },
  ],
});

Font.register({
  family: "Raleway",
  fonts: [
    { src: "/fonts/Raleway-Regular.ttf", fontWeight: 400 },
    { src: "/fonts/Raleway-Bold.ttf", fontWeight: 700 },
    { src: "/fonts/Raleway-ExtraBold.ttf", fontWeight: 800 },
  ],
});

export const COLORS = {
  bg: "#0D0D0D", // Updated from #000000
  surface: "#1a1a1a",
  surfaceAlt: "#242424",
  accent: "#FAD419", // Updated to match exact hex
  text: "#ffffff",
  muted: "#9ca3af",
  border: "#2a2a2a",
  agree: "#22c55e",
  agreePartial: "#16a34a",
  disagreePartial: "#b91c1c",
  disagree: "#ef4444",
  yellow: "#FAD419",
};

export const FONT = {
  display: "Hammersmith One",
  body: "Montserrat",
  heading: "Raleway",
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
