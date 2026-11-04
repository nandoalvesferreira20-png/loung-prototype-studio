import type { CSSProperties } from "react";

export const studioBrand = {
  logo: "/assets/brand/loung-tech-lt.png",
  name: "Loung Tech",
  product: "Prototype Studio",
};
export const brandPalette = [
  { key: "black", name: "Preto", color: "#000000" },
  { key: "off-white", name: "Off-white", color: "#F1EEE6" },
  { key: "gray", name: "Cinza", color: "#A8A59D" },
  { key: "lime", name: "Verde-lima", color: "#CDF03B" },
  { key: "blue", name: "Azul", color: "#2A4BFF" },
] as const;
const semanticTokens = {
  surface: "#F8F6F1",
  white: "#FFFFFF",
  muted: "#5E5B55",
  border: "#D0CCC3",
  hover: "#E7E3D9",
  "on-dark": "#F1EEE6",
  "muted-dark": "#BEBBB3",
  "border-dark": "#353530",
  "surface-dark": "#171715",
  error: "#9D2E25",
  "error-bg": "#FAEAE7",
  warning: "#79520F",
  "warning-bg": "#F6EDDA",
  success: "#365522",
  "success-bg": "#E7EEDC",
  "info-bg": "#E8EBFF",
  "lime-hover": "#BDE125",
  "blue-hover": "#1735CE",
};
export const studioTokens = Object.fromEntries([
  ...brandPalette.map((t) => [`--lt-${t.key}`, t.color]),
  ...Object.entries(semanticTokens).map(([key, value]) => [
    `--lt-${key}`,
    value,
  ]),
]) as CSSProperties;
export const studioIcons = {
  icon: [{ url: studioBrand.logo, type: "image/png", sizes: "830x830" }],
  apple: [{ url: studioBrand.logo, type: "image/png", sizes: "830x830" }],
};
