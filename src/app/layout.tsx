import type { Metadata } from "next";
import "./globals.css";
import "@/styles/studio.css";
import { studioFontVariables } from "@/styles/fonts";
export const metadata: Metadata = {
  title: { default: "Loung Prototype Studio", template: "%s · Loung Studio" },
  description:
    "Loung Prototype Studio. Plataforma interna da Loung Tech para leads e protótipos privados.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={studioFontVariables}>{children}</body>
    </html>
  );
}
