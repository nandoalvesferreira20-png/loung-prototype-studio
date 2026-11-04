import localFont from "next/font/local";
const headings = localFont({
  src: "./fonts/bricolage-grotesque.ttf",
  variable: "--font-studio-heading",
  display: "swap",
  weight: "200 800",
  preload: false,
});
const body = localFont({
  src: "./fonts/inter.ttf",
  variable: "--font-studio-body",
  display: "swap",
  weight: "100 900",
  preload: false,
});
const editorial = localFont({
  src: "./fonts/instrument-serif.ttf",
  variable: "--font-studio-editorial",
  display: "swap",
  weight: "400",
  preload: false,
});
// Variables only: client templates keep their existing font families.
export const studioFontVariables = `${headings.variable} ${body.variable} ${editorial.variable}`;
